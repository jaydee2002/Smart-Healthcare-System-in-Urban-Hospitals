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
    qualification: { type: String, required: true },
    specialization: { type: String, required: true },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    availability: [availabilitySchema],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Links to doctor user
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
