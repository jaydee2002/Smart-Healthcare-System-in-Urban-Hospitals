// Frontend: src/components/ReportList.jsx (React with Tailwind)
import React, { useState, useEffect } from "react";
import { getAllReports, deleteReport } from "../services/repoService"; // Fixed import path

const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterByPatients, setFilterByPatients] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const [showToast, setShowToast] = useState({ message: "", type: "" });

  useEffect(() => {
    fetchReports();
  }, []);

  const showToastMessage = (message, type = "success") => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast({ message: "", type: "" }), 3000);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await getAllReports();
      setReports(data);
      setFilteredReports(data);
      showToastMessage("Reports loaded successfully");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to fetch reports";
      setError(errorMsg);
      showToastMessage(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteId) return;

    try {
      await deleteReport(deleteId);
      showToastMessage("Report deleted successfully");
      setReports((prev) => prev.filter((item) => item._id !== deleteId));
      setFilteredReports((prev) =>
        prev.filter((item) => item._id !== deleteId)
      );
      setDeleteId(null);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to delete report";
      showToastMessage(errorMsg, "error");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSortBy("newest");
    setFilterByPatients("all");
  };

  useEffect(() => {
    let filtered = [...reports];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((report) =>
        report._id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by patient count
    if (filterByPatients !== "all") {
      const threshold = parseInt(filterByPatients);
      filtered = filtered.filter(
        (report) => report.reportData.basePatients >= threshold
      );
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort(
        (a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)
      );
    } else if (sortBy === "oldest") {
      filtered.sort(
        (a, b) => new Date(a.generatedAt) - new Date(b.generatedAt)
      );
    } else if (sortBy === "patients-high") {
      filtered.sort(
        (a, b) => b.reportData.basePatients - a.reportData.basePatients
      );
    } else if (sortBy === "patients-low") {
      filtered.sort(
        (a, b) => a.reportData.basePatients - b.reportData.basePatients
      );
    }

    setFilteredReports(filtered);
  }, [searchTerm, sortBy, filterByPatients, reports]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-red-50 border border-red-200 rounded-lg">
          <div className="p-6">
            <div className="text-center text-red-600">
              <p className="mb-4">Error: {error}</p>
              <button
                onClick={fetchReports}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Generated Reports</h1>
          <p className="text-gray-600">
            View and manage all generated healthcare reports
          </p>
        </div>

        {/* Filters Card */}
        <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🔍 Search & Filters
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Find specific reports using search and filters
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </div>
                <input
                  type="text"
                  placeholder="Search by Report ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="patients-high">Most Patients</option>
                <option value="patients-low">Least Patients</option>
              </select>

              {/* Filter by Patients */}
              <select
                value={filterByPatients}
                onChange={(e) => setFilterByPatients(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Reports</option>
                <option value="500">500+ Patients</option>
                <option value="1000">1000+ Patients</option>
                <option value="2000">2000+ Patients</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 justify-between items-center">
              {/* Reset Filters */}
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                🔄 Reset Filters
              </button>

              {/* Results Count */}
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-md">
                Showing {filteredReports.length} of {reports.length} reports
              </span>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-6xl mx-auto mb-3">📄</div>
                <h3 className="mb-1 text-lg font-semibold text-gray-900">
                  No reports found
                </h3>
                <p className="text-gray-600">
                  {reports.length === 0
                    ? "No reports have been generated yet"
                    : "Try adjusting your filters"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <div
                key={report._id}
                className="bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow duration-200 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="flex items-center gap-2 mb-2 font-semibold text-sm">
                        📄 Report
                      </h4>
                      <p className="text-xs text-gray-500 break-all">
                        ID: {report._id}
                      </p>
                    </div>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                      Active
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Generated Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      📅 {new Date(report.generatedAt).toLocaleString()}
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-600">👥</span>
                          <span className="text-xs text-gray-600">
                            Patients
                          </span>
                        </div>
                        <div className="text-xl font-bold text-blue-700">
                          {report.reportData.basePatients.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-green-600">📋</span>
                          <span className="text-xs text-gray-600">
                            Appointments
                          </span>
                        </div>
                        <div className="text-xl font-bold text-green-700">
                          {report.reportData.baseAppointments.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Departments</span>
                        <span>
                          {report.reportData.departmentData?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Services Tracked</span>
                        <span>
                          {report.reportData.topServicesData?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() =>
                          (window.location.href = `/view-report/${report._id}`)
                        }
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center justify-center gap-1"
                      >
                        👁 View Details
                      </button>
                      <button
                        onClick={() => setDeleteId(report._id)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 text-sm flex items-center justify-center"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">Delete Report?</h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. This will permanently delete the
                report and all its associated data.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReport}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast.message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-md ${
            showToast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          } transform transition-transform duration-300 translate-x-full animate-slide-in-right`}
        >
          {showToast.message}
        </div>
      )}
    </>
  );
};

export default ReportList;
