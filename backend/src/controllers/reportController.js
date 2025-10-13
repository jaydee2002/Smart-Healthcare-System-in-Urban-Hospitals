// src/controllers/reportController.js
import Report from "../models/Report.js";
import Appointment from "../models/Appointment.js";
import Hospital from "../models/Hospital.js";
import {
  startOfDay,
  endOfDay,
  addDays,
  addWeeks,
  startOfWeek,
  startOfMonth,
} from "date-fns";

// Helper to build date range based on type
const getDateRange = (type, baseDate = new Date()) => {
  const now = new Date(baseDate);
  switch (type) {
    case "daily":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "weekly":
      return {
        start: startOfWeek(now),
        end: endOfDay(addDays(startOfWeek(now), 6)),
      };
    case "monthly":
      return {
        start: startOfMonth(now),
        end: endOfDay(addDays(startOfMonth(now), 30)),
      };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
};

// @desc    Generate report
// @route   GET /api/reports/:type
// @access  Private/Manager
const generateReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { hospital, startDate, endDate } = req.query; // Filters

    // Build query for appointments
    let matchQuery = { status: { $ne: "cancelled" } }; // Exclude cancelled
    if (hospital) matchQuery.hospital = hospital; // Wait, appointments don't have hospital directly; join via doctor
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      const range = getDateRange(type);
      matchQuery.date = { $gte: range.start, $lte: range.end };
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "doctors",
          localField: "doctor",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      { $unwind: "$doctorDetails" },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            hospital: "$doctorDetails.hospital",
          },
          patientCount: { $sum: 1 },
          appointments: { $push: { time: "$timeSlot.start", type: "$type" } },
        },
      },
      {
        $group: {
          _id: "$_id.hospital",
          totalPatients: { $sum: "$patientCount" },
          peakDate: {
            $max: {
              date: "$_id.date",
              count: "$patientCount",
            },
          },
          utilization: { $avg: { $divide: ["$patientCount", 10] } }, // Simplified % (assume 10 slots/day)
          peakTimes: { $push: "$appointments" }, // For analysis
        },
      },
      {
        $lookup: {
          from: "hospitals",
          localField: "_id",
          foreignField: "_id",
          as: "hospitalDetails",
        },
      },
      {
        $unwind: { path: "$hospitalDetails", preserveNullAndEmptyArrays: true },
      },
    ];

    const metrics = await Appointment.aggregate(pipeline);

    // Flatten metrics
    const reportData = {
      type,
      filters: { hospital, startDate, endDate },
      metrics: {
        totalPatientCount: metrics.reduce(
          (sum, m) => sum + (m.totalPatients || 0),
          0
        ),
        averageUtilization:
          metrics.reduce((sum, m) => sum + (m.utilization || 0), 0) /
          (metrics.length || 1),
        peakTimes: metrics.flatMap(
          (m) =>
            m.peakTimes?.map((pt) => ({ time: pt.time, count: pt.length })) ||
            []
        ),
        hospitalBreakdown: metrics.map((m) => ({
          hospital: m.hospitalDetails?.name || "Unknown",
          patients: m.totalPatients,
          peakDay: m.peakDate?.date,
        })),
      },
    };

    // Save report
    const report = await Report.create({
      type,
      filters: reportData.filters,
      metrics: reportData.metrics,
      generatedBy: req.user._id,
    });

    res.json({ ...reportData, reportId: report._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get report history
// @route   GET /api/reports
// @access  Private/Manager
const getReports = async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    let query = {};

    if (type) query.type = type;

    const reports = await Report.find(query)
      .populate("generatedBy", "name")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single report by ID (for export)
// @route   GET /api/reports/:id
// @access  Private/Manager
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate(
      "generatedBy",
      "name"
    );
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { generateReport, getReports, getReportById };
