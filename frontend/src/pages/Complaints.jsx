import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import getDecodedToken from '../lib/auth';
import {
	createComplaint,
	deleteComplaint,
	getAllComplaints,
	getMyComplaints,
	getOtherComplaints,
	resolveComplaint,
	updateComplaint,
} from '../api/complaint';

const categoryChoices = [
	'Electrical',
	'Plumbing',
	'Internet',
	'Cleanliness',
	'Security',
	'Mess',
	'Other',
];

const formatDate = (value) => {
	if (!value) return '-';
	try {
		return new Date(value).toLocaleString();
	} catch {
		return value;
	}
};

function Complaints() {
	const navigate = useNavigate();
	const location = useLocation();
	const [complaints, setComplaints] = useState([]);
	const [studentViewScope, setStudentViewScope] = useState('all');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState(categoryChoices[0]);
	const [images, setImages] = useState([]);

	const [editingComplaint, setEditingComplaint] = useState(null);
	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editCategory, setEditCategory] = useState(categoryChoices[0]);
	const [editImages, setEditImages] = useState([]);

	const user = useMemo(() => getDecodedToken(), []);
	const isAttendant = user?.role === 'attendant';

	const getRaisedById = (complaint) => {
		const raisedBy = complaint?.raisedBy;
		if (!raisedBy) return '';
		if (typeof raisedBy === 'string') return raisedBy;
		if (typeof raisedBy === 'object') return raisedBy._id || '';
		return '';
	};

	const loadComplaints = async () => {
		setLoading(true);
		setError('');
		try {
			let data = [];
			if (isAttendant) {
				data = await getOtherComplaints();
			} else if (studentViewScope === 'all') {
				data = await getAllComplaints();
			} else {
				data = await getMyComplaints();
			}
			setComplaints(data);
		} catch (err) {
			setError(err?.message || 'Failed to fetch complaints');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!user) {
			navigate('/login', { state: { from: location.pathname } });
			return;
		}
		loadComplaints();
	}, [studentViewScope]);

	const resetCreateForm = () => {
		setTitle('');
		setDescription('');
		setCategory(categoryChoices[0]);
		setImages([]);
	};

	const handleCreateComplaint = async (e) => {
		e.preventDefault();
		if (!title.trim() || !description.trim() || !category) {
			setError('Please fill title, description and category');
			return;
		}

		setError('');
		setSuccess('');
		try {
			await createComplaint({
				title: title.trim(),
				description: description.trim(),
				category,
				images,
			});
			setSuccess('Complaint raised successfully');
			resetCreateForm();
			loadComplaints();
		} catch (err) {
			setError(err?.message || 'Failed to raise complaint');
		}
	};

	const openEdit = (complaint) => {
		setEditingComplaint(complaint);
		setEditTitle(complaint.title || '');
		setEditDescription(complaint.description || '');
		setEditCategory(complaint.category || categoryChoices[0]);
		setEditImages([]);
		setError('');
		setSuccess('');
	};

	const handleEditComplaint = async (e) => {
		e.preventDefault();
		if (!editingComplaint?._id) return;
		if (!editTitle.trim() || !editDescription.trim() || !editCategory) {
			setError('Please fill title, description and category');
			return;
		}

		setError('');
		setSuccess('');
		try {
			await updateComplaint({
				id: editingComplaint._id,
				title: editTitle.trim(),
				description: editDescription.trim(),
				category: editCategory,
				images: editImages,
			});
			setSuccess('Complaint updated successfully');
			setEditingComplaint(null);
			setEditImages([]);
			loadComplaints();
		} catch (err) {
			setError(err?.message || 'Failed to update complaint');
		}
	};

	const handleDeleteComplaint = async (id) => {
		const shouldDelete = window.confirm('Delete this complaint permanently?');
		if (!shouldDelete) return;

		setError('');
		setSuccess('');
		try {
			await deleteComplaint(id);
			setSuccess('Complaint deleted successfully');
			loadComplaints();
		} catch (err) {
			setError(err?.message || 'Failed to delete complaint');
		}
	};

	const handleResolveComplaint = async (id) => {
		setError('');
		setSuccess('');
		try {
			await resolveComplaint(id);
			setSuccess('Complaint marked as resolved');
			loadComplaints();
		} catch (err) {
			setError(err?.message || 'Failed to resolve complaint');
		}
	};

	const heading = isAttendant
		? 'Student Complaints'
		: studentViewScope === 'all'
			? 'All Complaints'
			: 'My Complaints';

	return (
		<div className="min-h-screen bg-[#0d1117] text-white">
			<Navbar />
			<main className="max-w-6xl mx-auto px-6 py-10">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
					<div>
						<h1 className="text-3xl font-extrabold">{heading}</h1>
						<p className="text-sm text-gray-300 mt-1">
							{isAttendant
								? 'Review complaints and mark them resolved after action is taken.'
								: studentViewScope === 'all'
									? 'Browse all complaints raised by students.'
									: 'Raise, edit, and track your hostel complaints in one place.'}
						</p>
					</div>
					<div className="flex items-center gap-2">
						{!isAttendant && (
							<select
								value={studentViewScope}
								onChange={(e) => setStudentViewScope(e.target.value)}
								className="px-3 py-2 rounded-md bg-[#1f2937] border border-white/10 text-sm"
							>
								<option value="all">All Complaints</option>
								<option value="mine">My Complaints</option>
							</select>
						)}
						<button
							type="button"
							onClick={loadComplaints}
							className="px-4 py-2 rounded-md bg-[#1f2937] border border-white/10 hover:bg-[#273549]"
						>
							Refresh
						</button>
					</div>
				</div>

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

				{!isAttendant && (
					<section className="rounded-2xl border border-white/10 bg-[#111827] p-5 mb-8">
						<h2 className="text-xl font-semibold mb-4">Raise New Complaint</h2>
						<form onSubmit={handleCreateComplaint} className="grid gap-4 md:grid-cols-2">
							<div className="md:col-span-1">
								<label className="block text-sm text-gray-300 mb-1">Title</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2"
									placeholder="Eg: Water leakage in room"
									required
								/>
							</div>

							<div className="md:col-span-1">
								<label className="block text-sm text-gray-300 mb-1">Category</label>
								<select
									value={category}
									onChange={(e) => setCategory(e.target.value)}
									className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2"
								>
									{categoryChoices.map((choice) => (
										<option key={choice} value={choice}>
											{choice}
										</option>
									))}
								</select>
							</div>

							<div className="md:col-span-2">
								<label className="block text-sm text-gray-300 mb-1">Description</label>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2 h-28"
									placeholder="Describe your issue in detail"
									required
								/>
							</div>

							<div className="md:col-span-2">
								<label className="block text-sm text-gray-300 mb-1">Upload Images (max 5)</label>
								<input
									type="file"
									accept="image/*"
									multiple
									onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 5))}
									className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2"
								/>
								{images.length > 0 && (
									<p className="mt-2 text-xs text-gray-400">{images.length} image(s) selected</p>
								)}
							</div>

							<div className="md:col-span-2 flex justify-end">
								<button
									type="submit"
									className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-md font-semibold"
								>
									Raise Complaint
								</button>
							</div>
						</form>
					</section>
				)}

				<section className="space-y-4">
					{loading ? (
						<div className="rounded-xl border border-white/10 bg-[#111827] px-4 py-6 text-gray-300">Loading complaints...</div>
					) : complaints.length === 0 ? (
						<div className="rounded-xl border border-white/10 bg-[#111827] px-4 py-6 text-gray-300">No complaints found.</div>
					) : (
						complaints.map((complaint) => {
							const isResolved = complaint.status === 'resolved';
							const isOwnComplaint = String(getRaisedById(complaint)) === String(user?.userId || '');
							const showStudentDetails = !isAttendant && studentViewScope === 'all';
							return (
								<article key={complaint._id} className="rounded-xl border border-white/10 bg-[#111827] p-5">
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
										<div>
											<h3 className="text-lg font-semibold">{complaint.title}</h3>
											<p className="text-xs text-gray-400 mt-1">
												Category: {complaint.category} | Raised: {formatDate(complaint.createdAt)}
											</p>
											{isAttendant && complaint.raisedBy && (
												<p className="text-xs text-gray-400 mt-1">
													By: {complaint.raisedBy.name || complaint.raisedBy.email || 'Student'}
												</p>
											)}
											{showStudentDetails && typeof complaint.raisedBy === 'object' && complaint.raisedBy && (
												<p className="text-xs text-gray-400 mt-1">
													By: {complaint.raisedBy.name || complaint.raisedBy.email || 'Student'}
												</p>
											)}
										</div>
										<span
											className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
												isResolved
													? 'bg-green-500/20 text-green-300 border border-green-500/40'
													: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
											}`}
										>
											{isResolved ? 'Resolved' : 'Pending'}
										</span>
									</div>

									<p className="text-gray-200 whitespace-pre-wrap">{complaint.description}</p>

									{Array.isArray(complaint.images) && complaint.images.length > 0 && (
										<div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
											{complaint.images.map((img, idx) => (
												<img
													key={`${complaint._id}-img-${idx}`}
													src={img}
													alt={`complaint-${idx + 1}`}
													className="h-28 w-full rounded-md object-cover border border-white/10"
												/>
											))}
										</div>
									)}

									<div className="mt-4 flex flex-wrap gap-2">
										{!isAttendant && isOwnComplaint && !isResolved && (
											<>
												<button
													type="button"
													onClick={() => openEdit(complaint)}
													className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-sm"
												>
													Edit
												</button>
												<button
													type="button"
													onClick={() => handleDeleteComplaint(complaint._id)}
													className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-sm"
												>
													Delete
												</button>
											</>
										)}

										{isAttendant && !isResolved && (
											<button
												type="button"
												onClick={() => handleResolveComplaint(complaint._id)}
												className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-sm"
											>
												Mark Resolved
											</button>
										)}
									</div>
								</article>
							);
						})
					)}
				</section>
			</main>

			{editingComplaint && (
				<div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
					<div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-6">
						<h2 className="text-2xl font-bold mb-4">Edit Complaint</h2>
						<form onSubmit={handleEditComplaint} className="space-y-4">
							<div>
								<label className="block text-sm text-gray-300 mb-1">Title</label>
								<input
									type="text"
									value={editTitle}
									onChange={(e) => setEditTitle(e.target.value)}
									className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2"
									required
								/>
							</div>
							<div>
								<label className="block text-sm text-gray-300 mb-1">Category</label>
								<select
									value={editCategory}
									onChange={(e) => setEditCategory(e.target.value)}
									className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2"
								>
									{categoryChoices.map((choice) => (
										<option key={choice} value={choice}>
											{choice}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm text-gray-300 mb-1">Description</label>
								<textarea
									value={editDescription}
									onChange={(e) => setEditDescription(e.target.value)}
									className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2 h-28"
									required
								/>
							</div>
							<div>
								<label className="block text-sm text-gray-300 mb-1">Replace Images (optional, max 5)</label>
								<input
									type="file"
									accept="image/*"
									multiple
									onChange={(e) => setEditImages(Array.from(e.target.files || []).slice(0, 5))}
									className="w-full rounded-md bg-[#0f172a] border border-gray-600 px-3 py-2"
								/>
							</div>
							<div className="flex justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={() => setEditingComplaint(null)}
									className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700"
								>
									Save Changes
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

export default Complaints;
