// src/components/DoctorSearch.jsx
import { useState, useEffect } from "react";
import { searchDoctors } from "../services/appointmentService.js";
import { Link } from "react-router-dom"; // Or onSelect prop

const DoctorSearch = ({ onSelectDoctor }) => {
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({
    hospitalType: "",
    specialization: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    searchDoctors(filters)
      .then((res) => {
        setDoctors(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="p-4">Searching doctors...</div>;

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-4">
        <select
          name="hospitalType"
          onChange={handleFilterChange}
          className="p-2 border rounded"
        >
          <option value="">All Types</option>
          <option value="private">Private</option>
          <option value="government">Government</option>
        </select>
        <input
          type="text"
          name="specialization"
          placeholder="Specialization"
          onChange={handleFilterChange}
          className="p-2 border rounded flex-1"
        />
      </div>
      <ul className="space-y-2">
        {doctors.map((doctor) => (
          <li key={doctor._id} className="bg-white p-4 rounded shadow-md">
            <h4 className="font-bold">
              {doctor.name} - {doctor.specialization}
            </h4>
            <p>
              {doctor.hospital?.name} ({doctor.hospital?.type})
            </p>
            <button
              onClick={() => onSelectDoctor(doctor)}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
            >
              View Slots
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DoctorSearch;
