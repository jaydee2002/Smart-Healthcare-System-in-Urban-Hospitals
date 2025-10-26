import { differenceInDays } from "date-fns";

// Function to generate mock data based on filters
export const generateMockData = ({
  reportType = "daily",
  department = "all",
  dateRange = { from: undefined, to: undefined },
  serviceType = "all",
  patientType = "all",
  status = "all",
} = {}) => {
  // Base data adjustments based on filters
  let basePatients = 73;
  let baseAppointments = 87;
  let baseDepartments = [
    { name: "Cardiology", value: 14, color: "#3b82f6" },
    { name: "Pediatrics", value: 23, color: "#10b981" },
    { name: "Emergency", value: 18, color: "#ef4444" },
    { name: "Orthopedics", value: 9, color: "#f59e0b" }, // Fixed: was 98, mismatched scale
    { name: "Neurology", value: 8, color: "#8b5cf6" }, // Fixed: was 76, mismatched scale
  ];
  let baseServices = [
    {
      service: "General Consultation",
      visits: 45,
      avgDuration: "25 min",
      revenue: "$4,560", // Scaled down to match base
    },
    {
      service: "Laboratory Tests",
      visits: 38,
      avgDuration: "15 min",
      revenue: "$3,890",
    },
    {
      service: "X-Ray Imaging",
      visits: 23,
      avgDuration: "20 min",
      revenue: "$3,510",
    },
    {
      service: "ECG",
      visits: 19,
      avgDuration: "10 min",
      revenue: "$1,980",
    },
    {
      service: "Physical Therapy",
      visits: 16,
      avgDuration: "45 min",
      revenue: "$3,340",
    },
  ];

  // Adjust based on department
  if (department !== "all") {
    const deptIndex = baseDepartments.findIndex(
      (d) => d.name.toLowerCase() === department.toLowerCase()
    );
    if (deptIndex !== -1) {
      basePatients = Math.floor(baseDepartments[deptIndex].value * 5); // Scale up for total
      baseAppointments = Math.floor(basePatients * 1.18);
      baseDepartments = [baseDepartments[deptIndex]]; // Show only selected
    }
  }

  // Adjust based on reportType
  let daysMultiplier = 1;
  if (reportType === "weekly") {
    daysMultiplier = 7;
  } else if (reportType === "monthly") {
    daysMultiplier = 30;
  } else if (reportType === "custom" && dateRange.from && dateRange.to) {
    const daysDiff = differenceInDays(dateRange.to, dateRange.from);
    daysMultiplier = Math.max(1, daysDiff + 1); // Ensure at least 1, handle invalid range
  }
  basePatients *= daysMultiplier;
  baseAppointments *= daysMultiplier;

  // Adjust based on advanced filters
  let filterMultiplier = 1;
  if (serviceType !== "all") filterMultiplier *= 0.8;
  if (patientType !== "all") filterMultiplier *= 0.9;
  if (status !== "all") {
    if (status === "completed") filterMultiplier *= 0.94;
    else if (status === "cancelled") filterMultiplier *= 0.06;
    else if (status === "no-show") filterMultiplier *= 0.05;
  }
  basePatients *= filterMultiplier;
  baseAppointments *= filterMultiplier;

  // Generate patient visits data
  const times = [
    "8:00 AM",
    "10:00 AM",
    "12:00 PM",
    "2:00 PM",
    "4:00 PM",
    "6:00 PM",
  ];
  const visitsData = times.map((time) => ({
    time,
    patients: Math.max(
      0,
      Math.floor((basePatients / times.length) * (0.5 + Math.random()))
    ), // Vary slightly, floor to >=0
  }));

  // Adjust departments values
  const adjustedDepartments = baseDepartments.map((dept) => ({
    ...dept,
    value: Math.max(
      0,
      Math.floor(dept.value * daysMultiplier * filterMultiplier)
    ),
  }));

  // Generate trend data (adapt length based on reportType)
  let trendDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (reportType === "daily") {
    trendDays = ["Today"];
  } else if (reportType === "monthly") {
    trendDays = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
  }
  // For custom, keep weekly for simplicity
  const avgDailyAppts = baseAppointments / Math.max(1, trendDays.length);
  const trendData = trendDays.map((day) => ({
    day,
    appointments: Math.max(
      0,
      Math.floor(avgDailyAppts * (0.8 + Math.random()))
    ),
    completed: Math.max(
      0,
      Math.floor(avgDailyAppts * 0.94 * (0.8 + Math.random()))
    ),
    cancelled: Math.max(
      0,
      Math.floor(avgDailyAppts * 0.06 * (0.8 + Math.random()))
    ),
  }));

  // Adjust services
  const adjustedServices = baseServices.map((service) => {
    const baseRevenue = parseFloat(service.revenue.slice(1)) || 0;
    return {
      ...service,
      visits: Math.max(
        0,
        Math.floor(service.visits * daysMultiplier * filterMultiplier)
      ),
      revenue: `$${Math.round(
        baseRevenue * daysMultiplier * filterMultiplier
      )}`, // Use Math.round for cleaner numbers
    };
  });

  return {
    patientVisitsData: visitsData,
    departmentData: adjustedDepartments,
    weeklyTrendData: trendData, // Renamed to trendData internally, but keep key as weeklyTrendData for compatibility
    topServicesData: adjustedServices,
    basePatients: Math.floor(basePatients), // Ensure integer
    baseAppointments: Math.floor(baseAppointments),
  };
};
