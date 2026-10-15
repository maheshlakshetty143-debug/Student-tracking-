import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser with sufficient limit for base64 images / photos
  app.use(express.json({ limit: '35mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // 1. AI Document OCR & Verification Endpoint
  app.post('/api/ai/verify-document', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', documentType = 'Academic Transcript', studentName, claimedGpa } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image base64 data is required for document verification' });
      }

      // Remove data URL prefix if provided
      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');

      const prompt = `You are an expert University Admissions Document Verification Officer and Forensic Auditor.
Analyze the provided document image (${documentType}).
Student Name on record: ${studentName || 'Not specified'}
Claimed GPA / Percentage: ${claimedGpa || 'Not specified'}

Perform thorough OCR, structural analysis, and authenticity verification:
1. Extract candidate name, issuing institution, degree/program, completion/issue date, overall GPA/grade, and top subjects.
2. Cross-verify if extracted candidate name and grades match the student's claimed records.
3. Detect authenticity markers: official seals, signatures, watermarks, anti-tampering layout, font uniformity, or signs of digital alterations.
4. Provide an overall Authenticity Score (0-100), Verification Status ('VERIFIED', 'FLAGGED_SUSPICIOUS', 'INCOMPLETE_OR_UNREADABLE'), and detailed reasoning.
5. Provide actionable recommendations for the admissions committee.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedName: { type: Type.STRING, description: 'Student name found on document' },
              issuingInstitution: { type: Type.STRING, description: 'School, College, or Board name' },
              credentialTitle: { type: Type.STRING, description: 'e.g. High School Diploma, Bachelor of Science' },
              graduationDate: { type: Type.STRING, description: 'Date or year of completion' },
              extractedGpaOrScore: { type: Type.STRING, description: 'GPA, percentage, or honors division' },
              subjectsFound: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key subjects or course codes extracted',
              },
              authenticityScore: { type: Type.NUMBER, description: 'Confidence score from 0 to 100' },
              status: {
                type: Type.STRING,
                description: 'VERIFIED | FLAGGED_SUSPICIOUS | INCOMPLETE_OR_UNREADABLE',
              },
              tamperIndicatorsDetected: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Any red flags, font mismatches, irregular alignment, or absence of seal',
              },
              keyObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Bullet points highlighting key forensic findings',
              },
              admissionRecommendation: {
                type: Type.STRING,
                description: 'Admissions council recommendation regarding this document',
              },
            },
            required: [
              'extractedName',
              'issuingInstitution',
              'authenticityScore',
              'status',
              'keyObservations',
              'admissionRecommendation',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Error in /api/ai/verify-document:', err);
      return res.status(500).json({
        error: err.message || 'Failed to verify document with AI',
      });
    }
  });

  // 2. AI SOP & Essay Evaluation Endpoint
  app.post('/api/ai/evaluate-sop', async (req, res) => {
    try {
      const { sopText, studentName, targetProgram, previousMajor } = req.body;

      if (!sopText || sopText.trim().length < 20) {
        return res.status(400).json({ error: 'SOP text must be at least 20 characters.' });
      }

      const prompt = `You are a Senior Admissions Committee Member evaluating a Statement of Purpose (SOP) / Admission Essay.
Student Name: ${studentName || 'Applicant'}
Target Program: ${targetProgram || 'General Admissions'}
Previous Background: ${previousMajor || 'Undisclosed'}

Candidate Statement of Purpose:
"""
${sopText}
"""

Evaluate this essay critically across academic readiness, clarity of vision, leadership & resilience, and originality.
Provide numerical scores (1-100) for dimensions, detect potential cliché or generic AI writing markers, summarize core strengths and weaknesses, generate 3 tailored interview questions for this specific candidate, and assign an overall Essay Quality Tier.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER, description: 'Composite score out of 100' },
              tier: { type: Type.STRING, description: 'EXCEPTIONAL | STRONG | COMPETITIVE | MARGINAL | DEFICIENT' },
              dimensions: {
                type: Type.OBJECT,
                properties: {
                  academicAlignment: { type: Type.NUMBER },
                  visionClarity: { type: Type.NUMBER },
                  leadershipResilience: { type: Type.NUMBER },
                  originalityVoice: { type: Type.NUMBER },
                },
                required: ['academicAlignment', 'visionClarity', 'leadershipResilience', 'originalityVoice'],
              },
              executiveSummary: { type: Type.STRING, description: '2-3 sentence executive review of the applicant essay' },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key positive differentiators',
              },
              concernsOrRedFlags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Weaknesses, lack of specifics, or vagueness',
              },
              suggestedInterviewQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 bespoke interview questions probing their claims and aspirations',
              },
            },
            required: ['overallScore', 'tier', 'dimensions', 'executiveSummary', 'strengths', 'suggestedInterviewQuestions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Error in /api/ai/evaluate-sop:', err);
      return res.status(500).json({ error: err.message || 'Failed to evaluate SOP with AI' });
    }
  });

  // 3. AI Admissions Holistic Decision & Scholarship Recommender
  app.post('/api/ai/evaluate-admission', async (req, res) => {
    try {
      const { application } = req.body;
      if (!application) {
        return res.status(400).json({ error: 'Application payload is required' });
      }

      const prompt = `You are an AI Dean of Admissions and Enrollment Director.
Perform a comprehensive, holistic evaluation for this college applicant:
- Candidate: ${application.name} (${application.email})
- Intended Major / Program: ${application.intendedProgram}
- High School / Prior College: ${application.previousSchool}
- GPA / Score: ${application.gpa} (out of 4.0 or percentage equivalent)
- Standardized / Entrance Score: ${application.testScore || 'N/A'}
- Extracurriculars / Projects: ${application.extracurriculars || 'None stated'}
- Document Verification Status: ${application.documentStatus || 'Pending'}
- SOP Score / Feedback: ${application.sopScore ? `${application.sopScore}/100` : 'Not yet evaluated'}
- Financial Aid Request: ${application.financialAidRequested ? 'Yes' : 'No'}

Determine:
1. Recommended Admission Decision ('DIRECT_ADMIT', 'CONDITIONAL_ADMIT', 'WAITLIST', 'DENIED')
2. Confidence Score (0-100)
3. Recommended Scholarship Grant Tier (e.g. '$20,000 Presidential STEM Honor', '$10,000 Dean Merit Award', '$5,000 Opportunity Grant', or 'None')
4. Academic Readiness Tier
5. Recommended Academic Pathway / Prerequisites
6. One-paragraph official notification draft ready for Dean signature.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedDecision: { type: Type.STRING, description: 'DIRECT_ADMIT | CONDITIONAL_ADMIT | WAITLIST | DENIED' },
              confidenceScore: { type: Type.NUMBER },
              scholarshipRecommendation: { type: Type.STRING },
              scholarshipAmountUSD: { type: Type.NUMBER },
              meritPercentile: { type: Type.STRING },
              rationaleSummary: { type: Type.STRING },
              keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedPathway: { type: Type.STRING },
              officialLetterDraft: { type: Type.STRING },
            },
            required: [
              'recommendedDecision',
              'confidenceScore',
              'scholarshipRecommendation',
              'rationaleSummary',
              'officialLetterDraft',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Error in /api/ai/evaluate-admission:', err);
      return res.status(500).json({ error: err.message || 'Failed to evaluate admission' });
    }
  });

  // 4. AI Classroom Vision Attendance
  app.post('/api/ai/vision-attendance', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', courseName, enrolledStudents = [] } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image base64 data is required for vision attendance' });
      }

      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');

      const studentRosterSummary = enrolledStudents
        .map((s: any) => `ID: ${s.id}, Name: ${s.name}, Visual Cue: ${s.avatarDesc || s.visualTag || 'Student'}`)
        .join('\n');

      const prompt = `You are an AI Automated Classroom Vision & Biometric Attendance Auditor for university lecture halls.
Course / Session: ${courseName || 'General Lecture'}

Enrolled Student Roster for this Class:
${studentRosterSummary || 'Alex Chen (Male, dark hair, glasses), Priya Sharma (Female, brown jacket), Liam Wilson (Male, blue hoodie), Elena Rostova (Female, light hair), Marcus Johnson (Male, athletic, dark hair), Zoe Taylor (Female, yellow sweater), David Kim (Male, black jacket), Sarah Jenkins (Female, white top)'}

Analyze the provided classroom/lecture hall image:
1. Detect and count all visible students present in seats/benches.
2. Match visible students against the enrolled roster using physical cues, seating posture, and presence.
3. For each student in the roster, determine if they are 'PRESENT' or 'ABSENT' with detection confidence (0-100) and approximate seat area (e.g. "Front Row Center", "Mid Row Left", "Back Row Right").
4. Flag any anomalies: e.g. proxy attempts, empty desks, distracted students, or unrecognized individuals in the room.
5. Provide overall session engagement rating and total count summary.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedHeadcount: { type: Type.NUMBER, description: 'Total human count detected in photo' },
              confidenceScore: { type: Type.NUMBER, description: 'Overall vision detection confidence (0-100)' },
              verifiedPresentCount: { type: Type.NUMBER },
              verifiedAbsentCount: { type: Type.NUMBER },
              attendanceRatePercent: { type: Type.NUMBER },
              studentDetections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    studentId: { type: Type.STRING },
                    studentName: { type: Type.STRING },
                    status: { type: Type.STRING, description: 'PRESENT | ABSENT | UNCERTAIN' },
                    confidence: { type: Type.NUMBER },
                    seatLocation: { type: Type.STRING },
                    visualNotes: { type: Type.STRING },
                  },
                  required: ['studentName', 'status', 'confidence'],
                },
              },
              anomaliesOrFlags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Unidentified visitors, empty front rows, proxy/spoofing risks',
              },
              classroomEngagement: {
                type: Type.STRING,
                description: 'HIGH | MODERATE | LOW with brief rationale',
              },
              auditSummary: { type: Type.STRING, description: 'Summary report for professor and registrar' },
            },
            required: [
              'detectedHeadcount',
              'confidenceScore',
              'attendanceRatePercent',
              'studentDetections',
              'auditSummary',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Error in /api/ai/vision-attendance:', err);
      return res.status(500).json({ error: err.message || 'Failed to process vision attendance' });
    }
  });

  // 5. AI Attendance Anomaly & Dropout Risk Predictor
  app.post('/api/ai/predict-attendance-risk', async (req, res) => {
    try {
      const { student, attendanceHistory, institutionalThreshold = 75 } = req.body;

      if (!student) {
        return res.status(400).json({ error: 'Student object is required' });
      }

      const prompt = `You are an AI Early Warning and Academic Retention Specialist in Higher Education.
Analyze the student's attendance records and risk profile against the institutional threshold of ${institutionalThreshold}%:

Student Profile:
- ID: ${student.id}
- Name: ${student.name}
- Department / Major: ${student.department}
- Semester / Year: Year ${student.year || 2}
- Overall Attendance: ${student.overallAttendance}%
- Subject Attendance: ${JSON.stringify(student.subjectAttendance || {})}
- Recent Attendance History (Last 15 sessions): ${JSON.stringify(attendanceHistory || ['P', 'P', 'A', 'P', 'A', 'A', 'P', 'A', 'A', 'A'])}

Perform rigorous diagnostic analysis:
1. Determine Dropout / Academic Failure Risk Level ('CRITICAL_DEFICIT', 'ELEVATED_RISK', 'MODERATE_WATCH', 'HEALTHY_ATTENDANCE').
2. Identify behavioral patterns (e.g. chronic Monday/Friday absence, post-lunch drop-offs, sudden 3-week decline).
3. Compute predicted final attendance percentage if current trajectory continues.
4. Auto-generate tailored intervention steps (e.g. Dean warning, mentor assignment, mental health counselor outreach).
5. Produce an automated Guardian / Student Alert notification message.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: {
                type: Type.STRING,
                description: 'CRITICAL_DEFICIT | ELEVATED_RISK | MODERATE_WATCH | HEALTHY_ATTENDANCE',
              },
              riskScore: { type: Type.NUMBER, description: 'Risk score from 0 (safest) to 100 (highest risk)' },
              predictedFinalAttendance: { type: Type.NUMBER },
              detectedPatterns: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Patterns identified in absenteeism',
              },
              rootCauseHypothesis: { type: Type.STRING },
              recommendedInterventions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Concrete immediate actions for academic staff',
              },
              automatedGuardianNotice: {
                type: Type.STRING,
                description: 'Ready-to-send SMS/email notice to guardian regarding exam debarment risk',
              },
              counselorActionPlan: { type: Type.STRING },
            },
            required: [
              'riskLevel',
              'riskScore',
              'predictedFinalAttendance',
              'detectedPatterns',
              'recommendedInterventions',
              'automatedGuardianNotice',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Error in /api/ai/predict-attendance-risk:', err);
      return res.status(500).json({ error: err.message || 'Failed to predict attendance risk' });
    }
  });

  // 6. AI Academic & Admissions Counselor Assistant (Chat/Query)
  app.post('/api/ai/counselor-assistant', async (req, res) => {
    try {
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const prompt = `You are EduPulse AI, the intelligent institutional assistant for University Admissions and Academic Attendance Management.
Context Data:
${JSON.stringify(context || {})}

User Query:
"${message}"

Provide a highly knowledgeable, precise, and supportive institutional response.
Offer practical calculations, regulatory rules (e.g. 75% UGC/ABET attendance minimums), admissions recommendations, or student advice. If relevant, suggest 2-3 quick follow-up actions.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are EduPulse AI, an intelligent university administrator and student advisor. Keep answers articulate, helpful, data-driven, and clear.',
        },
      });

      return res.json({
        success: true,
        answer: response.text || 'Unable to generate response.',
      });
    } catch (err: any) {
      console.error('Error in /api/ai/counselor-assistant:', err);
      return res.status(500).json({ error: err.message || 'Failed to query assistant' });
    }
  });

  // Mount Vite or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduPulse AI Server active on port ${PORT}`);
  });
}

startServer();
