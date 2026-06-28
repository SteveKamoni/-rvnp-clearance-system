// import React from "react";

const STATUS_STYLES = {
  cleared: {
    label: "Cleared",
    className:
      "bg-green-100 text-green-800 border border-green-200",
  },
  deduction: {
    label: "Deduction",
    className:
      "bg-amber-100 text-amber-800 border border-amber-200",
  },
  pending: {
    label: "Pending",
    className:
      "bg-gray-100 text-gray-700 border border-gray-200",
  },
  blocked: {
    label: "Blocked",
    className:
      "bg-red-100 text-red-700 border border-red-200",
  },
};

const StatusBadge = ({
  status = "pending",
  className = "",
}) => {
  const badge =
    STATUS_STYLES[status.toLowerCase()] ??
    STATUS_STYLES.pending;

  return (
    <span
      className={`
        inline-flex items-center
        rounded-full
        px-3 py-1
        text-xs
        font-semibold
        tracking-wide
        whitespace-nowrap
        ${badge.className}
        ${className}
      `}
    >
      <span
        className={`mr-2 h-2 w-2 rounded-full ${
          status === "cleared"
            ? "bg-green-500"
            : status === "deduction"
            ? "bg-amber-500"
            : status === "blocked"
            ? "bg-red-500"
            : "bg-gray-400"
        }`}
      />

      {badge.label}
    </span>
  );
};

export default StatusBadge;