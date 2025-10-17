import { useState, useEffect } from "react";
import { getAvailableSlots } from "../services/appointmentService.js";

const Calendar = ({ selected, onSelect, disabled, className }) => {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1)
  );

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = currentMonth.getDay();
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="text-center py-2"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const isDisabled = disabled(date);
    const isSelected =
      selected && date.toDateString() === selected.toDateString();
    days.push(
      <button
        key={day}
        onClick={() => !isDisabled && onSelect(date)}
        disabled={isDisabled}
        className={`text-center py-2 px-4 rounded-full ${
          isSelected
            ? "bg-neutral-900 text-white"
            : isDisabled
            ? "text-neutral-300 cursor-not-allowed"
            : "hover:bg-neutral-100"
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex justify-between w-full mb-2">
        <button onClick={prevMonth} className="px-2 py-1">
          &lt;
        </button>
        <span className="font-medium">
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button onClick={nextMonth} className="px-2 py-1">
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 w-full">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center font-medium text-neutral-500 py-2"
          >
            {day}
          </div>
        ))}
        {days}
      </div>
    </div>
  );
};

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

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Calendar Section */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-neutral-600"
          >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
          </svg>
          <h2>Select a Date</h2>
        </div>
        <div className="flex justify-center">
          <Calendar
            selected={selectedDate}
            onSelect={(date) => setSelectedDate(date)}
            disabled={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
            className="rounded-md border-0"
          />
        </div>
      </div>

      {/* Time Slots Section */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-neutral-600"
          >
            <path d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <h2>Available Time Slots</h2>
          <span className="ml-auto text-neutral-500">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-neutral-200 h-16 w-full rounded-lg"
              />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-neutral-400"
              >
                <path d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <p className="text-neutral-500">No available slots for this date</p>
            <p className="text-neutral-400 mt-1">Please select another date</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => onSelectSlot(slot)}
                className="group relative p-4 rounded-lg border-2 border-neutral-200 bg-white hover:border-neutral-900 hover:bg-neutral-50 transition-all duration-200 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 group-hover:bg-neutral-900 flex items-center justify-center transition-colors duration-200">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors duration-200"
                      >
                        <path d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-neutral-900">
                        {formatTime(slot.start)}
                      </div>
                      <div className="text-neutral-500 mt-0.5">30 min</div>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg
                      className="w-5 h-5 text-neutral-900"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotSelector;

// import { useState, useEffect } from "react";

// const SlotSelector = ({ doctorId, onSelectSlot }) => {
//   const [slots, setSlots] = useState([
//     { start: "2025-10-20T09:00:00", end: "2025-10-20T09:30:00", available: true },
//     { start: "2025-10-20T09:30:00", end: "2025-10-20T10:00:00", available: true },
//     { start: "2025-10-20T10:00:00", end: "2025-10-20T10:30:00", available: false },
//     { start: "2025-10-20T10:30:00", end: "2025-10-20T11:00:00", available: true },
//     { start: "2025-10-20T11:00:00", end: "2025-10-20T11:30:00", available: true },
//     { start: "2025-10-20T14:00:00", end: "2025-10-20T14:30:00", available: true },
//     { start: "2025-10-20T14:30:00", end: "2025-10-20T15:00:00", available: true },
//     { start: "2025-10-20T15:30:00", end: "2025-10-20T16:00:00", available: true },
//   ]);
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [selectedSlot, setSelectedSlot] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // Generate dates for next 7 days
//   const generateDateOptions = () => {
//     const dates = [];
//     for (let i = 0; i < 7; i++) {
//       const date = new Date();
//       date.setDate(date.getDate() + i);
//       dates.push(date);
//     }
//     return dates;
//   };

//   const dateOptions = generateDateOptions();

//   const formatDate = (date) => {
//     return date.toISOString().split("T")[0];
//   };

//   const formatDayName = (date) => {
//     const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
//     return days[date.getDay()];
//   };

//   const formatDateDisplay = (date) => {
//     return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
//   };

//   const formatTime = (dateTime) => {
//     return new Date(dateTime).toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//   };

//   const groupSlotsByTime = (slots) => {
//     const morning = [];
//     const afternoon = [];
//     const evening = [];

//     slots.forEach((slot) => {
//       const hour = new Date(slot.start).getHours();
//       if (hour < 12) morning.push(slot);
//       else if (hour < 17) afternoon.push(slot);
//       else evening.push(slot);
//     });

//     return { morning, afternoon, evening };
//   };

//   const handleSelectSlot = (slot) => {
//     if (slot.available) {
//       setSelectedSlot(slot);
//       onSelectSlot(slot);
//     }
//   };

//   const { morning, afternoon, evening } = groupSlotsByTime(slots);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-6 md:p-8">
//       <div className="max-w-4xl mx-auto">
//         {/* Header */}
//         <div className="mb-12">
//           <div className="flex items-center gap-3 mb-3">
//             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
//               📅
//             </div>
//             <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
//               Select Your Appointment Time
//             </h1>
//           </div>
//           <p className="text-gray-600 text-lg">
//             Choose your preferred date and time slot
//           </p>
//         </div>

//         {/* Date Selector */}
//         <div className="mb-10">
//           <h2 className="text-lg font-bold text-gray-900 mb-4">Select Date</h2>
//           <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
//             {dateOptions.map((date, idx) => {
//               const isSelected =
//                 formatDate(date) === formatDate(selectedDate);
//               return (
//                 <button
//                   key={idx}
//                   onClick={() => setSelectedDate(date)}
//                   className={`p-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
//                     isSelected
//                       ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg ring-2 ring-blue-400"
//                       : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:shadow-md"
//                   }`}
//                 >
//                   <div className="text-xs font-semibold opacity-75">
//                     {formatDayName(date)}
//                   </div>
//                   <div className="text-lg font-bold mt-1">
//                     {formatDateDisplay(date)}
//                   </div>
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Time Slots */}
//         <div className="mb-8">
//           <h2 className="text-lg font-bold text-gray-900 mb-6">Select Time</h2>

//           {loading ? (
//             <div className="flex items-center justify-center py-12">
//               <div className="animate-pulse text-center">
//                 <div className="w-12 h-12 bg-blue-200 rounded-full mx-auto mb-4" />
//                 <p className="text-gray-600 font-medium">Loading available slots...</p>
//               </div>
//             </div>
//           ) : slots.length === 0 ? (
//             <div className="text-center py-16 bg-white border-2 border-dashed border-gray-300 rounded-2xl">
//               <p className="text-5xl mb-4">😔</p>
//               <h3 className="text-xl font-bold text-gray-900 mb-2">
//                 No slots available
//               </h3>
//               <p className="text-gray-600">
//                 Please try selecting a different date
//               </p>
//             </div>
//           ) : (
//             <div className="space-y-8">
//               {/* Morning Slots */}
//               {morning.length > 0 && (
//                 <div>
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
//                       <span className="text-lg">🌅</span>
//                     </div>
//                     <h3 className="font-bold text-gray-900">Morning Slots</h3>
//                     <span className="text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
//                       {morning.filter((s) => s.available).length} available
//                     </span>
//                   </div>
//                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
//                     {morning.map((slot, idx) => (
//                       <button
//                         key={idx}
//                         onClick={() => handleSelectSlot(slot)}
//                         disabled={!slot.available}
//                         className={`p-4 rounded-xl font-semibold transition-all duration-200 transform ${
//                           !slot.available
//                             ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
//                             : selectedSlot === slot
//                             ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg ring-2 ring-blue-400 scale-105"
//                             : "bg-white border-2 border-amber-200 text-gray-700 hover:border-blue-400 hover:shadow-md hover:scale-105"
//                         }`}
//                       >
//                         <div className="text-sm opacity-75">
//                           {formatTime(slot.start)}
//                         </div>
//                         <div className="text-xs opacity-60 mt-1">
//                           {formatTime(slot.end)}
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Afternoon Slots */}
//               {afternoon.length > 0 && (
//                 <div>
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                       <span className="text-lg">☀️</span>
//                     </div>
//                     <h3 className="font-bold text-gray-900">Afternoon Slots</h3>
//                     <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
//                       {afternoon.filter((s) => s.available).length} available
//                     </span>
//                   </div>
//                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
//                     {afternoon.map((slot, idx) => (
//                       <button
//                         key={idx}
//                         onClick={() => handleSelectSlot(slot)}
//                         disabled={!slot.available}
//                         className={`p-4 rounded-xl font-semibold transition-all duration-200 transform ${
//                           !slot.available
//                             ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
//                             : selectedSlot === slot
//                             ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg ring-2 ring-blue-400 scale-105"
//                             : "bg-white border-2 border-blue-200 text-gray-700 hover:border-blue-400 hover:shadow-md hover:scale-105"
//                         }`}
//                       >
//                         <div className="text-sm opacity-75">
//                           {formatTime(slot.start)}
//                         </div>
//                         <div className="text-xs opacity-60 mt-1">
//                           {formatTime(slot.end)}
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Evening Slots */}
//               {evening.length > 0 && (
//                 <div>
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
//                       <span className="text-lg">🌙</span>
//                     </div>
//                     <h3 className="font-bold text-gray-900">Evening Slots</h3>
//                     <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
//                       {evening.filter((s) => s.available).length} available
//                     </span>
//                   </div>
//                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
//                     {evening.map((slot, idx) => (
//                       <button
//                         key={idx}
//                         onClick={() => handleSelectSlot(slot)}
//                         disabled={!slot.available}
//                         className={`p-4 rounded-xl font-semibold transition-all duration-200 transform ${
//                           !slot.available
//                             ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
//                             : selectedSlot === slot
//                             ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg ring-2 ring-blue-400 scale-105"
//                             : "bg-white border-2 border-indigo-200 text-gray-700 hover:border-blue-400 hover:shadow-md hover:scale-105"
//                         }`}
//                       >
//                         <div className="text-sm opacity-75">
//                           {formatTime(slot.start)}
//                         </div>
//                         <div className="text-xs opacity-60 mt-1">
//                           {formatTime(slot.end)}
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Selected Slot Summary */}
//         {selectedSlot && (
//           <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
//             <div className="flex items-start justify-between">
//               <div>
//                 <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
//                   ✓ Slot Selected
//                 </p>
//                 <h3 className="text-2xl font-bold text-gray-900 mt-2">
//                   {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
//                 </h3>
//                 <p className="text-gray-600 mt-1">
//                   {selectedDate.toLocaleDateString("en-US", {
//                     weekday: "long",
//                     year: "numeric",
//                     month: "long",
//                     day: "numeric",
//                   })}
//                 </p>
//               </div>
//               <div className="text-4xl">✅</div>
//             </div>
//           </div>
//         )}

//         {/* Legend */}
//         <div className="bg-white border-2 border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-6">
//           <div className="flex items-center gap-2">
//             <div className="w-4 h-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded" />
//             <span className="text-sm font-medium text-gray-700">Selected</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-4 h-4 border-2 border-blue-200 rounded" />
//             <span className="text-sm font-medium text-gray-700">Available</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-4 h-4 bg-gray-100 rounded" />
//             <span className="text-sm font-medium text-gray-700">Booked</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SlotSelector;
