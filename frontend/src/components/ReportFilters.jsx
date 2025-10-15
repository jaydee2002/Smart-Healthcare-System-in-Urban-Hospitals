// src/components/ReportFilters.jsx
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../services/api.js";
import toast from "react-hot-toast";

const ReportFilters = ({ onFilterChange, initialFilters = {} }) => {
  const [hospitals, setHospitals] = useState([]);
  const [startDate, setStartDate] = useState(
    initialFilters.startDate ? new Date(initialFilters.startDate) : null
  );
  const [endDate, setEndDate] = useState(
    initialFilters.endDate ? new Date(initialFilters.endDate) : null
  );
  const [hospital, setHospital] = useState(initialFilters.hospital || "");
  const [reportType, setReportType] = useState("daily");

  useEffect(() => {
    // Fetch hospitals (assume backend endpoint; or hardcode from seed)
    api
      .get("/hospitals") // Add if needed, or use seeded
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.hospitals)
          ? res.data.hospitals
          : [
              { _id: "1", name: "City Private" },
              { _id: "2", name: "Govt General" },
            ];
        setHospitals(data);
      })
      .catch(() => setHospitals([{ _id: "1", name: "Sample Hospital" }]));
  }, []);

  const handleApply = () => {
    const filters = {
      reportType,
      hospital,
      startDate: startDate?.toISOString().split("T")[0],
      endDate: endDate?.toISOString().split("T")[0],
    };
    onFilterChange(filters);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-bold mb-4">Filters</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Hospital</label>
          <select
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">All Hospitals</option>
            {hospitals.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      <button
        onClick={handleApply}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Apply Filters
      </button>
      <label className="ml-4">
        <input type="checkbox" className="mr-2" /> Schedule Email (Simulated)
      </label>
    </div>
  );
};

export default ReportFilters;
