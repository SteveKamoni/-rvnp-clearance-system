// client/src/pages/student/StudentDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareText,
  SendHorizonal,
  XCircle,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import TabNav from "../../components/layout/TabNav";

import StudentInfoCard from "./StudentInfoCard";
import SummaryStats from "./SummaryStats";

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingDepartment, setProcessingDepartment] = useState(null);
  const [departmentErrors, setDepartmentErrors] = useState({});
  const [responseDrafts, setResponseDrafts] = useState({});

  const [student, setStudent] = useState({
    fullName: "",
    admNo: "",
    course: "",
    department: "",
    nationalId: "",
    parentGuardianName: "",
    permanentAddress: "",
    phone1: "",
    phone2: "",
    dateOfCompletion: "",
    overallStatus: "pending",
    totalDeductions: 0,
  });

  const [departments, setDepartments] = useState([]);

  const loadClearance = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");
      setDepartmentErrors({});

      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        "http://localhost:5000/api/clearance/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const clearance = data.clearance || data;

      setStudent({
        fullName: clearance.student?.fullName || "",
        admNo: clearance.student?.admNo || "",
        course: clearance.student?.course || "",
        department: clearance.student?.department || "",
        nationalId: clearance.student?.nationalId || "",
        parentGuardianName: clearance.student?.parentGuardianName || "",
        permanentAddress: clearance.student?.permanentAddress || "",
        phone1: clearance.student?.phone1 || "",
        phone2: clearance.student?.phone2 || "",
        dateOfCompletion: clearance.student?.dateOfCompletion
          ? clearance.student.dateOfCompletion.substring(0, 10)
          : "",
        overallStatus: clearance.overallStatus || "pending",
        totalDeductions: clearance.totalDeductions || 0,
      });

      setDepartments(clearance.departments || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your clearance information."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadClearance();
  }, []);

  const cleared = departments.filter((d) => d.status === "cleared").length;
  const pending = departments.filter((d) => d.status === "pending").length;
  const requested = departments.filter((d) => d.status === "requested").length;
  const rejected = departments.filter((d) => d.status === "rejected").length;
  const summoned = departments.filter((d) => d.status === "summoned").length;
  const clearancePercentage = Math.round((cleared / 14) * 100);

  const studentData = useMemo(
    () => ({
      ...student,
      name: student.fullName,
      admissionNumber: student.admNo,
      idNumber: student.nationalId,
      guardianName: student.parentGuardianName,
      address: student.permanentAddress,
      completionDate: student.dateOfCompletion,
      clearancePercentage,
      clearedCount: cleared,
      deductionCount: student.totalDeductions,
      pendingCount: pending + requested + rejected + summoned,
      blockedCount: 0,
      status: student.overallStatus,
      totalDeductions: student.totalDeductions,
    }),
    [student, clearancePercentage, cleared, pending, requested, rejected, summoned]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setStudent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRequestClearance = async (sno) => {
    try {
      setProcessingDepartment(sno);
      setDepartmentErrors((prev) => ({ ...prev, [sno]: "" }));

      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/clearance/request/${sno}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadClearance(false);
    } catch (err) {
      setDepartmentErrors((prev) => ({
        ...prev,
        [sno]: err.response?.data?.message || "Unable to request clearance.",
      }));
    } finally {
      setProcessingDepartment(null);
    }
  };

  const handleSendResponse = async (sno) => {
    const response = (responseDrafts[sno] || "").trim();

    if (!response) {
      setDepartmentErrors((prev) => ({
        ...prev,
        [sno]: "Please enter a response before sending.",
      }));
      return;
    }

    try {
      setProcessingDepartment(sno);
      setDepartmentErrors((prev) => ({ ...prev, [sno]: "" }));

      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/clearance/respond/${sno}`,
        { response },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResponseDrafts((prev) => ({ ...prev, [sno]: "" }));
      await loadClearance(false);
    } catch (err) {
      setDepartmentErrors((prev) => ({
        ...prev,
        [sno]: err.response?.data?.message || "Unable to send your response.",
      }));
    } finally {
      setProcessingDepartment(null);
    }
  };

  const renderStatusCard = (department) => {
    const isBusy = processingDepartment === department.sno;
    const status = department.status || "pending";
    const borderClass =
      status === "requested"
        ? "border-l-blue-500"
        : status === "cleared"
        ? "border-l-green-500"
        : status === "rejected"
        ? "border-l-red-500"
        : status === "summoned"
        ? "border-l-amber-500"
        : "border-l-gray-400";

    const iconColor =
      status === "cleared"
        ? "text-green-600"
        : status === "rejected"
        ? "text-red-600"
        : status === "summoned"
        ? "text-amber-600"
        : status === "requested"
        ? "text-blue-600"
        : "text-gray-500";

    const badgeClass =
      status === "requested"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : status === "cleared"
        ? "bg-green-50 text-green-700 border-green-200"
        : status === "rejected"
        ? "bg-red-50 text-red-700 border-red-200"
        : status === "summoned"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-gray-100 text-gray-700 border-gray-200";

    return (
      <div
        key={department.sno}
        className={`rounded-xl border border-gray-200 ${borderClass} border-l-4 bg-white p-5 shadow-sm`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
            <Building2 size={20} className="text-[#0D1B3E]" />
          </div>

          <div className="flex items-center gap-2">
            {status === "cleared" ? (
              <CheckCircle2 size={20} className={iconColor} />
            ) : status === "rejected" ? (
              <XCircle size={20} className={iconColor} />
            ) : status === "summoned" ? (
              <AlertTriangle size={20} className={iconColor} />
            ) : status === "requested" ? (
              <Clock3 size={20} className={iconColor} />
            ) : (
              <Clock3 size={20} className={iconColor} />
            )}
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Department {department.sno}
        </p>
        <h3 className="mt-1 text-sm font-semibold text-[#0D1B3E]">
          {department.name}
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
            {status === "requested"
              ? "Awaiting Review"
              : status === "cleared"
              ? "Cleared"
              : status === "rejected"
              ? "Rejected"
              : status === "summoned"
              ? "Summoned"
              : "Pending"}
          </span>

          {Number(department.deductionAmount || 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              <Banknote size={12} /> KSh {Number(department.deductionAmount || 0).toLocaleString()}
            </span>
          )}
        </div>

        {status === "rejected" || status === "summoned" ? (
          <div className="mt-4 space-y-3">
            <div className={`rounded-lg border p-3 text-sm ${status === "rejected" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <MessageSquareText size={16} />
                {status === "rejected" ? "Officer reason" : "Officer reason"}
              </div>
              <p>{department.officerReason || "No reason provided."}</p>
            </div>

            {department.studentResponse ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <p className="mb-1 font-semibold text-gray-700">Your response</p>
                <p>{department.studentResponse}</p>
              </div>
            ) : (
              <>
                <textarea
                  rows={3}
                  value={responseDrafts[department.sno] || ""}
                  onChange={(e) =>
                    setResponseDrafts((prev) => ({
                      ...prev,
                      [department.sno]: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-[#0D1B3E] focus:outline-none"
                  placeholder="Enter your response"
                />
                <button
                  type="button"
                  onClick={() => handleSendResponse(department.sno)}
                  disabled={isBusy || Boolean(processingDepartment && processingDepartment !== department.sno)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D1B3E] px-4 py-2 text-sm font-semibold text-[#C9A84C] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBusy ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
                  {isBusy ? "Sending..." : "Send Response"}
                </button>
              </>
            )}
          </div>
        ) : null}

        {status === "pending" ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleRequestClearance(department.sno)}
              disabled={isBusy || Boolean(processingDepartment && processingDepartment !== department.sno)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D1B3E] px-4 py-2 text-sm font-semibold text-[#C9A84C] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Clock3 size={16} />}
              {isBusy ? "Requesting..." : "Request Clearance"}
            </button>
          </div>
        ) : null}

        {departmentErrors[department.sno] ? (
          <p className="mt-3 text-sm text-red-600">{departmentErrors[department.sno]}</p>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-300 border-t-[#0D1B3E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <h2 className="mb-2 text-xl font-bold text-red-600">Unable to Load Dashboard</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            type="button"
            onClick={() => loadClearance()}
            className="rounded-lg bg-[#0D1B3E] px-4 py-2 font-semibold text-[#C9A84C]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            <StudentInfoCard student={studentData} />

            <SummaryStats
              stats={{
                cleared,
                deductions: student.totalDeductions,
                pending: pending + requested + rejected + summoned,
                blocked: 0,
                totalDeductions: student.totalDeductions,
                overallStatus: student.overallStatus,
              }}
            />

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#0D1B3E]">Clearance Checklist</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a department to view clearance status, remarks and any deductions.
                  </p>
                </div>
                <span className="rounded-full bg-[#0D1B3E] px-4 py-2 text-sm font-semibold text-[#C9A84C]">
                  {departments.length} Departments
                </span>
              </div>

              <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                {departments.map((department) => renderStatusCard(department))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "departments" && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0D1B3E]">All Departments</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review each department and respond to any review requests from officers.
                </p>
              </div>
              <span className="rounded-full bg-[#0D1B3E] px-4 py-2 text-sm font-semibold text-[#C9A84C]">
                {departments.length} Departments
              </span>
            </div>

            <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
              {departments.map((department) => renderStatusCard(department))}
            </div>
          </section>
        )}

        {activeTab === "details" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#0D1B3E]">My Details</h2>
              <p className="mt-2 text-gray-500">
                Review and update your personal information before submitting your final clearance.
              </p>
            </div>

            <form className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Student Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={student.fullName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0D1B3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Admission Number</label>
                  <input
                    type="text"
                    name="admNo"
                    value={student.admNo}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0D1B3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={student.department}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0D1B3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Course</label>
                  <input
                    type="text"
                    name="course"
                    value={student.course}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0D1B3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">National ID Number</label>
                  <input
                    type="text"
                    name="nationalId"
                    value={student.nationalId}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0D1B3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Date of Completion</label>
                  <input
                    type="date"
                    name="dateOfCompletion"
                    value={student.dateOfCompletion}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0D1B3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Parent / Guardian Name</label>
                  <input
                    type="text"
                    name="parentGuardianName"
                    value={student.parentGuardianName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0D1B3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Permanent Address</label>
                  <input
                    type="text"
                    name="permanentAddress"
                    value={student.permanentAddress}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0D1B3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number 1</label>
                  <input
                    type="tel"
                    name="phone1"
                    value={student.phone1}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0D1B3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number 2</label>
                  <input
                    type="tel"
                    name="phone2"
                    value={student.phone2}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0D1B3E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-200 pt-6">
                <button
                  type="button"
                  className="rounded-lg bg-[#0D1B3E] px-8 py-3 font-semibold text-[#C9A84C] transition hover:opacity-95"
                >
                  Save Details
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;