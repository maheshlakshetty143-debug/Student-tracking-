import React, { useState, useRef, useEffect } from 'react';
import {
  Student,
  AttendanceLogEntry,
  VisionAttendanceResult,
  VisionDetectionItem,
} from '../types';
import {
  generateSampleClassroomDataUrl,
  INITIAL_ATTENDANCE_LOGS,
} from '../data/mockData';
import {
  Camera,
  QrCode,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Loader2,
  Download,
  Calendar,
  Clock,
  Check,
  Search,
  Scan,
  Volume2,
  VolumeX,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

interface AttendanceCenterProps {
  enrolledStudents: Student[];
  setEnrolledStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  attendanceLogs: AttendanceLogEntry[];
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceLogEntry[]>>;
  openKioskModal: () => void;
  openIdBadgeModal: (student: Student) => void;
}

export const AttendanceCenter: React.FC<AttendanceCenterProps> = ({
  enrolledStudents,
  setEnrolledStudents,
  attendanceLogs,
  setAttendanceLogs,
  openKioskModal,
  openIdBadgeModal,
}) => {
  const [activeMode, setActiveMode] = useState<'vision' | 'rollcall' | 'kiosk_logs'>('vision');
  const [selectedCourse, setSelectedCourse] = useState<string>('CS-301 Distributed Systems');

  // Vision State
  const [classroomPreset, setClassroomPreset] = useState<'FULL_LECTURE' | 'PARTIAL_ATTENDANCE' | 'LAB_SESSION'>('PARTIAL_ATTENDANCE');
  const [currentClassroomPhoto, setCurrentClassroomPhoto] = useState<string>(
    generateSampleClassroomDataUrl('PARTIAL_ATTENDANCE')
  );
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // AI Vision Processing
  const [isScanningVision, setIsScanningVision] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionAttendanceResult | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Manual roll-call local state: studentId -> 'P' | 'A' | 'L' | 'E'
  const [rollCallState, setRollCallState] = useState<Record<string, 'P' | 'A' | 'L' | 'E'>>(() => {
    const initial: Record<string, 'P' | 'A' | 'L' | 'E'> = {};
    enrolledStudents.forEach((s) => {
      // Liam Wilson (CS-2024-003) absent by default to show realistic defaulter risk
      initial[s.id] = s.rollNo === 'CS-2024-003' ? 'A' : 'P';
    });
    return initial;
  });

  // Sound feedback for kiosk/scan
  const playSound = (type: 'success' | 'alert') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // AudioContext may be restricted before user gesture
    }
  };

  // Webcam handler
  const startWebcam = async () => {
    try {
      setIsWebcamActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      alert('Unable to access webcam. Switching to high-res classroom sample image.');
      setIsWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const captureWebcamFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCurrentClassroomPhoto(dataUrl);
      stopWebcam();
      setSuccessToast('Live classroom frame captured! Ready for AI Vision scan.');
    }
  };

  // Change preset image
  const handleSelectPreset = (preset: 'FULL_LECTURE' | 'PARTIAL_ATTENDANCE' | 'LAB_SESSION') => {
    setClassroomPreset(preset);
    setCurrentClassroomPhoto(generateSampleClassroomDataUrl(preset));
    setVisionResult(null);
  };

  // Upload custom classroom photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCurrentClassroomPhoto(base64);
      setVisionResult(null);
      setSuccessToast(`Uploaded "${file.name}". Ready for AI Vision scan.`);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini AI Vision Attendance
  const handleRunAiVisionScan = async () => {
    setIsScanningVision(true);
    setSuccessToast(null);

    try {
      const res = await fetch('/api/ai/vision-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentClassroomPhoto,
          mimeType: currentClassroomPhoto.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/jpeg',
          courseName: selectedCourse,
          enrolledStudents: enrolledStudents.map((s) => ({
            id: s.id,
            name: s.name,
            rollNo: s.rollNo,
            avatarDesc: s.visualTag,
          })),
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const result: VisionAttendanceResult = data.data;
        setVisionResult(result);
        playSound('success');

        // Automatically update roll call state based on AI detection
        const nextRollCall: Record<string, 'P' | 'A' | 'L' | 'E'> = { ...rollCallState };
        result.studentDetections.forEach((det) => {
          // match by studentId or by studentName
          const matchedStudent = enrolledStudents.find(
            (s) => s.id === det.studentId || s.name.toLowerCase() === det.studentName.toLowerCase()
          );
          if (matchedStudent) {
            nextRollCall[matchedStudent.id] = det.status === 'PRESENT' ? 'P' : 'A';
          }
        });
        setRollCallState(nextRollCall);

        setSuccessToast(
          `AI Vision Attendance Scan Complete! Detected ${result.detectedHeadcount} students with ${result.confidenceScore}% confidence.`
        );
      } else {
        alert(data.error || 'Failed to analyze classroom image with AI Vision');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error connecting to AI Vision endpoint');
    } finally {
      setIsScanningVision(false);
    }
  };

  // Commit Attendance Session to database and update student cumulative attendance %
  const handleCommitAttendanceSession = () => {
    if (!visionResult && Object.keys(rollCallState).length === 0) return;

    let present = 0;
    let absent = 0;

    // Recalculate student attendance stats
    const updatedStudents = enrolledStudents.map((student) => {
      const status = rollCallState[student.id] || 'P';
      const isPresent = status === 'P' || status === 'L';
      if (isPresent) present++;
      else absent++;

      // Append new attendance to recent trend
      const newTrend = [...student.recentAttendanceTrend.slice(1), status as 'P' | 'A' | 'L'];

      // Simple incremental update to overall attendance %
      const pastSessionsCount = 30;
      const pastPresentCount = Math.round((student.overallAttendance / 100) * pastSessionsCount);
      const updatedTotalSessions = pastSessionsCount + 1;
      const updatedPresentCount = pastPresentCount + (isPresent ? 1 : 0);
      const newOverall = Number(((updatedPresentCount / updatedTotalSessions) * 100).toFixed(1));

      // Re-evaluate risk tier
      const newRisk = newOverall < 75 ? 'CRITICAL' : newOverall <= 80 ? 'MODERATE' : 'HEALTHY';

      return {
        ...student,
        overallAttendance: newOverall,
        recentAttendanceTrend: newTrend,
        riskTier: newRisk,
      } as Student;
    });

    setEnrolledStudents(updatedStudents);

    // Create new attendance log entry
    const newLog: AttendanceLogEntry = {
      id: `log-${Date.now()}`,
      courseCode: selectedCourse.split(' ')[0] || 'CS-301',
      courseName: selectedCourse,
      sessionDate: new Date().toISOString().split('T')[0],
      timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lecturer: 'Prof. Vance (AI Vision Logged)',
      totalEnrolled: enrolledStudents.length,
      presentCount: present,
      absentCount: absent,
      method: visionResult ? 'AI_VISION' : 'MANUAL',
      attendanceRate: Number(((present / enrolledStudents.length) * 100).toFixed(1)),
      classroomPhotoUrl: currentClassroomPhoto,
      auditNotes: visionResult?.auditSummary || `Official attendance session finalized. ${present} Present, ${absent} Absent.`,
    };

    setAttendanceLogs([newLog, ...attendanceLogs]);
    playSound('success');
    setSuccessToast(
      `Attendance Ledger Updated! Recorded ${present} present, ${absent} absent for ${selectedCourse}.`
    );
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Roll No', 'Student Name', 'Department', 'Status', 'Overall Attendance %', 'Risk Tier'];
    const rows = enrolledStudents.map((s) => [
      s.rollNo,
      s.name,
      s.department,
      rollCallState[s.id] || 'P',
      `${s.overallAttendance}%`,
      s.riskTier,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${selectedCourse.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-950/80 border border-emerald-800 px-4 py-2.5 rounded-xl text-xs text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Mode Navigation & Course Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMode('vision')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeMode === 'vision'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Automated AI Vision Scan</span>
          </button>

          <button
            onClick={() => setActiveMode('rollcall')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeMode === 'rollcall'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Class Roll Call Table</span>
          </button>

          <button
            onClick={() => setActiveMode('kiosk_logs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeMode === 'kiosk_logs'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Session Logs & History</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">Active Lecture:</span>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="CS-301 Distributed Systems">CS-301 Distributed Systems & Cloud</option>
            <option value="AI-402 Deep Learning">AI-402 Deep Learning & Neural Architectures</option>
            <option value="CS-302 Algorithm Engineering">CS-302 Advanced Algorithm Engineering</option>
            <option value="BIO-310 Computational Genomics">BIO-310 Computational Genomics</option>
          </select>

          <button
            onClick={openKioskModal}
            className="bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-medium px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Launch QR Kiosk</span>
          </button>
        </div>
      </div>

      {/* MODE 1: Automated AI Classroom Vision Scan */}
      {activeMode === 'vision' && (
        <div className="space-y-6">
          {/* Vision Control Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Classroom AI Vision Biometric Capture</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Multimodal 4K Stream
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Gemini 3.8 Flash detects all visible students, matches facial biometric tags, and logs attendance without manual roll calls.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Presets */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 flex items-center gap-1 text-xs">
                <span className="text-[10px] text-slate-500 px-2 font-medium">Classroom Sample:</span>
                <button
                  onClick={() => handleSelectPreset('PARTIAL_ATTENDANCE')}
                  className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                    classroomPreset === 'PARTIAL_ATTENDANCE'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Partial (Empty Seat)
                </button>
                <button
                  onClick={() => handleSelectPreset('FULL_LECTURE')}
                  className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                    classroomPreset === 'FULL_LECTURE'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Full (100% Present)
                </button>
                <button
                  onClick={() => handleSelectPreset('LAB_SESSION')}
                  className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                    classroomPreset === 'LAB_SESSION'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bio Lab Session
                </button>
              </div>

              {/* Webcam Toggle */}
              {isWebcamActive ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={captureWebcamFrame}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Snap Frame</span>
                  </button>
                  <button
                    onClick={stopWebcam}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-2 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={startWebcam}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Use Device Camera</span>
                </button>
              )}

              {/* Upload photo */}
              <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer">
                <span>Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>

              {/* Run AI Vision Scan */}
              <button
                onClick={handleRunAiVisionScan}
                disabled={isScanningVision}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                {isScanningVision ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Vision AI Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Vision Scan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Visual Screen & Detection Results */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Viewport (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE CAMERA SENSOR ARRAY: HALL 402B
                </span>
                <span className="text-cyan-400 font-mono text-[11px]">30 FPS • 4K STREAM</span>
              </div>

              {/* Camera / Image Container */}
              <div className="relative mt-2 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex justify-center items-center min-h-[360px]">
                {isWebcamActive ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-auto object-cover max-h-[460px]" />
                ) : (
                  <img
                    src={currentClassroomPhoto}
                    alt="Classroom Lecture"
                    className="w-full h-auto object-contain max-h-[460px]"
                  />
                )}
                <canvas ref={canvasRef} className="hidden" />

                {/* Laser Scanning Overlay during AI scan */}
                {isScanningVision && (
                  <div className="absolute inset-0 bg-indigo-950/30 flex flex-col justify-between pointer-events-none">
                    <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400/80 animate-pulse"></div>
                    <div className="p-4 text-center">
                      <span className="bg-slate-900/90 text-cyan-300 font-mono text-xs px-3 py-1.5 rounded-full border border-cyan-500/50 shadow-xl">
                        [AI Vision] Running facial vector matching & seat presence audit...
                      </span>
                    </div>
                  </div>
                )}

                {/* HUD Overlay tags if detected */}
                {visionResult && !isScanningVision && (
                  <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 rounded-lg p-2.5 text-xs space-y-1 shadow-xl">
                    <div className="text-white font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Vision Verified: {visionResult.verifiedPresentCount || visionResult.detectedHeadcount} Present</span>
                    </div>
                    <div className="text-slate-300 text-[11px]">
                      Match Confidence: <span className="text-cyan-300 font-mono font-bold">{visionResult.confidenceScore}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Commit Bar */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Class: <span className="text-white font-semibold">{selectedCourse}</span>
                </span>
                <button
                  onClick={handleCommitAttendanceSession}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit Attendance to Official Ledger</span>
                </button>
              </div>
            </div>

            {/* AI Vision Analysis & Roster Breakdown (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {visionResult ? (
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        AI Biometric Roll Summary
                      </span>
                      <span className="text-xs font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                        {visionResult.confidenceScore}% Confidence
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">Detected</span>
                        <span className="text-xl font-bold text-white">{visionResult.detectedHeadcount}</span>
                      </div>
                      <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/40">
                        <span className="text-[10px] text-emerald-400 block uppercase font-semibold">Present</span>
                        <span className="text-xl font-bold text-emerald-400">
                          {visionResult.verifiedPresentCount || visionResult.detectedHeadcount}
                        </span>
                      </div>
                      <div className="bg-rose-950/30 p-2.5 rounded-lg border border-rose-800/40">
                        <span className="text-[10px] text-rose-400 block uppercase font-semibold">Absent</span>
                        <span className="text-xl font-bold text-rose-400">
                          {visionResult.verifiedAbsentCount ||
                            enrolledStudents.length - (visionResult.verifiedPresentCount || visionResult.detectedHeadcount)}
                        </span>
                      </div>
                    </div>

                    {/* Engagement & Audit Summary */}
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Classroom Engagement:</span>
                        <span className="font-bold text-indigo-400">{visionResult.classroomEngagement || 'HIGH'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
                        {visionResult.auditSummary}
                      </p>
                    </div>

                    {/* Anomalies if any */}
                    {visionResult.anomaliesOrFlags && visionResult.anomaliesOrFlags.length > 0 && (
                      <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-2.5 text-xs space-y-1">
                        <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Vision Security / Proxy Anomaly Alert:</span>
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-amber-200/90 space-y-0.5">
                          {visionResult.anomaliesOrFlags.map((flag, idx) => (
                            <li key={idx}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Student Detected List */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Matched Student Roster
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {enrolledStudents.length} Enrolled in {selectedCourse.split(' ')[0]}
                      </span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                      {enrolledStudents.map((student) => {
                        // find detection note
                        const det = visionResult.studentDetections.find(
                          (d) =>
                            d.studentId === student.id ||
                            d.studentName.toLowerCase() === student.name.toLowerCase()
                        );
                        const isPresent = det ? det.status === 'PRESENT' : rollCallState[student.id] === 'P';
                        const confidence = det?.confidence || 95;

                        return (
                          <div
                            key={student.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                              isPresent
                                ? 'bg-slate-950 border-emerald-900/40'
                                : 'bg-rose-950/20 border-rose-900/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-700"
                              />
                              <div>
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  <span>{student.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400">({student.rollNo})</span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>{det?.seatLocation || student.visualTag.split(',')[0]}</span>
                                  {det && <span>• {confidence}% Match</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Toggle P/A manually if override needed */}
                              <button
                                onClick={() => {
                                  const next = isPresent ? 'A' : 'P';
                                  setRollCallState({ ...rollCallState, [student.id]: next });
                                }}
                                className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                                  isPresent
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {isPresent ? 'PRESENT' : 'ABSENT'}
                              </button>

                              <button
                                onClick={() => openIdBadgeModal(student)}
                                className="p-1 rounded text-slate-400 hover:text-cyan-300 transition"
                                title="View Student ID Badge"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
                  <Camera className="w-12 h-12 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-semibold text-white">AI Vision Roll Call Ready</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click "Run AI Vision Scan" to identify student faces, verify attendance against the active roster, and flag empty desks or proxies.
                  </p>
                  <button
                    onClick={handleRunAiVisionScan}
                    disabled={isScanningVision}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Scan Classroom Now</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Manual Roll Call & Ledger Table */}
      {activeMode === 'rollcall' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Subject Attendance Sheet</h3>
              <p className="text-xs text-slate-400">
                {selectedCourse} • Date: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const allP: Record<string, 'P' | 'A' | 'L' | 'E'> = {};
                  enrolledStudents.forEach((s) => (allP[s.id] = 'P'));
                  setRollCallState(allP);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
              >
                Mark All Present
              </button>

              <button
                onClick={handleExportCsv}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleCommitAttendanceSession}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Session</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Overall %</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                  <th className="py-2.5 px-3">Recent 10 Trend</th>
                  <th className="py-2.5 px-3 text-center">Today's Status</th>
                  <th className="py-2.5 px-3 text-right">Pass / Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {enrolledStudents.map((s) => {
                  const status = rollCallState[s.id] || 'P';
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={s.avatar}
                            alt={s.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-semibold text-white">{s.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">{s.rollNo}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-300">{s.department}</td>

                      <td className="py-3 px-3 font-semibold">
                        <span
                          className={
                            s.overallAttendance < 75
                              ? 'text-rose-400 font-bold'
                              : s.overallAttendance <= 80
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {s.overallAttendance.toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {s.riskTier === 'CRITICAL' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" /> Defaulter (&lt;75%)
                          </span>
                        ) : s.riskTier === 'MODERATE' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Warning (75-80%)
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Healthy
                          </span>
                        )}
                      </td>

                      {/* Recent Trend Dots */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          {s.recentAttendanceTrend.map((t, i) => (
                            <span
                              key={i}
                              className={`w-2.5 h-2.5 rounded-full ${
                                t === 'P'
                                  ? 'bg-emerald-500'
                                  : t === 'L'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              title={`Session ${i + 1}: ${t === 'P' ? 'Present' : t === 'L' ? 'Late' : 'Absent'}`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Status Toggle Buttons */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
                          {(['P', 'L', 'A', 'E'] as const).map((code) => {
                            const isCurrent = status === code;
                            const label =
                              code === 'P' ? 'Present' : code === 'L' ? 'Late' : code === 'A' ? 'Absent' : 'Excused';
                            return (
                              <button
                                key={code}
                                onClick={() => setRollCallState({ ...rollCallState, [s.id]: code })}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                  isCurrent
                                    ? code === 'P'
                                      ? 'bg-emerald-600 text-white'
                                      : code === 'L'
                                      ? 'bg-amber-600 text-white'
                                      : code === 'A'
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-indigo-600 text-white'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {code}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => openIdBadgeModal(s)}
                          className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>ID Card</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 3: Session Logs & History */}
      {activeMode === 'kiosk_logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Historical Attendance Logs</h3>
              <p className="text-xs text-slate-400">
                Audited archive of AI Vision, QR Kiosk, and faculty submissions.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {attendanceLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg border ${
                      log.method === 'AI_VISION'
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                        : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    }`}
                  >
                    {log.method === 'AI_VISION' ? (
                      <Camera className="w-5 h-5" />
                    ) : (
                      <QrCode className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{log.courseCode}</span>
                      <span className="text-slate-300 font-medium">{log.courseName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300">
                        {log.method}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Date: {log.sessionDate}</span>
                      <span>•</span>
                      <span>Time: {log.timeSlot}</span>
                      <span>•</span>
                      <span>Instructor: {log.lecturer}</span>
                    </div>
                    {log.auditNotes && (
                      <div className="text-[11px] text-slate-400 italic mt-1 max-w-xl">
                        "{log.auditNotes}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right self-end md:self-center">
                  <div>
                    <div className="text-lg font-bold text-emerald-400">{log.attendanceRate}%</div>
                    <span className="text-[10px] text-slate-400">
                      {log.presentCount} / {log.totalEnrolled} Present
                    </span>
                  </div>
                  {log.classroomPhotoUrl && (
                    <img
                      src={log.classroomPhotoUrl}
                      alt="Session Snapshot"
                      className="w-14 h-10 rounded object-cover border border-slate-800 shadow-sm"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
