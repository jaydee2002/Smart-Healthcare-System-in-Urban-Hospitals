// seed.js (run with: node seed.js)
import connectDB from "./src/config/db.js";
import Hospital from "./src/models/Hospital.js";
import Doctor from "./src/models/Doctor.js";
import User from "./src/models/User.js";

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await Hospital.deleteMany();
  await Doctor.deleteMany();
  await User.deleteMany();

  // Sample Hospitals
  const hospitals = await Hospital.insertMany([
    {
      name: "City Private Hospital",
      type: "private",
      address: "123 Main St",
      contact: "123-456",
    },
    {
      name: "Govt General Hospital",
      type: "government",
      address: "456 Oak Ave",
      contact: "789-012",
    },
  ]);

  // Sample Doctor (link to hospital)
  const sampleUser = await User.create({
    name: "Dr. Jane Smith",
    email: "doctor@example.com",
    password: "password123",
    role: "doctor",
  });

  await Doctor.create({
    name: "Dr. Jane Smith",
    qualification: "MD",
    specialization: "Cardiology",
    hospital: hospitals[0]._id,
    user: sampleUser._id,
    availability: [
      {
        date: new Date("2025-10-20"),
        timeSlots: [
          {
            start: new Date("2025-10-20T09:00:00"),
            end: new Date("2025-10-20T10:00:00"),
          },
        ],
        recurrence: "none",
      },
    ],
  });

  console.log("Seed data inserted!");
  process.exit();
};

seedData().catch(console.error);
