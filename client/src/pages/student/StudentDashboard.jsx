// client/src/pages/student/StudentDashboard.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Bell,
  LogOut,
  X
} from "lucide-react";

import useAuthStore from "../../store/authStore";
import TabNav from "../../components/layout/TabNav";
import StudentInfoCard from "./StudentInfoCard";
import SummaryStats from "./SummaryStats";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

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

  // Notifications State & Refs
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  const [dismissedIds, setDismissedIds] = useState(() => {
    const saved = localStorage.getItem("dismissedNotifications");
    return saved ? JSON.parse(saved) : [];
  });

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

  // Derive notifications from departments array
  const notifications = useMemo(() => {
    const list = [];
    departments.forEach((dept) => {
      // 1. Rejected or summoned AND studentResponse is empty
      if (
        (dept.status === "rejected" || dept.status === "summoned") &&
        (!dept.studentResponse || !dept.studentResponse.trim())
      ) {
        const reason = dept.officerReason || "";
        const id = `${dept.sno}-${dept.status}-${reason}`;
        list.push({
          id,
          type: "action_needed",
          message: `${dept.name}: ${reason || "No explanation provided."}`,
          sno: dept.sno,
        });
      }
      // 2. Cleared AND clearedAt is within the last 24 hours
      if (dept.status === "cleared" && dept.clearedAt) {
        const clearedTime = new Date(dept.clearedAt).getTime();
        const now = new Date().getTime();
        if (now - clearedTime <= 24 * 60 * 60 * 1000) {
          const id = `${dept.sno}-${dept.status}-${dept.clearedAt}`;
          list.push({
            id,
            type: "cleared",
            message: `${dept.name} has cleared you`,
            sno: dept.sno,
          });
        }
      }
    });
    return list;
  }, [departments]);

  // Filter notifications to only show ones NOT in dismissedIds
  const visibleNotifications = useMemo(() => {
    return notifications.filter((n) => !dismissedIds.includes(n.id));
  }, [notifications, dismissedIds]);

  const dismissNotification = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem("dismissedNotifications", JSON.stringify(updated));
  };

  const clearAllNotifications = () => {
    const visibleIds = visibleNotifications.map((n) => n.id);
    const updated = [...dismissedIds, ...visibleIds];
    setDismissedIds(updated);
    localStorage.setItem("dismissedNotifications", JSON.stringify(updated));
  };

  // Clean up stale dismissedIds
  useEffect(() => {
    const currentIds = notifications.map((n) => n.id);
    const cleaned = dismissedIds.filter((id) => currentIds.includes(id));
    if (cleaned.length !== dismissedIds.length) {
      setDismissedIds(cleaned);
      localStorage.setItem("dismissedNotifications", JSON.stringify(cleaned));
    }
  }, [notifications]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

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

  const handleViewNotification = (id, sno) => {
    dismissNotification(id);
    setActiveTab("departments");
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/", { replace: true });
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
      {/* INLINE NAVBAR WITH NOTIFICATION DROPDOWN */}
      <header className="w-full bg-[#0D1B3E] text-white shadow-lg">
        <div className="mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#102552] border-2 border-[#C9A84C] shadow-md">
              <span className="text-lg font-bold tracking-wide text-[#C9A84C]">
                RV
              </span>
            </div>

            <div>
              <h1 className="text-lg font-semibold leading-tight">
                Clearance Portal
              </h1>

              <p className="text-sm text-slate-300">
                Rift Valley National Polytechnic
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                className="relative rounded-full p-2 transition hover:bg-[#173067]"
              >
                <Bell size={22} />

                {/* Notification Indicator dot badge with count */}
                {visibleNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-[#0D1B3E]">
                    {visibleNotifications.length}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white text-slate-900 shadow-2xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0D1B3E]">Notifications</span>
                    {visibleNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        className="text-xs font-bold text-[#C9A84C] hover:text-[#0D1B3E] transition"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {visibleNotifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-400">
                        No new notifications
                      </div>
                    ) : (
                      visibleNotifications.map((n, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-3 px-4 py-3 hover:bg-slate-50 transition border-l-4 relative group ${
                            n.type === "action_needed"
                              ? "border-l-red-500"
                              : "border-l-green-500"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === "action_needed" ? (
                              <AlertTriangle size={16} className="text-red-500" />
                            ) : (
                              <CheckCircle2 size={16} className="text-green-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-xs text-slate-700 leading-normal break-words">
                              {n.message}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleViewNotification(n.id, n.sno)}
                              className="mt-2 text-[10px] font-bold text-[#C9A84C] hover:text-[#0D1B3E] uppercase tracking-wider block text-left"
                            >
                              View
                            </button>
                          </div>
                          {/* Dismiss Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(n.id);
                            }}
                            className="absolute right-2 top-3 text-slate-400 hover:text-slate-600 p-1 rounded transition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-[#C9A84C] px-4 py-2 font-medium text-[#C9A84C] transition hover:bg-[#C9A84C] hover:text-[#0D1B3E]"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

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