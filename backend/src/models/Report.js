// src/models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // daily, weekly, etc.
    filters: {
      hospital: mongoose.Schema.Types.ObjectId,
      dateRange: { start: Date, end: Date },
    },
    metrics: {
      patientCount: Number,
      peakTimes: [String],
      utilization: Number, // e.g., % slots filled
    },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
