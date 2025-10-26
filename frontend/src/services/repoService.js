// src/services/reportsService.js
import api from "./api.js";

export const getAllReports = async () => {
  const response = await api.get("/oapi/reports");
  return response.data;
};

export const deleteReport = async (id) => {
  const response = await api.delete(`/oapi/reports/${id}`);
  return response.data;
};

export const getReportById = async (id) => {
  const response = await api.get(`/oapi/reports/${id}`);
  return response.data;
};

export const createReport = async (payload) => {
  const response = await api.post("/oapi/reports", payload);
  return response.data;
};

export const updateReport = async (id, payload) => {
  const response = await api.put(`/oapi/reports/${id}`, payload);
  return response.data;
};
