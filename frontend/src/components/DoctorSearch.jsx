import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Calendar,
  ChevronRight,
  User,
  Building2,
} from "lucide-react";
import { searchDoctors } from "../services/appointmentService.js";
import api from "../services/api.js"; // Assuming api is available for fetching hospitals

const getInitials = (name) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const DoctorCard = ({ doctor, onSelect }) => {
  const hospitalType = doctor.hospital?.type?.toLowerCase();
  const typeBadgeClass =
    hospitalType === "government"
      ? "bg-green-100 text-green-800 border border-green-200"
      : "bg-blue-100 text-blue-800 border border-blue-200";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors duration-200">
      {/* Header: Avatar + Name + Qualification */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium flex-shrink-0">
          <span className="text-sm">{getInitials(doctor.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {doctor.name}
          </h3>
          <p className="text-sm text-gray-500">
            {doctor.qualification || "MD, MBBS"}
          </p>
        </div>
      </div>

      {/* Specialization */}
      <div className="mb-4">
        <p className="text-gray-900 font-medium text-sm">
          {doctor.specialization}
        </p>
      </div>

      {/* Hospital Info */}
      {doctor.hospital?.name && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate flex-1">{doctor.hospital.name}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadgeClass}`}
          >
            {hospitalType === "government" ? "Government" : "Private"}
          </span>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => onSelect(doctor)}
        className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors duration-200 flex items-center justify-between text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          View Available Slots
        </span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// Loading Skeleton
const DoctorCardSkeleton = () => {
  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-40 bg-gray-100 rounded" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-10 w-full bg-gray-100 rounded-md" />
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = () => {
  return (
    <div className="border border-gray-200 rounded-xl p-16 text-center bg-white">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <Search className="w-8 h-8 text-gray-500" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No doctors found
      </h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        We couldn't find any doctors matching your criteria. Try adjusting your
        filters.
      </p>
    </div>
  );
};

// Main Component
const DoctorSearch = ({ onSelectDoctor }) => {
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [specializations, setSpecializations] = useState([]); // Assuming specializations are fetched or predefined
  const [filters, setFilters] = useState({
    name: "",
    specialization: "",
    hospitalId: "",
    hospitalType: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch hospitals
    api
      .get("/hospitals")
      .then((res) => {
        if (res.data?.success) setHospitals(res.data.data);
      })
      .catch(() => {});

    // Fetch or set specializations (assuming predefined or fetched)
    setSpecializations([
      "Cardiology",
      "Neurology",
      "Pediatrics",
      "Dermatology",
      "Orthopedics",
      // Add more as needed
    ]);

    setLoading(true);
    searchDoctors(filters)
      .then((res) => {
        setDoctors(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [filters]);

  const handleNameChange = (e) => {
    setFilters({ ...filters, name: e.target.value });
  };

  const handleSpecializationChange = (e) => {
    setFilters({ ...filters, specialization: e.target.value });
  };

  const handleHospitalChange = (e) => {
    setFilters({ ...filters, hospitalId: e.target.value });
  };

  const handleHospitalTypeChange = (e) => {
    setFilters({ ...filters, hospitalType: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Channel your Doctor
          </h1>
          <p className="text-gray-600">
            Search and book appointments with verified specialists
          </p>
        </div>

        {/* Layout: Doctors on left, Filters on right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Doctors Grid - Left (3 columns on lg) */}

          <div className="lg:col-span-1 sticky top-8 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Filters
              </h3>

              {/* Doctor Name Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  Doctor Name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    value={filters.name}
                    onChange={handleNameChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Specialization Select */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  Specialization
                </label>
                <div className="relative">
                  <select
                    value={filters.specialization}
                    onChange={handleSpecializationChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-colors appearance-none"
                  >
                    <option value="">All Specializations</option>
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Hospital Select */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  Hospital
                </label>
                <div className="relative">
                  <select
                    value={filters.hospitalId}
                    onChange={handleHospitalChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-colors appearance-none"
                  >
                    <option value="">All Hospitals</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital._id} value={hospital._id}>
                        {hospital.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Hospital Type Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Type
                </label>
                <div className="relative">
                  <select
                    value={filters.hospitalType}
                    onChange={handleHospitalTypeChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-colors appearance-none"
                  >
                    <option value="">All Hospital Types</option>
                    <option value="private">Private Hospitals</option>
                    <option value="government">Government Hospitals</option>
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {/* Results count */}
            {!loading && (
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} found
                </p>
              </div>
            )}

            {/* Doctors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                [...Array(4)].map((_, i) => <DoctorCardSkeleton key={i} />)
              ) : doctors.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState />
                </div>
              ) : (
                doctors.map((doctor) => (
                  <DoctorCard
                    key={doctor._id}
                    doctor={doctor}
                    onSelect={onSelectDoctor}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSearch;
