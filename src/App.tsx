/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AdmissionApplication,
  Student,
  AttendanceLogEntry,
} from './types';
import {
  INITIAL_APPLICATIONS,
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE_LOGS,
} from './data/mockData';
import { Header } from './components/Header';
import { AdmissionsHub } from './components/AdmissionsHub';
import { AttendanceCenter } from './components/AttendanceCenter';
import { DropoutRiskRadar } from './components/DropoutRiskRadar';
import { StudentDirectory } from './components/StudentDirectory';
import { AiCounselorDesk } from './components/AiCounselorDesk';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { KioskModal } from './components/KioskModal';
import { IdBadgeModal } from './components/IdBadgeModal';
import { NewApplicationModal } from './components/NewApplicationModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'admissions' | 'attendance' | 'risk-radar' | 'students' | 'counselor' | 'analytics'
  >('admissions');

  // Core Data Collections
  const [applications, setApplications] = useState<AdmissionApplication[]>(INITIAL_APPLICATIONS);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLogEntry[]>(INITIAL_ATTENDANCE_LOGS);

  // Modals
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [badgeStudent, setBadgeStudent] = useState<Student | null>(null);

  // Telemetry counts
  const pendingReviewsCount = applications.filter(
    (a) => a.stage === 'DOCUMENT_VERIFICATION' || a.stage === 'SOP_EVALUATION'
  ).length;

  const criticalRiskCount = enrolledStudents.filter((s) => s.overallAttendance < 75).length;

  const overallAttendanceRate =
    enrolledStudents.reduce((acc, s) => acc + s.overallAttendance, 0) /
    (enrolledStudents.length || 1);

  // Handle Kiosk Check In
  const handleKioskCheckIn = (student: Student) => {
    // Update student's attendance
    const updated = enrolledStudents.map((s) => {
      if (s.id === student.id) {
        const newTrend = [...s.recentAttendanceTrend.slice(1), 'P' as const];
        const newRate = Math.min(100, Number((s.overallAttendance + 0.5).toFixed(1)));
        return {
          ...s,
          overallAttendance: newRate,
          recentAttendanceTrend: newTrend,
          riskTier: newRate < 75 ? ('CRITICAL' as const) : newRate <= 80 ? ('MODERATE' as const) : ('HEALTHY' as const),
        };
      }
      return s;
    });

    setEnrolledStudents(updated);
  };

  const handleApplicationCreated = (newApp: AdmissionApplication) => {
    setApplications([newApp, ...applications]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openNewAppModal={() => setIsNewAppModalOpen(true)}
        openKioskModal={() => setIsKioskModalOpen(true)}
        pendingReviewsCount={pendingReviewsCount}
        criticalRiskCount={criticalRiskCount}
        overallAttendanceRate={overallAttendanceRate}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'admissions' && (
          <AdmissionsHub
            applications={applications}
            setApplications={setApplications}
            enrolledStudents={enrolledStudents}
            setEnrolledStudents={setEnrolledStudents}
            openNewAppModal={() => setIsNewAppModalOpen(true)}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceCenter
            enrolledStudents={enrolledStudents}
            setEnrolledStudents={setEnrolledStudents}
            attendanceLogs={attendanceLogs}
            setAttendanceLogs={setAttendanceLogs}
            openKioskModal={() => setIsKioskModalOpen(true)}
            openIdBadgeModal={(s) => setBadgeStudent(s)}
          />
        )}

        {activeTab === 'risk-radar' && (
          <DropoutRiskRadar
            students={enrolledStudents}
            setStudents={setEnrolledStudents}
            openIdBadgeModal={(s) => setBadgeStudent(s)}
          />
        )}

        {activeTab === 'students' && (
          <StudentDirectory
            students={enrolledStudents}
            openIdBadgeModal={(s) => setBadgeStudent(s)}
          />
        )}

        {activeTab === 'counselor' && (
          <AiCounselorDesk
            students={enrolledStudents}
            applications={applications}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            students={enrolledStudents}
            applications={applications}
            attendanceLogs={attendanceLogs}
          />
        )}
      </main>

      {/* Modals */}
      <KioskModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
        students={enrolledStudents}
        onCheckInSuccess={handleKioskCheckIn}
      />

      <IdBadgeModal
        student={badgeStudent}
        onClose={() => setBadgeStudent(null)}
      />

      <NewApplicationModal
        isOpen={isNewAppModalOpen}
        onClose={() => setIsNewAppModalOpen(false)}
        onApplicationCreated={handleApplicationCreated}
      />
    </div>
  );
}
