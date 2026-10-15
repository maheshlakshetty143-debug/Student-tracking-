import { AdmissionApplication, Student, AttendanceLogEntry } from '../types';

// Helper to generate a realistic SVG document as base64
export function generateSampleDocumentDataUrl(
  type: 'HONORS_TRANSCRIPT' | 'FLAGGED_TRANSCRIPT' | 'CERTIFICATE_OF_MERIT',
  studentName: string,
  gpa: string,
  school: string
): string {
  const isFlagged = type === 'FLAGGED_TRANSCRIPT';
  const isCert = type === 'CERTIFICATE_OF_MERIT';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="800" height="1100">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fffdfa" />
        <stop offset="100%" stop-color="#f8f4eb" />
      </linearGradient>
      <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 0 20 Q 10 0 20 20 T 40 20" fill="none" stroke="#e3dac9" stroke-width="0.8" opacity="0.4" />
      </pattern>
    </defs>
    <rect width="800" height="1100" fill="url(#bg)" />
    <rect x="25" y="25" width="750" height="1050" fill="none" stroke="#2c3e50" stroke-width="4" />
    <rect x="35" y="35" width="730" height="1030" fill="none" stroke="#b8860b" stroke-width="1.5" />
    <rect x="45" y="45" width="710" height="1010" fill="url(#guilloche)" />

    <!-- Header Seal -->
    <circle cx="400" cy="140" r="45" fill="none" stroke="#0f172a" stroke-width="2.5" />
    <circle cx="400" cy="140" r="38" fill="none" stroke="#b8860b" stroke-dasharray="4,2" />
    <text x="400" y="135" font-family="serif" font-size="11" text-anchor="middle" font-weight="bold" fill="#0f172a">ACADEMIC BOARD</text>
    <text x="400" y="152" font-family="serif" font-size="10" text-anchor="middle" fill="#b8860b">ESTD 1948</text>

    <!-- Institution -->
    <text x="400" y="220" font-family="serif" font-size="24" text-anchor="middle" font-weight="bold" fill="#0f172a">${school.toUpperCase()}</text>
    <text x="400" y="245" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#475569" letter-spacing="2">OFFICIAL ACCREDITED ACADEMIC RECORD</text>
    <line x1="150" y1="260" x2="650" y2="260" stroke="#cbd5e1" stroke-width="1" />

    <!-- Document Title -->
    <text x="400" y="300" font-family="serif" font-size="20" text-anchor="middle" font-weight="bold" fill="#1e293b">
      ${isCert ? 'CERTIFICATE OF MERIT & DISTINCTION' : 'CONSOLIDATED TRANSCRIPT OF GRADES'}
    </text>

    <!-- Student Info Box -->
    <rect x="80" y="330" width="640" height="110" rx="4" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
    <text x="100" y="360" font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">CANDIDATE NAME:</text>
    <text x="240" y="360" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${studentName}</text>

    <text x="100" y="390" font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">ROLL / REG NO:</text>
    <text x="240" y="390" font-family="monospace" font-size="13" fill="#0f172a">REG-2024-${Math.floor(10000 + Math.random() * 90000)}</text>

    <text x="100" y="420" font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">OVERALL CUMULATIVE GPA:</text>
    <text x="300" y="420" font-family="sans-serif" font-size="${isFlagged ? '17' : '15'}" font-weight="bold" fill="${isFlagged ? '#dc2626' : '#15803d'}">
      ${gpa} ${isFlagged ? '(MANUALLY OVERWRITTEN / FONT ANOMALY)' : '/ 4.00 (FIRST CLASS DISTINCTION)'}
    </text>

    <!-- Subjects Table -->
    <rect x="80" y="470" width="640" height="30" fill="#0f172a" />
    <text x="100" y="490" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">COURSE / SUBJECT</text>
    <text x="400" y="490" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">CREDITS</text>
    <text x="500" y="490" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">GRADE</text>
    <text x="600" y="490" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">POINTS</text>

    <g font-family="sans-serif" font-size="12" fill="#334155">
      <rect x="80" y="500" width="640" height="28" fill="#f8fafc" />
      <text x="100" y="520">Advanced Calculus & Linear Algebra</text>
      <text x="410" y="520">4.0</text>
      <text x="510" y="520" font-weight="bold">A+</text>
      <text x="610" y="520">4.0</text>

      <rect x="80" y="528" width="640" height="28" fill="#ffffff" />
      <text x="100" y="548">Physics for Engineers: Mechanics & Waves</text>
      <text x="410" y="548">4.0</text>
      <text x="510" y="548" font-weight="bold">A</text>
      <text x="610" y="548">3.9</text>

      <rect x="80" y="556" width="640" height="28" fill="#f8fafc" />
      <text x="100" y="576">Computer Programming & Algorithms</text>
      <text x="410" y="576">4.0</text>
      <text x="510" y="576" font-weight="bold">A+</text>
      <text x="610" y="576">4.0</text>

      <rect x="80" y="584" width="640" height="28" fill="#ffffff" />
      <text x="100" y="604">Digital Electronics & Logic Circuits</text>
      <text x="410" y="604">3.0</text>
      <text x="510" y="604" font-weight="bold">A</text>
      <text x="610" y="604">3.8</text>

      <rect x="80" y="612" width="640" height="28" fill="#f8fafc" />
      <text x="100" y="632">Academic Writing, Ethics & Communication</text>
      <text x="410" y="632">3.0</text>
      <text x="510" y="632" font-weight="bold">A-</text>
      <text x="610" y="632">3.7</text>
    </g>

    <!-- Verification / Watermark Notes -->
    <rect x="80" y="670" width="640" height="90" fill="#f1f5f9" stroke="#cbd5e1" stroke-dasharray="3,3" />
    <text x="100" y="695" font-family="sans-serif" font-size="11" font-weight="bold" fill="#0f172a">SECURITY WATERMARK & DIGITAL VALIDATION:</text>
    <text x="100" y="715" font-family="sans-serif" font-size="10" fill="#475569">Certified authentic transcript with micro-line print and security fiber seal.</text>
    <text x="100" y="735" font-family="monospace" font-size="10" fill="#0284c7">SHA-256 HASH: 8f2a1b9c4d7e6f3a2b1c0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3</text>

    <!-- Stamp & Signatures -->
    <g transform="translate(140, 840)">
      <line x1="0" y1="60" x2="180" y2="60" stroke="#475569" stroke-width="1" />
      <path d="M 20 50 Q 60 20 90 45 T 150 40" fill="none" stroke="#1e293b" stroke-width="2" />
      <text x="90" y="80" font-family="sans-serif" font-size="11" text-anchor="middle" font-weight="bold" fill="#334155">REGISTRAR OF EXAMINATIONS</text>
    </g>

    <g transform="translate(480, 810)">
      <!-- Official Gold/Red Stamp -->
      <circle cx="80" cy="50" r="48" fill="none" stroke="${isFlagged ? '#94a3b8' : '#b91c1c'}" stroke-width="3" stroke-dasharray="6,2" />
      <circle cx="80" cy="50" r="42" fill="none" stroke="${isFlagged ? '#cbd5e1' : '#b91c1c'}" stroke-width="1.2" />
      <text x="80" y="45" font-family="serif" font-size="10" text-anchor="middle" font-weight="bold" fill="${isFlagged ? '#64748b' : '#b91c1c'}">OFFICIAL SEAL</text>
      <text x="80" y="60" font-family="sans-serif" font-size="8" text-anchor="middle" fill="${isFlagged ? '#64748b' : '#b91c1c'}">ACADEMIC AUDIT</text>
      <text x="80" y="115" font-family="sans-serif" font-size="11" text-anchor="middle" font-weight="bold" fill="#334155">CONTROLLER OF ADMISSIONS</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// Sample Classroom High-Res SVG for AI Vision Attendance Testing
export function generateSampleClassroomDataUrl(variant: 'FULL_LECTURE' | 'PARTIAL_ATTENDANCE' | 'LAB_SESSION'): string {
  const isPartial = variant === 'PARTIAL_ATTENDANCE';
  const isLab = variant === 'LAB_SESSION';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600">
    <defs>
      <linearGradient id="roomGrad" x1="0" y1="0" x2="0" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="60%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#334155" />
      </linearGradient>
      <linearGradient id="boardGrad" x1="0" y1="0" x2="100%" y2="0">
        <stop offset="0%" stop-color="#064e3b" />
        <stop offset="100%" stop-color="#047857" />
      </linearGradient>
    </defs>
    <!-- Background wall -->
    <rect width="1000" height="600" fill="url(#roomGrad)" />

    <!-- Blackboard / Projection Screen -->
    <rect x="250" y="40" width="500" height="150" rx="8" fill="url(#boardGrad)" stroke="#10b981" stroke-width="2" />
    <text x="500" y="80" font-family="sans-serif" font-size="18" text-anchor="middle" font-weight="bold" fill="#ecfdf5">
      ${isLab ? 'BIO-310: Computational Genomics & Lab Protocol' : 'CS-301: Distributed AI Systems & Architecture'}
    </text>
    <text x="500" y="110" font-family="monospace" font-size="14" text-anchor="middle" fill="#a7f3d0">
      Room 402B • Academic Session: Fall • Instructor: Prof. Vance
    </text>
    <text x="500" y="140" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#6ee7b7">
      [AI Vision Attendance Capture Active • Face & Seating Tagging]
    </text>

    <!-- Podium & Front desk -->
    <rect x="100" y="160" width="120" height="90" fill="#475569" stroke="#64748b" rx="4" />
    <rect x="120" y="130" width="80" height="30" fill="#334155" rx="2" />
    <text x="160" y="150" font-family="sans-serif" font-size="10" text-anchor="middle" fill="#94a3b8">LECTERN</text>

    <!-- Row 1 Desks & Students -->
    <rect x="120" y="320" width="760" height="24" fill="#64748b" rx="4" />
    <!-- Student 1 (Alex Chen) -->
    <g transform="translate(180, 260)">
      <circle cx="20" cy="20" r="18" fill="#fde047" stroke="#eab308" stroke-width="2" /> <!-- face -->
      <circle cx="15" cy="18" r="2" fill="#0f172a" />
      <circle cx="25" cy="18" r="2" fill="#0f172a" />
      <rect x="11" y="15" width="18" height="6" fill="none" stroke="#0f172a" stroke-width="1.5" /> <!-- glasses -->
      <path d="M 0 50 C 5 35, 35 35, 40 50 Z" fill="#2563eb" /> <!-- blue shirt -->
      <text x="20" y="70" font-family="sans-serif" font-size="10" text-anchor="middle" font-weight="bold" fill="#f8fafc">Alex Chen</text>
      <text x="20" y="82" font-family="monospace" font-size="8" text-anchor="middle" fill="#38bdf8">#CS-01</text>
    </g>

    <!-- Student 2 (Priya Sharma) -->
    <g transform="translate(360, 260)">
      <circle cx="20" cy="20" r="18" fill="#fed7aa" stroke="#f97316" stroke-width="2" />
      <circle cx="15" cy="18" r="2" fill="#0f172a" />
      <circle cx="25" cy="18" r="2" fill="#0f172a" />
      <path d="M 0 50 C 5 35, 35 35, 40 50 Z" fill="#db2777" /> <!-- pink top -->
      <text x="20" y="70" font-family="sans-serif" font-size="10" text-anchor="middle" font-weight="bold" fill="#f8fafc">Priya Sharma</text>
      <text x="20" y="82" font-family="monospace" font-size="8" text-anchor="middle" fill="#f472b6">#CS-02</text>
    </g>

    <!-- Student 3 (Liam Wilson) - Might be absent in partial -->
    ${
      isPartial
        ? `<g transform="translate(540, 260)">
            <rect x="0" y="30" width="40" height="25" fill="#334155" stroke="#ef4444" stroke-dasharray="3,3" rx="4" />
            <text x="20" y="47" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#f87171">[EMPTY SEAT]</text>
            <text x="20" y="70" font-family="sans-serif" font-size="10" text-anchor="middle" fill="#94a3b8">Liam Wilson (Abs)</text>
          </g>`
        : `<g transform="translate(540, 260)">
            <circle cx="20" cy="20" r="18" fill="#e2e8f0" stroke="#64748b" stroke-width="2" />
            <circle cx="15" cy="18" r="2" fill="#0f172a" />
            <circle cx="25" cy="18" r="2" fill="#0f172a" />
            <path d="M 0 50 C 5 35, 35 35, 40 50 Z" fill="#059669" />
            <text x="20" y="70" font-family="sans-serif" font-size="10" text-anchor="middle" font-weight="bold" fill="#f8fafc">Liam Wilson</text>
            <text x="20" y="82" font-family="monospace" font-size="8" text-anchor="middle" fill="#34d399">#CS-03</text>
          </g>`
    }

    <!-- Student 4 (Elena Rostova) -->
    <g transform="translate(720, 260)">
      <circle cx="20" cy="20" r="18" fill="#fef08a" stroke="#ca8a04" stroke-width="2" />
      <circle cx="15" cy="18" r="2" fill="#0f172a" />
      <circle cx="25" cy="18" r="2" fill="#0f172a" />
      <path d="M 0 50 C 5 35, 35 35, 40 50 Z" fill="#7c3aed" />
      <text x="20" y="70" font-family="sans-serif" font-size="10" text-anchor="middle" font-weight="bold" fill="#f8fafc">Elena Rostova</text>
      <text x="20" y="82" font-family="monospace" font-size="8" text-anchor="middle" fill="#c084fc">#CS-04</text>
    </g>

    <!-- Row 2 Desks & Students -->
    <rect x="80" y="470" width="840" height="28" fill="#475569" rx="4" />

    <!-- Student 5 (Marcus Johnson) -->
    <g transform="translate(140, 400)">
      <circle cx="24" cy="22" r="22" fill="#b45309" stroke="#78350f" stroke-width="2" />
      <circle cx="18" cy="20" r="2" fill="#ffffff" />
      <circle cx="30" cy="20" r="2" fill="#ffffff" />
      <path d="M 0 60 C 5 40, 45 40, 50 60 Z" fill="#0284c7" />
      <text x="24" y="82" font-family="sans-serif" font-size="11" text-anchor="middle" font-weight="bold" fill="#f8fafc">Marcus Johnson</text>
      <text x="24" y="96" font-family="monospace" font-size="9" text-anchor="middle" fill="#38bdf8">#CS-05</text>
    </g>

    <!-- Student 6 (Zoe Taylor) -->
    <g transform="translate(340, 400)">
      <circle cx="24" cy="22" r="22" fill="#fde047" stroke="#eab308" stroke-width="2" />
      <circle cx="18" cy="20" r="2" fill="#0f172a" />
      <circle cx="30" cy="20" r="2" fill="#0f172a" />
      <path d="M 0 60 C 5 40, 45 40, 50 60 Z" fill="#ea580c" />
      <text x="24" y="82" font-family="sans-serif" font-size="11" text-anchor="middle" font-weight="bold" fill="#f8fafc">Zoe Taylor</text>
      <text x="24" y="96" font-family="monospace" font-size="9" text-anchor="middle" fill="#fb923c">#CS-06</text>
    </g>

    <!-- Student 7 (David Kim) -->
    <g transform="translate(560, 400)">
      <circle cx="24" cy="22" r="22" fill="#fed7aa" stroke="#f97316" stroke-width="2" />
      <circle cx="18" cy="20" r="2" fill="#0f172a" />
      <circle cx="30" cy="20" r="2" fill="#0f172a" />
      <path d="M 0 60 C 5 40, 45 40, 50 60 Z" fill="#16a34a" />
      <text x="24" y="82" font-family="sans-serif" font-size="11" text-anchor="middle" font-weight="bold" fill="#f8fafc">David Kim</text>
      <text x="24" y="96" font-family="monospace" font-size="9" text-anchor="middle" fill="#4ade80">#CS-07</text>
    </g>

    <!-- Student 8 (Sarah Jenkins) -->
    <g transform="translate(760, 400)">
      <circle cx="24" cy="22" r="22" fill="#fbcfe8" stroke="#f43f5e" stroke-width="2" />
      <circle cx="18" cy="20" r="2" fill="#0f172a" />
      <circle cx="30" cy="20" r="2" fill="#0f172a" />
      <path d="M 0 60 C 5 40, 45 40, 50 60 Z" fill="#4f46e5" />
      <text x="24" y="82" font-family="sans-serif" font-size="11" text-anchor="middle" font-weight="bold" fill="#f8fafc">Sarah Jenkins</text>
      <text x="24" y="96" font-family="monospace" font-size="9" text-anchor="middle" fill="#818cf8">#CS-08</text>
    </g>

    <!-- AI Vision Detection HUD Overlay -->
    <rect x="20" y="20" width="200" height="50" rx="6" fill="#0f172a" opacity="0.8" stroke="#3b82f6" />
    <circle cx="40" cy="45" r="6" fill="#22c55e" />
    <text x="55" y="42" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff">AI VISION SCANNER</text>
    <text x="55" y="56" font-family="monospace" font-size="10" fill="#93c5fd">FPS: 30 • 4K STREAM</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export const INITIAL_APPLICATIONS: AdmissionApplication[] = [
  {
    id: 'app-001',
    applicationId: 'ADM-2026-9041',
    name: 'Aria Thorne',
    email: 'aria.thorne@stemconnect.org',
    phone: '+1 (555) 392-8819',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    intendedProgram: 'B.S. Artificial Intelligence & Robotics',
    previousSchool: 'Westlake Polytechnic High School',
    gpa: 3.94,
    testScore: 'SAT: 1540 (Math: 790, EBRW: 750)',
    extracurriculars: 'Captain of FIRST Robotics team; Published paper on miniature quadcopter swarm pathfinding; Volunteer STEM mentor.',
    financialAidRequested: true,
    sopText: `Growing up surrounded by the rapid expansion of automated hardware, my goal has always been to build robotic perception systems that augment human safety rather than merely replace human labor. At Westlake Polytechnic, I spent two years leading our robotics engineering club where we engineered an open-source autonomous rover to identify structural micro-fractures in aging municipal bridges. This endeavor taught me that cutting-edge neural architectures are only as strong as their real-world grounding and ethical safeguards.

Your university’s Institute for Autonomous Intelligence offers unparalleled labs under Prof. Vance and Dr. Liang, whose papers on spatial neuromorphic computing directly inspired our high school rover's telemetry design. I want to spend my undergraduate journey contributing to active research in edge-compute computer vision while taking rigorous courses in advanced algorithms, machine learning ethics, and robotic kinematics. I am eager to contribute my technical rigor, team leadership, and relentless curiosity to your academic community.`,
    documentType: 'Official High School Academic Transcript',
    documentSampleKey: 'HONORS_TRANSCRIPT',
    documentPreviewUrl: generateSampleDocumentDataUrl(
      'HONORS_TRANSCRIPT',
      'Aria Thorne',
      '3.94',
      'Westlake Polytechnic High School'
    ),
    documentStatus: 'VERIFIED',
    documentAnalysis: {
      extractedName: 'Aria Thorne',
      issuingInstitution: 'Westlake Polytechnic High School',
      credentialTitle: 'High School Honors Diploma in STEM',
      graduationDate: 'June 2026',
      extractedGpaOrScore: '3.94 / 4.00 (Unweighted)',
      subjectsFound: ['Advanced Calculus BC', 'AP Physics C', 'Data Structures in C++', 'Digital Logic'],
      authenticityScore: 98,
      status: 'VERIFIED',
      tamperIndicatorsDetected: [],
      keyObservations: [
        'Genuine embossed board seal and verified registrar signature detected.',
        'Perfect consistency between claimed 3.94 GPA and official course credit audit.',
        'Exemplary course rigor in mathematics and physical sciences exceeding prerequisite requirements.',
      ],
      admissionRecommendation: 'Highest academic priority. Document fully verified with 98% forensic confidence.',
    },
    sopAnalysis: {
      overallScore: 95,
      tier: 'EXCEPTIONAL',
      dimensions: {
        academicAlignment: 96,
        visionClarity: 94,
        leadershipResilience: 92,
        originalityVoice: 98,
      },
      executiveSummary: 'Outstanding, highly articulate narrative demonstrating deep hands-on robotics research, genuine institutional alignment, and mature leadership.',
      strengths: [
        'Cites specific faculty research (Prof. Vance & Dr. Liang) demonstrating authentic institutional fit.',
        'Substantive technical project (autonomous rover for bridge micro-fractures) with real-world impact.',
        'Zero generic platitudes; confident and distinct scholarly voice.',
      ],
      suggestedInterviewQuestions: [
        'How did you tackle sensor noise and latency when operating the rover across uneven bridge joints?',
        'Which trade-offs between neuromorphic edge computing and cloud compute do you hope to investigate further?',
        'How do you envision mentoring peers who might have had less prior coding exposure in high school?',
      ],
    },
    admissionEvaluation: {
      recommendedDecision: 'DIRECT_ADMIT',
      confidenceScore: 97,
      scholarshipRecommendation: '$20,000 Presidential STEM Honor Fellowship',
      scholarshipAmountUSD: 20000,
      meritPercentile: 'Top 1.5%',
      rationaleSummary: 'Aria is a top-tier candidate matching institutional priorities in AI & Robotics. Stellar academic metrics, pristine verified credentials, and compelling research drive.',
      keyStrengths: ['Top 1% STEM rigor', '98% document authenticity score', 'Clear research focus'],
      riskFactors: [],
      recommendedPathway: 'Honors Accelerated Track with freshman lab placement in Autonomous Perception Lab',
      officialLetterDraft: 'Dear Aria, On behalf of the University Admissions Board, it is our distinct privilege to offer you admission to the B.S. in Artificial Intelligence & Robotics with the Presidential STEM Honor Fellowship.',
    },
    stage: 'DECISION_READY',
    submittedAt: '2026-10-10T14:32:00Z',
  },
  {
    id: 'app-002',
    applicationId: 'ADM-2026-9042',
    name: 'Julian Vance',
    email: 'julian.vance@inboxmail.com',
    phone: '+1 (555) 714-2209',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    intendedProgram: 'B.S. Computer Science',
    previousSchool: 'Crestview Metro High School',
    gpa: 3.82,
    testScore: 'ACT: 31',
    extracurriculars: 'Built mobile quiz app with 5,000 downloads; High school varsity soccer vice-captain.',
    financialAidRequested: false,
    sopText: `Computer science is the defining language of the 21st century. Ever since I received my first computer at age ten, I was amazed by how lines of code could transform a screen into an interactive realm. I taught myself Python and Flutter, eventually releasing a collaborative study flashcard application that helped thousands of high school peers study for AP exams.

At your institution, I aim to deepen my understanding of distributed backend systems and cloud infrastructure. Your state-of-the-art campus and strong industry co-op programs with leading tech incubators provide the exact platform I need to bridge theoretical algorithms with scalable consumer software. I am prepared to dedicate myself fully to your curriculum and student development.`,
    documentType: 'Official High School Transcript',
    documentSampleKey: 'HONORS_TRANSCRIPT',
    documentPreviewUrl: generateSampleDocumentDataUrl(
      'HONORS_TRANSCRIPT',
      'Julian Vance',
      '3.82',
      'Crestview Metro High School'
    ),
    documentStatus: 'VERIFIED',
    stage: 'SOP_EVALUATION',
    submittedAt: '2026-10-11T09:15:00Z',
  },
  {
    id: 'app-003',
    applicationId: 'ADM-2026-9043',
    name: 'Kavita Sundaram',
    email: 'kavita.sundaram@gmail.com',
    phone: '+1 (555) 902-3341',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    intendedProgram: 'B.S. Biomedical Engineering',
    previousSchool: 'St. Jude International Academy',
    gpa: 3.98,
    testScore: 'SAT: 1560 (Math: 800, EBRW: 760)',
    extracurriculars: 'National Science Olympiad Gold Medalist; Volunteered 200+ hours in pediatric cardiology clinic; Play classical violin.',
    financialAidRequested: true,
    sopText: `Witnessing how computational diagnostics can pinpoint microvascular cardiac defects before symptomatic onset crystallized my calling in Biomedical Engineering. During my hospital observership, I observed ultrasound sonography and became fascinated by how signal filtering algorithms isolate acoustic noise. I wish to pursue cardiovascular biomechanics and bio-MEMS sensors in your world-renowned Biomedical laboratories.`,
    documentType: 'International Baccalaureate Official Diploma & Transcript',
    documentSampleKey: 'HONORS_TRANSCRIPT',
    documentPreviewUrl: generateSampleDocumentDataUrl(
      'HONORS_TRANSCRIPT',
      'Kavita Sundaram',
      '3.98',
      'St. Jude International Academy'
    ),
    documentStatus: 'PENDING',
    stage: 'DOCUMENT_VERIFICATION',
    submittedAt: '2026-10-12T11:45:00Z',
  },
  {
    id: 'app-004',
    applicationId: 'ADM-2026-9044',
    name: 'Brandon Cole',
    email: 'brandon.c@apexschool.net',
    phone: '+1 (555) 441-0982',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    intendedProgram: 'B.S. Data Science & Analytics',
    previousSchool: 'Oakridge Community High',
    gpa: 3.75, // Claimed 3.75 but document has alteration!
    testScore: 'SAT: 1280',
    extracurriculars: 'Fantasy sports statistical modeler; School newspaper sports editor.',
    financialAidRequested: false,
    sopText: `I like computers and numbers. Data science is a growing field with high salaries and lots of jobs. I want to study here because your university has a good name and good campus life. I will work hard and get good grades.`,
    documentType: 'High School Marks Card (Flagged)',
    documentSampleKey: 'FLAGGED_TRANSCRIPT',
    documentPreviewUrl: generateSampleDocumentDataUrl(
      'FLAGGED_TRANSCRIPT',
      'Brandon Cole',
      '3.75',
      'Oakridge Community High'
    ),
    documentStatus: 'FLAGGED',
    documentAnalysis: {
      extractedName: 'Brandon Cole',
      issuingInstitution: 'Oakridge Community High',
      credentialTitle: 'Secondary School Transcript',
      graduationDate: 'May 2026',
      extractedGpaOrScore: '2.95 (Altered to 3.75 on claimed record)',
      subjectsFound: ['Algebra II', 'Chemistry', 'General English', 'Intro to Computing'],
      authenticityScore: 32,
      status: 'FLAGGED_SUSPICIOUS',
      tamperIndicatorsDetected: [
        'Noticeable font rasterization mismatch on GPA field (Helvetica vs original Garamond font).',
        'Official stamp shows blurred artifact typical of cut-and-paste manipulation.',
        'Transcript hash check failed against district digital verification clearinghouse.',
      ],
      keyObservations: [
        'Clear visual indicators of grade inflation manipulation in digital PDF.',
        'Missing mandatory registrar counter-signature.',
      ],
      admissionRecommendation: 'Hold application pending secondary audit or immediate denial due to academic integrity violation.',
    },
    stage: 'DOCUMENT_VERIFICATION',
    submittedAt: '2026-10-13T16:20:00Z',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu-101',
    rollNo: 'CS-2024-001',
    name: 'Alex Chen',
    email: 'a.chen@university.edu',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    department: 'Computer Science & Engineering',
    program: 'B.S. Computer Science',
    year: 3,
    semester: 5,
    gpa: 3.88,
    overallAttendance: 94.2,
    subjectAttendance: {
      'CS-301 Distributed Systems': 96,
      'CS-302 Algorithm Engineering': 92,
      'AI-402 Deep Learning': 95,
      'MATH-301 Numerical Analysis': 94,
    },
    status: 'ACTIVE',
    visualTag: 'Male, dark hair, glasses, yellow/dark sweater, front row',
    riskTier: 'HEALTHY',
    guardianName: 'Robert Chen',
    guardianPhone: '+1 (555) 998-1122',
    guardianEmail: 'robert.chen@corp.com',
    admissionYear: 2024,
    recentAttendanceTrend: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  },
  {
    id: 'stu-102',
    rollNo: 'CS-2024-002',
    name: 'Priya Sharma',
    email: 'p.sharma@university.edu',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    department: 'Computer Science & Engineering',
    program: 'B.S. Artificial Intelligence & Robotics',
    year: 3,
    semester: 5,
    gpa: 3.92,
    overallAttendance: 91.5,
    subjectAttendance: {
      'CS-301 Distributed Systems': 90,
      'CS-302 Algorithm Engineering': 94,
      'AI-402 Deep Learning': 93,
      'MATH-301 Numerical Analysis': 89,
    },
    status: 'ACTIVE',
    visualTag: 'Female, dark brown hair, pink/magenta top, front row left',
    riskTier: 'HEALTHY',
    guardianName: 'Anil Sharma',
    guardianPhone: '+1 (555) 887-2233',
    guardianEmail: 'anil.sharma@domain.in',
    admissionYear: 2024,
    recentAttendanceTrend: ['P', 'P', 'P', 'L', 'P', 'P', 'P', 'P', 'P', 'P'],
  },
  {
    id: 'stu-103',
    rollNo: 'CS-2024-003',
    name: 'Liam Wilson',
    email: 'l.wilson@university.edu',
    phone: '+1 (555) 456-7890',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'Computer Science & Engineering',
    program: 'B.S. Computer Science',
    year: 3,
    semester: 5,
    gpa: 2.74,
    overallAttendance: 61.2, // Below 75% threshold!
    subjectAttendance: {
      'CS-301 Distributed Systems': 58,
      'CS-302 Algorithm Engineering': 62,
      'AI-402 Deep Learning': 60,
      'MATH-301 Numerical Analysis': 65,
    },
    status: 'PROBATION',
    visualTag: 'Male, light hair, green hoodie, middle row',
    riskTier: 'CRITICAL',
    guardianName: 'Heather Wilson',
    guardianPhone: '+1 (555) 776-3344',
    guardianEmail: 'hwilson@familynet.org',
    admissionYear: 2024,
    recentAttendanceTrend: ['A', 'A', 'P', 'A', 'A', 'A', 'P', 'A', 'A', 'P'],
  },
  {
    id: 'stu-104',
    rollNo: 'CS-2024-004',
    name: 'Elena Rostova',
    email: 'e.rostova@university.edu',
    phone: '+1 (555) 567-8901',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    department: 'Data Science & AI',
    program: 'B.S. Data Science & Analytics',
    year: 2,
    semester: 3,
    gpa: 3.65,
    overallAttendance: 88.0,
    subjectAttendance: {
      'CS-301 Distributed Systems': 85,
      'CS-302 Algorithm Engineering': 90,
      'AI-402 Deep Learning': 88,
      'MATH-301 Numerical Analysis': 89,
    },
    status: 'ACTIVE',
    visualTag: 'Female, blonde hair, purple top, front row right',
    riskTier: 'HEALTHY',
    guardianName: 'Dmitri Rostov',
    guardianPhone: '+1 (555) 665-4455',
    guardianEmail: 'd.rostov@telecom.eu',
    admissionYear: 2025,
    recentAttendanceTrend: ['P', 'P', 'P', 'P', 'A', 'P', 'P', 'P', 'P', 'P'],
  },
  {
    id: 'stu-105',
    rollNo: 'CS-2024-005',
    name: 'Marcus Johnson',
    email: 'm.johnson@university.edu',
    phone: '+1 (555) 678-9012',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    department: 'Computer Science & Engineering',
    program: 'B.S. Computer Science',
    year: 3,
    semester: 5,
    gpa: 3.41,
    overallAttendance: 72.4, // Borderline defaulter
    subjectAttendance: {
      'CS-301 Distributed Systems': 70,
      'CS-302 Algorithm Engineering': 74,
      'AI-402 Deep Learning': 71,
      'MATH-301 Numerical Analysis': 75,
    },
    status: 'ACTIVE',
    visualTag: 'Male, dark complexion, athletic build, blue shirt, row 2 left',
    riskTier: 'MODERATE',
    guardianName: 'Patricia Johnson',
    guardianPhone: '+1 (555) 554-5566',
    guardianEmail: 'patricia.j@citygov.org',
    admissionYear: 2024,
    recentAttendanceTrend: ['P', 'A', 'P', 'P', 'A', 'P', 'A', 'P', 'P', 'A'],
  },
  {
    id: 'stu-106',
    rollNo: 'CS-2024-006',
    name: 'Zoe Taylor',
    email: 'z.taylor@university.edu',
    phone: '+1 (555) 789-0123',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    department: 'Biomedical Engineering',
    program: 'B.S. Biomedical Engineering',
    year: 2,
    semester: 3,
    gpa: 3.80,
    overallAttendance: 96.0,
    subjectAttendance: {
      'CS-301 Distributed Systems': 95,
      'CS-302 Algorithm Engineering': 96,
      'AI-402 Deep Learning': 97,
      'MATH-301 Numerical Analysis': 96,
    },
    status: 'ACTIVE',
    visualTag: 'Female, auburn hair, orange jacket, row 2 center',
    riskTier: 'HEALTHY',
    guardianName: 'Gregory Taylor',
    guardianPhone: '+1 (555) 443-6677',
    guardianEmail: 'gtaylor@designstudio.com',
    admissionYear: 2025,
    recentAttendanceTrend: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  },
  {
    id: 'stu-107',
    rollNo: 'CS-2024-007',
    name: 'David Kim',
    email: 'd.kim@university.edu',
    phone: '+1 (555) 890-1234',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    department: 'Computer Science & Engineering',
    program: 'B.S. Computer Science',
    year: 3,
    semester: 5,
    gpa: 3.70,
    overallAttendance: 89.2,
    subjectAttendance: {
      'CS-301 Distributed Systems': 88,
      'CS-302 Algorithm Engineering': 91,
      'AI-402 Deep Learning': 88,
      'MATH-301 Numerical Analysis': 90,
    },
    status: 'ACTIVE',
    visualTag: 'Male, black hair, green shirt, row 2 right',
    riskTier: 'HEALTHY',
    guardianName: 'Grace Kim',
    guardianPhone: '+1 (555) 332-7788',
    guardianEmail: 'grace.kim@academics.kr',
    admissionYear: 2024,
    recentAttendanceTrend: ['P', 'P', 'P', 'P', 'P', 'L', 'P', 'P', 'P', 'P'],
  },
  {
    id: 'stu-108',
    rollNo: 'CS-2024-008',
    name: 'Sarah Jenkins',
    email: 's.jenkins@university.edu',
    phone: '+1 (555) 901-2345',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    department: 'Data Science & AI',
    program: 'B.S. Data Science & Analytics',
    year: 2,
    semester: 3,
    gpa: 3.25,
    overallAttendance: 68.5, // Below 75% threshold
    subjectAttendance: {
      'CS-301 Distributed Systems': 65,
      'CS-302 Algorithm Engineering': 70,
      'AI-402 Deep Learning': 68,
      'MATH-301 Numerical Analysis': 71,
    },
    status: 'ACTIVE',
    visualTag: 'Female, light hair, indigo/navy hoodie, row 2 right corner',
    riskTier: 'CRITICAL',
    guardianName: 'Thomas Jenkins',
    guardianPhone: '+1 (555) 221-8899',
    guardianEmail: 'tjenkins@jenkinshomes.com',
    admissionYear: 2025,
    recentAttendanceTrend: ['P', 'A', 'A', 'P', 'A', 'A', 'P', 'A', 'A', 'A'],
  },
];

export const INITIAL_ATTENDANCE_LOGS: AttendanceLogEntry[] = [
  {
    id: 'log-501',
    courseCode: 'CS-301',
    courseName: 'Distributed Systems & Cloud Architecture',
    sessionDate: '2026-10-14',
    timeSlot: '09:00 AM - 10:30 AM',
    lecturer: 'Prof. Vance',
    totalEnrolled: 8,
    presentCount: 7,
    absentCount: 1,
    method: 'AI_VISION',
    attendanceRate: 87.5,
    classroomPhotoUrl: generateSampleClassroomDataUrl('PARTIAL_ATTENDANCE'),
    auditNotes: 'AI Vision verified 7 students present with 96% biometric match confidence. Liam Wilson marked absent (empty seat B-3 verified).',
  },
  {
    id: 'log-502',
    courseCode: 'AI-402',
    courseName: 'Deep Learning & Neural Architectures',
    sessionDate: '2026-10-13',
    timeSlot: '11:00 AM - 12:30 PM',
    lecturer: 'Dr. Liang',
    totalEnrolled: 8,
    presentCount: 8,
    absentCount: 0,
    method: 'AI_VISION',
    attendanceRate: 100.0,
    classroomPhotoUrl: generateSampleClassroomDataUrl('FULL_LECTURE'),
    auditNotes: '100% full attendance recorded via camera sensor array. High classroom engagement noted.',
  },
  {
    id: 'log-503',
    courseCode: 'CS-302',
    courseName: 'Advanced Algorithm Engineering',
    sessionDate: '2026-10-12',
    timeSlot: '02:00 PM - 03:30 PM',
    lecturer: 'Prof. Morales',
    totalEnrolled: 8,
    presentCount: 6,
    absentCount: 2,
    method: 'QR_KIOSK',
    attendanceRate: 75.0,
    auditNotes: 'Contactless kiosk turnstile check-in at Lecture Hall B entrance. 2 unexcused absences.',
  },
];

export const SAMPLE_SOPS = [
  {
    title: 'High-Impact Robotics Aspirant (Exemplary)',
    program: 'B.S. Artificial Intelligence & Robotics',
    text: `Growing up surrounded by the rapid expansion of automated hardware, my goal has always been to build robotic perception systems that augment human safety rather than merely replace human labor. At Westlake Polytechnic, I spent two years leading our robotics engineering club where we engineered an open-source autonomous rover to identify structural micro-fractures in aging municipal bridges. This endeavor taught me that cutting-edge neural architectures are only as strong as their real-world grounding and ethical safeguards.

Your university’s Institute for Autonomous Intelligence offers unparalleled labs under Prof. Vance and Dr. Liang, whose papers on spatial neuromorphic computing directly inspired our high school rover's telemetry design. I want to spend my undergraduate journey contributing to active research in edge-compute computer vision while taking rigorous courses in advanced algorithms, machine learning ethics, and robotic kinematics. I am eager to contribute my technical rigor, team leadership, and relentless curiosity to your academic community.`,
  },
  {
    title: 'Generic AI-Generated Essay (Flagged for Cliches)',
    program: 'B.S. Computer Science',
    text: `Since the dawn of time, technology has always been a beacon of light in the vast ocean of human civilization. In today's fast-paced world, computer science is the backbone of innovation and society. Computers have always fascinated me from a very young age when I first clicked a mouse. Technology is changing the world, and I want to be part of that change.

Your esteemed institution has great faculty, wonderful buildings, and a great ranking. If I am admitted, I promise to be a hardworking student who attends all classes, gets good grades, and makes the university proud. In conclusion, please accept my application.`,
  },
  {
    title: 'Interdisciplinary Bio-Data Science Transitioner',
    program: 'B.S. Data Science & Analytics',
    text: `During my junior year research internship at the regional genomics consortium, our lab hit a bottleneck: we had thousands of patient DNA sequence variations, but lacked custom algorithmic pipelines to isolate stochastic errors from clinically actionable oncogenic mutations. This realization transformed my passion from passive biology to high-throughput data engineering.

I taught myself Python and statistical clustering to build a preliminary variant classifier. At your university, I want to bridge biomedical informatics and massive-scale statistical learning. Your faculty's collaborative projects with academic hospitals present the ideal environment for my dual aspirations in clinical precision algorithms.`,
  },
];
