import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getMonthlyAttendance, markAttendance } from '../api/attendance';

function AttendancePage() {
	const [loading, setLoading] = useState(false);
	const [attendance, setAttendance] = useState([]);
	const [month, setMonth] = useState(new Date().getMonth() + 1);
	const [year, setYear] = useState(new Date().getFullYear());

	const fetchAttendance = async () => {
		try {
			const data = await getMonthlyAttendance(month, year);
			setAttendance(data);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		fetchAttendance();
	}, [month, year]);

	const handleMarkAttendance = () => {
		if (!navigator.geolocation) {
			alert('Geolocation not supported');
			return;
		}

		setLoading(true);

		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				try {
					const { latitude, longitude } = pos.coords;

					await markAttendance(latitude, longitude);

					alert('Attendance marked');
					fetchAttendance();
				} catch (err) {
					alert(err?.response?.data?.message || err?.response?.data?.msg || 'Failed');
				} finally {
					setLoading(false);
				}
			},
			() => {
				alert('Location permission denied');
				setLoading(false);
			}
		);
	};

	const daysInMonth = new Date(year, month, 0).getDate();

	const getStatus = (date) => {
		const found = attendance.find((d) => d.date === date);
		return found ? found.status : 'absent';
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f1b3d] to-[#0a0f1f] text-white">
			<Navbar />

			<div className="p-8 max-w-7xl mx-auto">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold tracking-tight">Attendance</h1>

					<button
						onClick={handleMarkAttendance}
						disabled={loading}
						className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all"
					>
						{loading ? 'Marking...' : 'Mark Attendance'}
					</button>
				</div>

				<div className="flex gap-4 mb-8">
					<input
						type="number"
						value={month}
						onChange={(e) => setMonth(Number(e.target.value))}
						className="bg-white/10 border border-white/20 backdrop-blur-md p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						min="1"
						max="12"
					/>
					<input
						type="number"
						value={year}
						onChange={(e) => setYear(Number(e.target.value))}
						className="bg-white/10 border border-white/20 backdrop-blur-md p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div className="grid grid-cols-7 gap-3">
					{[...Array(daysInMonth)].map((_, i) => {
						const day = i + 1;
						const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

						const status = getStatus(date);

						let bg = 'bg-white/15 border border-white/20 text-white';
						if (status === 'present') bg = 'bg-green-500/70 border border-green-500 text-white';

						return (
							<div key={day} className={`${bg} p-4 rounded-xl text-center font-semibold backdrop-blur-md hover:scale-105 transition-all duration-200 cursor-pointer`}>
								{day}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default AttendancePage;
