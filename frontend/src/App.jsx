import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Attendance from './pages/Attendance.jsx';
import Home from './pages/Home.jsx';
import HostelCart from './pages/HostelCart.jsx';
import Leave from './pages/Leave.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import Signup from './pages/Signup.jsx';
import AttendantLogin from './pages/AttendantLogin.jsx';
import AttendantSignup from './pages/AttendantSignup.jsx';
import AttendantAttendance from './pages/AttendantAttendance.jsx';
import Reports from './pages/Reports.jsx';
import Complaints from './pages/Complaints.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/hostelcart" element={<HostelCart />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/attendant/login" element={<AttendantLogin />} />
        <Route path="/attendant/signup" element={<AttendantSignup />} />
        <Route path="/attendant/attendance" element={<AttendantAttendance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
