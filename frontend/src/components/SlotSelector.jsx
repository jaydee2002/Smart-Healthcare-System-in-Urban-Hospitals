// src/components/SlotSelector.jsx
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getAvailableSlots } from "../services/appointmentService.js";

const SlotSelector = ({ doctorId, onSelectSlot }) => {
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    getAvailableSlots(doctorId, selectedDate.toISOString().split("T")[0])
      .then((res) => {
        setSlots(res.data.slots);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [doctorId, selectedDate]);

  if (loading) return <div className="p-4">Loading slots...</div>;

  return (
    <div className="p-4">
      <DatePicker
        selected={selectedDate}
        onChange={setSelectedDate}
        className="mb-4 p-2 border rounded"
      />
      <ul className="space-y-2">
        {slots.map((slot, i) => (
          <li
            key={i}
            className="bg-white p-4 rounded shadow-md flex justify-between items-center"
          >
            <span>
              {new Date(slot.start).toLocaleTimeString()} -{" "}
              {new Date(slot.end).toLocaleTimeString()}
            </span>
            <button
              onClick={() => onSelectSlot(slot)}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Select
            </button>
          </li>
        ))}
      </ul>
      {slots.length === 0 && (
        <p className="text-gray-500">No available slots.</p>
      )}
    </div>
  );
};

export default SlotSelector;
