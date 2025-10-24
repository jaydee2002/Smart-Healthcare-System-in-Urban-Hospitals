// src/pages/Doctor/PatientVisit.jsx
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import PatientRegistrationForm from "../../components/PatientRegistrationForm.jsx";
import ConsultationForm from "../../components/ConsultationForm.jsx";
import {
  getDoctorPatients,
  getPatientById,
} from "../../services/patientService.js";

const PatientVisit = () => {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const handleRegisterSubmit = (patient) => {
    if (!patient?._id) {
      console.error("Patient missing _id:", patient);
      return;
    }
    setIsRegisterModalOpen(false);
    debouncedSearch(searchQuery); // Refresh the list
    setCurrentPatient(patient);
  };

  const handleConsultSubmit = (updatedPatient) => {
    setCurrentPatient(updatedPatient);
    setActiveTab("records");
  };

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
      console.error("Error fetching patients:", error);
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
      setActiveTab("overview");
      setExpandedRecord(0);
    } catch (error) {
      console.error("Error loading patient details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const PatientCard = ({ patient }) => (
    <button
      onClick={() => selectPatient(patient)}
      className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 bg-white"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700">
          {getInitials(patient.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-gray-900">{patient.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-gray-500">
                <span>✉️</span>
                <span className="truncate">{patient.email}</span>
              </div>
            </div>
          </div>
          {patient.phone && (
            <div className="flex items-center gap-2 mt-2 text-gray-500">
              <span>📞</span>
              <span>{patient.phone}</span>
            </div>
          )}
          {patient.lastVisit && (
            <div className="flex items-center gap-2 mt-2 text-gray-400">
              <span>🕒</span>
              <span>
                Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );

  const SkeletonCard = () => (
    <div className="p-4 rounded-xl border border-gray-200 bg-white animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );

  const renderPatientList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Patient Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage patient records and consultations
          </p>
        </div>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded shadow-sm flex items-center"
        >
          + Add Patient
        </button>
      </div>

      <div className="bg-white rounded shadow-sm p-6">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search patients by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">All Patients</h2>
          <span className="text-sm text-gray-500">{patients.length} total</span>
        </div>
        <div className="grid gap-3">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : patients.length > 0 ? (
            patients.map((p) => <PatientCard key={p._id} patient={p} />)
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  🔍
                </div>
                <p className="text-gray-900 mb-1">No patients found</p>
                <p className="text-gray-500">
                  Try adjusting your search criteria
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPatientDetails = () => {
    if (!currentPatient) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPatient(null)}
            className="text-gray-600 hover:text-gray-900 flex items-center text-sm"
          >
            ← Back
          </button>
        </div>

        <div className="flex items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 text-2xl border-4 border-gray-100 shadow-sm">
            {getInitials(currentPatient.name)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentPatient.name}
            </h1>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                ✉️ <span>{currentPatient.email}</span>
              </div>
              {currentPatient.phone && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  📞 <span>{currentPatient.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "overview"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "records"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Medical Records
            </button>
            <button
              onClick={() => setActiveTab("consult")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "consult"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              New Consultation
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="border border-gray-200 shadow-sm rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Patient Information
                    </h2>
                  </div>
                  <div className="p-4">
                    <dl className="grid grid-cols-2 gap-6">
                      <div>
                        <dt className="text-gray-500 mb-1 text-sm">
                          Date of Birth
                        </dt>
                        <dd className="text-gray-900 text-sm">
                          {currentPatient.dateOfBirth
                            ? new Date(
                                currentPatient.dateOfBirth
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 mb-1 text-sm">
                          Blood Type
                        </dt>
                        <dd className="text-gray-900 text-sm">
                          {currentPatient.bloodType || "—"}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-gray-500 mb-2 text-sm">
                          Known Allergies
                        </dt>
                        <dd>
                          {currentPatient.allergies &&
                          currentPatient.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {currentPatient.allergies.map((allergy, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 text-sm"
                                >
                                  {allergy}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-900 text-sm">
                              No known allergies
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {currentPatient.records &&
                  currentPatient.records.length > 0 && (
                    <div className="border border-gray-200 shadow-sm rounded-lg">
                      <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Recent Activity
                        </h2>
                      </div>
                      <div className="p-4">
                        <div className="space-y-4">
                          {currentPatient.records
                            .slice(0, 3)
                            .map((record, index) => (
                              <div key={index} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
                                    {index + 1}
                                  </div>
                                  {index < 2 &&
                                    index <
                                      currentPatient.records.length - 1 && (
                                      <div className="w-px h-full bg-gray-200 mt-2" />
                                    )}
                                </div>
                                <div className="flex-1 pb-4">
                                  <p className="text-gray-900 text-sm">
                                    {record.diagnosis.join(", ")}
                                  </p>
                                  <p className="text-gray-500 text-sm mt-1">
                                    {new Date(record.date).toLocaleDateString(
                                      "en-US",
                                      {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      }
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              <div className="space-y-6">
                <div className="border border-gray-200 shadow-sm rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Health Card
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
                      <QRCodeSVG
                        value={currentPatient._id || "N/A"}
                        size={180}
                      />
                    </div>
                    <p className="text-center text-gray-500 mt-4 text-sm">
                      Scan for quick access to patient records
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "records" && (
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="border border-gray-200 shadow-sm rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Medical History
                    </h2>
                  </div>
                  <div className="p-4 max-h-[600px] overflow-y-auto">
                    {currentPatient.records?.length ? (
                      <div className="space-y-4">
                        {currentPatient.records.map((record, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                          >
                            {console.log("Rendering record:", record)}
                            <button
                              onClick={() =>
                                setExpandedRecord(
                                  expandedRecord === index ? null : index
                                )
                              }
                              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
                                  {index + 1}
                                </div>
                                <div className="text-left">
                                  <p className="text-gray-900 text-sm">
                                    {new Date(record.date).toLocaleDateString(
                                      "en-US",
                                      {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      }
                                    )}
                                  </p>
                                  <p className="text-gray-500 text-sm mt-0.5">
                                    {record.diagnosis.join(", ")}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`text-gray-400 transition-transform ${
                                  expandedRecord === index ? "rotate-180" : ""
                                }`}
                              >
                                ▼
                              </span>
                            </button>

                            {expandedRecord === index && (
                              <div className="px-6 pb-6 pt-2 bg-gray-50 space-y-6">
                                <div>
                                  <div className="flex items-center gap-2 text-gray-600 mb-3 text-sm">
                                    📋 <span>Diagnosis</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {record.diagnosis.map((d, i) => (
                                      <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm"
                                      >
                                        {d}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {record.medications.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-3 text-sm">
                                      💊 <span>Prescribed Medications</span>
                                    </div>
                                    <div className="space-y-2">
                                      {record.medications.map((med, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200 text-sm"
                                        >
                                          <span className="text-gray-900">
                                            {med.name}
                                          </span>
                                          <span className="text-gray-500">
                                            {med.dosage}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {record.notes && (
                                  <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-3 text-sm">
                                      📝 <span>Clinical Notes</span>
                                    </div>
                                    <div className="bg-white px-4 py-3 rounded-lg border border-gray-200">
                                      <p className="text-gray-700 text-sm leading-relaxed">
                                        {record.notes}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {record.followUpDate && (
                                  <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-3 text-sm">
                                      📅 <span>Follow-up Scheduled</span>
                                    </div>
                                    <div className="bg-white px-4 py-3 rounded-lg border border-gray-200 flex items-center gap-2 text-sm">
                                      <span className="text-green-600">✓</span>
                                      <span className="text-gray-900">
                                        {new Date(
                                          record.followUpDate
                                        ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          📄
                        </div>
                        <p className="text-gray-900 mb-1">No medical records</p>
                        <p className="text-gray-500">
                          Start a consultation to create the first record
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border border-gray-200 shadow-sm rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Quick Stats
                    </h2>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-gray-500 mb-1 text-sm">Total Visits</p>
                      <p className="text-gray-900 text-2xl">
                        {currentPatient.records?.length || 0}
                      </p>
                    </div>
                    <hr className="border-gray-200" />
                    <div>
                      <p className="text-gray-500 mb-1 text-sm">Last Visit</p>
                      <p className="text-gray-900 text-sm">
                        {currentPatient.records &&
                        currentPatient.records.length > 0
                          ? new Date(
                              currentPatient.records[0].date
                            ).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <hr className="border-gray-200" />
                    <div>
                      <p className="text-gray-500 mb-1 text-sm">
                        Active Medications
                      </p>
                      <p className="text-gray-900 text-sm">
                        {currentPatient.records &&
                        currentPatient.records.length > 0
                          ? currentPatient.records[0].medications.length
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "consult" && (
            <div className="mt-6 max-w-3xl">
              <div className="border border-gray-200 shadow-sm rounded-lg">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    New Consultation
                  </h2>
                  <p className="text-gray-500 mt-1 text-sm">
                    Record consultation details and prescriptions
                  </p>
                </div>
                <div className="p-4">
                  <ConsultationForm
                    patientId={currentPatient._id}
                    onSubmit={handleConsultSubmit}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPatient ? renderPatientDetails() : renderPatientList()}
      </div>

      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded max-w-lg w-full relative">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ×
            </button>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Register New Patient
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                Add a new patient to the system
              </p>
            </div>
            <div className="p-4">
              <PatientRegistrationForm onSubmit={handleRegisterSubmit} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientVisit;
