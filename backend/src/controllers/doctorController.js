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
import path from "path";
import fs from "fs";

const createDoctor = async (req, res) => {
  try {
    const {
      name,
      age,
      qualification,
      specialization,
      consultationRate,
      hospitalId,
    } = req.body;

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

    // Handle image upload
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/doctors/${req.file.filename}`;
    }

    const doctor = await Doctor.create({
      name,
      age: age ? parseInt(age) : undefined,
      qualification,
      specialization,
      consultationRate: consultationRate ? parseFloat(consultationRate) : undefined,
      hospital: hospitalId,
      image: imagePath,
      user: req.user?._id,
    });

    res.status(201).json(doctor);
  } catch (error) {
    // Clean up file on error (ESM-safe: use imported fs)
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
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
    const {
      name,
      age,
      qualification,
      specialization,
      consultationRate,
      hospitalId,
    } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (hospitalId) {
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) return res.status(400).json({ message: "Invalid hospital" });
      doctor.hospital = hospitalId;
    }
    if (name) doctor.name = name;
    if (age) doctor.age = parseInt(age);
    if (qualification) doctor.qualification = qualification;
    if (specialization) doctor.specialization = specialization;
    if (consultationRate) doctor.consultationRate = parseFloat(consultationRate);

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (doctor.image) {
        const oldImagePath = path.join(process.cwd(), "public", doctor.image);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Error deleting old image:", err);
        });
      }
      doctor.image = `/uploads/doctors/${req.file.filename}`;
    }

    const updatedDoctor = await doctor.save();
    res.json(updatedDoctor);
  } catch (error) {
    // Clean up new file on error
    if (req.file && !res.headersSent) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
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

    // Delete image if exists
    if (doctor.image) {
      const imagePath = path.join(process.cwd(), "public", doctor.image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Error deleting image:", err);
      });
    }

    // Cascade delete appointments
    await Appointment.deleteMany({ doctor: req.params.id });

    // Remove doctor
    await doctor.deleteOne();
    res.json({ message: "Doctor removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Helper: check for overlaps safely (no assumption that _id exists on subdocs)
 */
const checkOverlaps = (
  date,
  newSlots,
  existingAvailabilities,
  excludeId = null
) => {
  const targetDate = startOfDay(new Date(date));
  const dayEnd = addDays(targetDate, 1);

  const relevantAvails = existingAvailabilities.filter((a) => {
    const idStr = a?._id ? String(a._id) : null;
    const notExcluded = excludeId ? idStr !== excludeId : true;
    const inSameDay = isWithinInterval(new Date(a.date), {
      start: targetDate,
      end: dayEnd,
    });
    return notExcluded && inSameDay;
  });

  for (let newSlot of newSlots) {
    for (let avail of relevantAvails) {
      for (let existing of avail.timeSlots) {
        if (newSlot.start < existing.end && newSlot.end > existing.start) {
          return true; // Overlap found
        }
      }
    }
  }
  return false; // No overlaps
};

// @desc    Set availability (with recurrence)
// @route   POST /api/doctors/:id/availability
// @access  Private/Admin
const setAvailability = async (req, res) => {
  try {
    const { date, timeSlots, recurrence } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const newSlots = timeSlots.map((slot) => ({
      start: new Date(slot.start),
      end: new Date(slot.end),
      isBooked: false,
    }));

    // Check for overlaps on initial date
    if (checkOverlaps(date, newSlots, doctor.availability)) {
      return res.status(400).json({ message: "Overlapping time slot" });
    }

    // Add initial availability
    doctor.availability.push({
      date: new Date(date),
      timeSlots: newSlots,
      recurrence,
    });

    // Apply recurrence if set (generate up to 1 month ahead, check overlaps for each)
    if (recurrence && recurrence !== "none") {
      let currentDate = new Date(date);
      const endDate = addMonths(new Date(date), 1);

      while (true) {
        if (recurrence === "daily") currentDate = addDays(currentDate, 1);
        else if (recurrence === "weekly") currentDate = addWeeks(currentDate, 1);
        else if (recurrence === "monthly") currentDate = addMonths(currentDate, 1);
        else break; // guard for unexpected values

        if (currentDate >= endDate) break;

        if (checkOverlaps(currentDate, newSlots, doctor.availability)) {
          continue; // Skip if overlap on recurring date
        }

        // Build slots for this currentDate without mutating previous dates
        const slotsForDate = newSlots.map((s) => {
          const start = new Date(currentDate);
          start.setHours(s.start.getHours(), s.start.getMinutes(), 0, 0);
          const end = new Date(currentDate);
          end.setHours(s.end.getHours(), s.end.getMinutes(), 0, 0);
          return { start, end, isBooked: false };
        });

        doctor.availability.push({
          date: new Date(currentDate),
          timeSlots: slotsForDate,
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

// @desc    Get availability for doctor
// @route   GET /api/doctors/:id/availability
// @access  Private/Admin
const getAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json(doctor.availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update availability
// @route   PUT /api/doctors/:id/availability/:availId
// @access  Private/Admin
const updateAvailability = async (req, res) => {
  try {
    const { date, timeSlots, recurrence } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const avail = doctor.availability.id(req.params.availId);
    if (!avail) {
      return res.status(404).json({ message: "Availability not found" });
    }

    const updateDate = date ? new Date(date) : avail.date;
    const updateSlots = timeSlots
      ? timeSlots.map((slot) => ({
          start: new Date(slot.start),
          end: new Date(slot.end),
          isBooked:
            slot.isBooked ??
            avail.timeSlots.find((s) => s.start.toISOString() === slot.start)
              ?.isBooked ??
            false,
        }))
      : avail.timeSlots;

    // Check for overlaps (exclude self)
    if (
      checkOverlaps(updateDate, updateSlots, doctor.availability, req.params.availId)
    ) {
      return res.status(400).json({ message: "Overlapping time slot" });
    }

    // Update fields
    avail.date = updateDate;
    avail.timeSlots = updateSlots;
    avail.recurrence = recurrence || avail.recurrence;

    await doctor.save();
    res.json(avail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete availability
// @route   DELETE /api/doctors/:id/availability/:availId
// @access  Private/Admin
const deleteAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const avail = doctor.availability.id(req.params.availId);
    if (!avail) {
      return res.status(404).json({ message: "Availability not found" });
    }

    // Optional: prevent deletion if any booked slots
    if (avail.timeSlots.some((s) => s.isBooked)) {
      return res
        .status(400)
        .json({ message: "Cannot delete availability with booked slots" });
    }

    // Remove the subdocument using pull
    doctor.availability.pull({ _id: req.params.availId });

    await doctor.save();
    res.json({ message: "Availability removed" });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error deleting availability: ${error.message}` });
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
  getAvailability,
  updateAvailability,
  deleteAvailability,
  getDoctorAppointments,
  updateAppointment,
};
