export type ProgramType =
  | 'B.S. Computer Science'
  | 'B.S. Artificial Intelligence & Robotics'
  | 'B.S. Data Science & Analytics'
  | 'B.S. Biomedical Engineering'
  | 'B.B.A. Business Analytics';

export type AdmissionStage =
  | 'NEW_INQUIRY'
  | 'DOCUMENT_VERIFICATION'
  | 'SOP_EVALUATION'
  | 'DECISION_READY'
  | 'ADMITTED'
  | 'WAITLISTED'
  | 'REJECTED';

export interface DocumentAnalysisResult {
  extractedName: string;
  issuingInstitution: string;
  credentialTitle?: string;
  graduationDate?: string;
  extractedGpaOrScore?: string;
  subjectsFound?: string[];
  authenticityScore: number;
  status: 'VERIFIED' | 'FLAGGED_SUSPICIOUS' | 'INCOMPLETE_OR_UNREADABLE';
  tamperIndicatorsDetected?: string[];
  keyObservations: string[];
  admissionRecommendation: string;
}

export interface SopAnalysisResult {
  overallScore: number;
  tier: 'EXCEPTIONAL' | 'STRONG' | 'COMPETITIVE' | 'MARGINAL' | 'DEFICIENT';
  dimensions: {
    academicAlignment: number;
    visionClarity: number;
    leadershipResilience: number;
    originalityVoice: number;
  };
  executiveSummary: string;
  strengths: string[];
  concernsOrRedFlags?: string[];
  suggestedInterviewQuestions: string[];
}

export interface AdmissionEvaluationResult {
  recommendedDecision: 'DIRECT_ADMIT' | 'CONDITIONAL_ADMIT' | 'WAITLIST' | 'DENIED';
  confidenceScore: number;
  scholarshipRecommendation: string;
  scholarshipAmountUSD?: number;
  meritPercentile?: string;
  rationaleSummary: string;
  keyStrengths?: string[];
  riskFactors?: string[];
  recommendedPathway?: string;
  officialLetterDraft: string;
}

export interface AdmissionApplication {
  id: string;
  applicationId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  intendedProgram: ProgramType;
  previousSchool: string;
  gpa: number;
  testScore?: string;
  extracurriculars: string;
  financialAidRequested: boolean;
  sopText: string;
  documentType: string;
  documentSampleKey?: string;
  documentPreviewUrl?: string;
  documentStatus: 'PENDING' | 'VERIFIED' | 'FLAGGED';
  documentAnalysis?: DocumentAnalysisResult;
  sopAnalysis?: SopAnalysisResult;
  admissionEvaluation?: AdmissionEvaluationResult;
  stage: AdmissionStage;
  submittedAt: string;
  decisionDate?: string;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  department: string;
  program: ProgramType;
  year: number;
  semester: number;
  gpa: number;
  overallAttendance: number; // percentage
  subjectAttendance: Record<string, number>;
  status: 'ACTIVE' | 'PROBATION' | 'LEAVE';
  visualTag: string; // descriptive cue for AI vision matching
  riskTier: 'HEALTHY' | 'MODERATE' | 'CRITICAL';
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  admissionYear: number;
  recentAttendanceTrend: ('P' | 'A' | 'L')[];
}

export interface VisionDetectionItem {
  studentId?: string;
  studentName: string;
  status: 'PRESENT' | 'ABSENT' | 'UNCERTAIN';
  confidence: number;
  seatLocation?: string;
  visualNotes?: string;
}

export interface VisionAttendanceResult {
  detectedHeadcount: number;
  confidenceScore: number;
  verifiedPresentCount?: number;
  verifiedAbsentCount?: number;
  attendanceRatePercent: number;
  studentDetections: VisionDetectionItem[];
  anomaliesOrFlags: string[];
  classroomEngagement?: string;
  auditSummary: string;
}

export interface AttendanceRiskPrediction {
  riskLevel: 'CRITICAL_DEFICIT' | 'ELEVATED_RISK' | 'MODERATE_WATCH' | 'HEALTHY_ATTENDANCE';
  riskScore: number;
  predictedFinalAttendance: number;
  detectedPatterns: string[];
  rootCauseHypothesis?: string;
  recommendedInterventions: string[];
  automatedGuardianNotice: string;
  counselorActionPlan?: string;
}

export interface AttendanceLogEntry {
  id: string;
  courseCode: string;
  courseName: string;
  sessionDate: string;
  timeSlot: string;
  lecturer: string;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  method: 'AI_VISION' | 'QR_KIOSK' | 'MANUAL';
  attendanceRate: number;
  classroomPhotoUrl?: string;
  auditNotes?: string;
}
