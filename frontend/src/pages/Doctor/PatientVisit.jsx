// src/pages/Doctor/PatientVisit.jsx
import { useState } from "react";
import PatientRegistrationForm from "../../components/PatientRegistrationForm.jsx";
import ConsultationForm from "../../components/ConsultationForm.jsx";
import { QRCodeSVG } from "qrcode.react"; // Changed to named import
import { getDoctorPatients } from "../../services/patientService.js";

const PatientVisit = () => {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [view, setView] = useState("register"); // 'register', 'consult', 'view'

  const handleRegisterSubmit = (patient) => {
    setCurrentPatient(patient);
    setView("consult");
  };

  const handleConsultSubmit = (updatedPatient) => {
    setCurrentPatient(updatedPatient);
    setView("view");
  };

  const searchPatients = (query) => {
    getDoctorPatients(query).then((res) => {
      // Handle list; select one to setCurrentPatient and setView('consult')
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Patient Management</h1>
      {view === "register" && (
        <PatientRegistrationForm onSubmit={handleRegisterSubmit} />
      )}
      {view === "consult" && currentPatient && (
        <ConsultationForm
          patientId={currentPatient._id}
          onSubmit={handleConsultSubmit}
        />
      )}
      {view === "view" && currentPatient && (
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">
            Patient: {currentPatient.name}
          </h2>
          <QRCodeSVG
            value={currentPatient.healthCardQR}
            size={128}
            className="mx-auto mb-4"
          />
          <h3 className="font-bold mb-2">Records:</h3>
          <ul>
            {currentPatient.records?.map((r, i) => (
              <li key={i}>
                Diagnosis: {r.diagnosis.join(", ")} | Meds:{" "}
                {r.medications.map((m) => `${m.name}:${m.dosage}`).join(", ")}
                {r.followUpDate &&
                  ` | Follow-up: ${new Date(
                    r.followUpDate
                  ).toLocaleDateString()}`}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setView("consult")}
            className="bg-blue-600 text-white p-2 rounded mt-4"
          >
            Add New Consultation
          </button>
        </div>
      )}
      <button
        onClick={() => searchPatients("")}
        className="bg-gray-500 text-white p-2 rounded mt-4"
      >
        Search Existing Patients
      </button>
    </div>
  );
};

export default PatientVisit;
