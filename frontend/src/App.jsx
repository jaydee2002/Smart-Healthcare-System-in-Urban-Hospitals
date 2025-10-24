// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoutes.jsx";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import ManagerDashboard from "./pages/Manager/Dashboard.jsx";
import DoctorManagement from "./pages/Admin/DoctorManagement.jsx";
import DoctorForm from "./components/DoctorForm.jsx";
import AvailabilityCalendar from "./components/AvailabilityCalendar.jsx";
import AdminDashboard from "./pages/Admin/Dashboard.jsx";
import Booking from "./pages/Patient/Booking.jsx";
import PatientVisit from "./pages/Doctor/PatientVisit.jsx";
import PatientDashboard from "./pages/Patient/Dashboard.jsx";
import DoctorDashboard from "./pages/Doctor/Dashboard.jsx";

function App() {
  return (
    <div className="min-h-screen  bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="doctors" element={<DoctorManagement />}>
            <Route index element={<DoctorForm />} /> {/* Create mode */}
            <Route path=":id" element={<DoctorForm />} /> {/* Edit mode */}
            <Route
              path=":id/availability"
              element={<AvailabilityCalendar />}
            />{" "}
            {/* Availability mode */}
          </Route>
          {/* Add similar for patients, hospitals if needed */}
        </Route>
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="booking" element={<Booking />} /> {/* Added */}
        </Route>
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="patients" element={<PatientVisit />} /> {/* Added */}
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
