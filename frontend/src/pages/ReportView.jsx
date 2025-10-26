// Frontend: src/components/ReportView.jsx (React with Tailwind)
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getReportById } from "../services/repoService";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  ArrowLeft,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  Clock,
  DollarSign,
  FileText,
  Download,
  BarChart3,
  PieChart,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const ReportView = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("visits");
  const reportRef = useRef(null);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await getReportById(id);
      setReport(data);
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Failed to fetch report"
      );
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`report-${report._id}.pdf`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Error: {error}</p>
          </div>
        </div>
        <Link to="/manager">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </button>
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="mb-1 text-lg font-semibold text-gray-900">
              Report not found
            </h3>
            <p className="text-gray-600 mb-4">
              The requested report could not be found.
            </p>
            <Link to="/manager">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 mx-auto">
                <ArrowLeft className="h-4 w-4" />
                Back to Reports
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { reportData, generatedAt } = report;

  // Calculate some statistics
  const totalPatientVisits =
    reportData.patientVisitsData?.reduce(
      (sum, item) => sum + item.patients,
      0
    ) || 0;

  const peakVisitTime =
    reportData.patientVisitsData?.reduce(
      (max, item) => (item.patients > max.patients ? item : max),
      reportData.patientVisitsData[0]
    ) || {};

  const totalDepartmentValue =
    reportData.departmentData?.reduce((sum, item) => sum + item.value, 0) || 0;

  const weeklyTotal =
    reportData.weeklyTrendData?.reduce(
      (sum, item) => sum + item.appointments,
      0
    ) || 0;

  const weeklyCompleted =
    reportData.weeklyTrendData?.reduce(
      (sum, item) => sum + item.completed,
      0
    ) || 0;

  const completionRate =
    weeklyTotal > 0 ? ((weeklyCompleted / weeklyTotal) * 100).toFixed(1) : 0;

  const totalRevenue =
    reportData.topServicesData?.reduce(
      (sum, item) => sum + parseFloat(item.revenue.replace(/[$,]/g, "")),
      0
    ) || 0;

  const renderTabContent = () => {
    switch (activeTab) {
      case "visits":
        return (
          <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <h4 className="text-lg font-semibold">Patient Visits by Time</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Distribution of patient visits throughout the day
            </p>
            {/* Simple Bar Representation with CSS */}
            <div className="space-y-2">
              {reportData.patientVisitsData?.map((item, index) => {
                const percentage =
                  totalPatientVisits > 0
                    ? (item.patients / totalPatientVisits) * 100
                    : 0;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <span className="w-20 text-sm">{item.time}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-12 text-sm font-medium">
                      {item.patients}
                    </span>
                    <span className="text-sm text-gray-600">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Table */}
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Time Slot
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Number of Patients
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.patientVisitsData?.map((item, index) => {
                    const percentage =
                      totalPatientVisits > 0
                        ? ((item.patients / totalPatientVisits) * 100).toFixed(
                            1
                          )
                        : 0;
                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 text-sm">{item.time}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md">
                            {item.patients}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "departments":
        return (
          <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              <h4 className="text-lg font-semibold">Department Distribution</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Patient distribution across different departments
            </p>
            {/* Simple Pie Representation - List with colored bars */}
            <div className="space-y-2">
              {reportData.departmentData?.map((item, index) => {
                const percentage =
                  totalDepartmentValue > 0
                    ? (item.value / totalDepartmentValue) * 100
                    : 0;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="w-24 text-sm">{item.name}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-12 text-sm font-medium">
                      {item.value}
                    </span>
                    <span className="text-sm text-gray-600">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Table */}
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Department
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Patient Count
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Percentage
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Color Code
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.departmentData?.map((item, index) => {
                    const percentage =
                      totalDepartmentValue > 0
                        ? ((item.value / totalDepartmentValue) * 100).toFixed(1)
                        : 0;
                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 text-sm">{item.name}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md">
                            {item.value}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{percentage}%</td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-gray-600">
                              {item.color}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "trends":
        return (
          <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <h4 className="text-lg font-semibold">
                Weekly Appointment Trends
              </h4>
            </div>
            <p className="text-gray-600 text-sm">
              Appointment volume and completion rates throughout the week
            </p>
            {/* Simple Line Representation - Stacked bars or table */}
            <div className="space-y-2">
              {reportData.weeklyTrendData?.map((item, index) => {
                const successRate =
                  item.appointments > 0
                    ? (item.completed / item.appointments) * 100
                    : 0;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 bg-gray-50 p-3 rounded-md"
                  >
                    <span className="w-20 text-sm font-medium">{item.day}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 flex">
                      <div
                        className="bg-green-500 h-4 rounded-l-full"
                        style={{
                          width: `${
                            (item.completed / item.appointments) * 100 || 0
                          }%`,
                        }}
                      ></div>
                      <div
                        className="bg-red-500 h-4 rounded-r-full flex-shrink-0"
                        style={{
                          width: `${
                            (item.cancelled / item.appointments) * 100 || 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="w-16 text-sm">{item.appointments}</span>
                    <span className="w-16 text-sm text-green-600">
                      {item.completed}
                    </span>
                    <span className="w-16 text-sm text-red-600">
                      {item.cancelled}
                    </span>
                    <span className="text-sm text-gray-600">
                      {successRate.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Table */}
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Day
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Total Appointments
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Completed
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Cancelled
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Success Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.weeklyTrendData?.map((item, index) => {
                    const successRate =
                      item.appointments > 0
                        ? ((item.completed / item.appointments) * 100).toFixed(
                            1
                          )
                        : 0;
                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 text-sm">{item.day}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md">
                            {item.appointments}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                            {item.completed}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-md">
                            {item.cancelled}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{successRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "services":
        return (
          <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <h4 className="text-lg font-semibold">
                Top Services Performance
              </h4>
            </div>
            <p className="text-gray-600 text-sm">
              Most utilized services and their performance metrics
            </p>
            {/* Table */}
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Rank
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Service Name
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Total Visits
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Avg Duration
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Revenue
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Revenue per Visit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topServicesData?.map((item, index) => {
                    const revenueNum = parseFloat(
                      item.revenue.replace(/[$,]/g, "")
                    );
                    const revenuePerVisit =
                      item.visits > 0
                        ? (revenueNum / item.visits).toFixed(2)
                        : 0;
                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 border border-gray-300 text-gray-600 text-xs rounded-md">
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm font-medium">
                          {item.service}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md">
                            {item.visits}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            {item.avgDuration}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSign className="h-3 w-3" />
                            {item.revenue}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          ${revenuePerVisit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Service Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-1">Total Services</p>
                <p className="text-2xl font-bold text-blue-900">
                  {reportData.topServicesData?.length || 0}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 mb-1">Total Visits</p>
                <p className="text-2xl font-bold text-green-900">
                  {reportData.topServicesData?.reduce(
                    (sum, s) => sum + s.visits,
                    0
                  ) || 0}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={reportRef} className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Link to="/manager">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </button>
          </Link>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Report Details</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Generated: {new Date(generatedAt).toLocaleString()}
            </p>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-md">
            ID: {report._id}
          </span>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="flex justify-between items-center pb-2">
            <span className="text-gray-600 text-sm">Total Patients</span>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {reportData.basePatients.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600 mt-1">Base patient count</p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="flex justify-between items-center pb-2">
            <span className="text-gray-600 text-sm">Appointments</span>
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            {reportData.baseAppointments.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600 mt-1">Total appointments</p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="flex justify-between items-center pb-2">
            <span className="text-gray-600 text-sm">Completion Rate</span>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {completionRate}%
          </div>
          <p className="text-sm text-gray-600 mt-1">Successful appointments</p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="flex justify-between items-center pb-2">
            <span className="text-gray-600 text-sm">Peak Time</span>
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {peakVisitTime.time || "N/A"}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {peakVisitTime.patients || 0} patients
          </p>
        </div>
      </div>

      {/* Statistical Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 mb-1">Total Visits</p>
              <p className="text-2xl font-bold text-blue-900">
                {totalPatientVisits}
              </p>
            </div>
            <Users className="h-10 w-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 mb-1">Department Services</p>
              <p className="text-2xl font-bold text-green-900">
                {totalDepartmentValue}
              </p>
            </div>
            <BarChart3 className="h-10 w-10 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-900">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Detailed Data Tabs */}
      <div className="space-y-6">
        {/* Tab Buttons */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { value: "visits", label: "Patient Visits" },
              { value: "departments", label: "Departments" },
              { value: "trends", label: "Weekly Trends" },
              { value: "services", label: "Top Services" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.value
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ReportView;
