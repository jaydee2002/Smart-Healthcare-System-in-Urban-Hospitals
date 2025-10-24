// src/pages/Patient/Dashboard.jsx
import { Link, Outlet } from "react-router-dom";
import DoctorSearch from "../../components/DoctorSearch";

const PatientDashboard = () => (
  <div className="min-h-screen bg-gray-100">
    {/* Hero Section */}
    <div className="relative min-h-[40`vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="text-center px-4 max-w-3xl">
        <h1 className="text-5xl font-light tracking-wide text-gray-900 mb-6">
          Doctor eChannelling
        </h1>
        <p className="text-xl font-light text-gray-600 mb-8">
          Seamless online appointments with trusted doctors.
        </p>
        <Link
          to="/patient/booking"
          className="inline-block bg-blue-600 text-white font-medium py-3 px-8 rounded-full hover:bg-blue-700 transition duration-300 shadow-sm"
        >
          Book Now
        </Link>
      </div>
    </div>

    {/* Doctor Search Section */}
    <div className=" px-4">
      <Outlet />
    </div>

    {/* Features Section */}
    <div className="bg-white py-12 px-4">
      <h2 className="text-3xl font-semibold text-center mb-8">
        Why Choose Us?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Easy Booking</h3>
          <p>Book appointments with top doctors in just a few clicks.</p>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Secure Consultations</h3>
          <p>Enjoy safe and private video consultations from home.</p>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
          <p>Our team is here to help you anytime you need assistance.</p>
        </div>
      </div>
    </div>
  </div>
);

export default PatientDashboard;
