import React, { useState } from 'react';
import { Student, AdmissionApplication } from '../types';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  Copy,
  Check,
  HelpCircle,
  BookOpen,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface AiCounselorDeskProps {
  students: Student[];
  applications: AdmissionApplication[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiCounselorDesk: React.FC<AiCounselorDeskProps> = ({
  students,
  applications,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: `Hello! I am EduPulse AI, your Institutional Admissions and Academic Attendance Counselor.
I have real-time access to the current applicant cohort (${applications.length} candidates) and enrolled student attendance data (${students.length} students).

How can I assist you today? You can ask me to analyze defaulter risks, draft acceptance letters, or explain degree prerequisites.`,
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const samplePrompts = [
    'Which students are below the 75% attendance threshold and at risk of exam debarment?',
    'Draft an official scholarship acceptance letter for Aria Thorne for B.S. AI & Robotics.',
    'Compare the academic strength and SOP quality of current applicants.',
    'What intervention steps should we take for Liam Wilson regarding his chronic Friday absences?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build lightweight context
      const context = {
        totalEnrolled: students.length,
        defaulters: students
          .filter((s) => s.overallAttendance < 75)
          .map((s) => ({ name: s.name, rollNo: s.rollNo, attendance: s.overallAttendance })),
        applicationsSummary: applications.map((a) => ({
          name: a.name,
          program: a.intendedProgram,
          gpa: a.gpa,
          documentStatus: a.documentStatus,
          sopScore: a.sopAnalysis?.overallScore,
          stage: a.stage,
        })),
      };

      const res = await fetch('/api/ai/counselor-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context,
        }),
      });

      const data = await res.json();
      const botReply: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'I am ready to assist with another query.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an error connecting to the AI model. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col h-[700px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>EduPulse AI Academic Advisor & Policy Desk</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                Online
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Assists with student records, attendance regulations, letters, and admission policies.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">Suggested:</span>
        {samplePrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] whitespace-nowrap transition cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-cyan-400 border border-slate-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-line font-sans">{msg.text}</div>

              <div
                className={`flex items-center justify-between text-[10px] pt-1 border-t ${
                  msg.sender === 'user' ? 'border-indigo-500/50 text-indigo-200' : 'border-slate-800 text-slate-500'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="hover:text-slate-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>EduPulse AI is formulating policy recommendation...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about admissions criteria, candidate SOP scores, defaulter statistics..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
