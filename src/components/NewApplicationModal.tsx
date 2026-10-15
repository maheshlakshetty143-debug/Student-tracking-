import React, { useState } from 'react';
import { AdmissionApplication, ProgramType } from '../types';
import { generateSampleDocumentDataUrl, SAMPLE_SOPS } from '../data/mockData';
import {
  X,
  FileText,
  Sparkles,
  Upload,
  CheckCircle,
  GraduationCap,
  Loader2,
} from 'lucide-react';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationCreated: (app: AdmissionApplication) => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({
  isOpen,
  onClose,
  onApplicationCreated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [intendedProgram, setIntendedProgram] = useState<ProgramType>('B.S. Artificial Intelligence & Robotics');
  const [previousSchool, setPreviousSchool] = useState('');
  const [gpa, setGpa] = useState('3.85');
  const [testScore, setTestScore] = useState('SAT: 1510');
  const [extracurriculars, setExtracurriculars] = useState('Lead coder at high school hackathon, robotics team member');
  const [sopText, setSopText] = useState(SAMPLE_SOPS[0].text);
  const [financialAid, setFinancialAid] = useState(true);
  const [runAiScreeningImmediately, setRunAiScreeningImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);

    const docUrl = generateSampleDocumentDataUrl(
      'HONORS_TRANSCRIPT',
      name.trim(),
      gpa,
      previousSchool || 'Accredited Preparatory Academy'
    );

    const newApp: AdmissionApplication = {
      id: `app-${Date.now()}`,
      applicationId: `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+1 (555) 019-8832',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + (Math.floor(Math.random() * 100))}?w=150&auto=format&fit=crop&q=80`,
      intendedProgram,
      previousSchool: previousSchool.trim() || 'Accredited Preparatory Academy',
      gpa: parseFloat(gpa) || 3.8,
      testScore,
      extracurriculars,
      financialAidRequested: financialAid,
      sopText,
      documentType: 'Official High School Transcript & Credits',
      documentSampleKey: 'HONORS_TRANSCRIPT',
      documentPreviewUrl: docUrl,
      documentStatus: 'PENDING',
      stage: 'DOCUMENT_VERIFICATION',
      submittedAt: new Date().toISOString(),
    };

    if (runAiScreeningImmediately) {
      try {
        // Fast parallel screening
        const [docRes, sopRes] = await Promise.all([
          fetch('/api/ai/verify-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: docUrl,
              mimeType: 'image/svg+xml',
              documentType: newApp.documentType,
              studentName: newApp.name,
              claimedGpa: gpa,
            }),
          }),
          fetch('/api/ai/evaluate-sop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sopText: newApp.sopText,
              studentName: newApp.name,
              targetProgram: newApp.intendedProgram,
              previousMajor: newApp.previousSchool,
            }),
          }),
        ]);

        const docData = await docRes.json();
        const sopData = await sopRes.json();

        if (docData.success && docData.data) {
          newApp.documentAnalysis = docData.data;
          newApp.documentStatus = docData.data.status === 'VERIFIED' ? 'VERIFIED' : 'FLAGGED';
        }

        if (sopData.success && sopData.data) {
          newApp.sopAnalysis = sopData.data;
          newApp.stage = 'DECISION_READY';
        }
      } catch (err) {
        console.error('Error during initial screening:', err);
      }
    }

    onApplicationCreated(newApp);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Register New Student Admission Application</h3>
              <p className="text-xs text-slate-400">Intake form with automated AI Document & SOP screening</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Candidate Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. maya.lin@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-8832"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Intended Academic Program</label>
              <select
                value={intendedProgram}
                onChange={(e) => setIntendedProgram(e.target.value as ProgramType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="B.S. Artificial Intelligence & Robotics">B.S. Artificial Intelligence & Robotics</option>
                <option value="B.S. Computer Science">B.S. Computer Science</option>
                <option value="B.S. Data Science & Analytics">B.S. Data Science & Analytics</option>
                <option value="B.S. Biomedical Engineering">B.S. Biomedical Engineering</option>
                <option value="B.B.A. Business Analytics">B.B.A. Business Analytics</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Previous School / Board</label>
              <input
                type="text"
                value={previousSchool}
                onChange={(e) => setPreviousSchool(e.target.value)}
                placeholder="e.g. Cambridge Academy"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Claimed GPA (4.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Test Score (SAT/ACT)</label>
                <input
                  type="text"
                  value={testScore}
                  onChange={(e) => setTestScore(e.target.value)}
                  placeholder="SAT 1520"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Statement of Purpose */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 font-medium">Statement of Purpose / Personal Essay</label>
              <button
                type="button"
                onClick={() => setSopText(SAMPLE_SOPS[2].text)}
                className="text-indigo-400 hover:text-indigo-300 text-[11px]"
              >
                Insert Sample Essay
              </button>
            </div>
            <textarea
              rows={4}
              value={sopText}
              onChange={(e) => setSopText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
              placeholder="Paste candidate statement of purpose..."
            />
          </div>

          {/* Screening Checkbox */}
          <div className="p-3 bg-indigo-950/20 border border-indigo-800/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoScreen"
                checked={runAiScreeningImmediately}
                onChange={(e) => setRunAiScreeningImmediately(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <label htmlFor="autoScreen" className="text-slate-300 font-medium cursor-pointer">
                Run Autonomous AI Document OCR & SOP Screening on submission
              </label>
            </div>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing AI Screening...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Register Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
