import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerPatient, updatePatient } from "../services/patientService.js";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const PatientRegistrationForm = ({ existingPatient, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          dateOfBirth: existingPatient.dateOfBirth,
          bloodType: existingPatient.bloodType,
          allergies: Array.isArray(existingPatient.allergies)
            ? existingPatient.allergies.join(", ")
            : existingPatient.allergies || "",
        }
      : {},
  });

  const onFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let result;
      if (existingPatient) {
        result = await updatePatient(existingPatient._id, data);
      } else {
        result = await registerPatient(data);
      }
      const savedPatient = result.data?.patient || result.data;
      onSubmit(savedPatient);
      toast.success(existingPatient ? "Patient updated" : "Patient registered");
    } catch (error) {
      if (error.response?.data?.patient) {
        toast.info("Patient exists; reviewing...");
        onSubmit(error.response.data.patient);
      } else {
        toast.error(error.response?.data?.message || "Error saving patient");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <label
            htmlFor="name"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            Full Name *
          </label>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            placeholder="john.doe@email.com"
            className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <label
            htmlFor="phone"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <label
            htmlFor="address"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            Address
          </label>
          <input
            id="address"
            type="text"
            placeholder="123 Main St, City, State"
            className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("address")}
          />
          {errors.address && (
            <p className="text-sm text-red-500">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="dateOfBirth"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            type="date"
            className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("dateOfBirth")}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="bloodType"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            Blood Type
          </label>
          <input
            id="bloodType"
            type="text"
            placeholder="A+"
            className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("bloodType")}
          />
          {errors.bloodType && (
            <p className="text-sm text-red-500">{errors.bloodType.message}</p>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <label
            htmlFor="allergies"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            Known Allergies
          </label>
          <input
            id="allergies"
            type="text"
            placeholder="Penicillin, Peanuts (comma-separated, leave blank if none)"
            className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("allergies")}
          />
          <p className="text-gray-500 text-sm">
            Separate multiple allergies with commas; leave blank for no known
            allergies
          </p>
          {errors.allergies && (
            <p className="text-sm text-red-500">{errors.allergies.message}</p>
          )}
        </div>
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
              {existingPatient ? "Updating..." : "Registering..."}
            </>
          ) : existingPatient ? (
            "Update Patient"
          ) : (
            "Register Patient"
          )}
        </button>
      </div>
    </form>
  );
};

export default PatientRegistrationForm;
