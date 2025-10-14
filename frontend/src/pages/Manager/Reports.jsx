// src/components/ReportExport.jsx
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getReportById } from "../../services/reportService.js";

const ReportExport = ({ reportId, metrics }) => {
  const exportPDF = async () => {
    const report = await getReportById(reportId);
    const doc = new jsPDF();
    doc.text("Healthcare Report", 10, 10);
    doc.text(`Type: ${report.type}`, 10, 20);
    doc.text(`Total Patients: ${metrics.totalPatientCount}`, 10, 30);
    // Add more text/tables (simplified)
    doc.save(`report-${report._id}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet([metrics]); // Flatten for sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metrics");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buf]), `report-${reportId}.xlsx`);
  };

  return (
    <div className="flex gap-4 p-4">
      <button
        onClick={exportPDF}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Export PDF
      </button>
      <button
        onClick={exportExcel}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Export Excel
      </button>
    </div>
  );
};

export default ReportExport;
