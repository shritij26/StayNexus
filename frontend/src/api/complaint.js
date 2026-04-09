import api from './interceptor';

export const getMyComplaints = async () => {
	const res = await api.get('/complaint/complaint');
	return res?.data?.complaints ?? [];
};

export const getAllComplaints = async () => {
	const res = await api.get('/complaint/all-complaints');
	return res?.data?.complaints ?? [];
};

export const getOtherComplaints = async () => {
	const res = await api.get('/complaint/complaints/others');
	return res?.data?.complaints ?? [];
};

export const createComplaint = async ({ title, description, category, images = [] }) => {
	const formData = new FormData();
	formData.append('title', title);
	formData.append('description', description);
	formData.append('category', category);
	images.forEach((file) => {
		formData.append('images', file);
	});

	const res = await api.post('/complaint/complaint', formData);
	return res?.data;
};

export const updateComplaint = async ({ id, title, description, category, images = [] }) => {
	const formData = new FormData();
	formData.append('id', id);
	if (title !== undefined) formData.append('title', title);
	if (description !== undefined) formData.append('description', description);
	if (category !== undefined) formData.append('category', category);
	images.forEach((file) => {
		formData.append('updatedImages', file);
	});

	const res = await api.patch('/complaint/complaint', formData);
	return res?.data;
};

export const deleteComplaint = async (id) => {
	const res = await api.delete('/complaint/complaint', {
		data: { id },
	});
	return res?.data;
};

export const resolveComplaint = async (id) => {
	const res = await api.patch('/complaint/complaint/resolve', { id });
	return res?.data;
};
