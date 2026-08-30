import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { apiRouter } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration for Render + Vercel
const frontendUrl = process.env.FRONTEND_URL;
if (frontendUrl) {
  app.use(
    cors({
      origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    })
  );
} else {
  app.use(cors());
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'College Complaint Management System API',
    timestamp: new Date().toISOString(),
  });
});

// Root API description
app.get('/', (req, res) => {
  res.json({
    message: 'College Complaint Management Backend API is running.',
    endpoints: {
      health: '/api/health',
      complaints: '/api/complaints',
      track: '/api/complaints/track/:referenceId',
      adminVerify: '/api/admin/verify',
      adminComplaints: '/api/admin/complaints',
      adminStats: '/api/admin/stats',
      dbStatus: '/api/db/status',
    },
  });
});

// Mount main API routes
app.use('/api', apiRouter);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 College Complaint Backend API running on port ${PORT}`);
});

export default app;
