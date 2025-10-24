import { useState } from "react";
import { recordConsultation } from "../services/patientService.js";
import toast from "react-hot-toast";
import { Loader2, Plus, X } from "lucide-react";

const ConsultationForm = ({ patientId, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [diagnosis, setDiagnosis] = useState([""]);
  const [treatment, setTreatment] = useState([""]);
  const [medications, setMedications] = useState([{ name: "", dosage: "" }]);

  if (!patientId) {
    return (
      <div className="text-red-500 text-center py-4">
        Error: Patient ID is undefined. Please try registering again.
      </div>
    );
  }

  const addDiagnosis = () => {
    setDiagnosis([...diagnosis, ""]);
  };

  const removeDiagnosis = (index) => {
    if (diagnosis.length > 1) {
      setDiagnosis(diagnosis.filter((_, i) => i !== index));
    }
  };

  const updateDiagnosis = (index, value) => {
    const updated = [...diagnosis];
    updated[index] = value;
    setDiagnosis(updated);
  };

  const addTreatment = () => {
    setTreatment([...treatment, ""]);
  };

  const removeTreatment = (index) => {
    if (treatment.length > 1) {
      setTreatment(treatment.filter((_, i) => i !== index));
    }
  };

  const updateTreatment = (index, value) => {
    const updated = [...treatment];
    updated[index] = value;
    setTreatment(updated);
  };

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "" }]);
  };

  const removeMedication = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const onFormSubmit = async (e) => {
    e.preventDefault();
    const parsedDiagnosis = diagnosis.filter((d) => d.trim());
    if (!parsedDiagnosis.length) {
      toast.error("Diagnosis is required");
      return;
    }
    const parsedTreatment = treatment.filter((t) => t.trim());
    const parsedMedications = medications.filter((m) => m.name.trim());

    setIsSubmitting(true);
    try {
      const fullData = {
        diagnosis: parsedDiagnosis,
        treatment: parsedTreatment,
        medications: parsedMedications,
        followUpDate: followUpDate || undefined,
      };
      const result = await recordConsultation(patientId, fullData);
      onSubmit(result.data);
      toast.success("Consultation recorded");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error recording consultation"
      );
      console.error("Full error object:", error); // Add
      console.error("Status:", error.response?.status); // Add
      console.error("Response body:", error.response?.data); // Add - if JSON, it's "Patient not found"
      toast.error(
        error.response?.data?.message || "Error recording consultation"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onFormSubmit} className="space-y-5">
      <div className="col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
            Diagnosis *
          </label>
          <button
            type="button"
            onClick={addDiagnosis}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-200 text-gray-900 hover:bg-gray-300 h-8 px-3"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </button>
        </div>
        <div className="space-y-3">
          {diagnosis.map((d, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={d}
                onChange={(e) => updateDiagnosis(index, e.target.value)}
                placeholder="Enter diagnosis"
                className="flex h-11 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {diagnosis.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDiagnosis(index)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-transparent hover:bg-gray-100 h-11 w-11 border border-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
            Treatment
          </label>
          <button
            type="button"
            onClick={addTreatment}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-200 text-gray-900 hover:bg-gray-300 h-8 px-3"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </button>
        </div>
        <div className="space-y-3">
          {treatment.map((t, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={t}
                onChange={(e) => updateTreatment(index, e.target.value)}
                placeholder="Enter treatment details"
                className="flex h-11 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {treatment.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTreatment(index)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-transparent hover:bg-gray-100 h-11 w-11 border border-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
            Medications
          </label>
          <button
            type="button"
            onClick={addMedication}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-200 text-gray-900 hover:bg-gray-300 h-8 px-3"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </button>
        </div>
        <div className="space-y-3">
          {medications.map((med, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  value={med.name}
                  onChange={(e) =>
                    updateMedication(index, "name", e.target.value)
                  }
                  placeholder="Medication name"
                  className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <input
                  value={med.dosage}
                  onChange={(e) =>
                    updateMedication(index, "dosage", e.target.value)
                  }
                  placeholder="Dosage (e.g., 10mg twice daily)"
                  className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              {medications.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-transparent hover:bg-gray-100 h-11 w-11 border border-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-sm">
          Use format "Name" and "Dosage" for each medication
        </p>
      </div>

      <div className="col-span-2 space-y-2">
        <label
          htmlFor="followUpDate"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          Follow-up Date
        </label>
        <input
          id="followUpDate"
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-white hover:bg-gray-800 h-11 px-4 py-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recording...
            </>
          ) : (
            "Record Consultation"
          )}
        </button>
      </div>
    </form>
  );
};

export default ConsultationForm;
