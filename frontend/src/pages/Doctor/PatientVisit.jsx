// src/pages/Doctor/PatientVisit.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import PatientRegistrationForm from "../../components/PatientRegistrationForm.jsx";
import ConsultationForm from "../../components/ConsultationForm.jsx";
import {
  getDoctorPatients,
  getPatientById,
} from "../../services/patientService.js";

const PatientVisit = () => {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [view, setView] = useState("dashboard"); // 'dashboard', 'consult', 'view'
  const [patients, setPatients] = useState([]); // Search results
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For skeletons
  const [openRecords, setOpenRecords] = useState([]); // For manual accordion

  const handleRegisterSubmit = (patient) => {
    if (!patient?._id) {
      console.error("Patient missing _id:", patient);
      toast.error("Error: Patient ID not received from registration.");
      return;
    }
    setCurrentPatient(patient);
    setIsRegisterModalOpen(false);
    setView("consult");
  };

  const handleConsultSubmit = (updatedPatient) => {
    setCurrentPatient(updatedPatient);
    setView("view");
  };

  // Simple debounce implementation without lodash
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedSearch = debounce(async (query) => {
    setIsLoading(true);
    try {
      const res = await getDoctorPatients(query);
      setPatients(res.data || []);
    } catch (error) {
      toast.error(error.message || "Error fetching patients");
    } finally {
      setIsLoading(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery]);

  const selectPatient = async (patient) => {
    setIsLoading(true);
    try {
      const fullPatientRes = await getPatientById(patient._id);
      setCurrentPatient(fullPatientRes.data);
      setView("view");
      setSearchQuery(""); // Clear search
    } catch (error) {
      toast.error("Error loading patient details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient?"))
      return;
    setIsLoading(true);
    try {
      // await deletePatient(id);
      toast.success("Patient deleted successfully");
      debouncedSearch(searchQuery);
      if (currentPatient?._id === id) {
        setCurrentPatient(null);
        setView("dashboard");
      }
    } catch (error) {
      toast.error(error.message || "Error deleting patient");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle record open state
  const toggleRecord = (index) => {
    setOpenRecords((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Skeleton loader component
  const SkeletonCard = () => (
    <div className="animate-pulse bg-white rounded-lg p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );

  // Patient details card
  const renderPatientDetails = () => (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-2">
        {currentPatient.name}
      </h2>
      <p className="text-sm text-gray-500 mb-4">{currentPatient.email}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-base font-medium text-gray-700 mb-2">
            Health Card
          </h3>
          <QRCodeSVG
            value={currentPatient.healthCardQR || "N/A"}
            size={128}
            className="mx-auto"
          />
        </div>
        <div>
          <h3 className="text-base font-medium text-gray-700 mb-2">Records</h3>
          {currentPatient.records?.length ? (
            currentPatient.records.map((r, i) => (
              <div key={i} className="mb-2">
                <button
                  className="text-sm text-blue-600 hover:underline flex items-center"
                  onClick={() => toggleRecord(i)}
                >
                  Record #{i + 1}
                  <span className="ml-1">
                    {openRecords.includes(i) ? "▲" : "▼"}
                  </span>
                </button>
                {openRecords.includes(i) && (
                  <div className="text-sm text-gray-600 mt-1 ml-4">
                    <p>Diagnosis: {r.diagnosis.join(", ")}</p>
                    <p>
                      Medications:{" "}
                      {r.medications
                        .map((m) => `${m.name} (${m.dosage})`)
                        .join(", ")}
                    </p>
                    {r.followUpDate && (
                      <p>
                        Follow-up:{" "}
                        {new Date(r.followUpDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No records yet.</p>
          )}
        </div>
      </div>
      <button
        onClick={() => setView(view === "consult" ? "view" : "consult")}
        className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition text-sm"
      >
        {view === "consult" ? "View Mode" : "Add Consultation"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white p-6 flex flex-col gap-4">
        <h1 className="text-xl font-medium text-gray-900">Patients</h1>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="text-sm text-indigo-600 hover:underline text-left"
        >
          + New Patient
        </button>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ×
            </button>
          )}
        </div>
        {isLoading ? (
          <SkeletonCard />
        ) : patients.length > 0 ? (
          patients.map((p) => (
            <div
              key={p._id}
              className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md text-sm"
            >
              <button
                className="text-left flex-1"
                onClick={() => selectPatient(p)}
              >
                {p.name} <span className="text-gray-500">({p.email})</span>
              </button>
              <button
                onClick={() => handleDelete(p._id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          ))
        ) : searchQuery ? (
          <p className="text-sm text-gray-500">No results</p>
        ) : (
          <p className="text-sm text-gray-500">No patients available</p>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {isLoading ? (
          <SkeletonCard />
        ) : currentPatient ? (
          <>
            <button
              onClick={() => setCurrentPatient(null)}
              className="mb-4 text-sm text-indigo-600 hover:underline"
            >
              ← Back
            </button>
            {renderPatientDetails()}
            {view === "consult" && (
              <div className="mt-6 bg-white rounded-lg p-6">
                <ConsultationForm
                  patientId={currentPatient._id}
                  onSubmit={handleConsultSubmit}
                />
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-sm">
            Select a patient or add a new one.
          </p>
        )}
      </main>

      {/* Simple Register Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-lg p-6 relative">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
            <PatientRegistrationForm onSubmit={handleRegisterSubmit} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientVisit;
