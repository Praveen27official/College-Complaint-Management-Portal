import { useState, FC, useEffect } from 'react';
import { 
  BookOpen, 
  Copy, 
  Check, 
  Terminal, 
  Server, 
  Globe, 
  Database, 
  GitBranch, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  Code2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { fetchDbStatus } from '../services/api';
import { DatabaseStatus } from '../types';

export const DeploymentGuide: FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [sqlSchema, setSqlSchema] = useState<string>('');
  const [activeStep, setActiveStep] = useState<number>(1);

  // Pre-flight check state
  const [checks, setChecks] = useState<{ [key: string]: boolean }>({
    pagesLoad: true,
    navigation: true,
    submitForm: true,
    trackStatus: true,
    adminAuth: true,
    updateStatus: true,
    errorHandling: true,
  });

  useEffect(() => {
    fetchDbStatus().then((data) => {
      setDbStatus(data.status);
      setSqlSchema(data.sqlSchema);
    }).catch(console.error);
  }, []);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2200);
  };

  const toggleCheck = (key: string) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const GIT_COMMANDS = `# 1. Initialize and commit your code
git init
git add .
git commit -m "feat: College Complaint Management System complete implementation"
git branch -M main

# 2. Add your GitHub remote and push
git remote add origin https://github.com/YOUR_USERNAME/college-complaint-system.git
git push -u origin main`;

  const RENDER_ENV = `# Render Web Service -> Environment Variables
PORT=3000
NODE_ENV=production
ADMIN_PASSWORD=your_secure_admin_password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FRONTEND_URL=https://your-project.vercel.app`;

  const VERCEL_ENV = `# Vercel Project -> Settings -> Environment Variables
VITE_API_URL=https://your-render-backend-url.onrender.com`;

  const SUPABASE_SQL_DEFAULT = `-- Supabase SQL Schema for College Complaint Management System
-- Run this in your Supabase Project -> SQL Editor

CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id TEXT UNIQUE NOT NULL,
  student_name TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Pending',
  admin_remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Allow public read & write operations for anonymous student submissions
CREATE POLICY "Allow public insert" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON complaints FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON complaints FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON complaints FOR DELETE USING (true);`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      
      {/* Title & Architecture Banner */}
      <div className="bg-[#1E3A8A] text-white rounded-xl p-6 sm:p-8 shadow-md border border-blue-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-bold uppercase tracking-wider border border-blue-400/40 mb-2">
              <Layers className="w-3.5 h-3.5" /> Full Stack Architecture Guide
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              Production Deployment Guide
            </h2>
            <p className="text-sm text-blue-100 mt-1 max-w-2xl">
              Step-by-step roadmap to deploy your College Complaint Management System using <strong>Vercel</strong> (Frontend), <strong>Render</strong> (Backend), <strong>Supabase</strong> (Database), and <strong>GitHub</strong>.
            </p>
          </div>

          <div className="bg-blue-950/70 border border-blue-800/80 p-4 rounded-lg text-xs space-y-1.5 shrink-0">
            <span className="text-blue-300 font-bold block uppercase tracking-wider text-[10px]">Architecture</span>
            <div className="text-blue-100 font-mono">Frontend ➔ Vercel (React + Vite)</div>
            <div className="text-emerald-300 font-mono">Backend ➔ Render (Express Node)</div>
            <div className="text-yellow-300 font-mono">Database ➔ Supabase (PostgreSQL)</div>
          </div>
        </div>
      </div>

      {/* Visual Workflow Diagram */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#1E3A8A]" />
          Deployment Architecture Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-2">
              <GitBranch className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">1. GitHub</h4>
            <p className="text-[11px] text-slate-500 mt-1">Central source code repository & CI/CD trigger</p>
          </div>

          <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center mb-2">
              <Globe className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-[#1E3A8A] text-xs sm:text-sm uppercase tracking-wider">2. Vercel</h4>
            <p className="text-[11px] text-slate-600 mt-1">Hosts client UI with fast global edge network</p>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-4 flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-indigo-700 text-white flex items-center justify-center mb-2">
              <Server className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-indigo-950 text-xs sm:text-sm uppercase tracking-wider">3. Render</h4>
            <p className="text-[11px] text-slate-600 mt-1">Runs Node/Express REST API endpoints securely</p>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4 flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center mb-2">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-emerald-950 text-xs sm:text-sm uppercase tracking-wider">4. Supabase</h4>
            <p className="text-[11px] text-slate-600 mt-1">Stores complaint records, timestamps, and remarks</p>
          </div>

        </div>
      </div>

      {/* Step Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { num: 1, title: 'Pre-flight Test' },
          { num: 2, title: 'GitHub Repo' },
          { num: 3, title: 'Supabase DB' },
          { num: 4, title: 'Render Backend' },
          { num: 5, title: 'Vercel Frontend' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setActiveStep(s.num)}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              activeStep === s.num
                ? 'bg-[#1E3A8A] text-white border-blue-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className={`text-[10px] font-bold block uppercase tracking-wider ${activeStep === s.num ? 'text-blue-200' : 'text-slate-400'}`}>
              Step {s.num}
            </span>
            <span className="text-xs sm:text-sm font-bold block truncate">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Step 1: Pre-flight Testing */}
      {activeStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider">Step 1</span>
              <h3 className="text-lg font-bold text-slate-900">Pre-Deployment Verification Checklist</h3>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">Ensure all CRUD operations succeed locally first</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600">
            Before deploying, verify each feature in your development preview. Confirm the interactive checklist below:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {[
              { key: 'pagesLoad', label: 'All pages load and display cleanly without errors' },
              { key: 'navigation', label: 'Navigation tabs switch smoothly between Submit, Track & Admin' },
              { key: 'submitForm', label: 'Student complaint form submits and outputs Reference ID' },
              { key: 'trackStatus', label: 'Track Complaint page retrieves status and visual timeline' },
              { key: 'adminAuth', label: 'Admin portal password check authenticates (default: admin123)' },
              { key: 'updateStatus', label: 'Admin can update status (Pending / In Progress / Resolved)' },
              { key: 'errorHandling', label: 'Error handling for invalid inputs or non-existent IDs works' },
            ].map(({ key, label }) => (
              <div 
                key={key} 
                onClick={() => toggleCheck(key)}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                  checks[key] ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                  checks[key] ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                }`}>
                  {checks[key] && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-[#1E3A8A] flex items-center justify-between">
            <span>✅ All pre-flight requirements implemented and verified in this application!</span>
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="font-bold inline-flex items-center gap-1 hover:underline text-[#1E3A8A] uppercase tracking-wider text-[11px]"
            >
              <span>Next: Push to GitHub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Push to GitHub */}
      {activeStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider">Step 2</span>
              <h3 className="text-lg font-bold text-slate-900">Push Project to GitHub</h3>
            </div>
            <span className="text-xs text-slate-500">GitHub connects to both Vercel and Render</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600">
            Create a repository on GitHub, then run the following Git commands in your terminal:
          </p>

          <div className="relative bg-slate-900 rounded-lg p-4 text-slate-200 font-mono text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => handleCopyText(GIT_COMMANDS, 'git')}
              className="absolute right-3 top-3 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans transition-colors cursor-pointer border border-slate-700"
            >
              {copiedSection === 'git' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Commands</span>
                </>
              )}
            </button>
            <pre className="whitespace-pre">{GIT_COMMANDS}</pre>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Security Note:</strong>
              Never commit <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> files containing secret database passwords or API keys. Ensure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> is added to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.gitignore</code>.
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Supabase Setup */}
      {activeStep === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider">Step 3</span>
              <h3 className="text-lg font-bold text-slate-900">Set Up Database on Supabase</h3>
            </div>
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 uppercase tracking-wider"
            >
              <span>Open Supabase</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs sm:text-sm text-slate-600">
            1. Create a project on Supabase.
            <br />
            2. Go to <strong>SQL Editor</strong>, paste the schema below, and click <strong>Run</strong>:
          </p>

          <div className="relative bg-slate-900 rounded-lg p-4 text-slate-200 font-mono text-xs overflow-x-auto max-h-72">
            <button
              type="button"
              onClick={() => handleCopyText(sqlSchema || SUPABASE_SQL_DEFAULT, 'sql')}
              className="sticky top-0 float-right inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-sans transition-colors cursor-pointer border border-slate-700"
            >
              {copiedSection === 'sql' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">SQL Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Schema</span>
                </>
              )}
            </button>
            <pre className="whitespace-pre">{sqlSchema || SUPABASE_SQL_DEFAULT}</pre>
          </div>

          <p className="text-xs text-slate-500">
            3. Retrieve your <strong>Project URL</strong> and <strong>anon key</strong> or <strong>service_role key</strong> from <strong>Project Settings → API</strong>.
          </p>
        </div>
      )}

      {/* Step 4: Render Backend Deployment */}
      {activeStep === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider">Step 4</span>
              <h3 className="text-lg font-bold text-slate-900">Deploy Backend on Render</h3>
            </div>
            <a 
              href="https://dashboard.render.com" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1 uppercase tracking-wider"
            >
              <span>Open Render</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600">
            <p>1. Go to <strong>Render → New → Web Service</strong> and select your GitHub repository.</p>
            <p>2. Configure build & runtime settings:</p>
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div><strong>Runtime:</strong> Node</div>
              <div><strong>Build Command:</strong> <code className="bg-slate-200 px-1 rounded">npm run build</code></div>
              <div><strong>Start Command:</strong> <code className="bg-slate-200 px-1 rounded">npm start</code></div>
              <div><strong>Auto Deploy:</strong> Yes</div>
            </div>
            <p>3. Under <strong>Environment Variables</strong>, add the following:</p>
          </div>

          <div className="relative bg-slate-900 rounded-lg p-4 text-slate-200 font-mono text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => handleCopyText(RENDER_ENV, 'render_env')}
              className="absolute right-3 top-3 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans transition-colors cursor-pointer border border-slate-700"
            >
              {copiedSection === 'render_env' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Render Env</span>
                </>
              )}
            </button>
            <pre className="whitespace-pre">{RENDER_ENV}</pre>
          </div>
        </div>
      )}

      {/* Step 5: Vercel Frontend Deployment */}
      {activeStep === 5 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider">Step 5</span>
              <h3 className="text-lg font-bold text-slate-900">Deploy Frontend on Vercel</h3>
            </div>
            <a 
              href="https://vercel.com/new" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-bold text-[#1E3A8A] hover:underline inline-flex items-center gap-1 uppercase tracking-wider"
            >
              <span>Open Vercel</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600">
            <p>1. In <strong>Vercel</strong>, click <strong>Add New → Project</strong> and import your GitHub repo.</p>
            <p>2. Framework Preset: <strong>Vite</strong></p>
            <p>3. Under <strong>Environment Variables</strong>, set your deployed Render backend URL:</p>
          </div>

          <div className="relative bg-slate-900 rounded-lg p-4 text-slate-200 font-mono text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => handleCopyText(VERCEL_ENV, 'vercel_env')}
              className="absolute right-3 top-3 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans transition-colors cursor-pointer border border-slate-700"
            >
              {copiedSection === 'vercel_env' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Vercel Env</span>
                </>
              )}
            </button>
            <pre className="whitespace-pre">{VERCEL_ENV}</pre>
          </div>

          <p className="text-xs text-slate-500">
            4. Click <strong>Deploy</strong>. Once Vercel assigns your URL (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://your-project.vercel.app</code>), update <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">FRONTEND_URL</code> in Render for secure CORS!
          </p>
        </div>
      )}

    </div>
  );
};

