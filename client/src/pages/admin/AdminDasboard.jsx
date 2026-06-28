import { useMemo, useState } from "react";
import {
  Search,
  Users,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Flag,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import StatusBadge from "../../components/ui/StatusBadge";

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // ==========================================
  // Summary Statistics
  // ==========================================

  const stats = [
    {
      title: "Total Students",
      value: 142,
      icon: Users,
      bg: "bg-slate-50",
      border: "border-slate-200",
      iconColor: "text-slate-700",
    },
    {
      title: "Fully Cleared",
      value: 87,
      icon: CheckCircle2,
      bg: "bg-green-50",
      border: "border-green-200",
      iconColor: "text-green-600",
    },
    {
      title: "In Progress",
      value: 43,
      icon: Clock3,
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-600",
    },
    {
      title: "Blocked",
      value: 12,
      icon: AlertTriangle,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-600",
    },
  ];

  // ==========================================
  // Department Overview
  // ==========================================

  const departments = [
    {
      id: 1,
      department: "Head of Music",
      officer: "Peter Kariuki",
      total: 142,
      cleared: 138,
      pending: 3,
      flagged: 1,
      completion: 97,
    },
    {
      id: 2,
      department: "Head of Drama",
      officer: "Jane Wanjiku",
      total: 142,
      cleared: 136,
      pending: 5,
      flagged: 1,
      completion: 96,
    },
    {
      id: 3,
      department: "Head of Industrial Liaison (ILO)",
      officer: "James Kiptoo",
      total: 142,
      cleared: 112,
      pending: 24,
      flagged: 6,
      completion: 79,
    },
    {
      id: 4,
      department: "Head of Guidance & Counselling",
      officer: "Grace Njeri",
      total: 142,
      cleared: 103,
      pending: 30,
      flagged: 9,
      completion: 73,
    },
    {
      id: 5,
      department: "Head of Sports",
      officer: "Samuel Kibet",
      total: 142,
      cleared: 94,
      pending: 37,
      flagged: 11,
      completion: 66,
    },
    {
      id: 6,
      department: "Head of Library",
      officer: "Mary Atieno",
      total: 142,
      cleared: 88,
      pending: 41,
      flagged: 13,
      completion: 62,
    },
    {
      id: 7,
      department: "Housekeeper (Beddings)",
      officer: "Alice Chebet",
      total: 142,
      cleared: 82,
      pending: 45,
      flagged: 15,
      completion: 58,
    },
    {
      id: 8,
      department: "Stores Controller",
      officer: "Joseph Mwangi",
      total: 142,
      cleared: 77,
      pending: 48,
      flagged: 17,
      completion: 54,
    },
    {
      id: 9,
      department: "Storekeeper (Department)",
      officer: "David Kimani",
      total: 142,
      cleared: 70,
      pending: 50,
      flagged: 22,
      completion: 49,
    },
    {
      id: 10,
      department: "Head of Department (HOD)",
      officer: "Ann Wairimu",
      total: 142,
      cleared: 61,
      pending: 58,
      flagged: 23,
      completion: 43,
    },
    {
      id: 11,
      department: "Exams Officer",
      officer: "George Otieno",
      total: 142,
      cleared: 52,
      pending: 63,
      flagged: 27,
      completion: 37,
    },
    {
      id: 12,
      department: "Dean of Students",
      officer: "Emily Jepchirchir",
      total: 142,
      cleared: 45,
      pending: 70,
      flagged: 27,
      completion: 32,
    },
    {
      id: 13,
      department: "Fees Balance",
      officer: "Finance Office",
      total: 142,
      cleared: 39,
      pending: 72,
      flagged: 31,
      completion: 27,
    },
    {
      id: 14,
      department: "Registrar",
      officer: "Registrar Office",
      total: 142,
      cleared: 29,
      pending: 83,
      flagged: 30,
      completion: 20,
    },
  ];

  // ==========================================
  // Recent Activity
  // ==========================================

  const activities = [
    {
      id: 1,
      type: "cleared",
      icon: CheckCircle2,
      description:
        "Wanjiku Otieno cleared by Head of Library",
      time: "2 minutes ago",
    },
    {
      id: 2,
      type: "flagged",
      icon: Flag,
      description:
        "Brian Kamau flagged by Storekeeper",
      time: "10 minutes ago",
    },
    {
      id: 3,
      type: "pending",
      icon: Clock3,
      description:
        "Fatuma Hassan awaiting HOD approval",
      time: "25 minutes ago",
    },
    {
      id: 4,
      type: "cleared",
      icon: CheckCircle2,
      description:
        "David Ochieng cleared by Registrar",
      time: "45 minutes ago",
    },
    {
      id: 5,
      type: "flagged",
      icon: Flag,
      description:
        "Library fine added for Aisha Mohamed",
      time: "1 hour ago",
    },
    {
      id: 6,
      type: "pending",
      icon: Clock3,
      description:
        "Collins Mwangi pending Finance Office review",
      time: "2 hours ago",
    },
  ];

  // ==========================================
  // Student Search
  // ==========================================

  const students = [
    {
      id: 1,
      name: "Wanjiku Otieno",
      admissionNumber: "ADM/2024/087",
      course: "ICT",
      status: "pending",
    },
    {
      id: 2,
      name: "Brian Kamau",
      admissionNumber: "ADM/2024/041",
      course: "Business",
      status: "cleared",
    },
    {
      id: 3,
      name: "Aisha Mohamed",
      admissionNumber: "ADM/2024/112",
      course: "Engineering",
      status: "blocked",
    },
    {
      id: 4,
      name: "Collins Mwangi",
      admissionNumber: "ADM/2024/033",
      course: "ICT",
      status: "pending",
    },
    {
      id: 5,
      name: "Fatuma Hassan",
      admissionNumber: "ADM/2024/078",
      course: "Hospitality",
      status: "pending",
    },
    {
      id: 6,
      name: "David Ochieng",
      admissionNumber: "ADM/2024/055",
      course: "Engineering",
      status: "cleared",
    },
  ];

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;

    const query = searchTerm.toLowerCase();

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.admissionNumber.toLowerCase().includes(query)
    );
  }, [searchTerm]);
    const getProgressColor = (completion) => {
    if (completion > 70) return "bg-green-500";
    if (completion >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getActivityBorder = (type) => {
    switch (type) {
      case "cleared":
        return "border-green-500";
      case "flagged":
        return "border-red-500";
      default:
        return "border-amber-500";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar
        title="Admin Panel"
        subtitle="Rift Valley National Polytechnic"
      />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* =======================
            Summary Statistics
        ======================= */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className={`${card.bg} ${card.border} rounded-2xl border p-6 shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {card.title}
                    </p>

                    <h2 className="mt-3 text-4xl font-bold text-[#0D1B3E]">
                      {card.value}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <Icon
                      size={28}
                      className={card.iconColor}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* =======================
            Department Overview
        ======================= */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-bold text-[#0D1B3E]">
              Department Clearance Overview
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Officer
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Total
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Cleared
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Pending
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Flagged
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Completion
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {departments.map((department) => (
                  <tr
                    key={department.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-[#0D1B3E]">
                      {department.department}
                    </td>

                    <td className="px-6 py-4">
                      {department.officer}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {department.total}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {department.cleared}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {department.pending}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {department.flagged}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${getProgressColor(
                              department.completion
                            )}`}
                            style={{
                              width: `${department.completion}%`,
                            }}
                          />
                        </div>

                        <span className="w-12 text-right font-semibold">
                          {department.completion}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-3">
          {/* =======================
              Recent Activity
          ======================= */}
          <section className="rounded-2xl bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-xl font-bold text-[#0D1B3E]">
                Recent Activity
              </h2>
            </div>

            <div className="divide-y divide-gray-100">
              {activities.map((activity) => {
                const Icon = activity.icon;

                return (
                  <div
                    key={activity.id}
                    className={`border-l-4 ${getActivityBorder(
                      activity.type
                    )} px-5 py-4`}
                  >
                    <div className="flex gap-4">
                      <div className="mt-1">
                        <Icon
                          size={18}
                          className="text-[#0D1B3E]"
                        />
                      </div>

                      <div>
                        <p className="font-medium text-gray-800">
                          {activity.description}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* =======================
              Student Search
          ======================= */}
          <section className="xl:col-span-2 rounded-2xl bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-xl font-bold text-[#0D1B3E]">
                Student Search
              </h2>
            </div>

            <div className="p-6">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Search by student name or admission number..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 focus:border-[#0D1B3E] focus:outline-none"
                />
              </div>

              <div className="mt-6 space-y-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col gap-4 rounded-xl border border-gray-200 p-5 transition hover:shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-[#0D1B3E]">
                        {student.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {student.admissionNumber} •{" "}
                        {student.course}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <StatusBadge
                        status={student.status}
                      />

                      <button className="rounded-lg bg-[#0D1B3E] px-4 py-2 text-sm font-semibold text-[#C9A84C] transition hover:opacity-95">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}

                {filteredStudents.length === 0 && (
                  <div className="py-10 text-center text-gray-500">
                    No students found.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
                </div>
  );
};

export default AdminDashboard;