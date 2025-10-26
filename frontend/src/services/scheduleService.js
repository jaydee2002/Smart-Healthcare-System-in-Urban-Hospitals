// src/services/reportScheduleService.js
import api from "./api.js";

// ✅ Get all report schedules
export const getAllReportSchedules = async () => {
  const res = await api.get("/reports/schedules");
  return res.data.schedules; // assuming backend sends { schedules: [...] }
};

// ✅ Delete a report schedule by ID
export const deleteReportSchedule = async (id) => {
  const res = await api.delete(`/reports/schedule/${id}`);
  return res.data; // assuming backend sends { message: "Deleted successfully" }
};
