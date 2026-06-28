import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Users,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  CreditCard,
  X,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import Navbar from "../../components/layout/Navbar";
import StatusBadge from "../../components/ui/StatusBadge";
const OfficerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const token = localStorage.getItem('token');

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [reason, setReason] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedStudent, setExpandedStudent] = useState(null);


  const fetchQueue = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/clearance/queue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueue(res.data.clearances || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOfficerAction = async (studentId, sno) => {
    if ((activeAction === 'rejected' || activeAction === 'summoned') && !reason.trim()) {
      setActionError('Reason is required');
      return;
    }
    try {
      setActionLoading(true);
      setActionError('');
      await axios.patch(
        `http://localhost:5000/api/clearance/${studentId}/department/${sno}`,
        { action: activeAction, reason, deductionAmount: Number(deductionAmount) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('Action completed successfully');
      await fetchQueue();
      setTimeout(() => {
        setSelectedClearance(null);
        setActiveAction(null);
        setReason('');
        setDeductionAmount('');
        setSuccessMessage('');
      }, 1500);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate('/');
  };

  const filteredQueue = useMemo(() => {
    return queue.filter(c => {
      const matchesSearch =
        c.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.student?.admNo?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === "all") return true;

      const deptStatus = c.departments?.[0]?.status;
      if (filterStatus === "pending") return deptStatus === "requested" || deptStatus === "pending";
      if (filterStatus === "cleared") return deptStatus === "cleared";
      if (filterStatus === "flagged") return deptStatus === "rejected" || deptStatus === "summoned";

      return true;
    });
  }, [queue, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: queue.length,
      pending: queue.filter(c => c.departments?.some(d => d.status === 'requested')).length,
      cleared: queue.filter(c => c.departments?.some(d => d.status === 'cleared')).length,
      flagged: queue.filter(c => c.departments?.some(d => d.status === 'rejected' || d.status === 'summoned')).length,
    };
  }, [queue]);

  const statCards = useMemo(() => [
    {
      title: "Total Requests",
      value: stats.total,
      icon: Users,
      bg: "bg-slate-50",
      border: "border-slate-200",
      iconColor: "text-slate-700",
    },
    {
      title: "Pending Clearance",
      value: stats.pending,
      icon: Clock3,
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-600",
    },
    {
      title: "Cleared Today",
      value: stats.cleared,
      icon: CheckCircle2,
      bg: "bg-green-50",
      border: "border-green-200",
      iconColor: "text-green-600",
    },
    {
      title: "Flagged / Summoned",
      value: stats.flagged,
      icon: AlertTriangle,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-600",
    },
  ], [stats]);

  const getBadgeStatus = (status) => {
    if (status === 'cleared') return 'cleared';
    if (status === 'rejected' || status === 'summoned') return 'blocked';
    return 'pending';
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
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchQueue();
            }}
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
<Navbar
  title="Clearance Portal"
  subtitle={user?.department || 'Officer'}
  showNotification
  onLogout={handleLogout}
/>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* =======================
            Statistics
        ======================== */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
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
            Search & Filter
        ======================== */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search by name or admission number"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 focus:border-[#0D1B3E] focus:outline-none"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value)
              }
              className="rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0D1B3E] focus:outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="cleared">Cleared</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </section>

        {/* =======================
            Student List
        ======================== */}
        <section className="mt-8 rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-bold text-[#0D1B3E]">
              Student Clearance Requests
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredQueue.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No clearance requests found.
              </div>
            ) : (
              filteredQueue.map((student) => (
                <div key={student._id}>
                  {/* Main Row */}
                  <div
                    className="cursor-pointer px-6 py-5 transition hover:bg-slate-50"
                    onClick={() =>
                      setExpandedStudent((prev) =>
                        prev === student._id ? null : student._id
                      )
                    }
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Student Info */}
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0D1B3E] font-bold text-[#C9A84C]">
                          {(student.student?.fullName || "Student")
                            .trim()
                            .split(/\s+/)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#0D1B3E]">
                            {student.student?.fullName || "N/A"}
                          </h3>

                          <p className="text-sm text-gray-500">
                            {student.student?.admNo || "N/A"} •{" "}
                            {student.student?.course || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge
                          status={getBadgeStatus(student.departments?.[0]?.status)}
                        />

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClearance(student);
                            setActiveAction(null);
                          }}
                          className="rounded-lg bg-[#0D1B3E] px-4 py-2 text-sm font-semibold text-[#C9A84C] transition hover:opacity-90"
                        >
                          Review
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClearance(student);
                            setActiveAction("rejected");
                          }}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                        >
                          Flag
                        </button>

                        {expandedStudent === student._id ? (
                          <ChevronUp className="text-gray-500" />
                        ) : (
                          <ChevronDown className="text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedStudent === student._id && (
                    <div className="bg-slate-50 px-6 py-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="rounded-xl border bg-white p-5">
                          <div className="mb-3 flex items-center gap-2">
                            <GraduationCap
                              size={18}
                              className="text-[#0D1B3E]"
                            />
                            <h4 className="font-semibold text-[#0D1B3E]">
                              Academic Information
                            </h4>
                          </div>

                          <p>
                            <strong>Course:</strong>{" "}
                            {student.student?.course || "N/A"}
                          </p>

                          <p>
                            <strong>Admission No:</strong>{" "}
                            {student.student?.admNo || "N/A"}
                          </p>

                          <p>
                            <strong>Department:</strong>{" "}
                            {student.student?.department || "N/A"}
                          </p>
                        </div>

                        <div className="rounded-xl border bg-white p-5">
                          <div className="mb-3 flex items-center gap-2">
                            <CreditCard
                              size={18}
                              className="text-[#0D1B3E]"
                            />
                            <h4 className="font-semibold text-[#0D1B3E]">
                              Contact Information
                            </h4>
                          </div>

                          <p>
                            <strong>National ID:</strong>{" "}
                            {student.student?.nationalId || "N/A"}
                          </p>

                          <p>
                            <strong>Phone:</strong>{" "}
                            {student.student?.phone1 || "N/A"}
                          </p>

                          {student.departments?.[0]?.officerReason && (
                            <p className="mt-3 text-amber-700">
                              <strong>Reason:</strong>{" "}
                              {student.departments[0].officerReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* =======================
            Flag Modal
        ======================== */}
{selectedClearance && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D1B3E]">{selectedClearance.student?.fullName}</h2>
          <p className="text-sm text-gray-500">{selectedClearance.student?.admNo}</p>
        </div>
        <button onClick={() => { setSelectedClearance(null); setActiveAction(null); setReason(''); setActionError(''); }}>
          <X />
        </button>
      </div>
      <div className="space-y-4 p-6">
        {successMessage && <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-green-700 text-sm">{successMessage}</div>}
        {actionError && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">{actionError}</div>}
        
        {selectedClearance.departments?.find(d => d.studentResponse) && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">Student Response:</p>
            <p className="text-sm text-blue-900">{selectedClearance.departments.find(d => d.studentResponse)?.studentResponse}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setActiveAction('cleared')} className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${activeAction === 'cleared' ? 'bg-green-600 text-white' : 'border-green-600 text-green-600'}`}>Approve</button>
          <button onClick={() => setActiveAction('rejected')} className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${activeAction === 'rejected' ? 'bg-red-600 text-white' : 'border-red-600 text-red-600'}`}>Reject</button>
          <button onClick={() => setActiveAction('summoned')} className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${activeAction === 'summoned' ? 'bg-amber-500 text-white' : 'border-amber-500 text-amber-600'}`}>Summon</button>
        </div>

        {activeAction === 'cleared' && (
          <div>
            <label className="block text-sm font-medium mb-1">Deduction Amount (KSh) — optional</label>
            <input type="number" value={deductionAmount} onChange={e => setDeductionAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0D1B3E] focus:outline-none" />
          </div>
        )}

        {(activeAction === 'rejected' || activeAction === 'summoned') && (
          <div>
            <label className="block text-sm font-medium mb-1">Reason <span className="text-red-500">*</span></label>
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
              placeholder={activeAction === 'summoned' ? 'Explain why and what to bring...' : 'Explain the reason for rejection...'}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0D1B3E] focus:outline-none" />
          </div>
        )}

        {activeAction && (
          <button
            onClick={() => {
              const dept = selectedClearance.departments?.find(d => d.status === 'requested');
              if (dept) handleOfficerAction(selectedClearance.student._id, dept.sno);
            }}
            disabled={actionLoading}
            className="w-full py-2 rounded-lg bg-[#0D1B3E] text-[#C9A84C] font-semibold disabled:opacity-60"
          >
            {actionLoading ? 'Processing...' : 'Confirm Action'}
          </button>
        )}
      </div>
    </div>
  </div>
)}
      </main>
    </div>
  );
};

export default OfficerDashboard;