import { useState, useEffect, useRef } from "react";
import { getDoctors, deleteDoctor } from "../services/doctorService.js";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  Trash2,
  Pencil,
  Calendar,
  Building2,
  GraduationCap,
  ChevronRight,
} from "lucide-react";

const DoctorTable = ({ onEdit }) => {
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    hospital: "",
    specialization: "",
  });
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Fetch doctors when filters change
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      fetchDoctors(filters);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters]);

  const fetchDoctors = async (filterParams) => {
    try {
      setLoading(true);
      const res = await getDoctors(filterParams);
      setDoctors(res.data);
    } catch (error) {
      toast.error("Error fetching doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  // Helper function to get initials
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Doctor Avatar Component (Image with fallback to initials)
  const DoctorAvatar = ({ doctor }) => {
    console.log(doctor.image);
    const imageUrl = doctor.image
      ? `http://localhost:5001${doctor.image}`
      : null;
    return (
      <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${doctor.name}'s profile`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.target.style.display = "none";
              const fallback = e.target.nextSibling;
              if (fallback) fallback.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`w-full h-full bg-gray-500 flex items-center justify-center flex-shrink-0 absolute inset-0 ${
            imageUrl ? "hidden" : ""
          }`}
        >
          <span className="text-white text-sm font-bold">
            {getInitials(doctor.name)}
          </span>
        </div>
      </div>
    );
  };

  // Badge Component
  const Badge = ({ icon: Icon, text, variant = "default" }) => {
    const variantStyles = {
      default: "bg-gray-50 text-gray-700",
      secondary: "bg-gray-50 text-gray-700",
    };

    return (
      <span
        className={`px-2.5 py-1 ${variantStyles[variant]} rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap`}
      >
        {Icon && <Icon className="w-3 h-3" />}
        {text}
      </span>
    );
  };

  // Action Button Component
  const ActionButton = ({
    icon: Icon,
    onClick,
    title,
    variant = "default",
    href,
  }) => {
    const variantStyles = {
      default: "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
      edit: "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
      delete: "text-red-600 hover:text-red-700 hover:bg-red-50",
      view: "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
    };

    const buttonClass = `p-2 ${variantStyles[variant]} rounded-lg transition-all duration-200`;

    if (href) {
      return (
        <Link to={href} className={buttonClass} title={title}>
          <Icon className="w-4 h-4" />
        </Link>
      );
    }

    return (
      <button onClick={onClick} className={buttonClass} title={title}>
        <Icon className="w-4 h-4" />
      </button>
    );
  };

  // Doctor Card Component
  const DoctorCard = ({ doctor, onEdit, onDelete }) => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 transition-all duration-200 hover:shadow-sm group">
        <div className="flex items-center justify-between gap-4">
          {/* Doctor Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <DoctorAvatar doctor={doctor} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-sm">
                  {doctor.name}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {doctor.qualification}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                icon={GraduationCap}
                text={doctor.specialization}
                variant="default"
              />
              <Badge
                icon={Building2}
                text={doctor.hospital?.name || "N/A"}
                variant="secondary"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <ActionButton
              icon={Pencil}
              onClick={() => onEdit(doctor)}
              title="Edit doctor"
              variant="edit"
            />
            <ActionButton
              icon={Trash2}
              onClick={() => onDelete(doctor)}
              title="Delete doctor"
              variant="delete"
            />
            <ActionButton
              icon={Calendar}
              href={`/admin/doctors/${doctor._id}/availability`}
              title="View availability"
              variant="view"
            />
            <div className="pl-2 ml-2 border-l border-gray-200">
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Skeleton Card Component
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="min-w-0 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-5 bg-gray-200 rounded-full w-20"></div>
            <div className="h-5 bg-gray-200 rounded-full w-24"></div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="pl-2 ml-2 border-l border-gray-200 w-4 h-4"></div>
        </div>
      </div>
    </div>
  );

  // Filter Card Component
  const FilterCard = ({ filters, onFilterChange }) => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              name="search"
              placeholder="Search by name or specialization"
              value={filters.search || ""}
              onChange={onFilterChange}
              autoComplete="off"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-sm bg-white hover:border-gray-400"
            />
          </div>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              name="hospital"
              placeholder="Hospital ID"
              value={filters.hospital || ""}
              onChange={onFilterChange}
              autoComplete="off"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-sm bg-white hover:border-gray-400"
            />
          </div>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              name="specialization"
              placeholder="Specialization"
              value={filters.specialization || ""}
              onChange={onFilterChange}
              autoComplete="off"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-sm bg-white hover:border-gray-400"
            />
          </div>
        </div>
      </div>
    );
  };

  // Empty State Component
  const EmptyState = () => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <p className="text-gray-600 font-semibold">No doctors found</p>
        <p className="text-gray-500 text-sm mt-1">
          Try adjusting your search filters
        </p>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 px-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold text-gray-900">Doctors</h2>
        <p className="text-sm text-gray-600">
          Manage and search through registered doctors
        </p>
      </div>

      {/* Filters */}
      <FilterCard filters={filters} onFilterChange={handleFilterChange} />

      {/* Doctors List */}
      <div className="space-y-3">
        {loading && doctors.length > 0 && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-500 border-t-transparent mr-2" />
            <span className="text-sm text-gray-500">Updating results...</span>
          </div>
        )}
        {loading && doctors.length === 0 ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <EmptyState />
        ) : (
          doctors.map((doctor) => (
            <DoctorCard
              key={doctor._id}
              doctor={doctor}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))
        )}
        {!loading && doctors.length > 0 && (
          <div className="text-center text-sm text-gray-500 pt-2">
            Showing {doctors.length} doctor
            {doctors.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorTable;
