import Hospital from "../models/Hospital.js";

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Public
export const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    console.error("Error fetching hospitals:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error. Unable to fetch hospitals.",
    });
  }
};
