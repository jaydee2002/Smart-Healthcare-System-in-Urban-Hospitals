import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  subMonths,
  addMonths,
  getMonth,
  getYear,
  differenceInDays,
} from "date-fns";

export function ReportsAnalytics() {
  const [reportType, setReportType] = useState("daily");
  const [department, setDepartment] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [serviceType, setServiceType] = useState("all");
  const [patientType, setPatientType] = useState("all");
  const [status, setStatus] = useState("all");

  // States for dynamic data
  const [patientVisitsData, setPatientVisitsData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [weeklyTrendData, setWeeklyTrendData] = useState([]);
  const [topServicesData, setTopServicesData] = useState([]);

  const [scheduleDateTime, setScheduleDateTime] = useState("");

  // Add these states near the top with other useState declarations
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [scheduleTime, setScheduleTime] = useState("09:00");

  // API Base URL - Update this to your Node.js backend URL
  const API_BASE_URL = "http://localhost:5001/api";

  // const promptForScheduleDateTime = () => {
  //   const date = window.prompt(
  //     "Enter schedule date (YYYY-MM-DD):",
  //     new Date().toISOString().split("T")[0]
  //   );
  //   if (!date) return null;

  //   const time = window.prompt("Enter schedule time (HH:MM):", "09:00");
  //   if (!time) return null;

  //   if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
  //     alert(
  //       "Invalid date or time format. Please use YYYY-MM-DD for date and HH:MM for time."
  //     );
  //     return null;
  //   }

  //   return `${date}T${time}:00`;
  // };

  const generateReportPayload = (includeSchedule = false) => {
    const payload = {
      reportType,
      department,
      serviceType,
      patientType,
      status,
    };

    if (reportType === "custom" && dateRange.from && dateRange.to) {
      payload.fromDate = dateRange.from.toISOString().split("T")[0];
      payload.toDate = dateRange.to.toISOString().split("T")[0];
    }

    if (includeSchedule && scheduleDateTime) {
      payload.scheduleDateTime = scheduleDateTime;
    }

    return payload;
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generateReportPayload()),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Assuming API returns { patientVisitsData, departmentData, weeklyTrendData, topServicesData }
      setPatientVisitsData(data.patientVisitsData || []);
      setDepartmentData(data.departmentData || []);
      setWeeklyTrendData(data.weeklyTrendData || []);
      setTopServicesData(data.topServicesData || []);

      setReportGenerated(true);
      alert(
        `${
          reportType.charAt(0).toUpperCase() + reportType.slice(1)
        } report generated successfully with applied filters.`
      );
    } catch (err) {
      setError(err.message || "Failed to generate report. Please try again.");
      setReportGenerated(false);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/export?format=${format}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      // Assuming API returns a blob or download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      alert(`Report exported as ${format.toUpperCase()}.`);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  // Add this Modal component before the return statement (or inline it)
  const ScheduleModal = () => {
    const [modalFromOpen, setModalFromOpen] = useState(false); // Separate state for modal's date picker
    const [modalFromMonth, setModalFromMonth] = useState(new Date()); // Separate month state

    const handleScheduleConfirm = async () => {
      const selectedDateTime = `${format(
        scheduleDate,
        "yyyy-MM-dd"
      )}T${scheduleTime}:00`;
      setScheduleDateTime(selectedDateTime); // Optional: store for later use
      setShowScheduleModal(false);
      setModalFromOpen(false);

      try {
        const response = await fetch(`${API_BASE_URL}/reports/schedule`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(generateReportPayload(true)), // Include schedule in payload
        });

        if (!response.ok) {
          throw new Error(`Scheduling failed: ${response.status}`);
        }

        alert(
          `Report scheduled successfully for ${new Date(
            selectedDateTime
          ).toLocaleString()}. You will receive automated reports via email.`
        );
      } catch (err) {
        alert(`Scheduling failed: ${err.message}`);
      }
    };

    const handleModalFromMonthChange = (month) => {
      setModalFromMonth(month);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h3 className="text-lg font-medium mb-4">
            Schedule Automated Reports
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <Popover open={modalFromOpen} onOpenChange={setModalFromOpen}>
                <CustomButton
                  variant="outline"
                  className="w-full justify-start"
                >
                  📅 {format(scheduleDate, "MMM dd, yyyy")}
                </CustomButton>
                <Calendar
                  selected={scheduleDate}
                  onSelect={(date) => setScheduleDate(date)}
                  month={modalFromMonth}
                  onMonthChange={handleModalFromMonthChange}
                />
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <CustomButton
              variant="outline"
              onClick={() => {
                setShowScheduleModal(false);
                setModalFromOpen(false);
              }}
            >
              Cancel
            </CustomButton>
            <CustomButton onClick={handleScheduleConfirm}>
              Schedule
            </CustomButton>
          </div>
        </div>
      </div>
    );
  };

  // Replace the existing handleScheduleReport with this
  const handleScheduleReport = async () => {
    setShowScheduleModal(true);
  };

  const CustomSelect = ({ value, onChange, options, placeholder, id }) => (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const CustomButton = ({
    onClick,
    children,
    variant = "default",
    disabled = false,
    className = "",
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${className} ${
        variant === "outline"
          ? "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500"
          : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );

  const CustomCard = ({ children, className = "" }) => (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      {children}
    </div>
  );

  const CustomCardHeader = ({ children }) => (
    <div className="px-6 py-4 border-b border-gray-200">{children}</div>
  );

  const CustomCardTitle = ({ children }) => (
    <h3 className="text-lg font-medium text-gray-900">{children}</h3>
  );

  const CustomCardDescription = ({ children }) => (
    <p className="text-sm text-gray-600 mt-1">{children}</p>
  );

  const CustomCardContent = ({ children, className = "" }) => (
    <div className={`p-6 ${className}`}>{children}</div>
  );

  const CustomTable = ({ children }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">{children}</table>
    </div>
  );

  const CustomTableHeader = ({ children }) => (
    <thead className="bg-gray-50">{children}</thead>
  );

  const CustomTableBody = ({ children }) => (
    <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
  );

  const CustomTableRow = ({ children }) => <tr>{children}</tr>;

  const CustomTableHead = ({ children }) => (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
      {children}
    </th>
  );

  const CustomTableCell = ({ children }) => (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {children}
    </td>
  );

  const CustomAlert = ({ children, variant = "default", className = "" }) => (
    <div
      className={`border rounded-md p-4 ${className} ${
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-green-200 bg-green-50 text-green-800"
      }`}
    >
      {children}
    </div>
  );

  const TabsList = ({ children }) => (
    <div className="flex space-x-8 -mb-px">{children}</div>
  );

  const TabTrigger = ({ value, children, activeTab, setActiveTab }) => (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`py-2 px-1 border-b-2 font-medium text-sm ${
        activeTab === value
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );

  const TabsContent = ({ value, children, activeTab }) => {
    if (activeTab !== value) return null;
    return <div className="space-y-6">{children}</div>;
  };

  // Functional Calendar Component
  const Calendar = ({ selected, onSelect, month, onMonthChange }) => {
    const currentMonth = month || new Date();
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const handlePrevMonth = () => {
      const prevMonth = addMonths(currentMonth, -1);
      onMonthChange(prevMonth);
    };

    const handleNextMonth = () => {
      const nextMonth = addMonths(currentMonth, 1);
      onMonthChange(nextMonth);
    };

    return (
      <div className="w-64 bg-white rounded-md shadow-lg">
        <div className="flex items-center justify-between p-3 border-b">
          <button
            onClick={handlePrevMonth}
            className="text-gray-500 hover:text-gray-700"
          >
            ‹
          </button>
          <div className="text-center font-medium">
            {monthNames[getMonth(currentMonth)]} {getYear(currentMonth)}
          </div>
          <button
            onClick={handleNextMonth}
            className="text-gray-500 hover:text-gray-700"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 p-3">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center font-medium text-gray-500 py-1"
            >
              {day}
            </div>
          ))}
          {days.map((day) => (
            <button
              key={day.toString()}
              type="button"
              onClick={() => onSelect(day)}
              className={`text-center p-2 rounded hover:bg-gray-100 w-full ${
                selected && selected.toDateString() === day.toDateString()
                  ? "bg-blue-500 text-white"
                  : ""
              } ${isToday(day) ? "bg-blue-100 text-blue-600" : ""} ${
                !isSameMonth(currentMonth, day) ? "text-gray-300" : ""
              }`}
            >
              {format(day, "d")}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const Popover = ({ children, content, open, onOpenChange }) => {
    const handleClickOutside = (e) => {
      if (e.target.closest(".popover-content")) return;
      onOpenChange(false);
    };

    return (
      <div
        className="relative inline-block text-left"
        onClick={handleClickOutside}
      >
        <div onClick={() => onOpenChange(true)} className="cursor-pointer">
          {children}
        </div>
        {open && (
          <div className="absolute z-10 mt-2 left-0 bg-white border border-gray-200 rounded-md shadow-lg popover-content">
            {content}
          </div>
        )}
      </div>
    );
  };

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [fromMonth, setFromMonth] = useState(new Date());
  const [toMonth, setToMonth] = useState(new Date());

  const handleFromSelect = (date) => {
    setDateRange({ ...dateRange, from: date });
    setFromOpen(false);
  };

  const handleToSelect = (date) => {
    setDateRange({ ...dateRange, to: date });
    setToOpen(false);
  };

  const handleFromMonthChange = (month) => {
    setFromMonth(month);
  };

  const handleToMonthChange = (month) => {
    setToMonth(month);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <p className="text-gray-600">
          Generate and analyze statistical reports on patient visits, service
          utilization, and hospital performance
        </p>
      </div>

      {/* Configuration Section */}
      <CustomCard className="mb-6">
        <CustomCardHeader>
          <CustomCardTitle>Report Configuration</CustomCardTitle>
          <CustomCardDescription>
            Select report type and apply filters to generate custom reports
          </CustomCardDescription>
        </CustomCardHeader>
        <CustomCardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="reportType"
                className="block text-sm font-medium text-gray-700"
              >
                Report Type
              </label>
              <CustomSelect
                id="reportType"
                value={reportType}
                onChange={(value) => setReportType(value)}
                options={[
                  { value: "daily", label: "Daily Report" },
                  { value: "weekly", label: "Weekly Report" },
                  { value: "monthly", label: "Monthly Report" },
                  { value: "custom", label: "Custom Date Range" },
                ]}
                placeholder="Select report type"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="department"
                className="block text-sm font-medium text-gray-700"
              >
                Department
              </label>
              <CustomSelect
                id="department"
                value={department}
                onChange={(value) => setDepartment(value)}
                options={[
                  { value: "all", label: "All Departments" },
                  { value: "cardiology", label: "Cardiology" },
                  { value: "pediatrics", label: "Pediatrics" },
                  { value: "emergency", label: "Emergency" },
                  { value: "orthopedics", label: "Orthopedics" },
                  { value: "neurology", label: "Neurology" },
                ]}
                placeholder="Select department"
              />
            </div>

            {reportType === "custom" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <Popover open={fromOpen} onOpenChange={setFromOpen}>
                    <CustomButton
                      variant="outline"
                      className="flex-1 justify-start"
                    >
                      📅 From:{" "}
                      {dateRange.from
                        ? format(dateRange.from, "MMM dd, yyyy")
                        : "Start date"}
                    </CustomButton>
                    <Calendar
                      selected={dateRange.from}
                      onSelect={handleFromSelect}
                      month={fromMonth}
                      onMonthChange={handleFromMonthChange}
                    />
                  </Popover>
                  <Popover open={toOpen} onOpenChange={setToOpen}>
                    <CustomButton
                      variant="outline"
                      className="flex-1 justify-start"
                    >
                      📅 To:{" "}
                      {dateRange.to
                        ? format(dateRange.to, "MMM dd, yyyy")
                        : "End date"}
                    </CustomButton>
                    <Calendar
                      selected={dateRange.to}
                      onSelect={handleToSelect}
                      month={toMonth}
                      onMonthChange={handleToMonthChange}
                    />
                  </Popover>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Filters Toggle */}
          <div>
            <CustomButton
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full md:w-auto"
            >
              🔍 {showFilters ? "Hide" : "Show"} Advanced Filters
            </CustomButton>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <label
                  htmlFor="serviceType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Service Type
                </label>
                <CustomSelect
                  id="serviceType"
                  value={serviceType}
                  onChange={setServiceType}
                  options={[
                    { value: "all", label: "All Services" },
                    { value: "consultation", label: "Consultation" },
                    { value: "diagnostic", label: "Diagnostic" },
                    { value: "treatment", label: "Treatment" },
                  ]}
                  placeholder=""
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="patientType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Patient Type
                </label>
                <CustomSelect
                  id="patientType"
                  value={patientType}
                  onChange={setPatientType}
                  options={[
                    { value: "all", label: "All Patients" },
                    { value: "new", label: "New Patients" },
                    { value: "returning", label: "Returning Patients" },
                  ]}
                  placeholder=""
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700"
                >
                  Appointment Status
                </label>
                <CustomSelect
                  id="status"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "completed", label: "Completed" },
                    { value: "cancelled", label: "Cancelled" },
                    { value: "no-show", label: "No Show" },
                  ]}
                  placeholder=""
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <CustomButton onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? (
                <>⏳ Generating Report...</>
              ) : (
                <>📄 Generate Report</>
              )}
            </CustomButton>

            <CustomButton variant="outline" onClick={handleScheduleReport}>
              ⏰ Schedule Automated Reports
            </CustomButton>

            <button
              onClick={() => (window.location.href = "/reports")}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Genarated Reports
            </button>
          </div>
        </CustomCardContent>
      </CustomCard>

      {/* Error Alert */}
      {error && (
        <CustomAlert variant="destructive" className="mb-6">
          ⚠️ <div className="mt-1">{error}</div>
        </CustomAlert>
      )}

      {/* Success Alert */}
      {reportGenerated && !error && (
        <CustomAlert className="mb-6">
          ✅{" "}
          <div className="mt-1">
            Report generated successfully! Review the data below and export as
            needed.
          </div>
        </CustomAlert>
      )}

      {/* Report Results */}
      {reportGenerated && !error && (
        <>
          {/* Key Metrics - Now dynamic */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <CustomCard>
              <CustomCardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Patients</span>
                  <span className="text-blue-500">👥</span>
                </div>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-3xl font-bold">
                  {Math.floor(
                    patientVisitsData.reduce((sum, d) => sum + d.patients, 0)
                  )}
                </div>
                <p className="text-sm text-green-600 mt-1">
                  📈 +12.5% from last period
                </p>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Appointments</span>
                  <span className="text-green-500">📋</span>
                </div>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-3xl font-bold">
                  {weeklyTrendData.reduce((sum, d) => sum + d.appointments, 0)}
                </div>
                <p className="text-sm text-green-600 mt-1">
                  📈 +8.3% from last period
                </p>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Peak Time</span>
                  <span className="text-orange-500">🕐</span>
                </div>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-3xl font-bold">
                  {patientVisitsData.length > 0
                    ? patientVisitsData.reduce(
                        (max, d) => (d.patients > max.patients ? d : max),
                        patientVisitsData[0]
                      ).time
                    : "N/A"}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {patientVisitsData.length > 0
                    ? Math.max(...patientVisitsData.map((d) => d.patients))
                    : 0}{" "}
                  patients
                </p>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="text-purple-500">✅</span>
                </div>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-3xl font-bold">
                  {weeklyTrendData.length > 0
                    ? (
                        (weeklyTrendData.reduce(
                          (sum, d) => sum + d.completed,
                          0
                        ) /
                          weeklyTrendData.reduce(
                            (sum, d) => sum + d.appointments,
                            0
                          )) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </div>
                <p className="text-sm text-green-600 mt-1">
                  📈 +2.1% from last period
                </p>
              </CustomCardContent>
            </CustomCard>
          </div>

          {/* Charts and Tables */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList>
                <TabTrigger
                  value="overview"
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                >
                  Overview
                </TabTrigger>
                <TabTrigger
                  value="departments"
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                >
                  Departments
                </TabTrigger>
                <TabTrigger
                  value="services"
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                >
                  Services
                </TabTrigger>
                <TabTrigger
                  value="trends"
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                >
                  Trends
                </TabTrigger>
              </TabsList>

              <div className="flex gap-2">
                <CustomButton
                  variant="outline"
                  onClick={() => handleExport("pdf")}
                >
                  📄 Export PDF
                </CustomButton>
                <CustomButton
                  variant="outline"
                  onClick={() => handleExport("excel")}
                >
                  📊 Export Excel
                </CustomButton>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <TabsContent value="overview" activeTab={activeTab}>
                <CustomCard>
                  <CustomCardHeader>
                    <CustomCardTitle>Patient Visits by Time</CustomCardTitle>
                    <CustomCardDescription>
                      Distribution of patient visits throughout the day
                    </CustomCardDescription>
                  </CustomCardHeader>
                  <CustomCardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={patientVisitsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="patients" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CustomCardContent>
                </CustomCard>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CustomCard>
                    <CustomCardHeader>
                      <CustomCardTitle>Department Distribution</CustomCardTitle>
                      <CustomCardDescription>
                        Patient visits by department
                      </CustomCardDescription>
                    </CustomCardHeader>
                    <CustomCardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={departmentData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {departmentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CustomCardContent>
                  </CustomCard>

                  <CustomCard>
                    <CustomCardHeader>
                      <CustomCardTitle>Weekly Performance</CustomCardTitle>
                      <CustomCardDescription>
                        Appointments completed vs cancelled
                      </CustomCardDescription>
                    </CustomCardHeader>
                    <CustomCardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weeklyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="completed"
                            stroke="#10b981"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="cancelled"
                            stroke="#ef4444"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CustomCardContent>
                  </CustomCard>
                </div>
              </TabsContent>

              <TabsContent value="departments" activeTab={activeTab}>
                <CustomCard>
                  <CustomCardHeader>
                    <CustomCardTitle>Department Performance</CustomCardTitle>
                    <CustomCardDescription>
                      Detailed breakdown by department
                    </CustomCardDescription>
                  </CustomCardHeader>
                  <CustomCardContent>
                    <CustomTable>
                      <CustomTableHeader>
                        <CustomTableRow>
                          <CustomTableHead>Department</CustomTableHead>
                          <CustomTableHead>Total Visits</CustomTableHead>
                          <CustomTableHead>Avg. Wait Time</CustomTableHead>
                          <CustomTableHead>Satisfaction Rate</CustomTableHead>
                        </CustomTableRow>
                      </CustomTableHeader>
                      <CustomTableBody>
                        {departmentData.map((dept) => (
                          <CustomTableRow key={dept.name}>
                            <CustomTableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: dept.color }}
                                ></div>
                                {dept.name}
                              </div>
                            </CustomTableCell>
                            <CustomTableCell>{dept.value}</CustomTableCell>
                            <CustomTableCell>
                              {Math.floor(Math.random() * 20 + 10)} min
                            </CustomTableCell>
                            <CustomTableCell>
                              {(Math.random() * 10 + 85).toFixed(1)}%
                            </CustomTableCell>
                          </CustomTableRow>
                        ))}
                      </CustomTableBody>
                    </CustomTable>
                  </CustomCardContent>
                </CustomCard>
              </TabsContent>

              <TabsContent value="services" activeTab={activeTab}>
                <CustomCard>
                  <CustomCardHeader>
                    <CustomCardTitle>Top Services</CustomCardTitle>
                    <CustomCardDescription>
                      Most utilized services and their performance metrics
                    </CustomCardDescription>
                  </CustomCardHeader>
                  <CustomCardContent>
                    <CustomTable>
                      <CustomTableHeader>
                        <CustomTableRow>
                          <CustomTableHead>Service</CustomTableHead>
                          <CustomTableHead>Total Visits</CustomTableHead>
                          <CustomTableHead>Avg. Duration</CustomTableHead>
                          <CustomTableHead>Revenue</CustomTableHead>
                        </CustomTableRow>
                      </CustomTableHeader>
                      <CustomTableBody>
                        {topServicesData.map((service, index) => (
                          <CustomTableRow key={index}>
                            <CustomTableCell>{service.service}</CustomTableCell>
                            <CustomTableCell>{service.visits}</CustomTableCell>
                            <CustomTableCell>
                              {service.avgDuration}
                            </CustomTableCell>
                            <CustomTableCell>{service.revenue}</CustomTableCell>
                          </CustomTableRow>
                        ))}
                      </CustomTableBody>
                    </CustomTable>
                  </CustomCardContent>
                </CustomCard>
              </TabsContent>

              <TabsContent value="trends" activeTab={activeTab}>
                <CustomCard>
                  <CustomCardHeader>
                    <CustomCardTitle>Weekly Appointment Trends</CustomCardTitle>
                    <CustomCardDescription>
                      Appointment volume and completion rates over the week
                    </CustomCardDescription>
                  </CustomCardHeader>
                  <CustomCardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={weeklyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="appointments"
                          fill="#3b82f6"
                          name="Total Appointments"
                        />
                        <Bar
                          dataKey="completed"
                          fill="#10b981"
                          name="Completed"
                        />
                        <Bar
                          dataKey="cancelled"
                          fill="#ef4444"
                          name="Cancelled"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CustomCardContent>
                </CustomCard>
              </TabsContent>
            </div>
          </div>
        </>
      )}

      {/* Initial State - No Report Generated */}
      {!reportGenerated && !error && !isLoading && (
        <CustomCard className="p-12 text-center">
          <div className="mx-auto mb-4 h-16 w-16 text-gray-400">📄</div>
          <h3 className="mb-2 text-xl font-medium text-gray-900">
            No Report Generated
          </h3>
          <p className="text-gray-600">
            Select a report type and configure your filters above, then click
            "Generate Report" to view analytics.
          </p>
        </CustomCard>
      )}

      {showScheduleModal && <ScheduleModal />}
    </div>
  );
}
