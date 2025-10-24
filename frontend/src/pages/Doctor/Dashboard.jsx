// src/pages/Doctor/Dashboard.jsx
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";
import {
  LogOut,
  Menu,
  X,
  Home,
  Users,
  Calendar,
  Settings,
  FileText,
  Bell,
} from "lucide-react";

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const sidebarLinks = [
    { icon: Home, label: "Dashboard", path: "/doctor/patients" },
    { icon: Users, label: "Patients", path: "/doctor/patients" },
    { icon: Calendar, label: "Appointments", path: "/doctor/appointments" },
    { icon: FileText, label: "Records", path: "/doctor/records" },
    { icon: Settings, label: "Settings", path: "/doctor/settings" },
  ];

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm flex-shrink-0 z-40">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Doctor Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-gray-600 hover:text-gray-900">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                DR
              </div>
              <span className="hidden md:inline text-sm">Dr. {user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main layout: sidebar + content */}
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
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
