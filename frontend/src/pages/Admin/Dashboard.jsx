// src/pages/Admin/AdminDashboard.jsx
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  LogOutIcon,
  BellIcon,
  Users,
  Stethoscope,
  Building2,
} from "lucide-react"; // Added icons
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    // your logout logic here
    toast.success("Logged out successfully");
  };

  const sidebarLinks = [
    { icon: Stethoscope, label: "Manage Doctors", path: "/admin/doctors" },
    { icon: Users, label: "Manage Patients", path: "/admin/patients" },
    { icon: Building2, label: "Manage Hospitals", path: "/admin/hospitals" },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-black shadow-sm flex-shrink-0 z-40">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left section with logo + title */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg" // 👈 replace with your hospital logo path
              alt="Hospital Logo"
              className="h-8 w-8 object-contain rounded-lg"
            />
            <h1 className="text-xl font-semibold text-white">
              Admin Dashboard
            </h1>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            <button className="relative text-gray-300 hover:text-white">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 text-gray-300">
              <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                AD
              </div>
              <span className="hidden md:inline text-sm">Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white"
            >
              <LogOutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Layout: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-gray-200 w-64 flex-shrink-0 transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 absolute lg:relative z-30 h-full`}
        >
          <nav className="p-4 space-y-1 h-full overflow-y-auto">
            {sidebarLinks.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                className="flex items-center px-4 py-3 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors text-sm"
              >
                <link.icon className="h-5 w-5 mr-3 text-gray-600" />
                {link.label}
                <ChevronRightIcon className="w-4 h-4 ml-auto text-gray-400" />
              </Link>
            ))}
          </nav>
        </aside>

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
