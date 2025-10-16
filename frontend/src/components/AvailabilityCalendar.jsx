import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  setAvailability,
  getAvailability,
  updateAvailability,
  deleteAvailability,
} from "../services/doctorService.js";
import toast from "react-hot-toast";
import { format, isAfter } from "date-fns";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

const AvailabilityCalendar = () => {
  const { id: doctorId } = useParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [recurrence, setRecurrence] = useState("none");
  const [availabilities, setAvailabilities] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentAvailId, setCurrentAvailId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    try {
      const res = await getAvailability(doctorId);
      setAvailabilities(res.data);
    } catch (error) {
      toast.error("Error fetching availabilities");
    }
  };

  useEffect(() => {
    refetch().then(() => setLoading(false));
  }, [doctorId]);

  useEffect(() => {
    if (!editMode && timeSlots.length > 0) {
      setTimeSlots(
        timeSlots.map((slot) => {
          const newStart = new Date(selectedDate);
          newStart.setHours(slot.start.getHours(), slot.start.getMinutes(), 0);
          const newEnd = new Date(selectedDate);
          newEnd.setHours(slot.end.getHours(), slot.end.getMinutes(), 0);
          return { start: newStart, end: newEnd };
        })
      );
    }
  }, [selectedDate, editMode]);

  const addSlot = () => {
    const defaultStart = new Date(selectedDate);
    defaultStart.setHours(9, 0, 0);
    const defaultEnd = new Date(selectedDate);
    defaultEnd.setHours(10, 0, 0);
    setTimeSlots([...timeSlots, { start: defaultStart, end: defaultEnd }]);
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...timeSlots];
    newSlots[index][field] = value;
    setTimeSlots(newSlots);
  };

  const removeSlot = (index) =>
    setTimeSlots(timeSlots.filter((_, i) => i !== index));

  const handleEdit = (avail) => {
    setSelectedDate(new Date(avail.date));
    setTimeSlots(
      avail.timeSlots.map((s) => ({
        start: new Date(s.start),
        end: new Date(s.end),
      }))
    );
    setRecurrence(avail.recurrence);
    setEditMode(true);
    setCurrentAvailId(avail._id);
  };

  const handleDelete = async (avail) => {
    if (
      window.confirm(
        `Delete availability for ${format(new Date(avail.date), "yyyy-MM-dd")}?`
      )
    ) {
      try {
        await deleteAvailability(doctorId, avail._id);
        toast.success("Availability deleted");
        refetch();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Error deleting availability"
        );
      }
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setCurrentAvailId(null);
    setTimeSlots([]);
    setRecurrence("none");
    setSelectedDate(new Date());
  };

  const handleSubmit = async () => {
    if (timeSlots.length === 0)
      return toast.error("Add at least one time slot");
    if (timeSlots.some((slot) => !isAfter(slot.end, slot.start)))
      return toast.error("End time must be after start time");

    setSubmitting(true);
    const data = { date: selectedDate.toISOString(), timeSlots, recurrence };
    try {
      if (editMode) {
        await updateAvailability(doctorId, currentAvailId, data);
        toast.success("Availability updated");
        handleCancel();
      } else {
        await setAvailability(doctorId, data);
        toast.success("Availability set");
        setTimeSlots([]);
      }
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving availability");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <div className="p-4 text-gray-600">Loading availabilities...</div>;

  return (
    <div className="p-6 flex flex-col h-full space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">
        {editMode ? "Edit Availability" : "Set New Availability"}
      </h2>
      <DatePicker
        selected={selectedDate}
        onChange={setSelectedDate}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        wrapperClassName="w-full"
      />
      <select
        value={recurrence}
        onChange={(e) => setRecurrence(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      >
        <option value="none">None</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
      <div className="space-y-4">
        {timeSlots.map((slot, index) => (
          <div key={index} className="flex items-center gap-4">
            <DatePicker
              selected={slot.start}
              onChange={(date) => updateSlot(index, "start", date)}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              dateFormat="h:mm aa"
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition flex-1"
            />
            <DatePicker
              selected={slot.end}
              onChange={(date) => updateSlot(index, "end", date)}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              dateFormat="h:mm aa"
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition flex-1"
            />
            <button
              type="button"
              onClick={() => removeSlot(index)}
              className="p-2 text-red-600 hover:text-red-800 transition"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addSlot}
        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        Add Slot
      </button>
      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {submitting
            ? "Saving..."
            : editMode
            ? "Update Availability"
            : "Set Availability"}
        </button>
        {editMode && (
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mt-8 mb-4">
        Existing Availabilities
      </h3>
      <div className="overflow-y-auto flex-1 space-y-4">
        {availabilities
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map((avail) => (
            <div key={avail._id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Date: {format(new Date(avail.date), "yyyy-MM-dd")}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(avail)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(avail)}
                    className="p-1 text-red-600 hover:text-red-800 transition"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Recurrence: {avail.recurrence}
              </p>
              <ul className="space-y-1">
                {avail.timeSlots.map((slot, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    {format(new Date(slot.start), "HH:mm")} -{" "}
                    {format(new Date(slot.end), "HH:mm")}{" "}
                    {slot.isBooked ? "(Booked)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        {availabilities.length === 0 && (
          <p className="text-sm text-gray-600">No availabilities set yet.</p>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
