// src/components/Navbar.jsx
import { useContext } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  if (!user) return null;

  return (
    <nav className="bg-blue-600 text-white p-4 ">
      <div className="container mx-auto flex justify-between max-w-5xl">
        <Link to="/" className="text-xl font-bold">
          Healthcare System
        </Link>
        <div>
          <span>
            Welcome, {user.name} ({user.role})
          </span>
          <button
            onClick={handleLogout}
            className="ml-4 bg-red-500 px-4 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
