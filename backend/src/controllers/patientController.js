// src/controllers/patientController.js
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import QRCode from "qrcode";
import Doctor from "../models/Doctor.js";

// @desc    Register new patient (doctor-side)
// @route   POST /api/patients
// @access  Private/Doctor
const registerPatient = async (req, res) => {
  try {
    const { name, email, phone, address, dateOfBirth, bloodType, allergies } =
      req.body;
    const doctorId = req.user._id; // Doctor from auth

    // Detect duplicate
    let patient = await Patient.findOne({ $or: [{ email }, { phone }] });
    if (patient) {
      return res
        .status(200)
        .json({ message: "Patient already exists", patient, action: "review" });
    }

    // Parse allergies
    const parsedAllergies = allergies
      ? allergies
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean)
      : [];

    // Create new patient
    patient = await Patient.create({
      name,
      email,
      phone,
      address,
      dateOfBirth,
      bloodType,
      allergies: parsedAllergies,
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
    const { diagnosis, treatment, medications, followUpDate } = req.body;
    const patientId = req.params.id;
    const doctorId = req.user._id; // This is the User ID from auth

    console.log("Recording consultation for Doctor (User ID):", doctorId);

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Parse diagnosis (handles string or array from frontend)
    let parsedDiagnosis = [];
    if (typeof diagnosis === "string") {
      parsedDiagnosis = diagnosis
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d);
    } else if (Array.isArray(diagnosis)) {
      // ✅ trim array items as well (previously only filtered)
      parsedDiagnosis = diagnosis.map((d) => d.trim()).filter((d) => d);
    }

    // Parse treatment similarly (handles string or array from frontend)
    let parsedTreatment = [];
    if (typeof treatment === "string") {
      parsedTreatment = treatment
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    } else if (Array.isArray(treatment)) {
      // ✅ trim array items as well
      parsedTreatment = treatment.map((t) => t.trim()).filter((t) => t);
    }

    // Parse medications (handles string or array of objects from frontend)
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
      // ✅ normalize objects by trimming too
      parsedMedications = medications
        .map((m) => ({
          name: (m.name ?? "").trim(),
          dosage: (m.dosage ?? "").trim(),
        }))
        .filter((m) => m.name);
    }

    // Add new record (with consultation date and followUpDate if provided)
    patient.records.push({
      date: new Date().toISOString(), // Add current date for consultation
      diagnosis: parsedDiagnosis,
      treatment: parsedTreatment,
      medications: parsedMedications,
      followUpDate,
    });

    await patient.save();

    res.json({
      ...patient.toObject(),
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
    const { name, email, phone, address, dateOfBirth, bloodType, allergies } =
      req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (name !== undefined) patient.name = name;
    if (email !== undefined) patient.email = email;
    if (phone !== undefined) patient.phone = phone;
    if (address !== undefined) patient.address = address;
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
    if (bloodType !== undefined) patient.bloodType = bloodType;
    if (allergies !== undefined) {
      patient.allergies = allergies
        ? allergies
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean)
        : [];
    }

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
