// src/services/reportService.js
import api from "./api.js";

const generateReport = (type, filters) => {
  const params = new URLSearchParams(filters);
  return api.get(`/reports/${type}?${params}`);
};

const getReports = (filters) => {
  const params = new URLSearchParams(filters);
  return api.get(`/reports?${params}`);
};

const getReportById = (id) => api.get(`/reports/${id}`);

export { generateReport, getReports, getReportById };
