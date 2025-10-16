// src/services/patientService.js
import api from "./api.js";

const registerPatient = (data) => api.post("/patients/register", data);

const recordConsultation = (id, data) =>
  api.post(`/patients/${id}/consultation`, data);

const getPatientById = (id) => api.get(`/patients/${id}`);

const getDoctorPatients = (search) => {
  const params = search ? `?search=${search}` : "";
  return api.get(`/patients${params}`);
};

const updatePatient = (id, data) => api.put(`/patients/${id}`, data);

export {
  registerPatient,
  recordConsultation,
  getPatientById,
  getDoctorPatients,
  updatePatient,
};
