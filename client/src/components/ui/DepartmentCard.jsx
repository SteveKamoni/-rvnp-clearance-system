// import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock3,
  XCircle,
  Building2,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

const STATUS_CONFIG = {
  cleared: {
    border: "border-l-green-500",
    icon: CheckCircle2,
    iconColor: "text-green-600",
  },
  deduction: {
    border: "border-l-amber-500",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
  },
  pending: {
    border: "border-l-gray-400",
    icon: Clock3,
    iconColor: "text-gray-500",
  },
  blocked: {
    border: "border-l-red-500",
    icon: XCircle,
    iconColor: "text-red-600",
  },
};

const DepartmentCard = ({
  department,
  onClick,
}) => {
  const config =
    STATUS_CONFIG[department.status] || STATUS_CONFIG.pending;

  const StatusIcon = config.icon;

  return (
    <button
      type="button"
      onClick={() => onClick?.(department)}
      className={`
        group
        w-full
        rounded-xl
        border
        border-gray-200
        ${config.border}
        border-l-4
        bg-white
        p-4
        text-left
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-1
        hover:shadow-lg
        focus:outline-none
        focus:ring-2
        focus:ring-[#0D1B3E]
        focus:ring-offset-2
      `}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-[#0D1B3E]/10">
          <Building2
            size={22}
            className="text-[#0D1B3E]"
          />
        </div>

        <StatusIcon
          size={20}
          className={config.iconColor}
        />
      </div>

      {/* Department Number */}
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Department {department.id}
      </p>

      {/* Department Name */}
      <h3 className="mt-1 line-clamp-2 min-h-[3.5rem] text-sm font-semibold text-[#0D1B3E]">
        {department.name}
      </h3>

      {/* Status */}
      <div className="mt-4 flex items-center justify-between">
        <StatusBadge status={department.status} />

        {department.status === "deduction" &&
          department.deduction > 0 && (
            <span className="text-xs font-semibold text-amber-700">
              KSh {department.deduction}
            </span>
          )}
      </div>
    </button>
  );
};

export default DepartmentCard;