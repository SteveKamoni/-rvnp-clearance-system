import { useMemo, useState, useEffect, useRef } from "react";
import {
  Search,
  Users,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Bell,
  MessageCircle
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // State requirements
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("queue"); // 'queue' | 'history'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [activeAction, setActiveAction] = useState(null); // 'cleared' | 'rejected' | 'summoned'
  const [reason, setReason] = useState("");
  const [deductionAmount, setDeductionAmount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Notifications State & Refs
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  const [dismissedIds, setDismissedIds] = useState(() => {
    const saved = localStorage.getItem("dismissedNotifications");
    return saved ? JSON.parse(saved) : [];
  });

  const fetchQueue = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:5000/api/clearance/queue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQueue(res.data.queue || res.data.clearances || []);
    } catch (err) {
      console.error("Error fetching queue:", err);
      throw err;
    }
  };

  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:5000/api/clearance/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data.history || []);
    } catch (err) {
      console.error("Error fetching history:", err);
      throw err;
    }
  };

  const fetchUserProfile = async () => {
    if (user && user.fullName) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.user) {
        useAuthStore.setState({ user: res.data.user });
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      throw err;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchUserProfile();
      await Promise.all([fetchQueue(), fetchHistory()]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // Mount effect
  useEffect(() => {
    loadData();

    // Auto-refresh queue every 30 seconds
    const interval = setInterval(() => {
      fetchQueue().catch((err) => console.error("Auto-refresh failed:", err));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Derive notifications from queue array
  const notifications = useMemo(() => {
    const list = [];
    const deptName = user?.department;
    if (!deptName) return list;

    queue.forEach((clearance) => {
      const dept = clearance.departments?.find((d) => d.name === deptName);
      if (dept && dept.status === "requested") {
        const studentId = clearance.student?._id || clearance.student || "";
        const sno = dept.sno;
        const requestedAt = dept.requestedAt || "";
        const id = `${studentId}-${sno}-requested-${requestedAt}`;

        if (dept.studentResponse && dept.studentResponse.trim()) {
          list.push({
            id,
            type: "response",
            message: `${clearance.student?.fullName || "A student"} responded to your decision`,
            studentName: clearance.student?.fullName || "",
            clearance,
          });
        } else {
          list.push({
            id,
            type: "request",
            message: `${clearance.student?.fullName || "A student"} requested clearance`,
            studentName: clearance.student?.fullName || "",
            clearance,
          });
        }
      }
    });
    return list;
  }, [queue, user?.department]);

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

  const handleOfficerAction = async (studentId, sno) => {
    if (
      (activeAction === "rejected" || activeAction === "summoned") &&
      !reason.trim()
    ) {
      setActionError("Reason is required");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      setActionLoading(true);
      setActionError("");
      await axios.patch(
        `http://localhost:5000/api/clearance/${studentId}/department/${sno}`,
        {
          action: activeAction,
          reason: activeAction === "cleared" ? "" : reason,
          deductionAmount:
            activeAction === "cleared" ? Number(deductionAmount) || 0 : 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage("Done");
      await Promise.all([fetchQueue(), fetchHistory()]);
      setTimeout(() => {
        setSelectedClearance(null);
        setActiveAction(null);
        setReason("");
        setDeductionAmount(0);
        setSuccessMessage("");
      }, 1500);
    } catch (err) {
      setActionError(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewNotification = (id, studentName) => {
    dismissNotification(id);
    setActiveTab("queue");
    setSearchTerm(studentName);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/");
  };

  // Filter lists
  const filteredQueue = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return queue;
    return queue.filter(
      (c) =>
        c.student?.fullName?.toLowerCase().includes(term) ||
        c.student?.admNo?.toLowerCase().includes(term)
    );
  }, [queue, searchTerm]);

  const filteredHistory = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return history;
    return history.filter(
      (c) =>
        c.student?.fullName?.toLowerCase().includes(term) ||
        c.student?.admNo?.toLowerCase().includes(term)
    );
  }, [history, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    const dept = user?.department;
    return {
      inQueue: queue.length,
      pendingReview: queue.filter((c) =>
        c.departments?.some((d) => d.status === "requested" && d.name === dept)
      ).length,
      clearedTotal: history.filter((c) =>
        c.departments?.some((d) => d.status === "cleared" && d.name === dept)
      ).length,
      flaggedTotal: history.filter((c) =>
        c.departments?.some(
          (d) =>
            ["rejected", "summoned"].includes(d.status) && d.name === dept
        )
      ).length,
    };
  }, [queue, history, user?.department]);

  // Helpers
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getInitials = (name) => {
    return (name || "Student")
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const renderBadge = (status) => {
    let classes = "";
    let label = "";
    if (status === "requested" || status === "pending") {
      classes = "bg-blue-50 text-blue-700 border-blue-200";
      label = "Requested";
    } else if (status === "cleared") {
      classes = "bg-green-50 text-green-700 border-green-200";
      label = "Cleared";
    } else if (status === "rejected") {
      classes = "bg-red-50 text-red-700 border-red-200";
      label = "Rejected";
    } else if (status === "summoned") {
      classes = "bg-amber-50 text-amber-700 border-amber-200";
      label = "Summoned";
    }
    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${classes}`}
      >
        {label}
      </span>
    );
  };

  // Loading state render
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#0D1B3E]" />
          <p className="text-sm font-semibold text-[#0D1B3E]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state render
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-md border border-slate-100">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
          <h2 className="mb-2 text-xl font-bold text-slate-800">Unable to Load Dashboard</h2>
          <p className="mb-6 text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="w-full rounded-xl bg-[#0D1B3E] px-4 py-3 font-semibold text-[#C9A84C] hover:opacity-90 transition shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* 1. NAVBAR WITH NOTIFICATION BELL AND DROPDOWN */}
      <nav className="bg-[#0D1B3E] text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0D1B3E] border-2 border-[#C9A84C] flex items-center justify-center font-bold text-[#C9A84C] text-lg">
              RV
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">
                Clearance Portal
              </h1>
              <span className="text-xs text-[#C9A84C] font-semibold">
                {user?.department || "Officer"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-200">
              {user?.fullName || "Officer Name"}
            </span>

            {/* Notification Bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                className="relative rounded-full p-2 transition hover:bg-[#173067]"
              >
                <Bell size={22} className="text-white" />

                {/* Dot badge with count */}
                {visibleNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-[#0D1B3E]">
                    {visibleNotifications.length}
                  </span>
                )}
              </button>

              {/* Dropdown Panel */}
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
                          className="flex gap-3 px-4 py-3 hover:bg-slate-50 transition border-l-4 border-l-blue-500 relative group"
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === "response" ? (
                              <MessageCircle size={16} className="text-[#0D1B3E]" />
                            ) : (
                              <CheckCircle2 size={16} className="text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-xs text-slate-700 leading-normal break-words">
                              {n.message}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleViewNotification(n.id, n.studentName)}
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
              onClick={handleLogout}
              className="px-3.5 py-1.5 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0D1B3E] transition rounded-lg text-sm font-semibold"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {/* Welcome & Profile Section */}
        <div className="bg-white border border-slate-200/65 rounded-2xl p-6 shadow-sm mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-[#0D1B3E] flex items-center justify-center font-bold text-xl text-[#C9A84C] shadow-sm">
              {getInitials(user?.fullName)}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Logged In HOD / Officer</p>
              <h2 className="text-xl font-bold text-[#0D1B3E] mt-1 leading-tight">
                {user?.fullName || "Officer Name"}
              </h2>
              <p className="text-sm font-semibold text-[#C9A84C] mt-0.5">
                {user?.department || "Department Head"}
              </p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-right">
            <span className="text-xs font-bold text-[#0D1B3E] block">RVNP Clearance System</span>
            <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">Department Head Portal</span>
          </div>
        </div>

        {/* 2. STATS ROW */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">In Queue</p>
              <h3 className="text-3xl font-bold text-blue-900 mt-1">
                {stats.inQueue}
              </h3>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Pending Review</p>
              <h3 className="text-3xl font-bold text-amber-900 mt-1">
                {stats.pendingReview}
              </h3>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Clock3 className="h-6 w-6 text-amber-600" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Cleared</p>
              <h3 className="text-3xl font-bold text-green-900 mt-1">
                {stats.clearedTotal}
              </h3>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Total Flagged</p>
              <h3 className="text-3xl font-bold text-red-900 mt-1">
                {stats.flaggedTotal}
              </h3>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* 3. TAB NAVIGATION */}
        <div className="flex gap-2 border-b border-slate-200 mt-10">
          <button
            onClick={() => {
              setActiveTab("queue");
              setSearchTerm("");
            }}
            className={`px-6 py-3.5 rounded-t-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "queue"
                ? "bg-[#0D1B3E] text-[#C9A84C] shadow-sm"
                : "bg-white text-slate-500 hover:text-slate-800 border-t border-x border-transparent hover:border-slate-200"
            }`}
          >
            Request Queue ({stats.inQueue})
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setSearchTerm("");
            }}
            className={`px-6 py-3.5 rounded-t-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "history"
                ? "bg-[#0D1B3E] text-[#C9A84C] shadow-sm"
                : "bg-white text-slate-500 hover:text-slate-800 border-t border-x border-transparent hover:border-slate-200"
            }`}
          >
            Clearance History ({history.length})
          </button>
        </div>

        {/* 4. SEARCH BAR */}
        <div className="relative mt-6 max-w-md shadow-sm rounded-lg">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D1B3E] focus:border-[#0D1B3E] bg-white text-slate-900 placeholder-slate-400 text-sm"
            placeholder={
              activeTab === "queue"
                ? "Search queue by name or admission number..."
                : "Search history by name or admission number..."
            }
          />
        </div>

        {/* 5. QUEUE TAB CONTENT */}
        {activeTab === "queue" && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {filteredQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Clock3 className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-base font-semibold text-slate-700">
                  No pending requests
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  All student clearance requests have been processed.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredQueue.map((item) => {
                  const deptInfo = item.departments?.find(
                    (d) => d.name === user?.department
                  );
                  return (
                    <div
                      key={item._id}
                      className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-[#0D1B3E] border border-[#C9A84C] flex items-center justify-center font-bold text-[#C9A84C]">
                          {getInitials(item.student?.fullName)}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#0D1B3E] text-base">
                            {item.student?.fullName || "N/A"}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {item.student?.admNo || "N/A"} •{" "}
                            {item.student?.course || "N/A"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 font-medium">
                            Requested {formatTimeAgo(deptInfo?.requestedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {renderBadge(deptInfo?.status || "requested")}
                        <button
                          onClick={() => {
                            setSelectedClearance(item);
                            setActiveAction(null);
                          }}
                          className="px-5 py-2 bg-[#0D1B3E] text-[#C9A84C] font-bold text-sm rounded-lg hover:opacity-95 shadow-sm transition"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. HISTORY TAB CONTENT */}
        {activeTab === "history" && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <CheckCircle2 className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-base font-semibold text-slate-700">
                  No actions taken yet
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Students cleared or flagged by you will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredHistory.map((item) => {
                  const deptInfo = item.departments?.find(
                    (d) => d.name === user?.department
                  );
                  return (
                    <div key={item._id} className="p-6 hover:bg-slate-50 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-[#0D1B3E] border border-[#C9A84C] flex items-center justify-center font-bold text-[#C9A84C]">
                            {getInitials(item.student?.fullName)}
                          </div>
                          <div>
                            <h4 className="font-bold text-[#0D1B3E] text-base">
                              {item.student?.fullName || "N/A"}
                            </h4>
                            <p className="text-sm text-slate-500">
                              {item.student?.admNo || "N/A"} •{" "}
                              {item.student?.course || "N/A"}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 font-medium">
                              Updated on {formatDateTime(deptInfo?.statusUpdatedAt || deptInfo?.clearedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="self-end sm:self-center">
                          {renderBadge(deptInfo?.status)}
                        </div>
                      </div>

                      {/* Reasons or Student Response in History */}
                      {["rejected", "summoned"].includes(deptInfo?.status) &&
                        deptInfo?.officerReason && (
                          <div className="mt-3 ml-16 bg-slate-50 rounded-lg p-3 text-sm border border-slate-100">
                            <span className="font-semibold text-slate-600 block text-xs mb-1">
                              Action Reason:
                            </span>
                            <p className="text-slate-700">{deptInfo.officerReason}</p>
                          </div>
                        )}

                      {deptInfo?.studentResponse && (
                        <div className="mt-3 ml-16 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-900 italic">
                          <span className="font-semibold not-italic block text-xs text-blue-600 mb-1">
                            Student Response:
                          </span>
                          "{deptInfo.studentResponse}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 7. ACTION MODAL */}
      {selectedClearance && (() => {
        const requestedDept = selectedClearance.departments?.find(
          (d) => d.name === user?.department
        );
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-[#0D1B3E] text-white">
                <div>
                  <h3 className="text-lg font-bold">
                    {selectedClearance.student?.fullName || "Student Info"}
                  </h3>
                  <p className="text-xs text-[#C9A84C] font-semibold mt-0.5">
                    {selectedClearance.student?.admNo}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedClearance(null);
                    setActiveAction(null);
                    setReason("");
                    setActionError("");
                    setSuccessMessage("");
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 max-h-[75vh]">
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm font-semibold shadow-sm">
                    {successMessage}
                  </div>
                )}
                {actionError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-semibold shadow-sm">
                    {actionError}
                  </div>
                )}

                {/* Details */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 grid grid-cols-2 gap-4 text-sm text-slate-700">
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Course</span>
                    <span className="font-semibold text-slate-800">
                      {selectedClearance.student?.course || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Academic Dept</span>
                    <span className="font-semibold text-slate-800">
                      {selectedClearance.student?.department || "N/A"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-400 block font-semibold">Phone</span>
                    <span className="font-semibold text-slate-800">
                      {selectedClearance.student?.phone1 || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Student Response */}
                {requestedDept?.studentResponse && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-blue-900 text-sm italic">
                    <p className="text-xs font-bold text-blue-700 mb-1 not-italic">
                      Student's Response:
                    </p>
                    "{requestedDept.studentResponse}"
                  </div>
                )}

                {/* Previous Reason */}
                {requestedDept?.officerReason && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-900 text-sm">
                    <p className="text-xs font-bold text-amber-700 mb-1">
                      Previous Reason:
                    </p>
                    {requestedDept.officerReason}
                  </div>
                )}

                {/* Three action buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction("cleared");
                      setActionError("");
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition duration-150 ${
                      activeAction === "cleared"
                        ? "bg-green-600 border-green-600 text-white shadow-sm"
                        : "border-green-600 text-green-600 hover:bg-green-50"
                    }`}
                  >
                    APPROVE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction("rejected");
                      setActionError("");
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition duration-150 ${
                      activeAction === "rejected"
                        ? "bg-red-600 border-red-600 text-white shadow-sm"
                        : "border-red-600 text-red-600 hover:bg-red-50"
                    }`}
                  >
                    REJECT
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction("summoned");
                      setActionError("");
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition duration-150 ${
                      activeAction === "summoned"
                        ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                        : "border-amber-500 text-amber-500 hover:bg-amber-50"
                    }`}
                  >
                    SUMMON
                  </button>
                </div>

                {/* Approve Active Section */}
                {activeAction === "cleared" && (
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-slate-700">
                      Deduction Amount (KSh)
                    </label>
                    <input
                      type="number"
                      value={deductionAmount}
                      onChange={(e) => setDeductionAmount(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0D1B3E] focus:border-[#0D1B3E] focus:outline-none"
                      placeholder="0"
                    />
                    <p className="text-xs text-slate-400 font-medium">
                      Leave 0 if no deductions
                    </p>
                  </div>
                )}

                {/* Reject Active Section */}
                {activeAction === "rejected" && (
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-slate-700">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0D1B3E] focus:border-[#0D1B3E] focus:outline-none"
                      placeholder="Explain clearly why this student cannot be cleared..."
                    />
                  </div>
                )}

                {/* Summon Active Section */}
                {activeAction === "summoned" && (
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-slate-700">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0D1B3E] focus:border-[#0D1B3E] focus:outline-none"
                      placeholder="Explain why they must appear and what to bring..."
                    />
                  </div>
                )}

                {/* Confirm Action Button */}
                {activeAction && (
                  <button
                    onClick={() => {
                      if (requestedDept) {
                        handleOfficerAction(
                          selectedClearance.student?._id,
                          requestedDept.sno
                        );
                      } else {
                        setActionError("No active request department found.");
                      }
                    }}
                    disabled={actionLoading}
                    className="w-full mt-4 py-3 rounded-xl bg-[#0D1B3E] text-[#C9A84C] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-65 transition shadow-sm"
                  >
                    {actionLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-[#C9A84C]" />
                    )}
                    Confirm{" "}
                    {activeAction === "cleared"
                      ? "Approval"
                      : activeAction === "rejected"
                      ? "Rejection"
                      : "Summon"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default OfficerDashboard;
