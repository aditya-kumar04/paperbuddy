import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routers
import authRouter from './src/routes/auth.js';
import superAdminRouter from './src/routes/superAdmin.js';
import schoolAdminRouter from './src/routes/schoolAdmin.js';
import accountantRouter from './src/routes/accountant.js';
import studentRouter from './src/routes/student.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // For development, allow all origins. Can be restricted to Vite port (e.g. 5173) in production
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Base health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Route bindings
app.use('/api/auth', authRouter);
app.use('/api/super-admin', superAdminRouter);
app.use('/api/school-admin', schoolAdminRouter);
app.use('/api/accountant', accountantRouter);
app.use('/api/student', studentRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error occurred' });
});

app.listen(PORT, () => {
  console.log(`PaperBuddy Backend Server listening on port ${PORT}`);
});
