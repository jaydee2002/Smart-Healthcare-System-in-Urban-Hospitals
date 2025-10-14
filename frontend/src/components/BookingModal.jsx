// src/components/BookingModal.jsx
import { useState } from "react";
import Modal from "react-modal";
import { bookAppointment } from "../services/appointmentService.js";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

Modal.setAppElement("#root");

const BookingModal = ({ isOpen, onClose, slot, doctor, onConfirm }) => {
  const [paymentAmount, setPaymentAmount] = useState(50); // Fixed for private
  const [isPrivate, setIsPrivate] = useState(
    doctor.hospital?.type === "private"
  );
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const data = {
        doctorId: doctor._id,
        slot: { date: slot.date, start: slot.start, end: slot.end },
      };
      const res = await bookAppointment(data);
      onConfirm(res.data);
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
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Amount ($)"
            className="w-full p-2 border rounded mt-2"
          />
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="flex-1 bg-blue-600 text-white p-2 rounded"
        >
          {submitting
            ? "Confirming..."
            : isPrivate
            ? "Pay & Confirm"
            : "Confirm"}
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-gray-500 text-white p-2 rounded"
        >
          Cancel
        </button>
      </div>
      {onConfirm && (
        <QRCodeSVG
          value={onConfirm.qrCode}
          size={128}
          className="mt-4 mx-auto"
        />
      )}{" "}
      {/* Show after confirm */}
    </Modal>
  );
};

export default BookingModal;
