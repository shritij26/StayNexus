import api from './interceptor';

export const getMonthlyAttendance = async (month, year) => {
	const res = await api.get('/attendance/monthly', {
		params: { month, year },
	});
	return res?.data?.attendance ?? [];
};

export const markAttendance = async (lat, lng) => {
	const res = await api.post('/attendance/mark', { lat, lng });
	return res?.data;
};

export const getAttendantMonthlyAttendance = async (month, year) => {
	const res = await api.get('/attendance/attendant/monthly', {
		params: { month, year },
	});
	return res?.data;
};
