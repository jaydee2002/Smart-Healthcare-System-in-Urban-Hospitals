// src/controllers/appointmentController.js
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Stripe from "stripe"; // For private payment simulation
import QRCode from "qrcode";

// FIXED: Initialize Stripe with error handling (no fallback)
let stripe;
try {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY not set in .env");
  }
  stripe = Stripe(secretKey);
  console.log(
    "Stripe initialized successfully (key length:",
    secretKey.length,
    ")"
  );
} catch (error) {
  console.error("Stripe init failed:", error.message);
  stripe = null;
}

// @desc    Create Payment Intent for appointment
// @route   POST /api/appointments/payment/intent
// @access  Private/Patient
const createPaymentIntent = async (req, res) => {
  console.log("Request body:", req.body); // Debug: Log amount/doctorId

  try {
    const { doctorId, amount } = req.body; // amount in cents (e.g., 280000 for ₹2800)
    const patientId = req.user._id.toString(); // FIXED: Convert ObjectId to string

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid amount (must be positive number in cents)" });
    }

    // FIXED: Lazy init Stripe inside function (after env loaded)
    let stripe;
    try {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      console.log(
        "STRIPE_SECRET_KEY full value:",
        secretKey ? "Loaded (length: " + secretKey.length + ")" : "Not set"
      ); // Debug full value
      if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY not set in .env");
      }
      stripe = Stripe(secretKey);
      // FIXED: Verify instance has methods
      if (
        !stripe.paymentIntents ||
        typeof stripe.paymentIntents.create !== "function"
      ) {
        throw new Error(
          "Invalid Stripe instance - key may be revoked or malformed"
        );
      }
      console.log("Stripe instance valid - ready for API call");
    } catch (initError) {
      console.error("Stripe init failed:", initError.message);
      return res
        .status(500)
        .json({ message: "Stripe service unavailable - check configuration" });
    }

    // Get doctor to validate
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // FIXED: Await populate
    await doctor.populate("hospital");
    if (!doctor.hospital || doctor.hospital.type !== "private") {
      return res
        .status(400)
        .json({ message: "Payment required for private hospitals only" });
    }

    console.log(
      "Creating Stripe PaymentIntent for amount:",
      amount,
      "doctor:",
      doctorId
    ); // Debug

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // In cents
      currency: "inr", // FIXED: Set to INR for ₹
      metadata: {
        doctorId: doctorId.toString(), // FIXED: Convert to string
        patientId: patientId, // Already string
      },
      automatic_payment_methods: { enabled: true },
    });

    console.log("PaymentIntent created successfully:", paymentIntent.id); // Debug

    res.json({ client_secret: paymentIntent.client_secret });
  } catch (error) {
    console.error("PaymentIntent error:", error.message); // FIXED: Log full error
    res.status(500).json({ message: error.message || "Payment setup failed" });
  }
};
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
      .select(
        "name age consultationRate image qualification specialization availability"
      );

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
  console.log("Booking request body:", req.body); // Debug: Log doctorId, slot, paymentIntentId

  try {
    const { doctorId, slot, paymentIntentId } = req.body;
    const patientId = req.user._id.toString(); // String for consistency

    if (!doctorId || !slot || !slot.date || !slot.start || !slot.end) {
      return res
        .status(400)
        .json({ message: "Invalid slot or doctor details" });
    }

    // FIXED: Lazy init Stripe inside function (after env loaded)
    let stripe;
    try {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      console.log(
        "STRIPE_SECRET_KEY full value:",
        secretKey ? "Loaded (length: " + secretKey.length + ")" : "Not set"
      ); // Debug full value
      if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY not set in .env");
      }
      stripe = Stripe(secretKey);
      // FIXED: Verify instance has methods
      if (
        !stripe.paymentIntents ||
        typeof stripe.paymentIntents.retrieve !== "function"
      ) {
        throw new Error(
          "Invalid Stripe instance - key may be revoked or malformed"
        );
      }
      console.log("Stripe instance valid - ready for API call");
    } catch (initError) {
      console.error("Stripe init failed:", initError.message);
      return res
        .status(500)
        .json({ message: "Stripe service unavailable - check configuration" });
    }

    // Get patient profile (or create bare-bones from user)
    console.log("Finding patient for ID:", patientId); // Debug
    let patient = await Patient.findOne({ user: patientId });
    if (!patient) {
      console.log("Creating new patient for user:", patientId); // Debug
      patient = await Patient.create({
        name: req.user.name,
        email: req.user.email,
        user: patientId,
      });
    }
    console.log("Patient ready:", patient._id); // Debug

    // Get doctor
    console.log("Finding doctor for ID:", doctorId); // Debug
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    console.log("Doctor found:", doctor.name); // Debug

    // Populate hospital
    console.log("Populating hospital for doctor:", doctorId); // Debug
    await doctor.populate("hospital");
    console.log("Hospital populated:", doctor.hospital?.name); // Debug

    const hospitalType = doctor.hospital?.type || "default";
    const isPrivate = hospitalType === "private";

    // Verify payment for private
    let paymentId = null;
    if (isPrivate) {
      if (!paymentIntentId) {
        return res
          .status(400)
          .json({ message: "Payment required for private hospital" });
      }

      console.log("Verifying payment intent:", paymentIntentId); // Debug
      // FIXED: Use the initialized stripe instance
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      console.log("Payment status:", paymentIntent.status); // Debug
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Payment not completed" });
      }
      paymentId = paymentIntentId;
    }

    // Check slot availability
    console.log("Checking slot for date:", slot.date, "start:", slot.start); // Debug
    const availDate = doctor.availability.find(
      (a) => a.date.toDateString() === new Date(slot.date).toDateString()
    );
    if (!availDate) {
      return res.status(400).json({ message: "No availability for this date" });
    }
    console.log("Avail date found:", availDate.date); // Debug

    const slotIndex = availDate.timeSlots.findIndex(
      (s) =>
        s.start.toISOString() === new Date(slot.start).toISOString() &&
        !s.isBooked
    );
    if (slotIndex === -1) {
      return res.status(400).json({ message: "Slot unavailable" });
    }
    console.log("Slot index found:", slotIndex); // Debug

    // Create appointment
    console.log("Creating appointment with paymentId:", paymentId); // Debug
    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctorId,
      date: new Date(slot.date),
      timeSlot: { start: new Date(slot.start), end: new Date(slot.end) },
      type: hospitalType,
      paymentId,
    });
    console.log("Appointment created:", appointment._id); // Debug

    // Mark slot as booked
    availDate.timeSlots[slotIndex].isBooked = true;
    await doctor.save();
    console.log("Slot booked and doctor saved"); // Debug

    // Generate QR (simple for now)
    const qrData = `APT:${appointment._id}`;
    const qrCode = await QRCode.toDataURL(qrData); // Requires qrcode lib

    res.status(201).json({
      ...appointment.toObject(),
      qrCode,
      message: "Appointment booked successfully",
    });
  } catch (error) {
    console.error("Booking error full stack:", error); // FIXED: Log full error with stack
    res.status(500).json({ message: error.message || "Booking failed" });
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
  createPaymentIntent,
  searchDoctors,
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
};
