import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import getDecodedToken from '../lib/auth';
import { createLeave, getLeaves } from '../api/leave';

export default function Leave() {
	const navigate = useNavigate();
	const location = useLocation();
	const user = useMemo(() => getDecodedToken(), []);

	const [formData, setFormData] = useState({
		fromDate: '',
		toDate: '',
		reason: '',
		type: 'Casual Leave',
	});
	const [leaves, setLeaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const loadLeaves = async () => {
		setLoading(true);
		setError('');
		try {
			const data = await getLeaves();
			setLeaves(data);
		} catch (err) {
			setError(err?.message || 'Failed to fetch leave requests');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!user) {
			navigate('/login', { state: { from: location.pathname }, replace: true });
			return;
		}

		if (user.role === 'attendant') {
			navigate('/attendant', { replace: true });
			return;
		}

		loadLeaves();
	}, [location.pathname, navigate, user]);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!formData.fromDate || !formData.toDate || !formData.reason.trim()) {
			setError('Please fill all required fields');
			return;
		}

		setSubmitting(true);
		setError('');
		setSuccess('');
		try {
			await createLeave({
				startDate: formData.fromDate,
				endDate: formData.toDate,
				reason: formData.reason.trim(),
				type: formData.type,
			});

			setSuccess('Leave request submitted successfully');
			setFormData({
				fromDate: '',
				toDate: '',
				reason: '',
				type: 'Casual Leave',
			});
			await loadLeaves();
		} catch (err) {
			setError(err?.message || 'Failed to submit leave request');
		} finally {
			setSubmitting(false);
		}
	};

	const getStatusClass = (status) => {
		if (status === 'Approved') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
		if (status === 'Denied') return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
		return 'bg-amber-500/20 text-amber-200 border border-amber-500/30';
	};

	return (
		<div className="min-h-screen bg-[#0f172a] text-white">
			<Navbar />
			<div className="w-full max-w-4xl mx-auto mt-10 px-4">
				<div className="bg-[#111827] rounded-2xl shadow-lg p-8 border border-gray-800">
					<h1 className="text-3xl font-semibold mb-2 text-blue-500">Leave Application</h1>
					<p className="text-gray-400 mb-6">Submit your leave request for attendant approval.</p>

					{error && (
						<div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
							{error}
						</div>
					)}
					{success && (
						<div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300 text-sm">
							{success}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label className="block text-sm mb-2 text-gray-300">Leave Type</label>
							<select
								name="type"
								value={formData.type}
								onChange={handleChange}
								className="w-full p-3 rounded-lg bg-[#0f172a] border border-gray-700 focus:border-blue-500 outline-none"
							>
								<option>Casual Leave</option>
								<option>Sick Leave</option>
								<option>Emergency Leave</option>
							</select>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm mb-2 text-gray-300">From Date</label>
								<input
									type="date"
									name="fromDate"
									value={formData.fromDate}
									onChange={handleChange}
									className="w-full p-3 rounded-lg bg-[#0f172a] border border-gray-700 focus:border-blue-500 outline-none text-white"
									required
								/>
							</div>
							<div>
								<label className="block text-sm mb-2 text-gray-300">To Date</label>
								<input
									type="date"
									name="toDate"
									value={formData.toDate}
									onChange={handleChange}
									className="w-full p-3 rounded-lg bg-[#0f172a] border border-gray-700 focus:border-blue-500 outline-none text-white"
									required
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm mb-2 text-gray-300">Reason</label>
							<textarea
								name="reason"
								value={formData.reason}
								onChange={handleChange}
								rows="4"
								placeholder="Write your reason..."
								className="w-full p-3 rounded-lg bg-[#0f172a] border border-gray-700 focus:border-blue-500 outline-none"
								required
							/>
						</div>

						<button
							type="submit"
							disabled={submitting}
							className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all font-medium disabled:opacity-60"
						>
							{submitting ? 'Submitting...' : 'Submit Request'}
						</button>
					</form>
				</div>

				<div className="bg-[#111827] rounded-2xl shadow-lg p-8 border border-gray-800 mt-8 mb-10">
					<div className="flex items-center justify-between mb-5">
						<h2 className="text-2xl font-semibold text-blue-400">My Leave Requests</h2>
						<button
							type="button"
							onClick={loadLeaves}
							className="px-3 py-1.5 rounded-md bg-[#1f2937] border border-gray-700 text-sm hover:bg-[#273549]"
						>
							Refresh
						</button>
					</div>

					{loading ? (
						<p className="text-gray-300">Loading leave requests...</p>
					) : leaves.length === 0 ? (
						<p className="text-gray-400">No leave requests yet.</p>
					) : (
						<div className="space-y-3">
							{leaves.map((leave) => (
								<article key={leave._id} className="rounded-lg border border-gray-700 bg-[#0f172a] p-4">
									<div className="flex items-center justify-between gap-3 mb-2">
										<p className="font-medium text-blue-100">{leave.type || 'Casual Leave'}</p>
										<span className={`px-2.5 py-1 rounded text-xs font-semibold ${getStatusClass(leave.status)}`}>
											{leave.status}
										</span>
									</div>
									<p className="text-sm text-gray-200">
										{new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
									</p>
									<p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{leave.reason}</p>
								</article>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}