import { useState, useEffect } from "react";
import { getDoctors, deleteDoctor } from "../services/doctorService.js";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  PencilIcon,
  TrashIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const DoctorTable = ({ onEdit }) => {
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    hospital: "",
    specialization: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDoctors(filters)
      .then((res) => {
        setDoctors(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDelete = async (doctor) => {
    if (window.confirm(`Delete doctor ${doctor.name}?`)) {
      try {
        await deleteDoctor(doctor._id);
        setDoctors(doctors.filter((d) => d._id !== doctor._id));
        toast.success("Doctor deleted");
      } catch (error) {
        toast.error(error.response?.data?.message || "Error deleting doctor");
      }
    }
  };

  if (loading)
    return <div className="p-4 text-gray-600">Loading doctors...</div>;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          name="search"
          placeholder="Search by name/specialization"
          value={filters.search}
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition flex-1 min-w-[200px]"
        />
        <input
          type="text"
          name="hospital"
          placeholder="Hospital ID"
          value={filters.hospital}
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-32"
        />
        <input
          type="text"
          name="specialization"
          placeholder="Specialization"
          value={filters.specialization}
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-32"
        />
      </div>
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">
                Name
              </th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">
                Qualification
              </th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">
                Specialization
              </th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">
                Hospital
              </th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor, index) => (
              <tr
                key={doctor._id}
                className={`hover:bg-gray-50 transition ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="p-4 text-sm text-gray-900">{doctor.name}</td>
                <td className="p-4 text-sm text-gray-900">
                  {doctor.qualification}
                </td>
                <td className="p-4 text-sm text-gray-900">
                  {doctor.specialization}
                </td>
                <td className="p-4 text-sm text-gray-900">
                  {doctor.hospital?.name}
                </td>
                <td className="p-4 flex space-x-2">
                  <button
                    onClick={() => onEdit(doctor)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition"
                    aria-label="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doctor)}
                    className="p-1 text-red-600 hover:text-red-800 transition"
                    aria-label="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <Link
                    to={`/admin/doctors/${doctor._id}/availability`}
                    className="p-1 text-green-600 hover:text-green-800 transition"
                    aria-label="Availability"
                  >
                    <CalendarIcon className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorTable;
