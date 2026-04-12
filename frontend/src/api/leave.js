import api from './interceptor';

export const createLeave = async ({ startDate, endDate, reason, type }) => {
  const res = await api.post('/leave/leaves', {
    startDate,
    endDate,
    reason,
    type,
  });
  return res?.data;
};

export const getLeaves = async () => {
  const res = await api.get('/leave/leaves');
  return res?.data?.leaves ?? [];
};

export const updateLeaveStatus = async (leaveId, status) => {
  const res = await api.patch(`/leave/leaves/${leaveId}`, { status });
  return res?.data;
};
