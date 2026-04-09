import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import getDecodedToken from '../lib/auth';
import { getAttendantMonthlyAttendance } from '../api/attendance';

function AttendantAttendance() {
	const navigate = useNavigate();
	const location = useLocation();
	const user = useMemo(() => getDecodedToken(), []);
	const isAttendant = user?.role === 'attendant';

	const [month, setMonth] = useState(new Date().getMonth() + 1);
	const [year, setYear] = useState(new Date().getFullYear());
	const [search, setSearch] = useState('');
	const [selectedStudentId, setSelectedStudentId] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [report, setReport] = useState(null);

	const loadReport = async () => {
		setLoading(true);
		setError('');
		try {
			const data = await getAttendantMonthlyAttendance(month, year);
			setReport(data);
		} catch (err) {
			setError(err?.message || 'Failed to fetch attendance report');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!user) {
			navigate('/login', { state: { from: location.pathname } });
			return;
		}
		if (!isAttendant) {
			navigate('/attendance');
			return;
		}
		loadReport();
	}, [month, year]);

	const students = report?.students || [];
	const filteredStudents = students.filter((student) => {
		const q = search.trim().toLowerCase();
		if (!q) return true;
		return (
			student.name?.toLowerCase().includes(q) ||
			student.email?.toLowerCase().includes(q) ||
			String(student.roomNumber || '').toLowerCase().includes(q)
		);
	});

	const selectedStudent = students.find((student) => String(student.studentId) === String(selectedStudentId)) || null;

	useEffect(() => {
		if (!selectedStudentId || students.length === 0) return;
		const exists = students.some((student) => String(student.studentId) === String(selectedStudentId));
		if (!exists) {
			setSelectedStudentId('');
		}
	}, [students, selectedStudentId]);

	return (
		<div className="min-h-screen bg-[#0d1117] text-white">
			<Navbar />
			<main className="max-w-7xl mx-auto px-6 py-10">
				<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
					<div>
						<h1 className="text-3xl font-extrabold">Attendant Attendance Dashboard</h1>
						<p className="text-gray-300 text-sm mt-1">
							Track monthly attendance for all students in {report?.hostelName || user?.hostelName || 'your hostel'}.
						</p>
					</div>
					<button
						type="button"
						onClick={loadReport}
						className="px-4 py-2 rounded-md bg-[#1f2937] border border-white/10 hover:bg-[#273549]"
					>
						Refresh
					</button>
				</div>

				{error && (
					<div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
						{error}
					</div>
				)}

				{selectedStudent ? (
					<>
						<section className="rounded-2xl border border-white/10 bg-[#111827] p-5 mb-6">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div>
									<p className="text-xs text-gray-400">Selected Student</p>
									<p className="text-2xl font-bold mt-1">{selectedStudent.name}</p>
									<p className="text-sm text-gray-400">
										{selectedStudent.email} | Room: {selectedStudent.roomNumber || '-'}
									</p>
								</div>
								<button
									type="button"
									onClick={() => setSelectedStudentId('')}
									className="px-4 py-2 rounded-md bg-[#0f172a] border border-white/10 hover:bg-[#1b2a45]"
								>
									Back To Students
								</button>
							</div>
						</section>

						<section className="rounded-2xl border border-white/10 bg-[#111827] p-5 mb-6">
							<div className="grid md:grid-cols-2 gap-4">
								<div>
									<label className="block text-xs text-gray-400 mb-1">Month</label>
									<input
										type="number"
										min="1"
										max="12"
										value={month}
										onChange={(e) => setMonth(Number(e.target.value))}
										className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2"
									/>
								</div>
								<div>
									<label className="block text-xs text-gray-400 mb-1">Year</label>
									<input
										type="number"
										value={year}
										onChange={(e) => setYear(Number(e.target.value))}
										className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2"
									/>
								</div>
							</div>
						</section>

						<section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
							<div className="rounded-xl border border-white/10 bg-[#111827] p-4">
								<p className="text-xs text-gray-400">Total Present Days</p>
								<p className="text-2xl font-bold text-green-400">{selectedStudent.presentDays}</p>
							</div>
							<div className="rounded-xl border border-white/10 bg-[#111827] p-4">
								<p className="text-xs text-gray-400">Total Leave Days</p>
								<p className="text-2xl font-bold text-yellow-300">{selectedStudent.leaveDays}</p>
							</div>
							<div className="rounded-xl border border-white/10 bg-[#111827] p-4">
								<p className="text-xs text-gray-400">Total Absent Days</p>
								<p className="text-2xl font-bold text-red-300">{selectedStudent.absentDays}</p>
							</div>
							<div className="rounded-xl border border-white/10 bg-[#111827] p-4">
								<p className="text-xs text-gray-400">Attendance %</p>
								<p className="text-2xl font-bold text-blue-300">{selectedStudent.attendancePercentage}%</p>
							</div>
						</section>

						<section className="rounded-2xl border border-white/10 bg-[#111827] p-5 overflow-x-auto">
							<h2 className="text-xl font-semibold mb-3">Monthly Day-wise Attendance</h2>
							<p className="text-sm text-gray-400 mb-4">
								Showing {month}/{year} attendance for {selectedStudent.name}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{selectedStudent.attendance.map((entry) => (
									<span
										key={`${selectedStudent.studentId}-${entry.date}`}
										className={`px-2 py-1 rounded border text-xs ${
											entry.status === 'present'
												? 'bg-green-500/20 border-green-500/40 text-green-300'
												: entry.status === 'leave'
													? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
													: 'bg-red-500/20 border-red-500/40 text-red-300'
										}`}
									>
										{entry.date.split('-')[2]}:{' '}
										{entry.status === 'present' ? 'P' : entry.status === 'leave' ? 'L' : 'A'}
									</span>
								))}
							</div>
						</section>
					</>
				) : (
					<>
						<section className="rounded-2xl border border-white/10 bg-[#111827] p-5 mb-6">
							<div className="grid md:grid-cols-4 gap-4">
								<div>
									<label className="block text-xs text-gray-400 mb-1">Month</label>
									<input
										type="number"
										min="1"
										max="12"
										value={month}
										onChange={(e) => setMonth(Number(e.target.value))}
										className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2"
									/>
								</div>
								<div>
									<label className="block text-xs text-gray-400 mb-1">Year</label>
									<input
										type="number"
										value={year}
										onChange={(e) => setYear(Number(e.target.value))}
										className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-xs text-gray-400 mb-1">Search student (name/email/room)</label>
									<input
										type="text"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										placeholder="Search..."
										className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2"
									/>
								</div>
							</div>
						</section>

						<section className="rounded-2xl border border-white/10 bg-[#111827] p-5 overflow-x-auto">
							<div className="flex items-center justify-between gap-3 mb-4">
								<h2 className="text-xl font-semibold">Students</h2>
								{report && <p className="text-sm text-gray-400">Total students: {report.totalStudents || 0}</p>}
							</div>
							{loading ? (
								<p className="text-gray-300">Loading report...</p>
							) : filteredStudents.length === 0 ? (
								<p className="text-gray-300">No student attendance found for selected month.</p>
							) : (
								<table className="w-full text-left text-sm border-collapse">
									<thead>
										<tr className="border-b border-white/10 text-gray-300">
											<th className="py-2 pr-3">Student</th>
											<th className="py-2 pr-3">Room</th>
											<th className="py-2 pr-3">Hostel</th>
											<th className="py-2">Action</th>
										</tr>
									</thead>
									<tbody>
										{filteredStudents.map((student) => (
											<tr key={student.studentId} className="border-b border-white/5 align-top">
												<td className="py-3 pr-3">
													<p className="font-semibold">{student.name}</p>
													<p className="text-xs text-gray-400">{student.email}</p>
												</td>
												<td className="py-3 pr-3">{student.roomNumber || '-'}</td>
												<td className="py-3 pr-3">{student.hostelName || '-'}</td>
												<td className="py-3">
													<button
														type="button"
														onClick={() => setSelectedStudentId(String(student.studentId))}
														className="px-3 py-1.5 rounded-md text-xs border bg-[#0f172a] border-white/10 hover:bg-[#1b2a45]"
													>
														View Attendance
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</section>
					</>
				)}
			</main>
		</div>
	);
}

export default AttendantAttendance;
