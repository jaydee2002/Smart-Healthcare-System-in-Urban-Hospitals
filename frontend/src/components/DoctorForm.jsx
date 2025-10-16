import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import {
  createDoctor,
  updateDoctor,
  getDoctorById,
} from "../services/doctorService.js";
import toast from "react-hot-toast";

const DoctorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();
  const [hospitals, setHospitals] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/hospitals")
      .then((res) => {
        if (res.data?.success) setHospitals(res.data.data);
      })
      .catch((err) => {
        toast.error("Failed to load hospitals");
      });

    if (id) {
      getDoctorById(id)
        .then((res) => {
          const doctor = res.data;
          Object.keys(doctor).forEach((key) => setValue(key, doctor[key]));
          setValue("hospitalId", doctor.hospital?._id);
        })
        .catch((err) => {
          toast.error("Failed to load doctor details");
        });
    } else {
      reset();
    }
  }, [id, setValue, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (id) {
        await updateDoctor(id, data);
        toast.success("Doctor updated");
      } else {
        await createDoctor(data);
        toast.success("Doctor created");
      }
      navigate("/admin/doctors");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving doctor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/admin/doctors");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          {...register("name", { required: "Name is required" })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="qualification"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Qualification
        </label>
        <input
          id="qualification"
          type="text"
          {...register("qualification", {
            required: "Qualification is required",
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        {errors.qualification && (
          <p className="mt-1 text-sm text-red-600">
            {errors.qualification.message}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="specialization"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Specialization
        </label>
        <input
          id="specialization"
          type="text"
          {...register("specialization", {
            required: "Specialization is required",
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        {errors.specialization && (
          <p className="mt-1 text-sm text-red-600">
            {errors.specialization.message}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="hospitalId"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Hospital
        </label>
        <select
          id="hospitalId"
          {...register("hospitalId", { required: "Hospital is required" })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">Select Hospital</option>
          {hospitals.map((h) => (
            <option key={h._id} value={h._id}>
              {h.name}
            </option>
          ))}
        </select>
        {errors.hospitalId && (
          <p className="mt-1 text-sm text-red-600">
            {errors.hospitalId.message}
          </p>
        )}
      </div>
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {submitting ? "Saving..." : id ? "Update Doctor" : "Create Doctor"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DoctorForm;
