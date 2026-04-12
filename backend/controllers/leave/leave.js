import Leave from '../../models/leave/leave.js';

export const createLeave = async (req, res) => {
  const { startDate, endDate, reason, type } = req.body;

  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ msg: 'All fields are required' });
  }

  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({ msg: 'startDate must be before endDate' });
  }

  try {
    const leave = await Leave.create({
      studentId: req.user.userId,
      studentName: req.user.name,
      hostelName: req.user.hostelName,
      startDate,
      endDate,
      reason,
      type: type || 'Casual Leave',
    });

    return res.status(201).json({ msg: 'Leave request submitted successfully', leave });
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to submit leave request', error: error.message });
  }
};

export const getLeaves = async (req, res) => {
  try {
    const query = req.user.role === 'attendant'
      ? { hostelName: req.user.hostelName }
      : { studentId: req.user.userId };
    const leaves = await Leave.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ leaves });
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to fetch leave requests', error: error.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  const { leaveId } = req.params;
  const { status } = req.body;

  if (req.user?.role !== 'attendant') {
    return res.status(403).json({ msg: 'Only attendants can approve or deny leave requests' });
  }

  if (!['Approved', 'Denied'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status value' });
  }

  try {
    const existingLeave = await Leave.findById(leaveId);

    if (!existingLeave) {
      return res.status(404).json({ msg: 'Leave request not found' });
    }

    if (existingLeave.hostelName && existingLeave.hostelName !== req.user.hostelName) {
      return res.status(403).json({ msg: 'You are not authorized to approve this leave request' });
    }

    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      { status },
      { new: true }
    );

    return res.status(200).json({ msg: 'Leave status updated successfully', leave });
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to update leave status', error: error.message });
  }
};