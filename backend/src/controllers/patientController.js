// src/controllers/patientController.js
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import QRCode from "qrcode";
import Doctor from "../models/Doctor.js";

// @desc    Register new patient (doctor-side)
// @route   POST /api/patients/register
// @access  Private/Doctor
const registerPatient = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const doctorId = req.user._id; // Doctor from auth

    // Detect duplicate
    let patient = await Patient.findOne({ $or: [{ email }, { phone }] });
    if (patient) {
      return res
        .status(200)
        .json({ message: "Patient already exists", patient, action: "review" });
    }

    // Create new patient
    patient = await Patient.create({
      name,
      email,
      phone,
      address,
      user: null, // Optional; link if patient registers later
    });

    // Generate QR for health card (data URL)
    const qrData = `patient:${patient._id}`; // Simple payload
    const qrCodeDataURL = await QRCode.toDataURL(qrData);

    patient.healthCardQR = qrCodeDataURL;
    await patient.save();

    res.status(201).json({
      ...patient.toObject(),
      message: "Patient registered and QR generated",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record consultation for patient
// @route   POST /api/patients/:id/consultation
// @access  Private/Doctor
const recordConsultation = async (req, res) => {
  try {
    const { diagnosis, treatment, medications, followUpDate } = req.body; // medications: string or [{name, dosage}]
    const patientId = req.params.id;
    const doctorId = req.user._id;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Parse diagnosis (split comma-separated if string)
    let parsedDiagnosis = [];
    if (typeof diagnosis === "string") {
      parsedDiagnosis = diagnosis
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d);
    } else if (Array.isArray(diagnosis)) {
      parsedDiagnosis = diagnosis;
    }

    // Parse treatment similarly
    let parsedTreatment = [];
    if (typeof treatment === "string") {
      parsedTreatment = treatment
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    } else if (Array.isArray(treatment)) {
      parsedTreatment = treatment;
    }

    // Parse medications
    let parsedMedications = [];
    if (typeof medications === "string") {
      parsedMedications = medications
        .split(",")
        .map((med) => {
          const [name, dosage] = med.trim().split(":");
          return { name: name?.trim() || "", dosage: dosage?.trim() || "" };
        })
        .filter((m) => m.name); // Filter invalid
    } else if (Array.isArray(medications)) {
      parsedMedications = medications;
    }

    // Add new record
    patient.records.push({
      diagnosis: parsedDiagnosis,
      treatment: parsedTreatment,
      medications: parsedMedications,
      followUpDate,
    });

    await patient.save();

    // Schedule follow-up appointment if date provided
    let followUpAppointment = null;
    if (followUpDate) {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      // Optional: Skip if past date
      if (new Date(followUpDate) < new Date()) {
        res.json({
          ...patient.toObject(),
          message:
            "Consultation recorded; follow-up date is in the past, no appointment scheduled",
        });
        return;
      }
      // Find next available slot (simplified: use first available on that date)
      const availDate = doctor.availability.find(
        (a) => a.date.toDateString() === new Date(followUpDate).toDateString()
      );
      if (availDate && availDate.timeSlots.some((s) => !s.isBooked)) {
        const freeSlot = availDate.timeSlots.find((s) => !s.isBooked);
        followUpAppointment = await Appointment.create({
          patient: patientId,
          doctor: doctorId,
          date: new Date(followUpDate),
          timeSlot: freeSlot.time, // Assuming schema expects string; adjust if needed
          status: "booked",
          type: doctor.hospital?.type || "default",
        });

        // Mark slot booked
        const slotIndex = availDate.timeSlots.findIndex((s) => s === freeSlot); // Use reference to exact slot
        if (slotIndex !== -1) {
          availDate.timeSlots[slotIndex].isBooked = true;
        }
        await doctor.save();
      } else {
        // Suggest next slot (placeholder)
        res.json({
          ...patient.toObject(),
          message:
            "Consultation recorded; follow-up slot unavailable, suggest rescheduling",
        });
        return;
      }
    }

    res.json({
      ...patient.toObject(),
      followUpAppointment,
      message: "Consultation recorded successfully",
    });
  } catch (error) {
    console.error(error); // Add for debugging
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient details (for doctor review)
// @route   GET /api/patients/:id
// @access  Private/Doctor
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate("records");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor's patients (search by name/email)
// @route   GET /api/patients
// @access  Private/Doctor
const getDoctorPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const patients = await Patient.find(query).select("-healthCardQR"); // Hide QR for list
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update patient details (e.g., after review)
// @route   PUT /api/patients/:id
// @access  Private/Doctor
const updatePatient = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (name) patient.name = name;
    if (email) patient.email = email;
    if (phone) patient.phone = phone;
    if (address) patient.address = address;

    const updatedPatient = await patient.save();
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  registerPatient,
  recordConsultation,
  getPatientById,
  getDoctorPatients,
  updatePatient,
};
