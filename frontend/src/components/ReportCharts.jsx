// src/components/ReportCharts.jsx
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ReportCharts = ({ metrics }) => {
  if (!metrics || metrics.totalPatientCount === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No data available for selected filters.
      </div>
    );
  }

  // Sample data prep for charts (from metrics)
  const hospitalData =
    metrics.hospitalBreakdown?.map((h) => ({
      name: h.hospital,
      patients: h.patients,
    })) || [];
  const peakData =
    metrics.peakTimes?.map((p, i) => ({
      time: `Slot ${i + 1}`,
      count: p.count,
    })) || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h4 className="font-bold mb-4">Patient Counts by Hospital</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hospitalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="patients" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h4 className="font-bold mb-4">Peak Times Utilization</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={peakData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="col-span-full bg-white p-4 rounded-lg shadow-md">
        <h4 className="font-bold mb-4">Summary Metrics</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{metrics.totalPatientCount}</p>
            <p>Total Patients</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {metrics.averageUtilization?.toFixed(1)}%
            </p>
            <p>Avg Utilization</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {metrics.hospitalBreakdown?.length}
            </p>
            <p>Hospitals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCharts;
