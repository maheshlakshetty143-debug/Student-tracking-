import React, { useState } from 'react';
import {
  AdmissionApplication,
  ProgramType,
  DocumentAnalysisResult,
  SopAnalysisResult,
  AdmissionEvaluationResult,
  Student,
} from '../types';
import {
  SAMPLE_SOPS,
  generateSampleDocumentDataUrl,
} from '../data/mockData';
import {
  Sparkles,
  FileText,
  CheckCircle,
  AlertTriangle,
  Award,
  Search,
  Filter,
  Eye,
  FileCheck2,
  FileCode,
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Send,
  Loader2,
  Upload,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface AdmissionsHubProps {
  applications: AdmissionApplication[];
  setApplications: React.Dispatch<React.SetStateAction<AdmissionApplication[]>>;
  enrolledStudents: Student[];
  setEnrolledStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  openNewAppModal: () => void;
}

export const AdmissionsHub: React.FC<AdmissionsHubProps> = ({
  applications,
  setApplications,
  enrolledStudents,
  setEnrolledStudents,
  openNewAppModal,
}) => {
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(applications[0] || null);
  const [activeStageFilter, setActiveStageFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('ALL');

  // Modal / Studio State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'document' | 'sop' | 'decision'>('document');

  // AI Loading States
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);
  const [isEvaluatingSop, setIsEvaluatingSop] = useState(false);
  const [isEvaluatingHolistic, setIsEvaluatingHolistic] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = activeStageFilter === 'ALL' || app.stage === activeStageFilter;
    const matchesProgram = selectedProgramFilter === 'ALL' || app.intendedProgram === selectedProgramFilter;
    return matchesSearch && matchesStage && matchesProgram;
  });

  // Calculate metrics
  const totalApps = applications.length;
  const verifiedCount = applications.filter((a) => a.documentStatus === 'VERIFIED').length;
  const flaggedCount = applications.filter((a) => a.documentStatus === 'FLAGGED').length;
  const decisionReadyCount = applications.filter((a) => a.stage === 'DECISION_READY' || a.stage === 'ADMITTED').length;
  const totalScholarshipOffered = applications.reduce((sum, a) => sum + (a.admissionEvaluation?.scholarshipAmountUSD || 0), 0);

  // Trigger AI Document OCR & Verification
  const handleVerifyDocument = async () => {
    if (!selectedApp) return;
    setIsVerifyingDoc(true);
    setActionSuccessMessage(null);

    try {
      // Use existing document preview or generate sample
      const docBase64 =
        selectedApp.documentPreviewUrl ||
        generateSampleDocumentDataUrl(
          'HONORS_TRANSCRIPT',
          selectedApp.name,
          selectedApp.gpa.toString(),
          selectedApp.previousSchool
        );

      const res = await fetch('/api/ai/verify-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: docBase64,
          mimeType: 'image/svg+xml',
          documentType: selectedApp.documentType,
          studentName: selectedApp.name,
          claimedGpa: selectedApp.gpa.toString(),
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const result: DocumentAnalysisResult = data.data;
        const newStatus = result.status === 'VERIFIED' ? 'VERIFIED' : 'FLAGGED';

        const updated = {
          ...selectedApp,
          documentStatus: newStatus,
          documentAnalysis: result,
          stage: selectedApp.stage === 'DOCUMENT_VERIFICATION' ? 'SOP_EVALUATION' : selectedApp.stage,
        } as AdmissionApplication;

        setSelectedApp(updated);
        setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
        setActionSuccessMessage(`Document scanned & evaluated! Authenticity score: ${result.authenticityScore}%`);
      } else {
        alert(data.error || 'Failed to verify document');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network or server error during AI verification');
    } finally {
      setIsVerifyingDoc(false);
    }
  };

  // Trigger AI SOP Evaluation
  const handleEvaluateSop = async () => {
    if (!selectedApp) return;
    setIsEvaluatingSop(true);
    setActionSuccessMessage(null);

    try {
      const res = await fetch('/api/ai/evaluate-sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopText: selectedApp.sopText,
          studentName: selectedApp.name,
          targetProgram: selectedApp.intendedProgram,
          previousMajor: selectedApp.previousSchool,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const result: SopAnalysisResult = data.data;

        const updated = {
          ...selectedApp,
          sopAnalysis: result,
          stage: selectedApp.stage === 'SOP_EVALUATION' ? 'DECISION_READY' : selectedApp.stage,
        } as AdmissionApplication;

        setSelectedApp(updated);
        setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
        setActionSuccessMessage(`SOP Evaluated by AI! Composite Score: ${result.overallScore}/100 (${result.tier})`);
      } else {
        alert(data.error || 'Failed to evaluate SOP');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error during SOP evaluation');
    } finally {
      setIsEvaluatingSop(false);
    }
  };

  // Trigger AI Holistic Admission Decision
  const handleEvaluateAdmission = async () => {
    if (!selectedApp) return;
    setIsEvaluatingHolistic(true);
    setActionSuccessMessage(null);

    try {
      const res = await fetch('/api/ai/evaluate-admission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application: {
            name: selectedApp.name,
            email: selectedApp.email,
            intendedProgram: selectedApp.intendedProgram,
            previousSchool: selectedApp.previousSchool,
            gpa: selectedApp.gpa,
            testScore: selectedApp.testScore,
            extracurriculars: selectedApp.extracurriculars,
            documentStatus: selectedApp.documentStatus,
            sopScore: selectedApp.sopAnalysis?.overallScore,
            financialAidRequested: selectedApp.financialAidRequested,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const result: AdmissionEvaluationResult = data.data;

        const newStage =
          result.recommendedDecision === 'DIRECT_ADMIT' || result.recommendedDecision === 'CONDITIONAL_ADMIT'
            ? 'ADMITTED'
            : result.recommendedDecision === 'WAITLIST'
            ? 'WAITLISTED'
            : 'REJECTED';

        const updated = {
          ...selectedApp,
          admissionEvaluation: result,
          stage: newStage,
          decisionDate: new Date().toISOString(),
        } as AdmissionApplication;

        setSelectedApp(updated);
        setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
        setActionSuccessMessage(`Admissions Decision Rendered: ${result.recommendedDecision}`);
      } else {
        alert(data.error || 'Failed to evaluate admission decision');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error during admission evaluation');
    } finally {
      setIsEvaluatingHolistic(false);
    }
  };

  // Enroll Admitted Candidate into University Student Directory
  const handleEnrollCandidate = () => {
    if (!selectedApp) return;

    // Check if already enrolled
    const exists = enrolledStudents.some((s) => s.email.toLowerCase() === selectedApp.email.toLowerCase());
    if (exists) {
      alert(`${selectedApp.name} is already registered in the active student directory!`);
      return;
    }

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      rollNo: `CS-2026-${String(enrolledStudents.length + 1).padStart(3, '0')}`,
      name: selectedApp.name,
      email: selectedApp.email,
      phone: selectedApp.phone,
      avatar: selectedApp.avatar,
      department: selectedApp.intendedProgram.includes('Robotics')
        ? 'AI & Robotics'
        : selectedApp.intendedProgram.includes('Data')
        ? 'Data Science'
        : 'Computer Science',
      program: selectedApp.intendedProgram,
      year: 1,
      semester: 1,
      gpa: selectedApp.gpa,
      overallAttendance: 100, // Starts at 100%
      subjectAttendance: {
        'CS-101 Intro to Computing': 100,
        'MATH-101 Calculus I': 100,
        'PHYS-101 Classical Physics': 100,
        'ENG-101 Technical Composition': 100,
      },
      status: 'ACTIVE',
      visualTag: `${selectedApp.name}, New Enrolled Freshman, front row`,
      riskTier: 'HEALTHY',
      guardianName: 'Parent of ' + selectedApp.name,
      guardianPhone: '+1 (555) 000-1122',
      guardianEmail: 'guardian.' + selectedApp.email,
      admissionYear: 2026,
      recentAttendanceTrend: ['P', 'P', 'P'],
    };

    setEnrolledStudents([newStudent, ...enrolledStudents]);

    // Update application stage to ADMITTED
    const updated = {
      ...selectedApp,
      stage: 'ADMITTED',
    } as AdmissionApplication;

    setSelectedApp(updated);
    setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));

    setActionSuccessMessage(`Successfully officially enrolled ${selectedApp.name}! Roll No: ${newStudent.rollNo}`);
  };

  // Handle custom file upload for document
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedApp) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      const updated = {
        ...selectedApp,
        documentPreviewUrl: base64,
        documentType: file.name,
        documentStatus: 'PENDING',
        documentAnalysis: undefined,
      } as AdmissionApplication;
      setSelectedApp(updated);
      setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
      setActionSuccessMessage(`Uploaded "${file.name}". Ready for AI verification.`);
    };
    reader.readAsDataURL(file);
  };

  const copyLetterToClipboard = () => {
    if (!selectedApp?.admissionEvaluation?.officialLetterDraft) return;
    navigator.clipboard.writeText(selectedApp.admissionEvaluation.officialLetterDraft);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Inbound Applicants</span>
            <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalApps}</span>
            <span className="text-xs text-indigo-400 font-medium">Active Fall Cycle</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Automated intake pipeline</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">AI Verified Credentials</span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{verifiedCount}</span>
            <span className="text-xs text-slate-400">of {totalApps} screened</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80">Tamper & seal verified</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Integrity Flags Detected</span>
            <span className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">{flaggedCount}</span>
            <span className="text-xs text-rose-400/80">Requires Dean Review</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Font anomaly / altered scores</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Scholarship Grants Committed</span>
            <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300">
              ${(totalScholarshipOffered / 1000).toFixed(0)}k
            </span>
            <span className="text-xs text-slate-400">Merit funding</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Autonomous merit scoring</div>
        </div>
      </div>

      {/* Main Layout: Pipeline List & Quick Studio */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, email, or application ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProgramFilter}
              onChange={(e) => setSelectedProgramFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Academic Programs</option>
              <option value="B.S. Artificial Intelligence & Robotics">B.S. AI & Robotics</option>
              <option value="B.S. Computer Science">B.S. Computer Science</option>
              <option value="B.S. Data Science & Analytics">B.S. Data Science</option>
              <option value="B.S. Biomedical Engineering">B.S. Biomedical</option>
            </select>

            <button
              onClick={openNewAppModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Register Applicant</span>
            </button>
          </div>
        </div>

        {/* Stage Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'ALL', label: 'All Candidates' },
            { id: 'DOCUMENT_VERIFICATION', label: 'Document Review' },
            { id: 'SOP_EVALUATION', label: 'SOP Scored' },
            { id: 'DECISION_READY', label: 'Decision Ready' },
            { id: 'ADMITTED', label: 'Admitted / Enrolled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStageFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeStageFilter === tab.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applications Table / Cards */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Candidate</th>
                <th className="py-3 px-3">Intended Program</th>
                <th className="py-3 px-3">Academics (GPA)</th>
                <th className="py-3 px-3">AI Document OCR</th>
                <th className="py-3 px-3">AI SOP Quality</th>
                <th className="py-3 px-3">Admission Decision</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredApps.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <tr
                    key={app.id}
                    className={`hover:bg-slate-800/40 transition cursor-pointer ${
                      isSelected ? 'bg-indigo-950/20 border-l-2 border-indigo-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedApp(app);
                    }}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={app.avatar}
                          alt={app.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-semibold text-white">{app.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{app.applicationId}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      <div className="font-medium">{app.intendedProgram}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{app.previousSchool}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-200">{app.gpa.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500">/ 4.0</span>
                      </div>
                      {app.testScore && (
                        <div className="text-[10px] text-indigo-400 truncate max-w-[140px]">{app.testScore}</div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {app.documentStatus === 'VERIFIED' ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          <span>{app.documentAnalysis?.authenticityScore || 98}% Verified</span>
                        </div>
                      ) : app.documentStatus === 'FLAGGED' ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Flagged ({app.documentAnalysis?.authenticityScore || 32}%)</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-400 border border-slate-700">
                          Pending OCR
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {app.sopAnalysis ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-indigo-300">{app.sopAnalysis.overallScore}/100</span>
                            <span
                              className={`text-[10px] px-1.5 rounded font-semibold ${
                                app.sopAnalysis.tier === 'EXCEPTIONAL'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-indigo-500/20 text-indigo-300'
                              }`}
                            >
                              {app.sopAnalysis.tier}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Not Evaluated</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {app.stage === 'ADMITTED' ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <CheckCircle className="w-3 h-3" /> Admitted
                          </span>
                          {app.admissionEvaluation?.scholarshipRecommendation && (
                            <span className="text-[10px] text-amber-300 truncate max-w-[150px]">
                              {app.admissionEvaluation.scholarshipRecommendation}
                            </span>
                          )}
                        </div>
                      ) : app.stage === 'DECISION_READY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Decision Ready
                        </span>
                      ) : app.stage === 'WAITLISTED' ? (
                        <span className="text-amber-400 text-[11px]">Waitlisted</span>
                      ) : app.stage === 'REJECTED' ? (
                        <span className="text-rose-400 text-[11px]">Denied</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">In Screening</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                          setIsDetailModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-indigo-500/30 text-xs font-medium transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Studio</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Candidate Quick Drawer / AI Review Panel */}
      {selectedApp && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <img
                src={selectedApp.avatar}
                alt={selectedApp.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedApp.name}</h3>
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {selectedApp.applicationId}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Applying for: <span className="text-indigo-300 font-medium">{selectedApp.intendedProgram}</span> • Prior: {selectedApp.previousSchool}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsDetailModalOpen(true);
                  setActiveModalTab('document');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Inspect Document OCR</span>
              </button>

              <button
                onClick={() => {
                  setIsDetailModalOpen(true);
                  setActiveModalTab('sop');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Evaluate SOP</span>
              </button>

              <button
                onClick={() => {
                  setIsDetailModalOpen(true);
                  setActiveModalTab('decision');
                }}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Admissions Committee Decision</span>
              </button>
            </div>
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Document Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-slate-400 font-semibold">
                <span>Academic Document OCR</span>
                {selectedApp.documentStatus === 'VERIFIED' ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Authentic
                  </span>
                ) : selectedApp.documentStatus === 'FLAGGED' ? (
                  <span className="text-rose-400 flex items-center gap-1 font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" /> Flagged
                  </span>
                ) : (
                  <span className="text-slate-500">Unverified</span>
                )}
              </div>
              <div className="text-slate-300 font-medium truncate">{selectedApp.documentType}</div>
              {selectedApp.documentAnalysis ? (
                <div className="space-y-1 text-[11px] text-slate-400">
                  <div>Issuing: <span className="text-slate-200">{selectedApp.documentAnalysis.issuingInstitution}</span></div>
                  <div>Extracted GPA: <span className="text-slate-200 font-bold">{selectedApp.documentAnalysis.extractedGpaOrScore}</span></div>
                  <div>Authenticity Score: <span className="text-indigo-400 font-bold">{selectedApp.documentAnalysis.authenticityScore}%</span></div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">Click to scan and verify authentic watermark and grades.</p>
              )}
            </div>

            {/* SOP Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-slate-400 font-semibold">
                <span>Statement of Purpose</span>
                {selectedApp.sopAnalysis && (
                  <span className="text-purple-400 font-bold">
                    {selectedApp.sopAnalysis.overallScore}/100 ({selectedApp.sopAnalysis.tier})
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-3 italic">
                "{selectedApp.sopText.slice(0, 160)}..."
              </div>
              {selectedApp.sopAnalysis?.executiveSummary && (
                <div className="text-[11px] text-indigo-300 bg-indigo-950/40 p-1.5 rounded border border-indigo-900/50">
                  {selectedApp.sopAnalysis.executiveSummary}
                </div>
              )}
            </div>

            {/* Decision & Scholarship Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-slate-400 font-semibold">
                <span>Admissions Committee Recommendation</span>
                <span className="text-amber-400 font-bold">
                  {selectedApp.admissionEvaluation?.recommendedDecision || 'Pending'}
                </span>
              </div>
              {selectedApp.admissionEvaluation ? (
                <div className="space-y-1 text-[11px]">
                  <div className="text-amber-300 font-semibold">
                    Grant: {selectedApp.admissionEvaluation.scholarshipRecommendation}
                  </div>
                  <div className="text-slate-400 line-clamp-2">
                    {selectedApp.admissionEvaluation.rationaleSummary}
                  </div>
                  {selectedApp.stage === 'ADMITTED' ? (
                    <div className="text-emerald-400 font-semibold flex items-center gap-1 pt-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Candidate Officially Enrolled
                    </div>
                  ) : (
                    <button
                      onClick={handleEnrollCandidate}
                      className="mt-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer"
                    >
                      Confirm Direct Admission & Enroll
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Run holistic evaluation to compute merit scholarship & decision letter.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deep-Dive AI Admissions Studio Modal */}
      {isDetailModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Admissions AI Studio</span>
                    <span className="text-xs font-normal text-slate-400">• {selectedApp.name}</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Application ID: <span className="font-mono text-indigo-300">{selectedApp.applicationId}</span> • Program: {selectedApp.intendedProgram}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Notification alert if any */}
            {actionSuccessMessage && (
              <div className="bg-emerald-950/70 border-b border-emerald-800/80 px-6 py-2 text-xs text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {actionSuccessMessage}
                </span>
                <button
                  onClick={() => setActionSuccessMessage(null)}
                  className="text-emerald-400 hover:text-emerald-200 text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Studio Navigation Tabs */}
            <div className="px-6 bg-slate-950/50 border-b border-slate-800 flex space-x-4">
              <button
                onClick={() => setActiveModalTab('document')}
                className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeModalTab === 'document'
                    ? 'border-indigo-500 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>1. Document OCR & Forensics</span>
                {selectedApp.documentStatus === 'VERIFIED' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
                {selectedApp.documentStatus === 'FLAGGED' && (
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                )}
              </button>

              <button
                onClick={() => setActiveModalTab('sop')}
                className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeModalTab === 'sop'
                    ? 'border-indigo-500 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>2. Statement of Purpose (SOP)</span>
                {selectedApp.sopAnalysis && (
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                )}
              </button>

              <button
                onClick={() => setActiveModalTab('decision')}
                className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeModalTab === 'decision'
                    ? 'border-indigo-500 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>3. Committee Decision & Scholarship</span>
                {selectedApp.admissionEvaluation && (
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                )}
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: Document Forensic OCR */}
              {activeModalTab === 'document' && (
                <div className="space-y-6">
                  {/* Top Bar for Document actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white">Document Forensic Scanner & OCR Engine</h4>
                      <p className="text-xs text-slate-400">
                        Multimodal Gemini 3.8 Flash extracts transcript courses, checks security seal authenticity, and flags digital tampering.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Upload custom doc */}
                      <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1.5 transition">
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>

                      {/* Swap with sample */}
                      <button
                        onClick={() => {
                          const isFlagged = selectedApp.documentStatus === 'FLAGGED';
                          const newKey = isFlagged ? 'HONORS_TRANSCRIPT' : 'FLAGGED_TRANSCRIPT';
                          const newUrl = generateSampleDocumentDataUrl(
                            newKey,
                            selectedApp.name,
                            isFlagged ? '3.92' : '2.95 (altered)',
                            selectedApp.previousSchool
                          );
                          const updated = {
                            ...selectedApp,
                            documentSampleKey: newKey,
                            documentPreviewUrl: newUrl,
                            documentStatus: 'PENDING',
                            documentAnalysis: undefined,
                          } as AdmissionApplication;
                          setSelectedApp(updated);
                          setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1.5 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Toggle Sample Doc (Authentic vs Tampered)</span>
                      </button>

                      <button
                        onClick={handleVerifyDocument}
                        disabled={isVerifyingDoc}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
                      >
                        {isVerifyingDoc ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Scanning Forensic Seal...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Run AI Document OCR</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Split View: Document Visual & OCR Extraction */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Left: Document Visual */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center relative overflow-hidden">
                      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
                        <span className="font-mono truncate">{selectedApp.documentType}</span>
                        <span className="text-[11px] text-indigo-400">Preview (800x1100 px)</span>
                      </div>

                      {/* Visual Container */}
                      <div className="relative mt-2 w-full max-h-[500px] overflow-auto rounded border border-slate-800 bg-slate-900 flex justify-center">
                        {selectedApp.documentPreviewUrl ? (
                          <img
                            src={selectedApp.documentPreviewUrl}
                            alt="Document Preview"
                            className="w-full object-contain shadow-lg"
                          />
                        ) : (
                          <div className="p-12 text-center text-slate-500 text-xs">
                            No document image uploaded.
                          </div>
                        )}

                        {/* Animated Laser Scanning HUD when verifying */}
                        {isVerifyingDoc && (
                          <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none flex flex-col justify-between">
                            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce shadow-lg shadow-cyan-400/50"></div>
                            <div className="p-4 text-center">
                              <span className="bg-slate-900/90 text-cyan-300 text-xs font-mono px-3 py-1.5 rounded-full border border-cyan-500/40">
                                ⟲ Parsing security seals, font matrices & GPA rows...
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: AI OCR Results */}
                    <div className="space-y-4">
                      {selectedApp.documentAnalysis ? (
                        <div className="space-y-4">
                          {/* Score & Status banner */}
                          <div
                            className={`p-4 rounded-xl border flex items-center justify-between ${
                              selectedApp.documentAnalysis.status === 'VERIFIED'
                                ? 'bg-emerald-950/40 border-emerald-800/80'
                                : 'bg-rose-950/40 border-rose-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {selectedApp.documentAnalysis.status === 'VERIFIED' ? (
                                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                              ) : (
                                <ShieldAlert className="w-8 h-8 text-rose-400" />
                              )}
                              <div>
                                <h4
                                  className={`text-sm font-bold ${
                                    selectedApp.documentAnalysis.status === 'VERIFIED'
                                      ? 'text-emerald-300'
                                      : 'text-rose-300'
                                  }`}
                                >
                                  {selectedApp.documentAnalysis.status === 'VERIFIED'
                                    ? 'VERIFIED AUTHENTIC DOCUMENT'
                                    : 'SUSPICIOUS / INTEGRITY FLAG'}
                                </h4>
                                <p className="text-xs text-slate-400">
                                  {selectedApp.documentAnalysis.status === 'VERIFIED'
                                    ? 'Matches institution records; anti-tamper guilloche pattern valid.'
                                    : 'Font raster anomalies or altered grades detected.'}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-2xl font-bold text-white">
                                {selectedApp.documentAnalysis.authenticityScore}%
                              </div>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                Forensic Confidence
                              </span>
                            </div>
                          </div>

                          {/* Extracted Metadata Grid */}
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                              Extracted Academic Credentials
                            </h5>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-slate-500 block">Candidate Name on Doc</span>
                                <span className="font-semibold text-white">
                                  {selectedApp.documentAnalysis.extractedName}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Issuing Body / School</span>
                                <span className="font-semibold text-white">
                                  {selectedApp.documentAnalysis.issuingInstitution}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Verified Grade / GPA</span>
                                <span className="font-bold text-indigo-400">
                                  {selectedApp.documentAnalysis.extractedGpaOrScore}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Credential Title</span>
                                <span className="font-medium text-slate-200">
                                  {selectedApp.documentAnalysis.credentialTitle || 'High School Transcript'}
                                </span>
                              </div>
                            </div>

                            {/* Subjects found */}
                            {selectedApp.documentAnalysis.subjectsFound &&
                              selectedApp.documentAnalysis.subjectsFound.length > 0 && (
                                <div className="pt-2 border-t border-slate-800">
                                  <span className="text-slate-500 text-[11px] block mb-1.5">
                                    Audited Coursework & Subject Credits:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selectedApp.documentAnalysis.subjectsFound.map((subj, i) => (
                                      <span
                                        key={i}
                                        className="bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded text-[11px]"
                                      >
                                        {subj}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* Tamper Flags if any */}
                          {selectedApp.documentAnalysis.tamperIndicatorsDetected &&
                            selectedApp.documentAnalysis.tamperIndicatorsDetected.length > 0 && (
                              <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-4 space-y-2">
                                <h5 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                                  <span>Forensic Red Flags Detected</span>
                                </h5>
                                <ul className="list-disc list-inside text-xs text-rose-200 space-y-1">
                                  {selectedApp.documentAnalysis.tamperIndicatorsDetected.map((flag, idx) => (
                                    <li key={idx}>{flag}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {/* Key Observations */}
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                            <h5 className="text-xs font-bold text-slate-300">Auditor Observations:</h5>
                            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                              {selectedApp.documentAnalysis.keyObservations.map((obs, idx) => (
                                <li key={idx}>{obs}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Recommendation */}
                          <div className="bg-indigo-950/20 border border-indigo-800/30 rounded-xl p-4">
                            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                              Committee Council Recommendation:
                            </span>
                            <p className="text-xs text-indigo-200 mt-1">
                              {selectedApp.documentAnalysis.admissionRecommendation}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                          <FileCode className="w-10 h-10 text-slate-600 mx-auto" />
                          <h4 className="text-sm font-semibold text-slate-300">No Forensic Scan Yet</h4>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Click "Run AI Document OCR" above to verify this applicant's transcript, extract credit details, and check anti-tampering seals.
                          </p>
                          <button
                            onClick={handleVerifyDocument}
                            disabled={isVerifyingDoc}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Scan Document Now</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Statement of Purpose Evaluation */}
              {activeModalTab === 'sop' && (
                <div className="space-y-6">
                  {/* Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white">AI Statement of Purpose (SOP) Evaluator</h4>
                      <p className="text-xs text-slate-400">
                        Evaluates academic alignment, depth of motivation, originality, and generates tailored faculty interview questions.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Presets */}
                      <select
                        onChange={(e) => {
                          const idx = parseInt(e.target.value);
                          if (!isNaN(idx) && SAMPLE_SOPS[idx]) {
                            const updated = {
                              ...selectedApp,
                              sopText: SAMPLE_SOPS[idx].text,
                              sopAnalysis: undefined,
                            } as AdmissionApplication;
                            setSelectedApp(updated);
                            setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
                          }
                        }}
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
                      >
                        <option value="">Load Preset Sample Essay...</option>
                        {SAMPLE_SOPS.map((s, i) => (
                          <option key={i} value={i}>
                            {s.title}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleEvaluateSop}
                        disabled={isEvaluatingSop}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
                      >
                        {isEvaluatingSop ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analyzing Semantic Depth...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Run AI SOP Evaluation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Left: SOP Text Editor/Viewer */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Applicant Narrative</span>
                        <span>{selectedApp.sopText.split(/\s+/).filter(Boolean).length} Words</span>
                      </div>
                      <textarea
                        value={selectedApp.sopText}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = {
                            ...selectedApp,
                            sopText: val,
                          };
                          setSelectedApp(updated);
                          setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
                        }}
                        rows={16}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-indigo-500"
                        placeholder="Paste applicant Statement of Purpose here..."
                      />
                    </div>

                    {/* Right: AI Evaluation Rubric */}
                    <div className="space-y-4">
                      {selectedApp.sopAnalysis ? (
                        <div className="space-y-4">
                          {/* Composite Score Card */}
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                SOP Evaluation Rating
                              </span>
                              <div className="text-xl font-bold text-white mt-0.5">
                                Tier: <span className="text-purple-400">{selectedApp.sopAnalysis.tier}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {selectedApp.sopAnalysis.executiveSummary}
                              </p>
                            </div>

                            <div className="text-center bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/40">
                              <span className="text-3xl font-extrabold text-indigo-400">
                                {selectedApp.sopAnalysis.overallScore}
                              </span>
                              <span className="text-[10px] text-slate-400 block">/ 100 PTS</span>
                            </div>
                          </div>

                          {/* Dimension Bars */}
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                            <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                              Core Dimension Breakdown
                            </h5>

                            <div>
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Academic & Faculty Research Alignment</span>
                                <span className="font-bold text-white">
                                  {selectedApp.sopAnalysis.dimensions.academicAlignment}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${selectedApp.sopAnalysis.dimensions.academicAlignment}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Clarity of Purpose & Career Vision</span>
                                <span className="font-bold text-white">
                                  {selectedApp.sopAnalysis.dimensions.visionClarity}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-cyan-500 rounded-full"
                                  style={{ width: `${selectedApp.sopAnalysis.dimensions.visionClarity}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Leadership, Grit & Resilience</span>
                                <span className="font-bold text-white">
                                  {selectedApp.sopAnalysis.dimensions.leadershipResilience}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${selectedApp.sopAnalysis.dimensions.leadershipResilience}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Originality & Authentic Voice (Anti-Plagiarism)</span>
                                <span className="font-bold text-white">
                                  {selectedApp.sopAnalysis.dimensions.originalityVoice}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${selectedApp.sopAnalysis.dimensions.originalityVoice}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {/* Strengths & Weaknesses */}
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                            <h5 className="text-xs font-bold text-emerald-400">Key Strengths Highlighted:</h5>
                            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                              {selectedApp.sopAnalysis.strengths.map((str, idx) => (
                                <li key={idx}>{str}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Tailored Interview Questions */}
                          <div className="bg-indigo-950/20 border border-indigo-800/30 rounded-xl p-4 space-y-2">
                            <h5 className="text-xs font-bold text-indigo-300">
                              AI-Generated Candidate Interview Questions:
                            </h5>
                            <ol className="list-decimal list-inside text-xs text-indigo-200 space-y-1.5">
                              {selectedApp.sopAnalysis.suggestedInterviewQuestions.map((q, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  {q}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                          <h4 className="text-sm font-semibold text-slate-300">SOP Not Evaluated Yet</h4>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Run the AI evaluator to analyze alignment with {selectedApp.intendedProgram} faculty and generate interview prompts.
                          </p>
                          <button
                            onClick={handleEvaluateSop}
                            disabled={isEvaluatingSop}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Evaluate SOP</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Committee Decision & Scholarship Grant */}
              {activeModalTab === 'decision' && (
                <div className="space-y-6">
                  {/* Actions Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white">Holistic Admission Decision & Scholarship Council</h4>
                      <p className="text-xs text-slate-400">
                        Synthesizes verified credentials, SOP merit, and academic cutoffs into an authoritative admissions decision.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleEvaluateAdmission}
                        disabled={isEvaluatingHolistic}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
                      >
                        {isEvaluatingHolistic ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Convening AI Council...</span>
                          </>
                        ) : (
                          <>
                            <Award className="w-4 h-4" />
                            <span>Compute Holistic Decision</span>
                          </>
                        )}
                      </button>

                      {selectedApp.admissionEvaluation && selectedApp.stage !== 'ADMITTED' && (
                        <button
                          onClick={handleEnrollCandidate}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve & Enroll Candidate</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedApp.admissionEvaluation ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {/* Left: Recommendation Metrics */}
                      <div className="space-y-4">
                        {/* Status Card */}
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Council Recommendation
                            </span>
                            <span className="text-xs text-slate-400">
                              Confidence: <span className="font-bold text-indigo-400">{selectedApp.admissionEvaluation.confidenceScore}%</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div
                              className={`p-3 rounded-xl border ${
                                selectedApp.admissionEvaluation.recommendedDecision.includes('ADMIT')
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : selectedApp.admissionEvaluation.recommendedDecision === 'WAITLIST'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              }`}
                            >
                              <GraduationCap className="w-8 h-8" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                {selectedApp.admissionEvaluation.recommendedDecision.replace('_', ' ')}
                              </h3>
                              <p className="text-xs text-slate-400">
                                Placement in {selectedApp.intendedProgram}
                              </p>
                            </div>
                          </div>

                          {/* Scholarship Card */}
                          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-amber-400" />
                                Merit Scholarship Recommendation
                              </span>
                              {selectedApp.admissionEvaluation.scholarshipAmountUSD && (
                                <span className="text-xs font-bold text-amber-200">
                                  ${selectedApp.admissionEvaluation.scholarshipAmountUSD.toLocaleString()} USD
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-amber-200/90 mt-1 font-medium">
                              {selectedApp.admissionEvaluation.scholarshipRecommendation}
                            </p>
                          </div>

                          {/* Rationale */}
                          <div>
                            <span className="text-xs font-bold text-slate-300 block mb-1">
                              Executive Rationale:
                            </span>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {selectedApp.admissionEvaluation.rationaleSummary}
                            </p>
                          </div>

                          {/* Recommended Pathway */}
                          {selectedApp.admissionEvaluation.recommendedPathway && (
                            <div className="pt-3 border-t border-slate-800 text-xs">
                              <span className="text-slate-400 font-medium">Recommended Academic Pathway: </span>
                              <span className="text-indigo-300 font-semibold">
                                {selectedApp.admissionEvaluation.recommendedPathway}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Official Decision Letter Preview */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            Official Admission Notification Draft
                          </span>
                          <button
                            onClick={copyLetterToClipboard}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedLetter ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Draft</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Letter Paper Simulation */}
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 text-xs text-slate-300 leading-relaxed font-serif space-y-3 shadow-inner">
                          <div className="border-b border-slate-800 pb-3 text-center not-italic font-sans">
                            <div className="font-bold text-white text-sm">OFFICE OF THE DEAN OF ADMISSIONS</div>
                            <div className="text-[11px] text-slate-400">INSTITUTE OF HIGHER COMPUTING & SCIENCES</div>
                          </div>

                          <div className="text-[11px] text-slate-400 font-sans">
                            Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            <br />
                            Candidate: {selectedApp.name} ({selectedApp.applicationId})
                          </div>

                          <div className="whitespace-pre-line text-slate-200">
                            {selectedApp.admissionEvaluation.officialLetterDraft}
                          </div>

                          <div className="pt-4 border-t border-slate-800 text-[11px] font-sans text-slate-400 flex items-center justify-between">
                            <span>Electronic Signature: Dr. Margaret Vance, Dean</span>
                            <span className="text-emerald-400 font-mono">HASH: 9a4e-auth-valid</span>
                          </div>
                        </div>

                        {/* Enrollment Confirmation */}
                        {selectedApp.stage !== 'ADMITTED' && (
                          <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center justify-between">
                            <span className="text-xs text-emerald-300">
                              Ready to formalize admission and issue university Roll No?
                            </span>
                            <button
                              onClick={handleEnrollCandidate}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition cursor-pointer"
                            >
                              Finalize Enrollment
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-12 text-center space-y-3">
                      <Award className="w-12 h-12 text-slate-600 mx-auto" />
                      <h4 className="text-sm font-semibold text-slate-300">Awaiting Committee Evaluation</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Click "Compute Holistic Decision" to evaluate {selectedApp.name}'s verified GPA ({selectedApp.gpa}), SOP score ({selectedApp.sopAnalysis?.overallScore || 'Pending'}), and award merit fellowships.
                      </p>
                      <button
                        onClick={handleEvaluateAdmission}
                        disabled={isEvaluatingHolistic}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Run Committee Evaluation</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>EduPulse Admissions Verification Engine</span>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg transition cursor-pointer"
              >
                Close Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
