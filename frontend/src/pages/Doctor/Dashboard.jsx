// src/pages/Doctor/Dashboard.jsx
import { Link, Outlet } from "react-router-dom";

const DoctorDashboard = () => (
  <div>
    <h1 className="text-3xl p-4">Doctor Dashboard</h1>
    <Link
      to="/doctor/patients"
      className="bg-blue-500 text-white p-2 rounded ml-4"
    >
      Manage Patients
    </Link>
    <Outlet /> {/* Render sub-routes here */}
  </div>
);

export default DoctorDashboard;
