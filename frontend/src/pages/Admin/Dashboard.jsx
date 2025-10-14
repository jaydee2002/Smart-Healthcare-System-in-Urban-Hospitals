import { Link, Outlet } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline"; // Assume @heroicons/react installed

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex-shrink-0 border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
        </div>
        <nav className="p-4 space-y-1">
          <Link
            to="/admin/doctors"
            className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4 mr-2" />
            Manage Doctors
          </Link>
          <Link
            to="/admin/patients"
            className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4 mr-2" />
            Manage Patients
          </Link>
          <Link
            to="/admin/hospitals"
            className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4 mr-2" />
            Manage Hospitals
          </Link>
          {/* Add more links as needed */}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto flex flex-col">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Admin Dashboard
        </h1>
        <div className="bg-white rounded-xl shadow-sm p-6 flex-1 min-h-0 overflow-auto">
          {/* Nested routes render here */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
