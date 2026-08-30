# CampusVoice — College Complaint Management Portal
 
CampusVoice is a simple, no-login complaint management system built for college campuses. Students can raise complaints about hostel, mess, infrastructure, academics, and other campus issues, then track resolution status using a reference ID — no account required. Admins manage and resolve complaints through a separate protected panel.
 
**Live App:** [campusvoice-ccm-portal.vercel.app](https://campusvoice-ccm-portal-852cuq74i-praveen-rs-projects-64993c0a.vercel.app/)

**Live Render:** [campusvoice-ccm-portal.vercel.app](https://campusvoice-college-complaint-management.onrender.com/)
 
---
 
## Features
 
- **Submit a Complaint** — Students fill out a simple form (name optional, category, description, location/block) and receive a unique reference ID.
- **Track a Complaint** — Enter a reference ID to check current status (Pending / In Progress / Resolved) and any admin remarks.
- **Admin Panel** — Password-protected dashboard where staff can view all complaints, filter by category/status, and update status with remarks.
- **No login required for students** — Frictionless submission, identity-free by design.
---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database & Storage | Supabase |
| Source Control | GitHub |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
 
---
 
## Architecture
 
```
                 USER
                   │
                   ▼
          ┌─────────────────┐
          │     VERCEL      │
          │    Frontend     │
          │   React / Vite  │
          └────────┬────────┘
                   │
                   │ REST API
                   ▼
          ┌─────────────────┐
          │     RENDER      │
          │     Backend     │
          │  Node / Express │
          └────────┬────────┘
                   │
                   │ Database Queries
                   ▼
          ┌─────────────────┐
          │     SUPABASE     │
          │  Postgres + DB   │
          └─────────────────┘
```
 
---
 
## Project Structure
 
```
campusvoice/
│
├── frontend/          # React + Vite app (deployed to Vercel)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/           # Express API (deployed to Render)
│   ├── src/
│   ├── package.json
│   └── .env            # not committed — see below
│
└── README.md
```
 
---
 
## Environment Variables
 
Environment variables are required for both the frontend and backend. **Never commit `.env` files** — they are excluded via `.gitignore`.
 
### Backend (`backend/.env`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_PASSWORD=your_admin_panel_password
PORT=5000
FRONTEND_URL=https://your-vercel-url.vercel.app
```
 
### Frontend (`frontend/.env`)
```
VITE_API_URL=https://your-render-backend-url.onrender.com
```
 
---
 
## Running Locally
 
### Backend
```bash
cd backend
npm install
npm start
```
 
### Frontend
```bash
cd frontend
npm install
npm run dev
```
 
The frontend will run on `http://localhost:5173` (default Vite port) and expects the backend at the URL set in `VITE_API_URL`.
 
---
 
## Deployment
 
| Component | Platform |
|---|---|
| Source Code | GitHub |
| Frontend | Vercel (Root Directory: `frontend`) |
| Backend | Render (Root Directory: `backend`) |
| Database | Supabase |
 
Pushing to the `main` branch automatically triggers redeployment on both Vercel and Render.
 
---
 
## How It Works
 
1. A student submits a complaint through the **Home** page.
2. The backend stores the complaint in Supabase and returns a unique **reference ID**.
3. The student can revisit the **Track Complaint** page anytime and enter their reference ID to see the live status.
4. An admin logs into the **Admin Panel** using a shared password, views all complaints, filters by category/status, and updates the status with an optional remark.
5. Status updates are immediately reflected when the student checks their reference ID again.
---
 
## Status Legend
 
| Badge | Meaning |
|---|---|
| 🟡 Pending | Complaint received, not yet reviewed |
| 🔵 In Progress | Complaint is being addressed |
| 🟢 Resolved | Complaint has been resolved |
 
---
 
## Notes
 
- No student accounts or personal login — complaints are tracked purely via reference ID for simplicity and low friction.
- Admin access is protected by a single shared password (not full multi-user authentication), kept as a server-side environment variable.
- Built as a student project demonstrating a full-stack deployment pipeline: GitHub → Vercel (frontend) + Render (backend) → Supabase (database).
 
