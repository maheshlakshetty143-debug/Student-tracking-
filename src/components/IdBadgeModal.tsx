import React from 'react';
import { Student } from '../types';
import {
  QrCode,
  X,
  Printer,
  Download,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface IdBadgeModalProps {
  student: Student | null;
  onClose: () => void;
}

export const IdBadgeModal: React.FC<IdBadgeModalProps> = ({ student, onClose }) => {
  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Digital Student Smart Pass</span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Physical Card Mockup */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-2 border-indigo-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden text-white">
            {/* Holographic Security Band */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-amber-400"></div>

            {/* University Crest & Name */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs">
                  EP
                </div>
                <div>
                  <h4 className="font-bold text-xs tracking-wider text-slate-100 uppercase">EDUPULSE INSTITUTE</h4>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block">UNIVERSITY SYSTEM</span>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                2026-2027
              </span>
            </div>

            {/* Student Photo & Vital Details */}
            <div className="mt-4 flex items-center gap-4">
              <div className="relative">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-20 h-24 rounded-xl object-cover border-2 border-slate-700 shadow-md"
                />
                <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-bold text-sm text-white leading-tight">{student.name}</div>
                <div className="text-[11px] font-mono text-cyan-400 font-semibold">{student.rollNo}</div>
                <div className="text-[10px] text-slate-300 font-medium">{student.program}</div>
                <div className="text-[10px] text-slate-400">Year {student.year} • Term Fall</div>
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Att: {student.overallAttendance}% (Eligible)
                </div>
              </div>
            </div>

            {/* Smart RFID Chip & Barcode Simulation */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              {/* Gold Chip Graphic */}
              <div className="w-10 h-7 rounded bg-amber-400/90 border border-amber-600 flex flex-col justify-around p-0.5">
                <div className="w-full h-0.5 bg-amber-600"></div>
                <div className="w-full h-0.5 bg-amber-600"></div>
              </div>

              {/* QR Code Graphic SVG */}
              <div className="bg-white p-1 rounded-lg shadow">
                <svg viewBox="0 0 100 100" width="48" height="48">
                  {/* Outer squares */}
                  <rect x="0" y="0" width="30" height="30" fill="#0f172a" />
                  <rect x="5" y="5" width="20" height="20" fill="#ffffff" />
                  <rect x="9" y="9" width="12" height="12" fill="#0f172a" />

                  <rect x="70" y="0" width="30" height="30" fill="#0f172a" />
                  <rect x="75" y="5" width="20" height="20" fill="#ffffff" />
                  <rect x="79" y="9" width="12" height="12" fill="#0f172a" />

                  <rect x="0" y="70" width="30" height="30" fill="#0f172a" />
                  <rect x="5" y="75" width="20" height="20" fill="#ffffff" />
                  <rect x="9" y="79" width="12" height="12" fill="#0f172a" />

                  {/* Random QR data points */}
                  <rect x="40" y="10" width="10" height="10" fill="#0f172a" />
                  <rect x="55" y="20" width="10" height="10" fill="#0f172a" />
                  <rect x="35" y="40" width="15" height="15" fill="#0f172a" />
                  <rect x="60" y="45" width="10" height="10" fill="#0f172a" />
                  <rect x="40" y="70" width="10" height="10" fill="#0f172a" />
                  <rect x="65" y="75" width="15" height="15" fill="#0f172a" />
                </svg>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span>SECURITY HASH: #EP-{student.id.slice(-6)}</span>
              <span className="text-cyan-300">NFC / QR ENABLED</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Student Pass</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
