import React from 'react';
import {
  GraduationCap,
  Sparkles,
  Camera,
  Users,
  AlertTriangle,
  Bot,
  BarChart3,
  QrCode,
  CheckCircle2,
  Plus,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'admissions' | 'attendance' | 'risk-radar' | 'students' | 'counselor' | 'analytics';
  setActiveTab: (tab: 'admissions' | 'attendance' | 'risk-radar' | 'students' | 'counselor' | 'analytics') => void;
  openNewAppModal: () => void;
  openKioskModal: () => void;
  pendingReviewsCount: number;
  criticalRiskCount: number;
  overallAttendanceRate: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openNewAppModal,
  openKioskModal,
  pendingReviewsCount,
  criticalRiskCount,
  overallAttendanceRate,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Top Banner / System Telemetry */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 px-4 py-1.5 text-xs border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-indigo-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            EduPulse Institutional AI Engine
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">Model: Gemini 3.8 Flash (Multimodal OCR & Vision)</span>
        </div>

        <div className="flex items-center gap-4 text-slate-300 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Institutional Attendance:</span>
            <span className="font-semibold text-emerald-400">{overallAttendanceRate.toFixed(1)}%</span>
          </div>
          {criticalRiskCount > 0 && (
            <div className="flex items-center gap-1 text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              <AlertTriangle className="w-3 h-3" />
              <span>{criticalRiskCount} Defaulters flagged</span>
            </div>
          )}
          <div className="text-slate-400 hidden md:block">
            Fall 2026 Academic Term
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-sans flex items-center gap-2">
                EduPulse <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
              </h1>
              <span className="bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-500/20">
                Automated Suite
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal">Student Admissions & Vision Attendance Automation</p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={openKioskModal}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition shadow-sm hover:border-slate-600 cursor-pointer"
            title="Open Digital QR Student Kiosk Scanner"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">QR Kiosk Check-In</span>
          </button>

          <button
            onClick={openNewAppModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Applicant</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          <button
            onClick={() => setActiveTab('admissions')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'admissions'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admissions Hub</span>
            {pendingReviewsCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  activeTab === 'admissions'
                    ? 'bg-indigo-800 text-indigo-100'
                    : 'bg-indigo-500/20 text-indigo-300'
                }`}
              >
                {pendingReviewsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Classroom Vision & Roll Call</span>
          </button>

          <button
            onClick={() => setActiveTab('risk-radar')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'risk-radar'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Defaulter & Dropout Radar</span>
            {criticalRiskCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {criticalRiskCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student Directory (360°)</span>
          </button>

          <button
            onClick={() => setActiveTab('counselor')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'counselor'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Advisor & Policy Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Yield</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
