import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Leave() {
	const [formData, setFormData] = useState({
		fromDate: "",
		toDate: "",
		reason: "",
		type: "Casual Leave",
	});

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
	};

	return (
		
		<div className="min-h-screen bg-[#0f172a] text-white">
			<Navbar />
			<div className="w-full max-w-2xl mx-auto mt-10 bg-[#111827] rounded-2xl shadow-lg p-8 border border-gray-800">

				<h1 className="text-3xl font-semibold mb-2 text-blue-500">
					Leave Application
				</h1>
				<p className="text-gray-400 mb-6">
					Submit your leave request in a clean and professional way.
				</p>

				<form onSubmit={handleSubmit} className="space-y-5">

					{/* Leave Type */}
					<div>
						<label className="block text-sm mb-2 text-gray-300">
							Leave Type
						</label>
						<select
							name="type"
							value={formData.type}
							onChange={handleChange}
							className="w-full p-3 rounded-lg bg-[#0f172a] border border-gray-700 focus:border-blue-500 outline-none"
						>
							<option>Casual Leave</option>
							<option>Sick Leave</option>
							<option>Emergency Leave</option>
						</select>
					</div>

					{/* From Date */}
					<div>
						<label className="block text-sm mb-2 text-gray-300">
							From Date
						</label>
						<input
							type="date"
							name="fromDate"
							value={formData.fromDate}
							onChange={handleChange}
							className="w-full p-3 rounded-lg bg-[#0f172a] border border-gray-700 focus:border-blue-500 outline-none text-white"
						/>
					</div>

					{/* To Date */}
					<div>
						<label className="block text-sm mb-2 text-gray-300">
							To Date
						</label>
						<input
							type="date"
							name="toDate"
							value={formData.toDate}
							onChange={handleChange}
							className="w-full p-3 rounded-lg bg-[#0f172a] border border-gray-700 focus:border-blue-500 outline-none text-white"
						/>
					</div>

					{/* Reason */}
					<div>
						<label className="block text-sm mb-2 text-gray-300">
							Reason
						</label>
						<textarea
							name="reason"
							value={formData.reason}
							onChange={handleChange}
							rows="4"
							placeholder="Write your reason..."
							className="w-full p-3 rounded-lg bg-[#0f172a] border border-gray-700 focus:border-blue-500 outline-none"
						/>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all font-medium"
					>
						Submit Request
					</button>

				</form>
			</div>
		</div>
	);
}