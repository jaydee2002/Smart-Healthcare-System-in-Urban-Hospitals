// src/models/Hospital.js
import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["private", "government"], required: true },
    address: { type: String, required: true },
    contact: { type: String },
  },
  { timestamps: true }
);

const Hospital = mongoose.model("Hospital", hospitalSchema);
export default Hospital;
