// import React from "react";
import { User, GraduationCap, Building2, CreditCard } from "lucide-react";
import ProgressRing from "../../components/ui/ProgressRing";
import StatusBadge from "../../components/ui/StatusBadge";

const StudentInfoCard = ({ student }) => {
  const {
    name,
    admissionNumber,
    course,
    department,
    idNumber,
    clearancePercentage,
    status,
    clearedCount,
    deductionCount,
    pendingCount,
  } = student;

  return (
    <section className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        {/* Progress Ring */}
        <div className="flex items-center justify-center">
          <ProgressRing
            percentage={clearancePercentage}
            size={170}
            strokeWidth={12}
            label="Cleared"
          />
        </div>

        {/* Student Information */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#0D1B3E]">
                {name}
              </h2>

              <p className="mt-1 text-gray-500">
                Student Clearance Information
              </p>
            </div>

            <StatusBadge
              status={status}
              className="self-start"
            />
          </div>

          {/* Student Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoItem
              icon={<GraduationCap size={18} />}
              label="Admission Number"
              value={admissionNumber}
            />

            <InfoItem
              icon={<Building2 size={18} />}
              label="Department"
              value={department}
            />

            <InfoItem
              icon={<User size={18} />}
              label="Course"
              value={course}
            />

            <InfoItem
              icon={<CreditCard size={18} />}
              label="National ID"
              value={idNumber}
            />
          </div>

          {/* Clearance Summary */}
          <div className="flex flex-wrap gap-3 pt-2">
            <SummaryBadge
              label="Cleared"
              value={clearedCount}
              color="bg-green-100 text-green-700 border-green-200"
            />

            <SummaryBadge
              label="Deductions"
              value={deductionCount}
              color="bg-amber-100 text-amber-700 border-amber-200"
            />

            <SummaryBadge
              label="Pending"
              value={pendingCount}
              color="bg-gray-100 text-gray-700 border-gray-200"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <div className="mb-2 flex items-center gap-2 text-[#0D1B3E]">
      {icon}
      <span className="text-sm font-semibold">
        {label}
      </span>
    </div>

    <p className="font-medium text-gray-700">
      {value}
    </p>
  </div>
);

const SummaryBadge = ({
  label,
  value,
  color,
}) => (
  <div
    className={`rounded-full border px-4 py-2 ${color}`}
  >
    <span className="font-semibold">
      {label}: {value}
    </span>
  </div>
);

export default StudentInfoCard;