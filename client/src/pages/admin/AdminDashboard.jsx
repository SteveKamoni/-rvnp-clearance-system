import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  X,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Clock3,
  Check,
  TrendingDown,
  Building,
  DollarSign
} from "lucide-react";
import useAuthStore from "../../store/authStore";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  // Core States
  const [stats, setStats] = useState(null);
  const [clearances, setClearances] = useState([]);
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'students' | 'departments'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Admin Override States
  const [overrideModal, setOverrideModal] = useState(null); // holds { studentId, sno, deptName }
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState("");
  const [overrideSuccess, setOverrideSuccess] = useState("");

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:5000/api/clearance/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
      return res.data;
    } catch (err) {
      console.error("Error fetching stats:", err);
      throw err;
    }
  };

  const fetchAllClearances = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:5000/api/clearance/all?limit=10000", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.clearances || [];
      setClearances(data);
      return data;
    } catch (err) {
      console.error("Error fetching clearances:", err);
      throw err;
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchStats(), fetchAllClearances()]);
      } catch (err) {
        console.error("Mount error:", err);
        setError("Failed to fetch clearance data. Please check server connection.");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStats(), fetchAllClearances()]);
    } catch (err) {
      console.error("Retry error:", err);
      setError("Failed to fetch clearance data. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminOverrideSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!overrideReason.trim()) {
      setOverrideError("Reason is required.");
      return;
    }

    setOverrideLoading(true);
    setOverrideError("");
    setOverrideSuccess("");

    try {
      const token = localStorage.getItem("token");
      const { studentId, sno } = overrideModal;

      const res = await axios.patch(
        `http://localhost:5000/api/clearance/admin/override/${studentId}/department/${sno}`,
        { reason: overrideReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setOverrideSuccess("Department cleared successfully");
        
        // Refetch data
        await fetchStats();
        const updatedClearances = await fetchAllClearances();

        // Update selected clearance detail modal
        if (updatedClearances) {
          const updatedSel = updatedClearances.find(
            (c) => (c.student?._id || c.student) === studentId
          );
          if (updatedSel) {
            setSelectedClearance(updatedSel);
          }
        }

        setTimeout(() => {
          setOverrideModal(null);
          setOverrideReason("");
          setOverrideSuccess("");
          setOverrideError("");
        }, 1500);
      }
    } catch (err) {
      console.error("Admin override error:", err);
      setOverrideError(
        err.response?.data?.message || "Failed to override department status."
      );
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/");
  };

  // Local filtering (student name or admission number, statusFilter)
  const filteredClearances = useMemo(() => {
    return clearances.filter((clearance) => {
      const student = clearance.student || {};
      const fullName = (student.fullName || "").toLowerCase();
      const admNo = (student.admNo || "").toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch = fullName.includes(query) || admNo.includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        clearance.overallStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clearances, searchTerm, statusFilter]);

  // UI Helpers
  const getStatusBadge = (status) => {
    const styles = {
      cleared: "bg-green-100 text-green-800 border-green-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      pending: "bg-gray-100 text-gray-800 border-gray-200",
      summoned: "bg-amber-100 text-amber-800 border-amber-200",
      blocked: "bg-red-100 text-red-800 border-red-200",
    };
    const labels = {
      cleared: "Cleared",
      in_progress: "In Progress",
      pending: "Pending",
      summoned: "Summoned",
      blocked: "Blocked",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getOfficerForDept = (deptName) => {
    for (const clearance of clearances) {
      const dept = clearance.departments?.find((d) => d.name === deptName);
      if (dept && dept.officerId && dept.officerId.fullName) {
        return dept.officerId.fullName;
      }
    }
    return "Not assigned";
  };

  // Completion Progress Bar Color Logic
  const getProgressBarColor = (rate) => {
    if (rate > 70) return "bg-green-500";
    if (rate >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  // Border logic for cards
  const getCardBorder = (rate) => {
    if (rate > 70) return "border-green-500";
    if (rate >= 40) return "border-amber-500";
    return "border-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B3E] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-16 h-16 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#C9A84C] font-semibold tracking-wider animate-pulse">
          Loading RVNP Admin Panel...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1B3E] flex flex-col items-center justify-center p-6 text-center text-white">
        <AlertTriangle size={64} className="text-red-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">System Connection Error</h2>
        <p className="text-gray-300 max-w-md mb-6">{error}</p>
        <button
          onClick={handleRetry}
          className="bg-[#C9A84C] text-[#0D1B3E] font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
        >
          <RefreshCw size={18} />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. NAVBAR */}
      <nav className="bg-[#0D1B3E] border-b border-[#C9A84C]/20 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C9A84C] flex items-center justify-center font-bold text-[#0D1B3E] text-lg shadow-md">
            RV
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Admin Panel</h1>
            <p className="text-[#C9A84C] text-xs font-semibold uppercase tracking-wider">Rift Valley National Polytechnic</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/90 text-sm font-medium">
            Dr. <span className="font-semibold text-white">{user?.fullName || "Administrator"}</span>
          </span>
          <button
            onClick={handleLogout}
            className="border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0D1B3E] px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* 2. TAB NAVIGATION */}
      <div className="bg-[#0D1B3E] px-6 border-t border-[#C9A84C]/10 shadow-lg">
        <div className="max-w-7xl mx-auto flex gap-6">
          {[
            { id: "overview", label: "Overview" },
            { id: "students", label: "Students" },
            { id: "departments", label: "Departments" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-[#C9A84C] text-[#C9A84C]"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* ========================================================= */}
        {/* OVERVIEW TAB */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            {/* A. STATS ROW (6 cards) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Card 1: Total Students */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Students</span>
                  <div className="bg-slate-100 p-1.5 rounded-lg text-slate-700">
                    <Users size={16} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#0D1B3E] mt-3">{stats?.totalStudents || 0}</h3>
              </div>

              {/* Card 2: Fully Cleared */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-green-600 text-xs font-semibold uppercase tracking-wider">Fully Cleared</span>
                  <div className="bg-green-100/50 p-1.5 rounded-lg text-green-700">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#0D1B3E] mt-3">{stats?.fullyCleared || 0}</h3>
              </div>

              {/* Card 3: In Progress */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 text-xs font-semibold uppercase tracking-wider">In Progress</span>
                  <div className="bg-blue-100/50 p-1.5 rounded-lg text-blue-700">
                    <Clock3 size={16} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#0D1B3E] mt-3">{stats?.inProgress || 0}</h3>
              </div>

              {/* Card 4: Pending */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Pending</span>
                  <div className="bg-gray-200/50 p-1.5 rounded-lg text-gray-700">
                    <Clock size={16} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#0D1B3E] mt-3">{stats?.pending || 0}</h3>
              </div>

              {/* Card 5: Summoned */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-amber-600 text-xs font-semibold uppercase tracking-wider">Summoned</span>
                  <div className="bg-amber-100/50 p-1.5 rounded-lg text-amber-700">
                    <AlertTriangle size={16} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#0D1B3E] mt-3">{stats?.summoned || 0}</h3>
              </div>

              {/* Card 6: Total Deductions */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-red-600 text-xs font-semibold uppercase tracking-wider">Deductions</span>
                  <div className="bg-red-100/50 p-1.5 rounded-lg text-red-700">
                    <TrendingDown size={16} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#0D1B3E] mt-3 whitespace-nowrap">
                  KSh {(stats?.totalDeductions || 0).toLocaleString()}
                </h3>
              </div>
            </div>

            {/* B. RECENT STUDENTS TABLE & C. DEPARTMENT OVERVIEW TABLE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* RECENT STUDENTS TABLE (2/3 width) */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/55">
                  <h3 className="font-bold text-[#0D1B3E] text-base">Student Clearance Status</h3>
                  <button 
                    onClick={() => setActiveTab("students")} 
                    className="text-xs font-semibold text-[#C9A84C] hover:text-[#0D1B3E] flex items-center gap-1 transition"
                  >
                    View All Students <ChevronRight size={14} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <th className="p-4">Student</th>
                        <th className="p-4">Adm No</th>
                        <th className="p-4">Course</th>
                        <th className="p-4">Overall Status</th>
                        <th className="p-4">Progress</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clearances.slice(0, 5).map((clearance) => {
                        const std = clearance.student || {};
                        const clearedCount = clearance.departments?.filter(d => d.status === "cleared").length || 0;
                        const pct = Math.round((clearedCount / 14) * 100);

                        return (
                          <tr key={clearance._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-4 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#0D1B3E] text-[#C9A84C] flex items-center justify-center font-bold text-xs">
                                {getInitials(std.fullName)}
                              </div>
                              <span className="font-medium text-slate-800">{std.fullName || "Unknown"}</span>
                            </td>
                            <td className="p-4 text-slate-600">{std.admNo || "N/A"}</td>
                            <td className="p-4 text-slate-600">{std.course || "N/A"}</td>
                            <td className="p-4">{getStatusBadge(clearance.overallStatus)}</td>
                            <td className="p-4">
                              <div className="w-24">
                                <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mb-1">
                                  <span>{clearedCount}/14</span>
                                  <span>{pct}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#C9A84C] rounded-full" 
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setSelectedClearance(clearance)}
                                className="bg-slate-100 hover:bg-[#0D1B3E] hover:text-white px-3 py-1 rounded text-xs font-semibold text-[#0D1B3E] transition"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {clearances.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400">
                            No students clearance records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DEPARTMENT OVERVIEW TABLE (1/3 width) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/55">
                  <h3 className="font-bold text-[#0D1B3E] text-base">Department Clearance Rates</h3>
                </div>
                <div className="p-4 space-y-4 max-h-[350px] overflow-y-auto">
                  {stats?.departmentStats?.map((dept, index) => (
                    <div key={dept.sno} className="flex flex-col gap-1 text-xs">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span className="truncate max-w-[200px]">{dept.sno}. {dept.name}</span>
                        <span>{dept.completionRate}%</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Cleared: {dept.cleared}</span>
                        <span>Pending/Req: {dept.pending + dept.requested}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getProgressBarColor(dept.completionRate)}`}
                          style={{ width: `${dept.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {(!stats || !stats.departmentStats) && (
                    <p className="text-center text-slate-400 text-sm py-4">No department statistics available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STUDENTS TAB */}
        {/* ========================================================= */}
        {activeTab === "students" && (
          <div className="space-y-6 animate-fadeIn">
            {/* A. SEARCH + FILTER BAR */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C]"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="cleared">Cleared</option>
                  <option value="summoned">Summoned</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            {/* B. FULL STUDENTS TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="p-4">Student</th>
                      <th className="p-4">Adm No</th>
                      <th className="p-4">Course</th>
                      <th className="p-4">Dept</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Progress</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClearances.map((clearance) => {
                      const std = clearance.student || {};
                      const clearedCount = clearance.departments?.filter(d => d.status === "cleared").length || 0;
                      const pct = Math.round((clearedCount / 14) * 100);

                      return (
                        <tr key={clearance._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0D1B3E] text-[#C9A84C] flex items-center justify-center font-bold text-xs">
                              {getInitials(std.fullName)}
                            </div>
                            <span className="font-medium text-slate-800">{std.fullName || "Unknown"}</span>
                          </td>
                          <td className="p-4 text-slate-600">{std.admNo || "N/A"}</td>
                          <td className="p-4 text-slate-600">{std.course || "N/A"}</td>
                          <td className="p-4 text-slate-600">{std.department || "N/A"}</td>
                          <td className="p-4">{getStatusBadge(clearance.overallStatus)}</td>
                          <td className="p-4">
                            <div className="w-28">
                              <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mb-1">
                                <span>{clearedCount}/14</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#C9A84C] rounded-full" 
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedClearance(clearance)}
                              className="bg-[#0D1B3E] text-[#C9A84C] hover:opacity-90 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredClearances.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400">
                          No students matched your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DEPARTMENTS TAB */}
        {/* ========================================================= */}
        {activeTab === "departments" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stats?.departmentStats?.map((dept) => {
                const officerName = getOfficerForDept(dept.name);
                const borderClass = getCardBorder(dept.completionRate);

                return (
                  <div 
                    key={dept.sno} 
                    className={`bg-white rounded-xl shadow-sm border-t-4 ${borderClass} p-5 flex flex-col justify-between gap-4 border border-slate-100 hover:shadow-md transition-shadow`}
                  >
                    <div>
                      <h3 className="font-bold text-[#0D1B3E] text-sm line-clamp-1">{dept.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Building size={12} />
                        <span className="truncate">Officer: {officerName}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between py-2 border-y border-slate-50">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Completion</span>
                        <h4 className="text-2xl font-black text-[#0D1B3E]">{dept.completionRate}%</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Student Statuses</span>
                        <div className="flex items-center gap-2 text-xs font-bold mt-1">
                          <span className="text-green-600">{dept.cleared}✓</span>
                          <span className="text-amber-500">{dept.pending + dept.requested}⌛</span>
                          <span className="text-red-500">{dept.rejected}✖</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getProgressBarColor(dept.completionRate)}`} 
                        style={{ width: `${dept.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {(!stats || !stats.departmentStats) && (
                <div className="col-span-full py-12 text-center text-slate-400">
                  No department statistics found.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* STUDENT DETAIL MODAL */}
      {/* ========================================================= */}
      {selectedClearance && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
            
            {/* Modal Header */}
            <div className="bg-[#0D1B3E] text-white p-6 flex justify-between items-start">
              <div>
                <span className="text-[#C9A84C] text-[10px] font-bold uppercase tracking-wider">Student Clearance Details</span>
                <h2 className="text-xl font-bold mt-1">{selectedClearance.student?.fullName || "Student Record"}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70 mt-1.5 font-medium">
                  <span>Adm No: <strong className="text-white">{selectedClearance.student?.admNo}</strong></span>
                  <span>Course: <strong className="text-white">{selectedClearance.student?.course}</strong></span>
                  <span>Dept: <strong className="text-white">{selectedClearance.student?.department}</strong></span>
                  <span>Phone: <strong className="text-white">{selectedClearance.student?.phone1}</strong></span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedClearance(null)} 
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Status Banner */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Overall Status:</span>
                {getStatusBadge(selectedClearance.overallStatus)}
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-red-600">
                <DollarSign size={16} />
                <span>Total Deductions: KSh {(selectedClearance.totalDeductions || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Modal Content - List of 14 Departments */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-3">
                {selectedClearance.departments?.map((dept) => {
                  const hasReason = dept.status === "rejected" || dept.status === "summoned";
                  
                  return (
                    <div key={dept.sno} className="border border-slate-100 rounded-lg p-4 bg-slate-50/20 hover:border-slate-200 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 w-5">{dept.sno}.</span>
                          <span className="font-semibold text-slate-800 text-sm">{dept.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">Officer: {dept.officerId?.fullName || "Not assigned"}</span>
                          {getStatusBadge(dept.status)}
                        </div>
                      </div>

                      {/* Rejected/Summoned Reasons and Override Button */}
                      {hasReason && (
                        <div className="mt-3 pl-8 space-y-2">
                          <div className={`p-3 rounded-lg border text-xs ${
                            dept.status === "rejected" 
                              ? "bg-red-50 text-red-800 border-red-100" 
                              : "bg-amber-50 text-amber-800 border-amber-100"
                          }`}>
                            <strong className="block font-bold mb-0.5">Officer Reason:</strong>
                            {dept.officerReason || "No explanation provided."}
                          </div>

                          {/* Student Response */}
                          {dept.studentResponse && dept.studentResponse.trim() !== "" && (
                            <div className="p-3 bg-blue-50 text-blue-800 border border-blue-100 rounded-lg text-xs">
                              <strong className="block font-bold mb-0.5">Student Clarification:</strong>
                              {dept.studentResponse}
                            </div>
                          )}

                          {/* Admin Override Action */}
                          <div className="pt-1 flex justify-end">
                            <button
                              onClick={() => {
                                setOverrideModal({
                                  studentId: selectedClearance.student?._id || selectedClearance.student,
                                  sno: dept.sno,
                                  deptName: dept.name
                                });
                                setOverrideReason("");
                                setOverrideError("");
                                setOverrideSuccess("");
                              }}
                              className="bg-[#C9A84C] hover:opacity-90 text-[#0D1B3E] px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                            >
                              <ShieldAlert size={14} />
                              Admin Override
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Cleared Department Display */}
                      {dept.status === "cleared" && (
                        <div className="mt-2 pl-8 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                          <Check size={14} className="stroke-[3]" />
                          <span>
                            Cleared on {dept.clearedAt ? new Date(dept.clearedAt).toLocaleDateString("en-KE", {
                              year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                            }) : "N/A"}
                            {dept.deductionAmount > 0 && ` (Deduction: KSh ${dept.deductionAmount})`}
                          </span>
                        </div>
                      )}

                      {/* Pending or Requested Display */}
                      {(dept.status === "pending" || dept.status === "requested") && (
                        <div className="mt-2 pl-8 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={14} />
                          <span>{dept.status === "requested" ? "Clearance request pending officer review" : "Not yet requested"}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setSelectedClearance(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2 rounded-lg text-sm font-semibold transition"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECONDARY MODAL: ADMIN OVERRIDE CONFIRMATION */}
      {/* ========================================================= */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-scaleIn">
            
            {/* Override Header */}
            <div className="bg-[#0D1B3E] text-white p-5 flex items-center gap-3">
              <div className="bg-[#C9A84C]/20 p-2 rounded-lg text-[#C9A84C]">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Override Dept Clearance</h3>
                <p className="text-[#C9A84C] text-[10px] uppercase font-bold tracking-wider">{overrideModal.deptName}</p>
              </div>
            </div>

            {/* Override Form */}
            <form onSubmit={handleAdminOverrideSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                You are forcing a status override for this department to <strong className="text-green-600 font-semibold">Cleared</strong>.
                This action is logged and visible in the department history audit. A reason is required.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Reason for Override:</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Provide detailed justification for overriding this department decision..."
                  rows="3"
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] bg-slate-50"
                  required
                />
              </div>

              {overrideError && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-lg text-xs font-medium">
                  {overrideError}
                </div>
              )}

              {overrideSuccess && (
                <div className="p-3 bg-green-50 text-green-800 border border-green-100 rounded-lg text-xs font-medium">
                  {overrideSuccess}
                </div>
              )}

              {/* Override Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModal(null)}
                  disabled={overrideLoading}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideLoading}
                  className="bg-[#0D1B3E] text-[#C9A84C] hover:opacity-95 px-5 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {overrideLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    "Confirm Override"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
