import { useState, useEffect } from "react";
import { ReportsAnalytics } from "../../components/ReportFilters.jsx";
import ReportCharts from "../../components/ReportCharts.jsx";
import ReportExport from "../../components/ReportExport.jsx";
import { generateReport, getReports } from "../../services/reportService.js";
import toast from "react-hot-toast";
import ManageSchedule from "./manageSchedule.jsx";
import ReportList from "../../components/ReportList.jsx";
import { useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  Calendar,
  BarChart3,
  ArrowRight,
  Settings,
  User,
} from "lucide-react";

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [reportsHistory, setReportsHistory] = useState([]);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
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
      .catch(() => toast.error("Failed to generate report"));
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col p-6  border-r border-gray-700/50">
        <div className="mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Manager Dashboard
          </h2>
          <p className="text-sm text-gray-400">Healthcare Analytics Hub</p>
        </div>
        <nav className="flex flex-col space-y-2 flex-1">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-all duration-300 text-gray-300 hover:text-white group"
          >
            <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Overview</span>
          </button>
          <button
            onClick={() => navigate("/reports")}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white  transform hover:scale-105 transition-all duration-300"
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium">Reports</span>
          </button>
          <button
            onClick={() => navigate("/schedules")}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-all duration-300 text-gray-300 hover:text-white group"
          >
            <Calendar className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Schedules</span>
          </button>
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-700/50">
          <button className="flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-all duration-300 text-gray-300 hover:text-white">
            <User className="h-5 w-5" />
            <span className="font-medium">Profile</span>
          </button>
          <button className="flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-all duration-300 text-gray-300 hover:text-white">
            <Settings className="h-5 w-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content (scrollable) */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Topbar */}

        {/* Reports Section */}
        <div className="space-y-8 pb-8">
          {/* Filters/Analytics */}
          <div className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden">
            <ReportsAnalytics onFilterChange={handleFilterChange} />
          </div>

          {/* Schedule Management */}
          <div className="bg-white rounded-2xl  border border-gray-200/50 overflow-hidden">
            <ManageSchedule />
          </div>

          {/* Charts */}
          {reportData && (
            <div className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden">
              <ReportCharts metrics={reportData.metrics} />
            </div>
          )}

          {/* Export */}
          {reportData && (
            <div className="bg-white rounded-2xl  border border-gray-200/50 overflow-hidden">
              <ReportExport
                reportId={reportData.reportId}
                metrics={reportData.metrics}
              />
            </div>
          )}

          {/* Recent Reports List - Integrated for completeness */}
          <div className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden">
            <div className="p-6 border-b border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Recent Reports</span>
              </h3>
            </div>
            <div className="p-6">
              <ReportList reports={reportsHistory} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
