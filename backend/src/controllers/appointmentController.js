// src/controllers/appointmentController.js
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Stripe from "stripe"; // For private payment simulation

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || "mock_key"); // Mock if no key

// @desc    Search doctors
// @route   GET /api/appointments/doctors/search
// @access  Private/Patient
const searchDoctors = async (req, res) => {
  try {
    const { hospitalType, name, specialization } = req.query;
    let query = {};

    if (hospitalType) {
      // Match via hospital type (assumes denormalized or virtual path)
      query["hospital.type"] = hospitalType;
    }
    if (name) {
      query.$or = [
        { name: { $regex: name, $options: "i" } },
        { specialization: { $regex: name, $options: "i" } },
      ];
    }
    if (specialization) query.specialization = specialization;

    const doctors = await Doctor.find(query)
      .populate("hospital", "name type")
      .select("name qualification specialization availability");

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available slots for doctor
// @route   GET /api/appointments/:doctorId/slots
// @access  Private/Patient
const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query; // Optional filter by date
    const doctor = await Doctor.findById(req.params.doctorId).populate(
      "hospital",
      "type"
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    let availSlots = [];
    if (date) {
      // Filter for specific date
      const targetDate = new Date(date);
      const dayAvail = doctor.availability.filter(
        (a) => a.date.toDateString() === targetDate.toDateString()
      );
      dayAvail.forEach((a) => {
        a.timeSlots
          .filter((s) => !s.isBooked)
          .forEach((slot) => availSlots.push(slot));
      });
    } else {
      // All future available slots (next 30 days)
      const now = new Date();
      doctor.availability
        .filter((a) => a.date >= now)
        .forEach((a) => {
          a.timeSlots
            .filter((s) => !s.isBooked)
            .forEach((slot) => availSlots.push({ ...slot, date: a.date }));
        });
    }

    res.json({ hospitalType: doctor.hospital?.type, slots: availSlots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Book appointment
// @route   POST /api/appointments/book
// @access  Private/Patient
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, slot } = req.body; // slot: {start, end, date}
    const patientId = req.user._id; // From auth middleware

    // Get patient profile (or create bare-bones from user)
    let patient = await Patient.findOne({ user: patientId });
    if (!patient) {
      patient = await Patient.create({
        name: req.user.name,
        email: req.user.email,
        user: patientId,
      });
    }

    // Get doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // ✅ FIX: properly populate before using doctor.hospital.type
    await doctor.populate("hospital");
    const hospitalType = doctor.hospital?.type || "default";
    const isPrivate = hospitalType === "private";

    // Check slot availability
    const availDate = doctor.availability.find(
      (a) => a.date.toDateString() === new Date(slot.date).toDateString()
    );
    if (!availDate) {
      return res.status(400).json({ message: "No availability for this date" });
    }

    const slotIndex = availDate.timeSlots.findIndex(
      (s) =>
        s.start.toISOString() === new Date(slot.start).toISOString() &&
        !s.isBooked
    );
    if (slotIndex === -1) {
      return res.status(400).json({ message: "Slot unavailable" });
    }

    let paymentId = null;
    if (isPrivate) {
      // Simulate payment
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 5000, // $50.00
          currency: "usd",
          metadata: { doctorId, patientId },
        });
        if (Math.random() > 0.1) {
          // 90% success for testing
          paymentId = paymentIntent.id;
        } else {
          return res.status(400).json({ message: "Payment failed" });
        }
      } catch (paymentError) {
        return res
          .status(400)
          .json({ message: "Payment error: " + paymentError.message });
      }
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctorId,
      date: new Date(slot.date),
      timeSlot: { start: new Date(slot.start), end: new Date(slot.end) },
      type: hospitalType,
      paymentId,
    });

    // Mark slot as booked
    availDate.timeSlots[slotIndex].isBooked = true;
    await doctor.save();

    res.status(201).json({
      ...appointment.toObject(),
      qrCode: "mock-qr-" + appointment._id, // Placeholder
      message: "Appointment booked successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient appointments
// @route   GET /api/appointments/my
// @access  Private/Patient
const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user._id;
    const appointments = await Appointment.find({ patient: patientId })
      .populate("doctor", "name specialization")
      .populate("hospital", "name") // optional; depends on schema
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel appointment (self-cancel)
// @route   DELETE /api/appointments/:id
// @access  Private/Patient
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (
      !appointment ||
      appointment.patient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    // Reopen slot
    const doctor = await Doctor.findById(appointment.doctor);
    const availDate = doctor.availability.find(
      (a) => a.date.toDateString() === appointment.date.toDateString()
    );
    if (availDate) {
      const slotIndex = availDate.timeSlots.findIndex(
        (s) =>
          s.start.toISOString() === appointment.timeSlot.start.toISOString()
      );
      if (slotIndex > -1) availDate.timeSlots[slotIndex].isBooked = false;
      await doctor.save();
    }

    res.json({ message: "Appointment cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  searchDoctors,
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
};
