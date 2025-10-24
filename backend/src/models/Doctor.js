// src/models/Doctor.js
import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  timeSlots: [
    { start: Date, end: Date, isBooked: { type: Boolean, default: false } },
  ],
  recurrence: { type: String, enum: ["none", "daily", "weekly", "monthly"] }, // For Step 4
});

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, min: 25 }, // New field: Age with minimum validation
    qualification: { type: String, required: true },
    specialization: { type: String, required: true },
    consultationRate: { type: Number, min: 1000 }, // New field: Consultation rate (LKR) with minimum
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    image: { type: String }, // New field: Path to uploaded profile image
    availability: [availabilitySchema],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Links to doctor user
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
