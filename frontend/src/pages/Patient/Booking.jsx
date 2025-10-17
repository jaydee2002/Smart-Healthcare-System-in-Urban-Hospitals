// src/pages/Patient/Booking.jsx
import { useState } from "react";
import DoctorSearch from "../../components/DoctorSearch.jsx";
import SlotSelector from "../../components/SlotSelector.jsx";
import BookingModal from "../../components/BookingModal.jsx";

const Booking = () => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setModalOpen(true);
  };

  const handleConfirm = (data) => {
    setConfirmation(data);
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Book Appointment
        </h1>
        <p className="text-sm text-gray-600 mb-8 text-center">
          Find a doctor and secure your slot in just a few steps
        </p>

        {!selectedDoctor ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <DoctorSearch onSelectDoctor={handleSelectDoctor} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Doctor Details Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 font-medium flex-shrink-0">
                  <span className="text-sm">
                    {getInitials(selectedDoctor.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1 truncate">
                    {selectedDoctor.name}
                  </h2>

                  <p className="text-blue-600 font-medium mb-2">
                    {selectedDoctor.specialization}
                  </p>

                  <p className="text-sm text-gray-600">
                    Consultation Rate: LKR{" "}
                    {selectedDoctor.consultationRate?.toLocaleString() || "N/A"}
                  </p>
                </div>
              </div>

              {/* Special Note */}
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Special Notes:</strong> All appointments are confirmed
                  via email and SMS within 5 minutes. Please arrive 15 minutes
                  early for registration. Cancellations must be made 24 hours in
                  advance.
                </p>
              </div>
            </div>

            {/* Slots Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Available Slots
                </h2>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  ← Back to Search
                </button>
              </div>
              <SlotSelector
                doctorId={selectedDoctor._id}
                onSelectSlot={handleSelectSlot}
              />
            </div>
          </div>
        )}

        {/* Booking Modal */}
        <BookingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          slot={selectedSlot}
          doctor={selectedDoctor}
          onConfirm={handleConfirm}
        />

        {/* Confirmation Section */}
        {confirmation && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                Booking Confirmed!
              </h3>
              <p className="text-sm text-green-700 mb-6">
                Your appointment is scheduled. Check your email/SMS for details.
              </p>
              <p className="text-sm font-medium text-green-900 mb-4">
                Appointment ID:{" "}
                <span className="bg-green-200 px-2 py-1 rounded text-xs">
                  {confirmation._id}
                </span>
              </p>
              <div className="border-2 border-green-200 rounded-lg p-4 bg-white">
                <QRCode value={confirmation.qrCode} size={128} />
                <p className="text-xs text-green-600 mt-2">
                  Scan QR Code for Digital Confirmation
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;
