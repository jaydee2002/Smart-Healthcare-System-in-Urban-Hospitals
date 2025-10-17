import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import {
  createDoctor,
  updateDoctor,
  getDoctorById,
} from "../services/doctorService.js";
import toast from "react-hot-toast";
import {
  User,
  Cake,
  GraduationCap,
  Stethoscope,
  DollarSign,
  Building2,
  Image,
  Upload,
} from "lucide-react";

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
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api
      .get("/hospitals")
      .then((res) => {
        if (res.data?.success) setHospitals(res.data.data);
      })
      .catch(() => toast.error("Failed to load hospitals"));

    if (id) {
      getDoctorById(id)
        .then((res) => {
          const doctor = res.data;
          Object.keys(doctor).forEach((key) => setValue(key, doctor[key]));
          setValue("hospitalId", doctor.hospital?._id);
          if (doctor.image) setImagePreview(doctor.image);
        })
        .catch(() => toast.error("Failed to load doctor details"));
    } else reset();
  }, [id, setValue, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key !== "image" || data.image?.[0]) formData.append(key, data[key]);
      });
      if (data.image?.[0]) formData.append("image", data.image[0]);

      if (id) {
        await updateDoctor(id, formData);
        toast.success("Doctor updated successfully!");
      } else {
        await createDoctor(formData);
        toast.success("Doctor created successfully!");
      }
      navigate("/admin/doctors");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving doctor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/admin/doctors");

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setImagePreview(URL.createObjectURL(file));
        setValue("image", [file]);
      } else {
        toast.error("Please upload a valid image file.");
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImagePreview(URL.createObjectURL(file));
      setValue("image", [file]);
    } else {
      toast.error("Please upload a valid image file.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-sm rounded-xl p-8 border border-gray-200 mt-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Enter doctor details
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete the form below to add a new healthcare professional to our
          system
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              Full Name
            </label>
            <input
              type="text"
              {...register("name", { required: "Name is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all text-sm"
              placeholder="Dr. Jane Doe"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Cake className="w-4 h-4 text-gray-400" />
              Age
            </label>
            <input
              type="number"
              {...register("age", {
                required: "Age is required",
                min: { value: 25, message: "Minimum age is 25" },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all text-sm"
              placeholder="35"
            />
            {errors.age && (
              <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
            )}
          </div>
        </div>

        {/* Qualification & Specialization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              Qualification
            </label>
            <input
              type="text"
              {...register("qualification", {
                required: "Qualification is required",
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all text-sm"
              placeholder="MBBS, MD"
            />
            {errors.qualification && (
              <p className="mt-1 text-sm text-red-600">
                {errors.qualification.message}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Stethoscope className="w-4 h-4 text-gray-400" />
              Specialization
            </label>
            <input
              type="text"
              {...register("specialization", {
                required: "Specialization is required",
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all text-sm"
              placeholder="Cardiology, Neurology..."
            />
            {errors.specialization && (
              <p className="mt-1 text-sm text-red-600">
                {errors.specialization.message}
              </p>
            )}
          </div>
        </div>

        {/* Rate & Hospital */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              Consultation Rate (LKR)
            </label>
            <input
              type="number"
              {...register("consultationRate", {
                required: "Consultation rate is required",
                min: { value: 1000, message: "Minimum rate is LKR 1000" },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all text-sm"
              placeholder="2500"
            />
            {errors.consultationRate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.consultationRate.message}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              Hospital
            </label>
            <select
              {...register("hospitalId", { required: "Hospital is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all text-sm"
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
        </div>

        {/* Image Upload with Drag & Drop */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Image className="w-4 h-4 text-gray-400" />
            Profile Image
          </label>
          <div
            className={`relative border-2 border-dashed rounded-md p-6 text-center transition-colors ${
              dragActive
                ? "border-gray-400 bg-gray-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              {...register("image")}
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                Drag & drop your image here, or click to select
              </p>
              <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
            </div>
            {imagePreview && (
              <div className="mt-4 p-2 bg-gray-50 rounded-md">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover mx-auto"
                />
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : id ? (
              "Update Doctor"
            ) : (
              "Create Doctor"
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorForm;
