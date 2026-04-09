import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import connectDB from './configs/database.js';
import attendanceRouter from './routes/attendance.route.js';
import hostelCartRouter from './routes/hostelcart.route.js';
import userRouter from './routes/user.route.js';
import attendantRouter from './routes/attendant.route.js';
import reportRouter from './routes/report.route.js';
import complaintRouter from './routes/complaint.routes.js';

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				return callback(null, true);
			}

			return callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
	})
);
app.use(express.json());
app.use('/api/v1/user', userRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/hostelcart', hostelCartRouter);
app.use('/api/v1/attendant', attendantRouter);
app.use('/api/v1/report', reportRouter);
app.use('/api/v1/complaint', complaintRouter);

app.get('/', (req, res) => {
	res.json({ status: 'hello from staynexus' });
});

const start = async () => {
	await connectDB();
	app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
};

start();
