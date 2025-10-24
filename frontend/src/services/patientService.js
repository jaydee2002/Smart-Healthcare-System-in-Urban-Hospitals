// src/services/patientService.js
import api from "./api.js";

const registerPatient = async (data) => {
  try {
    const res = await api.post("/patients", data);
    return res; // res.data should be { _id, name, ... }
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error registering patient"
    );
  }
};

const recordConsultation = async (id, data) => {
  try {
    const res = await api.post(`/patients/${id}/consultation`, data);
    return res;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error recording consultation"
    );
  }
};

const getPatientById = async (id) => {
  try {
    const res = await api.get(`/patients/${id}`);
    return res;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching patient");
  }
};

const getDoctorPatients = async (search) => {
  try {
    const res = await api.get("/patients", {
      params: { search }, // Better for multiple params in future; auto-encodes
    });
    return res;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching patients");
  }
};

const updatePatient = async (id, data) => {
  try {
    const res = await api.put(`/patients/${id}`, data);
    return res;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating patient");
  }
};

export {
  registerPatient,
  recordConsultation,
  getPatientById,
  getDoctorPatients,
  updatePatient,
};
