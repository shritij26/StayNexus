import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import getDecodedToken from '../lib/auth';
import { getOtherComplaints, resolveComplaint } from '../api/complaint';
import { getLeaves, updateLeaveStatus } from '../api/leave';

const formatDate = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '-';
  }
};

function AttendantDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = useMemo(() => getDecodedToken(), []);

  useEffect(() => {
    if (!user) {
      navigate('/attendant/login', { replace: true });
      return;
    }

    if (user.role !== 'attendant') {
      navigate('/', { replace: true });
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [complaintData, leaveData] = await Promise.all([
          getOtherComplaints(),
          getLeaves(),
        ]);
        setComplaints(complaintData);
        setLeaves(leaveData);
      } catch (err) {
        setError(err?.message || 'Failed to load attendant dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate, user]);

  const complaintStats = useMemo(() => {
    const pending = complaints.filter((item) => item.status !== 'resolved').length;
    const resolved = complaints.length - pending;
    return { total: complaints.length, pending, resolved };
  }, [complaints]);

  const leaveStats = useMemo(() => {
    const pending = leaves.filter((item) => item.status === 'Pending').length;
    const approved = leaves.filter((item) => item.status === 'Approved').length;
    const denied = leaves.filter((item) => item.status === 'Denied').length;
    return { total: leaves.length, pending, approved, denied };
  }, [leaves]);

  const pendingComplaints = useMemo(
    () => complaints.filter((item) => item.status !== 'resolved').slice(0, 8),
    [complaints]
  );

  const pendingLeaves = useMemo(
    () => leaves.filter((item) => item.status === 'Pending').slice(0, 8),
    [leaves]
  );

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [complaintData, leaveData] = await Promise.all([getOtherComplaints(), getLeaves()]);
      setComplaints(complaintData);
      setLeaves(leaveData);
    } catch (err) {
      setError(err?.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveComplaint = async (id) => {
    try {
      await resolveComplaint(id);
      await refresh();
    } catch (err) {
      setError(err?.message || 'Failed to resolve complaint');
    }
  };

  const handleLeaveDecision = async (leaveId, status) => {
    try {
      await updateLeaveStatus(leaveId, status);
      await refresh();
    } catch (err) {
      setError(err?.message || `Failed to mark leave as ${status}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1228] via-[#102244] to-[#1b4332] text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold">Attendant Dashboard</h1>
            <p className="text-sm text-blue-100/80 mt-1">
              Review incoming complaints and approve or deny leave requests from one place.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="px-4 py-2 rounded-md bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-red-100 text-sm">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-white/20 bg-[#0c1b36]/70 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-200">Complaints Total</p>
            <p className="text-3xl font-bold mt-2">{complaintStats.total}</p>
          </div>
          <div className="rounded-xl border border-yellow-300/30 bg-yellow-400/10 p-4">
            <p className="text-xs uppercase tracking-wide text-yellow-100">Complaints Pending</p>
            <p className="text-3xl font-bold mt-2">{complaintStats.pending}</p>
          </div>
          <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-4">
            <p className="text-xs uppercase tracking-wide text-cyan-100">Leaves Pending</p>
            <p className="text-3xl font-bold mt-2">{leaveStats.pending}</p>
          </div>
          <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-100">Leaves Approved</p>
            <p className="text-3xl font-bold mt-2">{leaveStats.approved}</p>
          </div>
        </section>

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-blue-100">Loading dashboard...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-white/10 bg-[#09172f]/80 p-5">
              <h2 className="text-xl font-semibold mb-4">Pending Complaints</h2>
              {pendingComplaints.length === 0 ? (
                <p className="text-sm text-blue-100/75">No pending complaints.</p>
              ) : (
                <div className="space-y-3">
                  {pendingComplaints.map((complaint) => (
                    <article key={complaint._id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{complaint.title}</p>
                          <p className="text-xs text-blue-100/80 mt-1">{complaint.category}</p>
                          <p className="text-xs text-blue-100/70 mt-1">
                            {complaint.raisedBy?.name || complaint.raisedBy?.email || 'Student'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleResolveComplaint(complaint._id)}
                          className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-sm"
                        >
                          Mark Resolved
                        </button>
                      </div>
                      <p className="text-sm text-blue-50/90 mt-3 line-clamp-3">{complaint.description}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#10232e]/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Pending Leave Approvals</h2>
                <span className="text-xs text-blue-100/75">Denied: {leaveStats.denied}</span>
              </div>
              {pendingLeaves.length === 0 ? (
                <p className="text-sm text-blue-100/75">No pending leave requests.</p>
              ) : (
                <div className="space-y-3">
                  {pendingLeaves.map((leave) => (
                    <article key={leave._id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="font-semibold">{leave.studentName || leave.studentId}</p>
                      <p className="text-xs text-blue-100/70 mt-1">{leave.type || 'Casual Leave'} | {leave.hostelName || '-'}</p>
                      <p className="text-xs text-blue-100/75 mt-1">
                        {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                      </p>
                      <p className="text-sm text-blue-50/90 mt-2">{leave.reason}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleLeaveDecision(leave._id, 'Approved')}
                          className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLeaveDecision(leave._id, 'Denied')}
                          className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-sm"
                        >
                          Deny
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default AttendantDashboard;
