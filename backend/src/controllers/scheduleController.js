import ReportSchedule from "../models/ReportSchedule.js";

// ✅ Create a new schedule
export const createReportSchedule = async (req, res) => {
  try {
    const {
      reportType,
      department,
      serviceType,
      patientType,
      status,
      scheduleDateTime,
    } = req.body;

    const newSchedule = new ReportSchedule({
      reportType,
      department,
      serviceType,
      patientType,
      status,
      scheduleDateTime,
    });

    await newSchedule.save();
    res.status(201).json({ success: true, schedule: newSchedule });
  } catch (err) {
    console.error("Error creating report schedule:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ✅ Get all schedules
export const getAllReportSchedules = async (req, res) => {
  try {
    const schedules = await ReportSchedule.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, schedules });
  } catch (err) {
    console.error("Error fetching report schedules:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ✅ Delete schedule by ID
export const deleteReportScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ReportSchedule.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Schedule deleted successfully" });
  } catch (err) {
    console.error("Error deleting report schedule:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
