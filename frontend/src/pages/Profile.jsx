import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import getDecodedToken from '../lib/auth';
import { updatePhoneNumber as updatePhoneNumberApi } from '../api/user';

function Profile() {
  const [user, setUser] = useState(() => getDecodedToken());
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setPhoneNumber(user?.phoneNumber ? String(user.phoneNumber) : '');
  }, [user]);

  const handlePhoneNumberUpdate = async (e) => {
    e.preventDefault();
    const trimmedPhone = phoneNumber.trim();

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError('Phone number must be exactly 10 digits.');
      setSuccess('');
      return;
    }

    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      const data = await updatePhoneNumberApi(trimmedPhone);

      if (data?.token) {
        localStorage.setItem('token', data.token);
      }

      const refreshedUser = getDecodedToken();
      if (refreshedUser) {
        setUser(refreshedUser);
      } else if (data?.user) {
        setUser((prev) => ({ ...(prev || {}), ...data.user }));
      }

      setPhoneNumber(trimmedPhone);
      setSuccess(data?.message || 'Phone number updated successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to update phone number.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-extrabold mb-8">Profile</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300 text-sm">
            {success}
          </div>
        )}

        {!user ? (
          <div className="rounded-xl border border-white/10 bg-[#111827] p-6 text-gray-300">
            You are not logged in. Please sign in to view your profile.
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#111827] p-6 space-y-6">
            <div>
              <p className="text-sm text-gray-400">Name</p>
              <p className="text-lg font-semibold">{user.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-lg font-semibold">{user.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Phone Number</p>
              <p className="text-lg font-semibold">{user.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Hostel</p>
              <p className="text-lg font-semibold">{user.hostelName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Room Number</p>
              <p className="text-lg font-semibold">{user.roomNumber || 'N/A'}</p>
            </div>

            <form onSubmit={handlePhoneNumberUpdate} className="pt-2 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-2">Update Phone Number</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    setPhoneNumber(digitsOnly);
                  }}
                  placeholder="Enter 10-digit phone number"
                  className="w-full rounded-md border border-white/10 bg-[#0d1117] px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdating}
                  required
                />
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-md bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Save Number'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default Profile;
