import React, { useState } from 'react';
import { Student } from '../types';
import {
  Users,
  Search,
  Filter,
  QrCode,
  GraduationCap,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface StudentDirectoryProps {
  students: Student[];
  openIdBadgeModal: (student: Student) => void;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({
  students,
  openIdBadgeModal,
}) => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(students[0] || null);

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || s.department === deptFilter;
    const matchTier = tierFilter === 'ALL' || s.riskTier === tierFilter;
    return matchSearch && matchDept && matchTier;
  });

  const departments = Array.from(new Set(students.map((s) => s.department)));

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search enrolled student name, roll number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="ALL">All Attendance Tiers</option>
            <option value="HEALTHY">Compliant (&gt;80%)</option>
            <option value="MODERATE">Watchlist (75-80%)</option>
            <option value="CRITICAL">Defaulter (&lt;75%)</option>
          </select>
        </div>
      </div>

      {/* Directory Grid & 360 Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Student Cards (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((student) => {
              const isSelected = selectedStudent?.id === student.id;
              const isCritical = student.overallAttendance < 75;

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`bg-slate-900 border rounded-xl p-4 transition cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <h4 className="font-bold text-white text-xs">{student.name}</h4>
                        <span className="font-mono text-[10px] text-slate-400 block">{student.rollNo}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openIdBadgeModal(student);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition"
                      title="View Digital QR ID Card"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-300 font-medium block">{student.program}</span>
                    <span>Year {student.year} • Sem {student.semester} • GPA: {student.gpa.toFixed(2)}</span>
                  </div>

                  {/* Attendance Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Overall Attendance</span>
                      <span
                        className={`font-bold ${
                          isCritical ? 'text-rose-400' : student.overallAttendance <= 80 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {student.overallAttendance.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isCritical ? 'bg-rose-500' : student.overallAttendance <= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(student.overallAttendance, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Student 360° Dossier (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          {selectedStudent ? (
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStudent.avatar}
                    alt={selectedStudent.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/40"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedStudent.name}</h3>
                    <p className="text-xs font-mono text-indigo-300">{selectedStudent.rollNo}</p>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        selectedStudent.overallAttendance < 75
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {selectedStudent.overallAttendance < 75 ? 'DEFAULTER RISK (<75%)' : 'ACTIVE & ELIGIBLE'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openIdBadgeModal(selectedStudent)}
                  className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-500/30 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>ID Badge</span>
                </button>
              </div>

              {/* Academic Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Academic Major</span>
                  <span className="font-semibold text-white">{selectedStudent.program}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Cumulative GPA</span>
                  <span className="font-bold text-indigo-400">{selectedStudent.gpa.toFixed(2)} / 4.00</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Official Email</span>
                  <span className="text-slate-300 truncate block">{selectedStudent.email}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Phone Contact</span>
                  <span className="text-slate-300">{selectedStudent.phone}</span>
                </div>
              </div>

              {/* Subject Attendance Breakdown */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Course Attendance Performance
                </h5>
                <div className="space-y-2 text-xs">
                  {Object.entries(selectedStudent.subjectAttendance).map(([subj, pct]) => (
                    <div key={subj} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[200px]">{subj}</span>
                        <span
                          className={`font-bold ${
                            pct < 75 ? 'text-rose-400' : pct <= 80 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            pct < 75 ? 'bg-rose-500' : pct <= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guardian Info */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Guardian / Emergency Contact
                </span>
                <div className="flex justify-between text-slate-300">
                  <span>Name: {selectedStudent.guardianName}</span>
                  <span className="text-slate-400">{selectedStudent.guardianPhone}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Notice Email: {selectedStudent.guardianEmail}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select a student to view full 360° academic profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
