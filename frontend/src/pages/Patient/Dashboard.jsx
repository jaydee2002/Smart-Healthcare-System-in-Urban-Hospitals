// src/pages/Patient/Dashboard.jsx
import { Link, Outlet } from "react-router-dom";

const PatientDashboard = () => (
  <div>
    <h1 className="text-3xl p-4">Patient Dashboard</h1>
    <Link
      to="/patient/booking"
      className="bg-blue-500 text-white p-2 rounded ml-4"
    >
      Book Appointment
    </Link>
    <Outlet /> {/* Render sub-routes here */}
  </div>
);

export default PatientDashboard;
