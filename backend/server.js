// config.js MUST be the first import: it loads .env and validates required
// secrets before any other module (routers, middlewares, prisma client) runs.
import { PORT, ALLOWED_ORIGINS } from './src/config.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import routers
import authRouter from './src/routes/auth.js';
import superAdminRouter from './src/routes/superAdmin.js';
import schoolAdminRouter from './src/routes/schoolAdmin.js';
import accountantRouter from './src/routes/accountant.js';
import studentRouter from './src/routes/student.js';
import { apiLimiter } from './src/middlewares/rateLimit.js';

const app = express();

// Sets a set of sensible security-related HTTP headers (X-Content-Type-Options,
// Strict-Transport-Security, disables X-Powered-By, etc.)
app.use(helmet());

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS, // Restricted to FRONTEND_URL (comma-separated list) from env
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Baseline rate limit across the whole API; individual auth endpoints layer
// tighter limiters on top (see routes/auth.js).
app.use('/api', apiLimiter);

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