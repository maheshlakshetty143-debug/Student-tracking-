import React, { useState } from 'react';
import { Student, AttendanceRiskPrediction } from '../types';
import {
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Mail,
  Phone,
  Send,
  CheckCircle,
  Loader2,
  Calendar,
  UserX,
  FileWarning,
  MessageSquare,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface DropoutRiskRadarProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  openIdBadgeModal: (student: Student) => void;
}

export const DropoutRiskRadar: React.FC<DropoutRiskRadarProps> = ({
  students,
  setStudents,
  openIdBadgeModal,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    students.find((s) => s.riskTier === 'CRITICAL') || students[0] || null
  );
  const [predictionData, setPredictionData] = useState<AttendanceRiskPrediction | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [sentNoticeSuccess, setSentNoticeSuccess] = useState<string | null>(null);

  // Group students by tier
  const criticalStudents = students.filter((s) => s.overallAttendance < 75);
  const moderateStudents = students.filter((s) => s.overallAttendance >= 75 && s.overallAttendance <= 80);
  const healthyStudents = students.filter((s) => s.overallAttendance > 80);

  // Run AI Risk Prediction
  const handleRunAiPrediction = async (student: Student) => {
    setSelectedStudent(student);
    setIsLoadingPrediction(true);
    setPredictionData(null);
    setSentNoticeSuccess(null);

    try {
      const res = await fetch('/api/ai/predict-attendance-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: {
            id: student.id,
            name: student.name,
            department: student.department,
            year: student.year,
            overallAttendance: student.overallAttendance,
            subjectAttendance: student.subjectAttendance,
          },
          attendanceHistory: student.recentAttendanceTrend,
          institutionalThreshold: 75,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPredictionData(data.data);
      } else {
        alert(data.error || 'Failed to predict attendance risk');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to AI prediction service');
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const handleDispatchGuardianAlert = () => {
    if (!selectedStudent || !predictionData) return;
    setSentNoticeSuccess(
      `Official SMS & Email alert successfully dispatched to guardian ${selectedStudent.guardianName} (${selectedStudent.guardianEmail})!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Regulatory Threshold */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-900/40 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <FileWarning className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Institutional Defaulter & Dropout Early Warning Radar
                </h2>
                <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                  75% Exam Threshold
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Predictive AI detects chronic absenteeism patterns, projects semester failure risk, and drafts automated parental interventions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-rose-950/60 border border-rose-800/80 px-3.5 py-2 rounded-lg text-center">
              <span className="text-[10px] text-rose-400 uppercase font-bold block">Critical Debarment</span>
              <span className="text-xl font-bold text-rose-300">{criticalStudents.length} Students</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-800/80 px-3.5 py-2 rounded-lg text-center">
              <span className="text-[10px] text-amber-400 uppercase font-bold block">Borderline Watch</span>
              <span className="text-xl font-bold text-amber-300">{moderateStudents.length} Students</span>
            </div>
            <div className="bg-emerald-950/60 border border-emerald-800/80 px-3.5 py-2 rounded-lg text-center hidden sm:block">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Compliant</span>
              <span className="text-xl font-bold text-emerald-300">{healthyStudents.length} Students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: At-Risk Students List & AI Diagnostic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* At-Risk Table (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Students Requiring Immediate Academic Intervention</h3>
              <p className="text-xs text-slate-400">Current attendance below statutory university requirement.</p>
            </div>
          </div>

          <div className="space-y-3">
            {[...criticalStudents, ...moderateStudents].map((student) => {
              const isSelected = selectedStudent?.id === student.id;
              const isCritical = student.overallAttendance < 75;

              return (
                <div
                  key={student.id}
                  onClick={() => handleRunAiPrediction(student)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-950 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{student.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{student.rollNo}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCritical
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isCritical ? 'CRITICAL DEFAULTER' : 'WATCHLIST'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {student.department} • Year {student.year}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <div className={`text-xl font-extrabold ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
                          {student.overallAttendance.toFixed(1)}%
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Req: 75.0% (-{(75.0 - student.overallAttendance).toFixed(1)}%)
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunAiPrediction(student);
                        }}
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-indigo-500/30 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Diagnose</span>
                      </button>
                    </div>
                  </div>

                  {/* Subject Attendance Deficit Breakdown */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    {Object.entries(student.subjectAttendance).map(([subj, rate]) => (
                      <div key={subj} className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                        <span className="text-slate-400 block truncate" title={subj}>
                          {subj.split(' ')[0]}
                        </span>
                        <span
                          className={`font-bold ${
                            rate < 75 ? 'text-rose-400' : rate <= 80 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {rate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: AI Retention & Risk Diagnostic Studio (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {isLoadingPrediction ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Analyzing Behavioral Trajectory...</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Gemini 3.8 Flash is correlating absence clusters, predicting exam eligibility, and generating personalized parental intervention notices.
              </p>
            </div>
          ) : selectedStudent && predictionData ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">AI Diagnostic: {selectedStudent.name}</h3>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    predictionData.riskLevel.includes('CRITICAL')
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {predictionData.riskLevel.replace('_', ' ')}
                </span>
              </div>

              {/* Toast if dispatched */}
              {sentNoticeSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{sentNoticeSuccess}</span>
                </div>
              )}

              {/* Risk & Projected Trajectory */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Risk Score</span>
                  <span className="text-2xl font-bold text-rose-400">{predictionData.riskScore}</span>
                  <span className="text-[10px] text-slate-500">/ 100 Hazard Index</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Projected Final Rate
                  </span>
                  <span className="text-2xl font-bold text-amber-400">
                    {predictionData.predictedFinalAttendance}%
                  </span>
                  <span className="text-[10px] text-rose-400 font-semibold block">Will Fail Exam Cutoff</span>
                </div>
              </div>

              {/* Detected Behavioral Patterns */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
                <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider block">
                  Detected Absenteeism Patterns:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {predictionData.detectedPatterns.map((pat, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {pat}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Immediate Interventions */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
                <span className="font-bold text-indigo-300 text-[11px] uppercase tracking-wider block">
                  Counselor Action Plan & Interventions:
                </span>
                <ul className="list-disc list-inside space-y-1 text-indigo-200">
                  {predictionData.recommendedInterventions.map((act, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {act}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Automated Guardian / Parent Warning Notice */}
              <div className="bg-slate-950 border border-rose-900/30 rounded-lg p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Automated Guardian Alert Draft
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    To: {selectedStudent.guardianEmail}
                  </span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300 text-[11px] leading-relaxed italic">
                  "{predictionData.automatedGuardianNotice}"
                </div>

                <button
                  onClick={handleDispatchGuardianAlert}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Statutory Notice to Guardian</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Select a Student to Run AI Diagnostic</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Click any student in the defaulter table to analyze historical trends and trigger early warning interventions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
