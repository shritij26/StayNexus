import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true, 
  },
  studentName: {
    type: String,
    trim: true,
  },
  hostelName: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true, 
  },
  endDate: {
    type: Date,
    required: true, 
  },
  reason: {
    type: String,
    required: true, 
    trim: true, // Removes extra spaces
  },
  type: {
    type: String,
    enum: ['Casual Leave', 'Sick Leave', 'Emergency Leave'],
    default: 'Casual Leave',
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Denied'],
    default: 'Pending', // Default status is 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now, 
  },
});

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;