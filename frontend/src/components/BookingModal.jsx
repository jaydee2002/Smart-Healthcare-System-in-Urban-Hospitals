import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Building2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  User,
  Sparkles,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BookingModal = ({ isOpen, onClose, slot, doctor, onConfirm }) => {
  const [paymentAmount, setPaymentAmount] = useState(250);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [step, setStep] = useState("confirm"); // confirm, payment, success

  if (!isOpen) return null;

  if (!doctor || !slot) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100 to-pink-100 rounded-full blur-3xl opacity-50" />
          <div className="relative text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <AlertCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-gray-900 mb-2">Oops! Something's Missing</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find the appointment details. Please try selecting a
              slot again.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-gray-900 to-gray-700 text-white py-3 px-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isPrivate = doctor.hospital?.type === "private";
  const appointmentDate = slot.start ? new Date(slot.start) : new Date();
  const isValidDate = !isNaN(appointmentDate.getTime());
  const displayDate = isValidDate
    ? appointmentDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Invalid Date";
  const displayStartTime = isValidDate
    ? appointmentDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Invalid Time";
  const displayEndTime = slot.end
    ? new Date(slot.end).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Invalid Time";

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const computedDate = isValidDate
        ? appointmentDate.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      const data = {
        doctorId: doctor._id,
        slot: {
          date: computedDate,
          start: slot.start,
          end: slot.end,
        },
        ...(isPrivate && { paymentAmount }),
      };

      // Simulate booking
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setBookingData({
        id: "APT-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        qrCode: JSON.stringify(data),
        ...data,
      });

      setStep("success");
      if (onConfirm) onConfirm(data);
      setTimeout(() => {
        onClose();
        setStep("confirm");
        setBookingData(null);
      }, 3000);
    } catch (error) {
      console.error("Booking error:", error);
      alert("Booking failed");
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-gray-900">
                {step === "success"
                  ? "Booking Confirmed"
                  : "Confirm Appointment"}
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {step === "success"
                  ? "Your appointment is confirmed"
                  : "Review your appointment details"}
              </p>
            </div>
            {step !== "success" && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {step === "success" ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </motion.div>
                <h3 className="text-gray-900 mb-2">Appointment Booked</h3>
                <p className="text-gray-600 mb-6">
                  Appointment ID:{" "}
                  <span className="font-mono text-gray-900">
                    {bookingData?.id}
                  </span>
                </p>

                {/* QR Code Placeholder */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 inline-block mx-auto">
                  <div className="w-32 h-32 bg-white border-2 border-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-100 rounded grid grid-cols-3 gap-1 p-2">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="bg-gray-900 rounded-sm" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Scan at reception
                  </p>
                </div>

                <p className="text-sm text-gray-500">
                  Closing automatically...
                </p>
              </motion.div>
            ) : (
              /* Confirmation State */
              <div className="space-y-5">
                {/* Doctor Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 mb-0.5 truncate">
                        {doctor.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-1">
                        {doctor.specialization}
                      </p>
                      <p className="text-gray-500 text-sm truncate">
                        {doctor.hospital?.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm">Date</span>
                    </div>
                    <span className="text-sm text-gray-900">{displayDate}</span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm">Time</span>
                    </div>
                    <span className="text-sm text-gray-900">
                      {displayStartTime} - {displayEndTime}
                    </span>
                  </div>

                  {isPrivate && (
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Building2 className="w-5 h-5" />
                        <span className="text-sm">Hospital Type</span>
                      </div>
                      <span className="text-sm text-gray-900 capitalize">
                        {doctor.hospital?.type}
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment Section */}
                {isPrivate && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <h4 className="text-gray-900">Payment Amount</h4>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) =>
                          setPaymentAmount(Number(e.target.value))
                        }
                        className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                        min="0"
                        step="1"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Payment will be processed after confirmation
                    </p>
                  </div>
                )}

                {/* Note */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    Please arrive 10 minutes early and bring a valid ID.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {step !== "success" && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>{isPrivate ? `Pay ₹${paymentAmount}` : "Confirm"}</>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingModal;
