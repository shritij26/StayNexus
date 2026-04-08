import Attendance from '../../models/attendance/attendance.model.js';
import User from '../../models/user.model.js';

// Fixed hostel reference point (update these coordinates to your hostel gate/center).
const HOSTEL_COORDS = {
	lat: 28.749883,
	lng: 77.117486,
};

const MAX_DISTANCE_KM = 1;

const toRadians = (value) => (value * Math.PI) / 180;

const haversineDistanceKm = (lat1, lng1, lat2, lng2) => {
	const earthRadiusKm = 6371;
	const dLat = toRadians(lat2 - lat1);
	const dLng = toRadians(lng2 - lng1);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return earthRadiusKm * c;
};

const formatDate = (date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const markAttendance = async (req, res) => {
	try {
		const userId = req.user?.userId || req.user?.id;
		if (!userId) {
			return res.status(401).json({ message: 'Unauthorized: user not found in request' });
		}

		const { lat, lng } = req.body || {};
		if (lat === undefined || lng === undefined) {
			return res.status(400).json({ message: 'Location is required (lat and lng)' });
		}

		const numericLat = Number(lat);
		const numericLng = Number(lng);
		if (Number.isNaN(numericLat) || Number.isNaN(numericLng)) {
			return res.status(400).json({ message: 'Invalid location coordinates' });
		}

		const distanceKm = haversineDistanceKm(numericLat, numericLng, HOSTEL_COORDS.lat, HOSTEL_COORDS.lng);
		if (distanceKm > MAX_DISTANCE_KM) {
			return res.status(403).json({
				message: 'You are outside the allowed hostel radius',
				distanceKm,
			});
		}

		const today = formatDate(new Date());

		const existing = await Attendance.findOne({ student: userId, date: today });
		if (existing) {
			return res.status(409).json({ message: 'Attendance already marked for today' });
		}

		const attendance = await Attendance.create({
			student: userId,
			date: today,
			status: 'present',
			location: { lat: numericLat, lng: numericLng },
		});

		return res.status(201).json({
			message: 'Attendance marked successfully',
			attendance,
		});
	} catch (error) {
		if (error?.code === 11000) {
			return res.status(409).json({ message: 'Attendance already marked for today' });
		}
		return res.status(500).json({ message: 'Failed to mark attendance', error: error.message });
	}
};

const getMonthlyAttendance = async (req, res) => {
	try {
		const userId = req.user?.userId || req.user?.id;
		if (!userId) {
			return res.status(401).json({ message: 'Unauthorized: user not found in request' });
		}

		const month = Number(req.query.month);
		const year = Number(req.query.year);

		if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1970) {
			return res.status(400).json({ message: 'Invalid month/year query parameters' });
		}

		const firstDay = new Date(year, month - 1, 1);
		const lastDay = new Date(year, month, 0);
		const startDate = formatDate(firstDay);
		const endDate = formatDate(lastDay);

		const records = await Attendance.find({
			student: userId,
			date: { $gte: startDate, $lte: endDate },
		})
			.select('date status -_id')
			.lean();

		const byDate = new Map(records.map((record) => [record.date, record.status]));

		const daysInMonth = lastDay.getDate();
		const attendance = [];

		for (let day = 1; day <= daysInMonth; day += 1) {
			const date = formatDate(new Date(year, month - 1, day));
			attendance.push({
				date,
				status: byDate.get(date) || 'absent',
			});
		}

		return res.status(200).json({ attendance });
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch monthly attendance', error: error.message });
	}
};

const getAttendantMonthlyAttendance = async (req, res) => {
	try {
		if (req.user?.role !== 'attendant') {
			return res.status(403).json({ message: 'Only attendants can access this attendance report' });
		}

		const month = Number(req.query.month);
		const year = Number(req.query.year);

		if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1970) {
			return res.status(400).json({ message: 'Invalid month/year query parameters' });
		}

		const hostelName = req.user?.hostelName;
		if (!hostelName) {
			return res.status(400).json({ message: 'Hostel information missing in token' });
		}

		const firstDay = new Date(year, month - 1, 1);
		const lastDay = new Date(year, month, 0);
		const startDate = formatDate(firstDay);
		const endDate = formatDate(lastDay);
		const daysInMonth = lastDay.getDate();

		const students = await User.find({ hostelName })
			.select('_id name email roomNumber hostelName')
			.lean();

		if (students.length === 0) {
			return res.status(200).json({
				hostelName,
				month,
				year,
				totalStudents: 0,
				overall: {
					totalPresent: 0,
					totalLeave: 0,
					totalAbsent: 0,
				},
				students: [],
			});
		}

		const studentIds = students.map((student) => student._id);
		const records = await Attendance.find({
			student: { $in: studentIds },
			date: { $gte: startDate, $lte: endDate },
		})
			.select('student date status markedAt -_id')
			.lean();

		const recordsByStudent = new Map();
		for (const record of records) {
			const key = String(record.student);
			if (!recordsByStudent.has(key)) {
				recordsByStudent.set(key, []);
			}
			recordsByStudent.get(key).push(record);
		}

		let totalPresent = 0;
		let totalLeave = 0;
		let totalAbsent = 0;

		const studentAttendance = students.map((student) => {
			const studentKey = String(student._id);
			const studentRecords = recordsByStudent.get(studentKey) || [];
			const statusByDate = new Map(studentRecords.map((record) => [record.date, record.status]));

			let presentDays = 0;
			let leaveDays = 0;
			let absentDays = 0;
			const attendance = [];

			for (let day = 1; day <= daysInMonth; day += 1) {
				const date = formatDate(new Date(year, month - 1, day));
				const status = statusByDate.get(date) || 'absent';

				if (status === 'present') presentDays += 1;
				else if (status === 'leave') leaveDays += 1;
				else absentDays += 1;

				attendance.push({ date, status });
			}

			totalPresent += presentDays;
			totalLeave += leaveDays;
			totalAbsent += absentDays;

			const presentDates = attendance.filter((entry) => entry.status === 'present').map((entry) => entry.date);
			const leaveDates = attendance.filter((entry) => entry.status === 'leave').map((entry) => entry.date);
			const attendancePercentage = Number(((presentDays / daysInMonth) * 100).toFixed(2));

			return {
				studentId: student._id,
				name: student.name,
				email: student.email,
				roomNumber: student.roomNumber,
				hostelName: student.hostelName,
				presentDays,
				leaveDays,
				absentDays,
				attendancePercentage,
				presentDates,
				leaveDates,
				attendance,
			};
		});

		return res.status(200).json({
			hostelName,
			month,
			year,
			totalStudents: students.length,
			overall: {
				totalPresent,
				totalLeave,
				totalAbsent,
			},
			students: studentAttendance,
		});
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch attendant monthly attendance', error: error.message });
	}
};

export { getAttendantMonthlyAttendance, getMonthlyAttendance, markAttendance };
