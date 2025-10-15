// src/pages/Manager/Reports.jsx
import { useState, useEffect } from "react";
import ReportFilters from "../../components/ReportFilters.jsx";
import ReportCharts from "../../components/ReportCharts.jsx";
import ReportExport from "../../components/ReportExport.jsx";
import { generateReport, getReports } from "../../services/reportService.js";
import toast from "react-hot-toast";

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [reportsHistory, setReportsHistory] = useState([]);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    // Load history
    getReports({ limit: 5 })
      .then((res) => setReportsHistory(res.data))
      .catch(console.error);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    generateReport(newFilters.reportType, {
      hospital: newFilters.hospital,
      startDate: newFilters.startDate,
      endDate: newFilters.endDate,
    })
      .then((res) => {
        setReportData(res.data);
        toast.success("Report generated");
      })
      .catch((error) => toast.error("Failed to generate report"));
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>
      <ReportFilters
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />
      {reportData && (
        <>
          <ReportCharts metrics={reportData.metrics} />
          <ReportExport
            reportId={reportData.reportId}
            metrics={reportData.metrics}
          />
        </>
      )}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Recent Reports</h3>
        <ul className="bg-white p-4 rounded-lg shadow-md">
          {reportsHistory.map((r) => (
            <li key={r._id} className="mb-2">
              {r.type} - {new Date(r.createdAt).toLocaleDateString()} (
              {r.generatedBy?.name})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Reports;
