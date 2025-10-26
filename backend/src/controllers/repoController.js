// controllers/reportController.js (ES Module)
import Report from "../models/Report.js";

// Create a new report
export const createReport = async (req, res) => {
  try {
    const payload = req.body;
    const data = generateMockData(payload); // Assuming generateMockData is imported or defined elsewhere

    const newReport = new Report({
      reportData: data,
      payload: payload,
    });

    await newReport.save();
    console.log("Report saved to database with ID:", newReport._id);

    res.status(201).json(newReport);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all reports
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ generatedAt: -1 })
      .select("-payload"); // Exclude payload for brevity
    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get report by ID
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id).select("-payload");
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update report by ID
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const data = generateMockData(payload); // Regenerate data if needed

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      {
        reportData: data,
        payload: payload,
        generatedAt: new Date(), // Update timestamp
      },
      { new: true, runValidators: true }
    ).select("-payload");

    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(updatedReport);
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete report by ID
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReport = await Report.findByIdAndDelete(id);
    if (!deletedReport) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ error: error.message });
  }
};
