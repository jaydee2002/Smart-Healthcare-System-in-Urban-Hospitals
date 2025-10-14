// src/pages/Manager/Dashboard.jsx
import { Link } from "react-router-dom";
import Reports from "./Reports.jsx";

const ManagerDashboard = () => (
  <div>
    <h1 className="text-3xl p-4">Manager Dashboard</h1>
    <Link
      to="/manager/reports"
      className="bg-blue-500 text-white p-2 rounded ml-4"
    >
      Generate Reports
    </Link>
    {/* Embed Reports or use Router for sub-path */}
    <Reports />
  </div>
);

export default ManagerDashboard;
