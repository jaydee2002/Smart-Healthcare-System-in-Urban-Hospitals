import { useNavigate } from "react-router-dom";
import DoctorTable from "../../components/DoctorTable.jsx";
import { Outlet } from "react-router-dom";

const DoctorManagement = () => {
  const navigate = useNavigate();

  const handleEdit = (doctor) => {
    navigate(`/admin/doctors/${doctor._id}`);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left side - Doctor table */}
      <div className="w-2/3 border-r border-gray-200 bg-white overflow-y-auto">
        <DoctorTable onEdit={handleEdit} />
      </div>

      {/* Right side - Outlet for form / availability */}
      <div className="w-1/3 overflow-y-auto p-6 min-h-0 bg-white">
        <Outlet />
      </div>
    </div>
  );
};

export default DoctorManagement;
