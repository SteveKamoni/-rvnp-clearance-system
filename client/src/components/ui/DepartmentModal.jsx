// import React from "react";
import {
  X,
  Building2,
  Banknote,
  MessageSquareText,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

const DepartmentModal = ({
  isOpen,
  department,
  onClose,
}) => {
  if (!isOpen || !department) return null;

  const deduction =
    Number(department.deduction || 0).toLocaleString();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0D1B3E]">
              <Building2
                size={22}
                className="text-[#C9A84C]"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#0D1B3E]">
                {department.name}
              </h2>

              <p className="text-sm text-gray-500">
                Department #{department.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 px-6 py-6">
          {/* Status */}
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Clearance Status
            </p>

            <StatusBadge status={department.status} />
          </div>

          {/* Deduction */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <Banknote
                size={20}
                className="text-[#C9A84C]"
              />

              <div>
                <p className="text-sm text-gray-500">
                  Deduction Amount
                </p>

                <p className="text-lg font-bold text-[#0D1B3E]">
                  KSh {deduction}
                </p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquareText
                size={18}
                className="text-[#0D1B3E]"
              />

              <h3 className="font-semibold text-[#0D1B3E]">
                Officer Remarks
              </h3>
            </div>

            <p className="leading-relaxed text-gray-700">
              {department.remarks ||
                "No remarks have been provided by this department."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#0D1B3E] px-6 py-2 font-semibold text-[#C9A84C] transition hover:opacity-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentModal;