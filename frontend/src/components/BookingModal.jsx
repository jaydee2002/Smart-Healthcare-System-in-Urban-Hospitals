// src/components/BookingModal.jsx
import { useState } from "react";
import Modal from "react-modal";
import { bookAppointment } from "../services/appointmentService.js";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

Modal.setAppElement("#root");

const BookingModal = ({ isOpen, onClose, slot, doctor, onConfirm }) => {
  const [paymentAmount, setPaymentAmount] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState(null); // ← NEW: Track success

  // Guard clause: If doctor or slot is missing
  if (!doctor || !slot) {
    return (
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        className="bg-white p-6 rounded-lg max-w-md mx-auto mt-20"
      >
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p>Missing doctor or slot information. Please try again.</p>
        <button
          onClick={onClose}
          className="w-full bg-gray-500 text-white p-2 rounded mt-4"
        >
          Close
        </button>
      </Modal>
    );
  }

  const isPrivate = doctor.hospital?.type === "private";

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const data = {
        doctorId: doctor._id,
        slot: { date: slot.date, start: slot.start, end: slot.end },
        ...(isPrivate && { paymentAmount }), // ← FIXED: Send payment
      };
      const res = await bookAppointment(data);
      setBookingData(res.data); // ← FIXED: Store for QR
      if (onConfirm) onConfirm(res.data);
      toast.success("Appointment booked!");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed");
    }
    setSubmitting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white p-6 rounded-lg max-w-md mx-auto mt-20"
    >
      <h2 className="text-xl font-bold mb-4">Confirm Appointment</h2>
      <p>Doctor: {doctor.name}</p>
      <p>Date: {new Date(slot.date).toLocaleDateString()}</p>
      <p>
        Time: {new Date(slot.start).toLocaleTimeString()} -{" "}
        {new Date(slot.end).toLocaleTimeString()}
      </p>

      {isPrivate && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Payment Amount ($)
          </label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            placeholder="50"
            min="0"
            step="0.01"
            className="w-full p-2 border rounded"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="flex-1 bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        >
          {submitting
            ? "Confirming..."
            : isPrivate
            ? `Pay $${paymentAmount} & Confirm`
            : "Confirm"}
        </button>
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 bg-gray-500 text-white p-2 rounded"
        >
          Cancel
        </button>
      </div>

      {/* FIXED: Show QR ONLY after successful booking */}
      {bookingData?.qrCode && (
        <div className="mt-4 text-center">
          <p className="text-sm text-green-600 mb-2">Booking Confirmed!</p>
          <QRCodeSVG value={bookingData.qrCode} size={128} />
        </div>
      )}
    </Modal>
  );
};

export default BookingModal;
