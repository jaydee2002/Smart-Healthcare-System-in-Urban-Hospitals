// src/services/doctorService.js
import api from "./api.js";

const getDoctors = (filters) => {
  const params = new URLSearchParams(filters);
  return api.get(`/doctors?${params}`);
};

const getDoctorById = (id) => api.get(`/doctors/${id}`);

const createDoctor = (data) => api.post("/doctors", data);

const updateDoctor = (id, data) => api.put(`/doctors/${id}`, data);

const deleteDoctor = (id) => api.delete(`/doctors/${id}`);

const setAvailability = (id, data) =>
  api.post(`/doctors/${id}/availability`, data);

const getAvailability = (id) => api.get(`/doctors/${id}/availability`);

const updateAvailability = (id, availId, data) =>
  api.put(`/doctors/${id}/availability/${availId}`, data);

const deleteAvailability = (id, availId) =>
  api.delete(`/doctors/${id}/availability/${availId}`);

const getDoctorAppointments = (id, filters) => {
  const params = new URLSearchParams(filters);
  return api.get(`/doctors/${id}/appointments?${params}`);
};

export {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  setAvailability,
  getAvailability,
  updateAvailability,
  deleteAvailability,
  getDoctorAppointments,
};
