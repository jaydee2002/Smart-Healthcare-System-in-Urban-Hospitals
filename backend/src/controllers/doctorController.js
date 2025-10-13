// src/controllers/doctorController.js
import Doctor from "../models/Doctor.js";
import Hospital from "../models/Hospital.js";
import Appointment from "../models/Appointment.js";
import {
  addDays,
  addWeeks,
  addMonths,
  isWithinInterval,
  startOfDay,
} from "date-fns";

// @desc    Create new doctor
// @route   POST /api/doctors
// @access  Private/Admin
const createDoctor = async (req, res) => {
  try {
    const { name, qualification, specialization, hospitalId } = req.body;

    // Validate hospital exists
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(400).json({ message: "Invalid hospital" });
    }

    // Check if doctor exists (by name/specialization)
    const doctorExists = await Doctor.findOne({ name, specialization });
    if (doctorExists) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    const doctor = await Doctor.create({
      name,
      qualification,
      specialization,
      hospital: hospitalId,
      // Link to user if provided (from auth), else optional
      user: req.user._id,
    });

    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all doctors (with search/filter)
// @route   GET /api/doctors
// @access  Private/Admin
const getDoctors = async (req, res) => {
  try {
    const { search, hospital, specialization } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }
    if (hospital) query.hospital = hospital;
    if (specialization) query.specialization = specialization;

    const doctors = await Doctor.find(query).populate("hospital", "name type");
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Private/Admin
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      "hospital",
      "name type"
    );
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private/Admin
const updateDoctor = async (req, res) => {
  try {
    const { name, qualification, specialization, hospitalId } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (hospitalId) {
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital)
        return res.status(400).json({ message: "Invalid hospital" });
      doctor.hospital = hospitalId;
    }
    if (name) doctor.name = name;
    if (qualification) doctor.qualification = qualification;
    if (specialization) doctor.specialization = specialization;

    const updatedDoctor = await doctor.save();
    res.json(updatedDoctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Cascade delete appointments
    await Appointment.deleteMany({ doctor: req.params.id });

    await doctor.remove();
    res.json({ message: "Doctor removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set availability (with recurrence)
// @route   POST /api/doctors/:id/availability
// @access  Private/Admin
const setAvailability = async (req, res) => {
  try {
    const { date, timeSlots, recurrence } = req.body; // timeSlots: [{start, end}]
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check for overlaps
    const newSlots = timeSlots.map((slot) => ({
      start: new Date(slot.start),
      end: new Date(slot.end),
      isBooked: false,
    }));

    // Simple overlap check (expand for production)
    const existingSlots =
      doctor.availability.find((a) =>
        isWithinInterval(new Date(date), {
          start: startOfDay(new Date(date)),
          end: addDays(startOfDay(new Date(date)), 1),
        })
      )?.timeSlots || [];
    for (let newSlot of newSlots) {
      for (let existing of existingSlots) {
        if (newSlot.start < existing.end && newSlot.end > existing.start) {
          return res.status(400).json({ message: "Overlapping time slot" });
        }
      }
    }

    // Add initial availability
    doctor.availability.push({
      date: new Date(date),
      timeSlots: newSlots,
      recurrence,
    });

    // Apply recurrence if set (e.g., generate up to 30 days ahead)
    if (recurrence !== "none") {
      let currentDate = new Date(date);
      const endDate = addMonths(currentDate, 1); // Limit to 1 month
      while (currentDate < endDate) {
        if (recurrence === "daily") currentDate = addDays(currentDate, 1);
        else if (recurrence === "weekly")
          currentDate = addWeeks(currentDate, 1);
        else if (recurrence === "monthly")
          currentDate = addMonths(currentDate, 1);

        // Clone slots for new date (no overlap check for recurring)
        doctor.availability.push({
          date: currentDate,
          timeSlots: newSlots.map((s) => ({
            ...s,
            start: new Date(s.start),
            end: new Date(s.end),
          })), // Adjust times if needed
          recurrence,
        });
      }
    }

    await doctor.save();
    res.status(201).json({ message: "Availability set" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search appointments for doctor
// @route   GET /api/doctors/:id/appointments
// @access  Private/Admin
const getDoctorAppointments = async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = { doctor: req.params.id };

    if (status) query.status = status;
    if (date)
      query.date = { $gte: new Date(date), $lte: addDays(new Date(date), 1) };

    const appointments = await Appointment.find(query)
      .populate("patient", "name")
      .populate("doctor", "name");
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update/Cancel appointment
// @route   PUT /api/doctors/:doctorId/appointments/:appointmentId
// @access  Private/Admin
const updateAppointment = async (req, res) => {
  try {
    const { status } = req.body; // e.g., 'cancelled'
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment || appointment.doctor.toString() !== req.params.doctorId) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = status || appointment.status;
    await appointment.save();

    // If cancelled, reopen slot in doctor's availability (simplified)
    if (status === "cancelled") {
      const doctor = await Doctor.findById(req.params.doctorId);
      const avail = doctor.availability.find(
        (a) => a.date.toDateString() === appointment.date.toDateString()
      );
      if (avail) {
        const slotIndex = avail.timeSlots.findIndex(
          (s) =>
            s.start.toISOString() === appointment.timeSlot.start.toISOString()
        );
        if (slotIndex > -1) avail.timeSlots[slotIndex].isBooked = false;
        await doctor.save();
      }
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  setAvailability,
  getDoctorAppointments,
  updateAppointment,
};
