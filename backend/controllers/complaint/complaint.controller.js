import Complaint from '../../models/complaint.model.js';
import { uploadImage, deleteFile } from '../../util/cloud.js';

// Create a new complaint
export const createComplaint = async (req, res) => {
	try {
		const { title, description, category } = req.body;
		const files = req.files;

		if (!title || !description || !category) {
			return res.status(400).json({ message: 'Title, description, and category are required' });
		}

		let imageUrls = [];
		if (files && files.length > 0) {
			for (const file of files) {
				const result = await uploadImage(file.buffer);
				imageUrls.push(result.secure_url);
			}
		}

		const complaint = new Complaint({
			title,
			description,
			category,
			images: imageUrls,
			raisedBy: req.user.userId,
		});

		await complaint.save();

		res.status(201).json({ message: 'Complaint raised successfully', complaint });
	} catch (error) {
		console.error('Error creating complaint:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

// Update a complaint (only by the raiser)
export const updateComplaint = async (req, res) => {
	try {
		const { id, title, description, category } = req.body;
		const files = req.files;

		if (!id) {
			return res.status(400).json({ message: 'Complaint ID is required' });
		}

		const complaint = await Complaint.findById(id);
		if (!complaint) {
			return res.status(404).json({ message: 'Complaint not found' });
		}

		if (complaint.raisedBy.toString() !== req.user.userId) {
			return res.status(403).json({ message: 'You can only update your own complaints' });
		}

		let imageUrls = complaint.images; // keep existing
		if (files && files.length > 0) {
			// Delete old images
			for (const url of complaint.images) {
				await deleteFile(url);
			}
			// Upload new ones
			imageUrls = [];
			for (const file of files) {
				const result = await uploadImage(file.buffer);
				imageUrls.push(result.secure_url);
			}
		}

		complaint.title = title || complaint.title;
		complaint.description = description || complaint.description;
		complaint.category = category || complaint.category;
		complaint.images = imageUrls;

		await complaint.save();

		res.json({ message: 'Complaint updated successfully', complaint });
	} catch (error) {
		console.error('Error updating complaint:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

// Delete a complaint (only by the raiser)
export const deleteComplaint = async (req, res) => {
	try {
		const { id } = req.body;

		if (!id) {
			return res.status(400).json({ message: 'Complaint ID is required' });
		}

		const complaint = await Complaint.findById(id);
		if (!complaint) {
			return res.status(404).json({ message: 'Complaint not found' });
		}

		if (complaint.raisedBy.toString() !== req.user.userId) {
			return res.status(403).json({ message: 'You can only delete your own complaints' });
		}

		// Delete images from cloud
		for (const url of complaint.images) {
			await deleteFile(url);
		}

		await Complaint.findByIdAndDelete(id);

		res.json({ message: 'Complaint deleted successfully' });
	} catch (error) {
		console.error('Error deleting complaint:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

// Get all complaints (public)
export const getAllComplaints = async (req, res) => {
	try {
		const complaints = await Complaint.find({})
			.populate('raisedBy', 'name email roomNumber hostelName')
			.sort({ createdAt: -1 });

		res.json({ complaints });
	} catch (error) {
		console.error('Error fetching complaints:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

// Get user's own complaints
export const getUserComplaints = async (req, res) => {
	try {
		const complaints = await Complaint.find({ raisedBy: req.user.userId })
			.sort({ createdAt: -1 });

		res.json({ complaints });
	} catch (error) {
		console.error('Error fetching user complaints:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

// Get complaints by others
export const getOtherComplaints = async (req, res) => {
	try {
		const complaints = await Complaint.find({ raisedBy: { $ne: req.user.userId } })
			.populate('raisedBy', 'name email roomNumber hostelName')
			.sort({ createdAt: -1 });

		res.json({ complaints });
	} catch (error) {
		console.error('Error fetching other complaints:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

// Get complaints by category
export const getComplaintsByCategory = async (req, res) => {
	try {
		const { category } = req.query;

		if (!category) {
			return res.status(400).json({ message: 'Category is required' });
		}

		const complaints = await Complaint.find({ category })
			.populate('raisedBy', 'name email roomNumber hostelName')
			.sort({ createdAt: -1 });

		res.json({ complaints });
	} catch (error) {
		console.error('Error fetching complaints by category:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

// Mark complaint as resolved (for attendant/warden, middleware later)
export const resolveComplaint = async (req, res) => {
	try {
		const { id } = req.body;

		if (req.user?.role !== 'attendant') {
			return res.status(403).json({ message: 'Only attendants can resolve complaints' });
		}

		if (!id) {
			return res.status(400).json({ message: 'Complaint ID is required' });
		}

		const complaint = await Complaint.findById(id);
		if (!complaint) {
			return res.status(404).json({ message: 'Complaint not found' });
		}

		complaint.status = 'resolved';
		await complaint.save();

		res.json({ message: 'Complaint marked as resolved', complaint });
	} catch (error) {
		console.error('Error resolving complaint:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};