// src/pages/Manager/ManageSchedule.jsx (adjust path as needed)
import { useEffect, useState } from "react";
import {
  getAllReportSchedules,
  deleteReportSchedule,
} from "../../services/scheduleService.js";
import toast from "react-hot-toast";

const ManageSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await getAllReportSchedules();
      setSchedules(data);
      setFilteredSchedules(data);
      toast.success("Schedules loaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch schedules");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteReportSchedule(deleteId);
      toast.success("Schedule deleted successfully");
      setSchedules((prev) => prev.filter((item) => item._id !== deleteId));
      setFilteredSchedules((prev) =>
        prev.filter((item) => item._id !== deleteId)
      );
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete schedule");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setReportTypeFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    let filtered = [...schedules];

    if (searchTerm) {
      filtered = filtered.filter(
        (schedule) =>
          schedule.reportType
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          schedule.department
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          schedule.serviceType
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          schedule.patientType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (reportTypeFilter !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.reportType === reportTypeFilter
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.department === departmentFilter
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.status === statusFilter
      );
    }

    setFilteredSchedules(filtered);
  }, [searchTerm, reportTypeFilter, departmentFilter, statusFilter, schedules]);

  const getStatusVariant = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "active" || statusLower === "scheduled")
      return "bg-blue-100 text-blue-800";
    if (statusLower === "completed") return "bg-gray-100 text-gray-800";
    if (statusLower === "cancelled") return "bg-red-100 text-red-800";
    return "bg-gray-200 text-gray-800";
  };

  const uniqueReportTypes = [...new Set(schedules.map((s) => s.reportType))];
  const uniqueDepartments = [...new Set(schedules.map((s) => s.department))];
  const uniqueStatuses = [...new Set(schedules.map((s) => s.status))];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Manage Report Schedules</h1>
        <p className="text-gray-600 text-sm">
          View, filter, and manage all scheduled reports
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <span>🔍</span> Search & Filters
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Use the filters below to find specific schedules
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              placeholder="Search schedules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Report Type Filter */}
          <select
            value={reportTypeFilter}
            onChange={(e) => setReportTypeFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Report Types</option>
            {uniqueReportTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-[180px]"
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
          >
            🔄 Reset Filters
          </button>

          <div className="ml-auto">
            <button
              onClick={fetchSchedules}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">📅 Scheduled Reports</span>
          <span className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-600">
            {filteredSchedules.length} of {schedules.length}
          </span>
        </h2>
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            Loading schedules...
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mb-1 text-gray-900">No schedules found</h3>
            <p className="text-gray-600">
              {schedules.length === 0
                ? "There are no scheduled reports yet"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">
                    Report Type
                  </th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">
                    Department
                  </th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">
                    Service
                  </th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">
                    Patient Type
                  </th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">
                    Scheduled Time
                  </th>
                  <th className="py-2 px-4 text-right text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((schedule) => (
                  <tr key={schedule._id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-4 text-sm">
                      {schedule.reportType || "N/A"}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {schedule.department || "N/A"}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {schedule.serviceType || "N/A"}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {schedule.patientType || "N/A"}
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusVariant(
                          schedule.status
                        )}`}
                      >
                        {schedule.status || "Unknown"}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        {schedule.scheduleDateTime
                          ? new Date(schedule.scheduleDateTime).toLocaleString()
                          : "N/A"}
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => setDeleteId(schedule._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete the
              scheduled report.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSchedule;
