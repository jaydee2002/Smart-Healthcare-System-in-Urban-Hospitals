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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Book Appointment</h1>
      {!selectedDoctor ? (
        <DoctorSearch onSelectDoctor={handleSelectDoctor} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold mb-4">
              Available Slots for {selectedDoctor.name}
            </h2>
            <SlotSelector
              doctorId={selectedDoctor._id}
              onSelectSlot={handleSelectSlot}
            />
          </div>
          <div>
            <button
              onClick={() => setSelectedDoctor(null)}
              className="bg-gray-500 text-white p-2 rounded mb-4"
            >
              Back to Search
            </button>
          </div>
        </div>
      )}
      <BookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        slot={selectedSlot}
        doctor={selectedDoctor}
        onConfirm={handleConfirm}
      />
      {confirmation && (
        <div className="mt-8 p-4 bg-green-100 rounded">
          <h3>Confirmation</h3>
          <p>Appointment ID: {confirmation._id}</p>
          <QRCode value={confirmation.qrCode} size={128} />
        </div>
      )}
    </div>
  );
};

export default Booking;
