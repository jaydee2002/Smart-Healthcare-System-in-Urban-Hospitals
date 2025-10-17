import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { format, isAfter } from "date-fns";
import { Calendar, Plus, Trash2, Pencil, Clock, X } from "lucide-react";

import {
  setAvailability,
  getAvailability,
  updateAvailability,
  deleteAvailability,
} from "../services/doctorService.js";

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
        toast.success("Availability deleted successfully");
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
        toast.success("Availability updated successfully");
        handleCancel();
      } else {
        await setAvailability(doctorId, data);
        toast.success("Availability created successfully");
        setTimeSlots([]);
      }
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving availability");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-gray-500">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {editMode ? "Edit Schedule" : "Manage Availability"}
          </h1>
          <p className="text-gray-600">
            {editMode
              ? "Update your existing schedule"
              : "Set your availability and manage time slots"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="space-y-6">
                {/* Date and Recurrence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate.toISOString().split("T")[0]}
                      onChange={(e) =>
                        setSelectedDate(new Date(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurrence
                    </label>
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                    >
                      <option value="none">None</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Time Slots
                    </label>
                    <span className="text-sm text-gray-500">
                      {timeSlots.length}/5 slots
                    </span>
                  </div>

                  {timeSlots.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                      <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No time slots added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {timeSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-4 border border-gray-200 rounded-md"
                        >
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <input
                              type="time"
                              value={
                                String(slot.start.getHours()).padStart(2, "0") +
                                ":" +
                                String(slot.start.getMinutes()).padStart(2, "0")
                              }
                              onChange={(e) => {
                                const [h, m] = e.target.value.split(":");
                                const newStart = new Date(slot.start);
                                newStart.setHours(parseInt(h), parseInt(m));
                                updateSlot(index, "start", newStart);
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                            />
                            <input
                              type="time"
                              value={
                                String(slot.end.getHours()).padStart(2, "0") +
                                ":" +
                                String(slot.end.getMinutes()).padStart(2, "0")
                              }
                              onChange={(e) => {
                                const [h, m] = e.target.value.split(":");
                                const newEnd = new Date(slot.end);
                                newEnd.setHours(parseInt(h), parseInt(m));
                                updateSlot(index, "end", newEnd);
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                            />
                          </div>
                          <button
                            onClick={() => removeSlot(index)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {timeSlots.length < 5 && (
                    <button
                      onClick={addSlot}
                      className="w-full mt-3 px-4 py-3 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-2 rounded-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Time Slot</span>
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || timeSlots.length === 0}
                    className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      "Saving..."
                    ) : editMode ? (
                      <>
                        <Pencil className="w-4 h-4" />
                        Update Schedule
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        Create Schedule
                      </>
                    )}
                  </button>
                  {editMode && (
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Summary Card */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Quick Summary
                </h3>
                <div className="space-y-3">
                  <div className="p-3 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">Selected Date</p>
                    <p className="text-gray-900">
                      {formatDate(selectedDate.toISOString())}
                    </p>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">Time Slots</p>
                    <p className="text-gray-900">{timeSlots.length}</p>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">Recurrence</p>
                    <p className="text-gray-900 capitalize">{recurrence}</p>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                    <span className="text-sm text-gray-600">
                      Total Schedules
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {availabilities.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                    <span className="text-sm text-gray-600">Active Today</span>
                    <span className="text-sm font-medium text-gray-900">
                      {
                        availabilities.filter(
                          (a) =>
                            new Date(a.date).toDateString() ===
                            new Date().toDateString()
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Schedules */}
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Existing Schedules
            </h2>
            <p className="text-gray-600">Manage your availability timeline</p>
          </div>

          {availabilities.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 mb-2">No schedules yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Create your first availability schedule to start managing your
                appointments
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availabilities
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((avail) => {
                  const hasBooked = avail.timeSlots.some((s) => s.isBooked);
                  const totalSlots = avail.timeSlots.length;
                  const bookedSlots = avail.timeSlots.filter(
                    (s) => s.isBooked
                  ).length;

                  return (
                    <div
                      key={avail._id}
                      className={`border p-5 rounded-lg ${
                        hasBooked ? "border-gray-300" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-gray-900 mb-2">
                            {formatDate(avail.date)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 border border-gray-200 text-xs text-gray-500 rounded-full">
                              {avail.recurrence}
                            </span>
                            {hasBooked && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                {bookedSlots}/{totalSlots} booked
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(avail)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(avail)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {avail.timeSlots.map((slot, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between px-3 py-2 border rounded-md text-sm ${
                              slot.isBooked
                                ? "border-gray-300 bg-gray-50 text-gray-700"
                                : "border-gray-200 bg-white text-gray-900"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>
                                {formatTime(slot.start)} –{" "}
                                {formatTime(slot.end)}
                              </span>
                            </div>
                            {slot.isBooked && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                Booked
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
