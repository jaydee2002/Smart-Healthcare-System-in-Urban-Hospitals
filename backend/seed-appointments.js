// seed-appointments.js (run with: node seed-appointments.js)
import dotenv from "dotenv";

import connectDB from "./src/config/db.js";
import Appointment from "./src/models/Appointment.js";
import Patient from "./src/models/Patient.js";
import Doctor from "./src/models/Doctor.js";

dotenv.config();

const seedAppointments = async () => {
  await connectDB();

  // Sample patient
  const samplePatient = await Patient.create({
    name: "Test Patient",
    email: "patient@test.com",
    user: "some-user-id", // Skip for now
  });

  // Sample doctor ID from seed
  const sampleDoctor = await Doctor.findOne();

  await Appointment.insertMany([
    {
      patient: samplePatient._id,
      doctor: sampleDoctor._id,
      date: new Date("2025-10-14"), // Today
      timeSlot: {
        start: new Date("2025-10-14T09:00:00"),
        end: new Date("2025-10-14T10:00:00"),
      },
      type: "private",
      status: "booked",
    },
    {
      patient: samplePatient._id,
      doctor: sampleDoctor._id,
      date: new Date("2025-10-14"),
      timeSlot: {
        start: new Date("2025-10-14T14:00:00"),
        end: new Date("2025-10-14T15:00:00"),
      },
      type: "government",
      status: "completed",
    },
  ]);

  console.log("Sample appointments seeded!");
  process.exit();
};

seedAppointments().catch(console.error);
