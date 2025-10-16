// src/components/PatientRegistrationForm.jsx
import { useForm } from "react-hook-form";
import { registerPatient, updatePatient } from "../services/patientService.js";
import toast from "react-hot-toast";

const PatientRegistrationForm = ({ existingPatient, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: existingPatient
      ? {
          name: existingPatient.name,
          email: existingPatient.email,
          phone: existingPatient.phone,
          address: existingPatient.address,
        }
      : {},
  });

  const onFormSubmit = async (data) => {
    try {
      let result;
      if (existingPatient) {
        result = await updatePatient(existingPatient._id, data);
      } else {
        result = await registerPatient(data);
      }
      onSubmit(result.data);
      toast.success(existingPatient ? "Patient updated" : "Patient registered");
    } catch (error) {
      if (error.response?.status === 200) {
        // Duplicate
        toast.info("Patient exists; reviewing...");
        onSubmit(error.response.data.patient);
      } else {
        toast.error(error.response?.data?.message || "Error saving patient");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="p-4 max-w-md space-y-4"
    >
      <input
        type="text"
        placeholder="Name"
        {...register("name", { required: true })}
        className="w-full p-2 border rounded"
      />
      {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      <input
        type="email"
        placeholder="Email"
        {...register("email", { required: true })}
        className="w-full p-2 border rounded"
      />
      <input
        type="tel"
        placeholder="Phone"
        {...register("phone")}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Address"
        {...register("address")}
        className="w-full p-2 border rounded"
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded"
      >
        Save Patient
      </button>
    </form>
  );
};

export default PatientRegistrationForm;
