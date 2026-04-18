import api from './interceptor';

export const updatePhoneNumber = async (phoneNumber) => {
	const res = await api.patch('/user/phone-number', { phoneNumber });
	return res?.data;
};
