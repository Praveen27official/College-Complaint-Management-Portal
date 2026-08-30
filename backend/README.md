# College Complaint Management System — Backend

Standalone Node.js / Express REST API backend with optional Supabase PostgreSQL integration.

## Features
- **Public Complaint Submission**: Anonymous or named grievance submission generating unique reference IDs (`CMP-YYYY-XXXX`).
- **Real-Time Status Tracking**: Instant query by reference ID with resolution timeline.
- **Secure Administrative APIs**: Passcode-protected endpoints for status management (`Pending` ➔ `In Progress` ➔ `Resolved`), remarks, and metrics.
- **Supabase Integration & Fallback**: Native Supabase table integration with in-memory persistence fallback for seamless local/preview testing.

## Local Development
```bash
npm install
npm run dev
```

## Production Deployment (Render)
1. Push this `backend/` folder (or root repository with Root Directory set to `backend`) to GitHub.
2. Create a new **Web Service** on [Render](https://dashboard.render.com).
3. Set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables from `.env.example`.
