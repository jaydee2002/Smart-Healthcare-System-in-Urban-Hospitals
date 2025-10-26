// models/Report.js
import { Schema, model } from "mongoose";

// Define the Report schema
const reportSchema = new Schema({
  reportData: {
    patientVisitsData: [
      {
        time: { type: String, required: true },
        patients: { type: Number, required: true },
      },
    ],
    departmentData: [
      {
        name: { type: String, required: true },
        value: { type: Number, required: true },
        color: { type: String, required: true },
      },
    ],
    weeklyTrendData: [
      {
        day: { type: String, required: true },
        appointments: { type: Number, required: true },
        completed: { type: Number, required: true },
        cancelled: { type: Number, required: true },
      },
    ],
    topServicesData: [
      {
        service: { type: String, required: true },
        visits: { type: Number, required: true },
        avgDuration: { type: String, required: true },
        revenue: { type: String, required: true },
      },
    ],
    basePatients: { type: Number, required: true },
    baseAppointments: { type: Number, required: true },
  },
  generatedAt: { type: Date, default: Date.now, required: true },
  // Optional: Add payload reference if needed
  payload: { type: Schema.Types.Mixed }, // Stores the original req.body
});

// Create the Report model
const Report = model("Report", reportSchema);

export default Report;
