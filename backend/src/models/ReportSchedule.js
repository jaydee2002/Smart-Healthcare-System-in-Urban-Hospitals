import mongoose from "mongoose";

const reportScheduleSchema = new mongoose.Schema(
  {
    reportType: { type: String, required: true },
    department: { type: String, required: true },
    serviceType: { type: String, required: true },
    patientType: { type: String, required: true },
    status: { type: String, required: true },

    scheduleDateTime: { type: Date, required: true },
    isGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("ReportSchedule", reportScheduleSchema);
