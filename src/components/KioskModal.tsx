import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import {
  QrCode,
  CheckCircle2,
  X,
  Scan,
  Volume2,
  Clock,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface KioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onCheckInSuccess: (student: Student) => void;
}

export const KioskModal: React.FC<KioskModalProps> = ({
  isOpen,
  onClose,
  students,
  onCheckInSuccess,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [lastCheckIn, setLastCheckIn] = useState<{
    student: Student;
    timestamp: string;
    verified: boolean;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Ignored if audio restricted
    }
  };

  const handleSimulateScan = (studentToScan?: Student) => {
    const student = studentToScan || students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    playChime();
    setLastCheckIn({
      student,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      verified: true,
    });

    onCheckInSuccess(student);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Kiosk Banner */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Contactless QR & Biometric Entrance Kiosk</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                  ACTIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400">Lecture Hall 402B Entrance • Autonomous Attendance Logging</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kiosk Screen */}
        <div className="p-6 space-y-6">
          {/* Digital Clock Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-cyan-300 tracking-wider">{currentTime}</div>
          </div>

          {/* Scanner Simulation Window */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
            {/* Target Reticle */}
            <div className="relative w-44 h-44 border-2 border-dashed border-cyan-500/60 rounded-2xl flex items-center justify-center bg-cyan-950/10 shadow-inner">
              <Scan className="w-16 h-16 text-cyan-400/80 animate-pulse" />
              {/* Corner markers */}
              <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
              <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
              <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
            </div>

            <p className="text-xs text-slate-400 mt-4">
              Hold digital or physical Student ID QR Badge in front of reader
            </p>
          </div>

          {/* Recent Check-In Success Card */}
          {lastCheckIn && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between text-xs animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <img
                  src={lastCheckIn.student.avatar}
                  alt={lastCheckIn.student.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{lastCheckIn.student.name}</span>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-800">
                      {lastCheckIn.student.rollNo}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ACCESS GRANTED • ATTENDANCE LOGGED AT {lastCheckIn.timestamp}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {lastCheckIn.student.department} • Overall: {lastCheckIn.student.overallAttendance}%
                  </div>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-emerald-300 block">Seat Assigned</span>
                <span className="text-[11px] font-mono text-slate-400">Hall 402B</span>
              </div>
            </div>
          )}

          {/* Quick Simulation Bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Simulate Student Badge Tap:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rollNo} - {s.department})
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleSimulateScan()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                <span>Simulate Scan & Tap</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Campus Turnstile Biometrics V3.2</span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg transition cursor-pointer"
          >
            Close Kiosk
          </button>
        </div>
      </div>
    </div>
  );
};
