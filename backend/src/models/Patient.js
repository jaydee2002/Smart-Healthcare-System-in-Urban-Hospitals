// src/models/Patient.js
import mongoose from "mongoose";

const healthRecordSchema = new mongoose.Schema({
  diagnosis: [{ type: String }],
  treatment: [{ type: String }],
  medications: [{ name: String, dosage: String }],
  followUpDate: Date,
});

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    healthCardQR: { type: String }, // QR code string (generated in Step 7)
    records: [healthRecordSchema],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Links to patient user
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
