import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
	const navigate = useNavigate();
	const [token, setToken] = useState(localStorage.getItem('token') || '');

	useEffect(() => {
		const syncToken = () => setToken(localStorage.getItem('token') || '');
		window.addEventListener('auth-changed', syncToken);
		window.addEventListener('storage', syncToken);
		return () => {
			window.removeEventListener('auth-changed', syncToken);
			window.removeEventListener('storage', syncToken);
		};
	}, []);

	const userName = useMemo(() => {
		if (!token) return null;
		try {
			const decoded = JSON.parse(atob(token.split('.')[1] || ''));
			if (!decoded || (decoded.exp && decoded.exp * 1000 <= Date.now())) return null;
			return decoded.name || decoded.email || 'Resident';
		} catch {
			return null;
		}
	}, [token]);

	const userRole = useMemo(() => {
		if (!token) return null;
		try {
			const decoded = JSON.parse(atob(token.split('.')[1] || ''));
			if (!decoded || (decoded.exp && decoded.exp * 1000 <= Date.now())) return null;
			return decoded.role || 'student';
		} catch {
			return null;
		}
	}, [token]);

	const hasToken = Boolean(userName);

	const [open, setOpen] = useState(false);

	useEffect(() => {
	  const onClick = (e) => {
	    // close if clicking outside any element with data-user-menu
	    if (!e.target.closest('[data-user-menu]')) setOpen(false);
	  };
	  document.addEventListener('click', onClick);
	  return () => document.removeEventListener('click', onClick);
	}, []);

	const handleLogout = () => {
		localStorage.removeItem('token');
		try {
			window.dispatchEvent(new Event('auth-changed'));
		} catch {
			// no-op
		}
		navigate('/');
	};

	return (
		<header className="sticky top-0 z-20 backdrop-blur-md border-b border-white/10 bg-[#09100d]/70">
			<div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
				<Link to="/" className="text-2xl font-black tracking-wide text-[#60a5fa] drop-shadow-[0_0_6px_rgba(96,165,250,0.4)]">
					StayNexus
				</Link>

				<div className="flex items-center gap-3">
					<Link
						to="/reports"
						className="px-3 py-1.5 rounded-lg border border-white/25 text-sm text-[#f6f4ef] hover:bg-white/10 transition-colors"
					>
						Reports
					</Link>
					<Link
						to="/hostelcart"
						className="px-3 py-1.5 rounded-lg border border-white/25 text-sm text-[#f6f4ef] hover:bg-white/10 transition-colors"
					>
						HostelCart
					</Link>
					{userRole !== 'attendant' && (
						<Link
							to="/attendance"
							className="px-3 py-1.5 rounded-lg border border-white/25 text-sm text-[#f6f4ef] hover:bg-white/10 transition-colors"
						>
							Attendance
						</Link>
					)}
					{userRole === 'attendant' && (
						<Link
							to="/attendant/attendance"
							className="px-3 py-1.5 rounded-lg border border-white/25 text-sm text-[#f6f4ef] hover:bg-white/10 transition-colors"
						>
							Student Attendance
						</Link>
					)}
					<Link
						to="/complaints"
						className="px-3 py-1.5 rounded-lg border border-white/25 text-sm text-[#f6f4ef] hover:bg-white/10 transition-colors"
					>
						Complaints
					</Link>
					<Link
						to="/leave"
						className="px-3 py-1.5 rounded-lg border border-white/25 text-sm text-[#f6f4ef] hover:bg-white/10 transition-colors"
					>
						Leave
					</Link>
					{!hasToken ? (
						<>
							<Link to="/login" className="px-3 py-1.5 rounded-lg border border-white/25 text-sm text-[#f6f4ef] hover:bg-white/10 transition-colors">
								Login
							</Link>
							<Link
								to="/signup"
								className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md shadow-blue-500/20 transition-all duration-300 hover:scale-105"
							>
								Signup
							</Link>
						</>
					) : (
						<div className="relative" data-user-menu>
						  <button
						    type="button"
						    onClick={() => setOpen((v) => !v)}
						    className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5"
						  >
						    {userName}
						  </button>

						  {open && (
						    <div className="absolute right-0 mt-2 w-36 rounded-xl border border-gray-700/40 bg-[#020617]/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.4)] overflow-hidden">
						      <Link
						        to="/profile"
						        onClick={() => setOpen(false)}
						        className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800/40 hover:text-[#60a5fa] transition-colors"
						      >
						        Profile
						      </Link>
						      <button
						        type="button"
						        onClick={() => {
						          setOpen(false);
						          handleLogout();
						        }}
						        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800/40 hover:text-[#60a5fa] transition-colors"
						      >
						        Logout
						      </button>
						    </div>
						  )}
						</div>
					)}
				</div>
			</div>
		</header>
	);
}

export default Navbar;
