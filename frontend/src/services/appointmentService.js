// src/services/appointmentService.js
import api from "./api.js";

const searchDoctors = (filters) => {
  const params = new URLSearchParams(filters);
  return api.get(`/appointments/doctors/search?${params}`);
};

const getAvailableSlots = (doctorId, date) => {
  const params = date ? `?date=${date}` : "";
  return api.get(`/appointments/${doctorId}/slots${params}`);
};

const bookAppointment = (data) => api.post("/appointments/book", data);

const getMyAppointments = () => api.get("/appointments/my");

const cancelAppointment = (id) => api.delete(`/appointments/${id}`);

export {
  searchDoctors,
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
};
