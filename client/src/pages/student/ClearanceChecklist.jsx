// import React from "react";
import DepartmentCard from "../../components/ui/DepartmentCard";

const ClearanceChecklist = ({
  departments = [],
  onDepartmentClick,
  title = "Clearance Checklist",
  showHeader = true,
}) => {
  return (
    <section className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#0D1B3E]">
              {title}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select a department to view clearance status, remarks and any
              deductions.
            </p>
          </div>

          <span className="rounded-full bg-[#0D1B3E] px-4 py-2 text-sm font-semibold text-[#C9A84C]">
            {departments.length} Departments
          </span>
        </div>
      )}

      <div
        className="
          grid
          gap-5
          grid-cols-[repeat(auto-fit,minmax(180px,1fr))]
        "
      >
        {departments.map((department) => (
          <DepartmentCard
            key={department.id}
            department={department}
            onClick={onDepartmentClick}
          />
        ))}
      </div>

      {departments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-[#0D1B3E]">
            No Departments Available
          </h3>

          <p className="mt-2 text-gray-500">
            Department clearance information will appear here once it has been
            loaded.
          </p>
        </div>
      )}
    </section>
  );
}

export default ClearanceChecklist;