// src/components/ConsultationForm.jsx
import { useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { recordConsultation } from "../services/patientService.js";
import toast from "react-hot-toast";

const ConsultationForm = ({ patientId, onSubmit }) => {
  const { register, handleSubmit, setValue } = useForm();
  const [followUpDate, setFollowUpDate] = useState(null);

  const onFormSubmit = async (data) => {
    const fullData = {
      ...data,
      followUpDate: followUpDate?.toISOString().split("T")[0],
    };
    try {
      const result = await recordConsultation(patientId, fullData);
      onSubmit(result.data);
      toast.success("Consultation recorded");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error recording consultation"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="p-4 space-y-4">
      <input
        type="text"
        placeholder="Diagnosis"
        {...register("diagnosis")}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Treatment"
        {...register("treatment")}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Medications (e.g., Aspirin:100mg)"
        {...register("medications")}
        className="w-full p-2 border rounded"
      />
      <DatePicker
        selected={followUpDate}
        onChange={setFollowUpDate}
        placeholderText="Follow-up Date"
        className="w-full p-2 border rounded"
      />
      <button
        type="submit"
        className="w-full bg-green-600 text-white p-2 rounded"
      >
        Record Consultation
      </button>
    </form>
  );
};

export default ConsultationForm;
