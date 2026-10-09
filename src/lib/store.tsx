'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Activity,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceType,
  AuditLog,
  Profile,
} from '@/types';
import {
  SEED_ACTIVITIES,
  SEED_ATTENDANCE_RECORDS,
  SEED_AUDIT_LOGS,
  SEED_PROFILES,
} from './constants';
import { validateAttendanceLocation } from './geo';

interface StoreContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  profiles: Profile[];
  activities: Activity[];
  attendanceRecords: AttendanceRecord[];
  auditLogs: AuditLog[];
  simulatedTime: Date | null;
  effectiveTime: Date;
  setSimulatedTime: (time: Date | null) => void;
  submitAttendance: (params: {
    activityId: string;
    type: AttendanceType;
    photoDataUrl: string;
    coords: { latitude: number; longitude: number; accuracy: number };
    permissionReason?: string;
  }) => { success: boolean; record: AttendanceRecord; message: string };
  reviewPermission: (recordId: string, status: AttendanceStatus, reviewNote?: string) => void;
  correctAttendance: (recordId: string, newStatus: AttendanceStatus, reason: string) => void;
  addStudent: (student: Omit<Profile, 'id' | 'created_at'>) => void;
  updateStudent: (student: Profile) => void;
  toggleStudentStatus: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (activity: Activity) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  resetToDefaultData: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = 'absensi_santri_nurul_falah_v3';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>(SEED_PROFILES);
  const [currentUser, setCurrentUserState] = useState<Profile>(SEED_PROFILES[0]);
  const [activities, setActivities] = useState<Activity[]>(SEED_ACTIVITIES);
  const [attendanceRecords, setAttendanceRecords] =
    useState<AttendanceRecord[]>(SEED_ATTENDANCE_RECORDS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(SEED_AUDIT_LOGS);
  const [simulatedTime, setSimulatedTime] = useState<Date | null>(null);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.profiles?.length) setProfiles(data.profiles);
        if (data.currentUser) setCurrentUserState(data.currentUser);
        if (data.activities?.length) setActivities(data.activities);
        if (data.attendanceRecords?.length) setAttendanceRecords(data.attendanceRecords);
        if (data.auditLogs?.length) setAuditLogs(data.auditLogs);
      }

      const storedTheme = localStorage.getItem('absensi_santri_theme') as 'light' | 'dark' | null;
      if (storedTheme === 'dark' || (!storedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setThemeState('dark');
        document.documentElement.classList.add('dark');
      } else {
        setThemeState('light');
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Failed to parse localStorage cache', e);
    }
    setIsLoaded(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    localStorage.setItem('absensi_santri_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
    localStorage.setItem('absensi_santri_theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Save changes to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profiles,
          currentUser,
          activities,
          attendanceRecords,
          auditLogs,
        })
      );
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [profiles, currentUser, activities, attendanceRecords, auditLogs, isLoaded]);

  const [actualTime, setActualTime] = useState<Date>(
    () => new Date('2026-10-09T05:00:00+07:00')
  );

  useEffect(() => {
    setActualTime(new Date());
    const interval = setInterval(() => {
      setActualTime(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const setCurrentUser = (user: Profile) => {
    setCurrentUserState(user);
  };

  // Determine effective time (simulated or actual)
  const effectiveTime = simulatedTime || actualTime;

  // Reset demo data helper
  const resetToDefaultData = () => {
    setProfiles(SEED_PROFILES);
    setCurrentUserState(SEED_PROFILES[0]);
    setActivities(SEED_ACTIVITIES);
    setAttendanceRecords(SEED_ATTENDANCE_RECORDS);
    setAuditLogs(SEED_AUDIT_LOGS);
    setSimulatedTime(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Attendance Submission with Validation
  const submitAttendance = ({
    activityId,
    type,
    photoDataUrl,
    coords,
    permissionReason,
  }: {
    activityId: string;
    type: AttendanceType;
    photoDataUrl: string;
    coords: { latitude: number; longitude: number; accuracy: number };
    permissionReason?: string;
  }) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) {
      return {
        success: false,
        record: {} as AttendanceRecord,
        message: 'Kegiatan tidak ditemukan atau sudah tidak aktif.',
      };
    }

    const todayStr = effectiveTime.toISOString().split('T')[0];

    // Idempotency check: 1 attendance per student per activity per day
    const existing = attendanceRecords.find(
      (r) =>
        r.student_id === currentUser.id &&
        r.activity_id === activityId &&
        r.operational_date === todayStr
    );
    if (existing) {
      return {
        success: false,
        record: existing,
        message: `Anda sudah mengirimkan absensi untuk ${activity.name} hari ini (${existing.status}).`,
      };
    }

    // Geolocation verification
    const geoValidation = validateAttendanceLocation(
      { latitude: coords.latitude, longitude: coords.longitude },
      { latitude: activity.location_lat, longitude: activity.location_lng },
      activity.radius_m,
      activity.max_gps_accuracy_m,
      coords.accuracy
    );

    let status: AttendanceStatus = 'hadir_valid';
    let message = 'Absensi berhasil diverifikasi!';

    if (type === 'izin') {
      status = 'izin_diajukan';
      message = 'Pengajuan izin berhasil dikirim dan menunggu persetujuan musyrif.';
    } else {
      // Hadir
      if (!geoValidation.isAccuracyAcceptable) {
        status = 'perlu_tinjauan';
        message = 'Akurasi GPS rendah. Absensi tercatat namun perlu tinjauan musyrif.';
      } else if (!geoValidation.isWithinRadius) {
        status = 'ditolak_lokasi';
        message = `Anda berada di luar radius pondok (${Math.round(
          geoValidation.distanceMeters
        )}m). Absensi ditolak oleh sistem.`;
      } else {
        status = 'hadir_valid';
        message = `Alhamdulillah! Kehadiran ${activity.name} berhasil divalidasi.`;
      }
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      session_id: `sess-${todayStr}-${activity.code.toLowerCase()}`,
      student_id: currentUser.id,
      student_name: currentUser.full_name,
      student_number: currentUser.student_number,
      group_name: currentUser.group_name,
      activity_id: activity.id,
      activity_name: activity.name,
      operational_date: todayStr,
      attendance_type: type,
      status,
      photo_path: photoDataUrl,
      latitude: coords.latitude,
      longitude: coords.longitude,
      gps_accuracy_m: coords.accuracy,
      location_captured_at: effectiveTime.toISOString(),
      distance_from_site_m: geoValidation.distanceMeters,
      submitted_at: effectiveTime.toISOString(),
      permission_reason: type === 'izin' ? permissionReason : undefined,
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);

    return {
      success: status === 'hadir_valid' || status === 'izin_diajukan',
      record: newRecord,
      message,
    };
  };

  // Musyrif permission approval / rejection
  const reviewPermission = (recordId: string, status: AttendanceStatus, reviewNote?: string) => {
    const record = attendanceRecords.find((r) => r.id === recordId);
    if (!record) return;

    const updated = attendanceRecords.map((r) => {
      if (r.id === recordId) {
        return {
          ...r,
          status,
          reviewed_by: currentUser.id,
          reviewed_by_name: currentUser.full_name,
          reviewed_at: effectiveTime.toISOString(),
          review_note: reviewNote,
        };
      }
      return r;
    });

    setAttendanceRecords(updated);

    // Audit log
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'REVIEW_PERMISSION',
      entity_type: 'attendance_record',
      entity_id: recordId,
      before_data: { status: record.status },
      after_data: { status, review_note: reviewNote },
      reason: reviewNote || 'Tinjauan izin musyrif',
      created_at: effectiveTime.toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  // Musyrif manual attendance correction
  const correctAttendance = (
    recordId: string,
    newStatus: AttendanceStatus,
    reason: string
  ) => {
    const record = attendanceRecords.find((r) => r.id === recordId);
    if (!record) return;

    const oldStatus = record.status;
    const correctionEntry = {
      original_status: oldStatus,
      corrected_status: newStatus,
      reason,
      corrected_by: currentUser.full_name,
      corrected_at: effectiveTime.toISOString(),
    };

    const updated = attendanceRecords.map((r) => {
      if (r.id === recordId) {
        return {
          ...r,
          status: newStatus,
          audit_corrections: [...(r.audit_corrections || []), correctionEntry],
        };
      }
      return r;
    });

    setAttendanceRecords(updated);

    // Audit log
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'MANUAL_CORRECTION',
      entity_type: 'attendance_record',
      entity_id: recordId,
      before_data: { status: oldStatus },
      after_data: { status: newStatus },
      reason,
      created_at: effectiveTime.toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  // Student management
  const addStudent = (studentData: Omit<Profile, 'id' | 'created_at'>) => {
    const newStudent: Profile = {
      ...studentData,
      id: `usr-santri-${Date.now()}`,
      role: 'santri',
      created_at: effectiveTime.toISOString(),
    };
    setProfiles((prev) => [...prev, newStudent]);

    // Audit log
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'CREATE_STUDENT',
      entity_type: 'profile',
      entity_id: newStudent.id,
      after_data: { full_name: newStudent.full_name, student_number: newStudent.student_number },
      reason: 'Penambahan data santri baru',
      created_at: effectiveTime.toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const updateStudent = (student: Profile) => {
    setProfiles((prev) => prev.map((p) => (p.id === student.id ? student : p)));
    if (currentUser.id === student.id) {
      setCurrentUserState(student);
    }
  };

  const toggleStudentStatus = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    );
  };

  // Activity management
  const addActivity = (actData: Omit<Activity, 'id'>) => {
    const newAct: Activity = {
      ...actData,
      id: `act-${Date.now()}`,
    };
    setActivities((prev) => [...prev, newAct]);

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'CREATE_ACTIVITY',
      entity_type: 'activity',
      entity_id: newAct.id,
      after_data: { name: newAct.name, code: newAct.code },
      reason: 'Penambahan kegiatan baru',
      created_at: effectiveTime.toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const updateActivity = (activity: Activity) => {
    setActivities((prev) => prev.map((a) => (a.id === activity.id ? activity : a)));

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'UPDATE_ACTIVITY',
      entity_type: 'activity',
      entity_id: activity.id,
      after_data: { name: activity.name, radius_m: activity.radius_m },
      reason: 'Pembaruan konfigurasi jadwal/radius kegiatan',
      created_at: effectiveTime.toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        profiles,
        activities,
        attendanceRecords,
        auditLogs,
        simulatedTime,
        effectiveTime,
        setSimulatedTime,
        submitAttendance,
        reviewPermission,
        correctAttendance,
        addStudent,
        updateStudent,
        toggleStudentStatus,
        addActivity,
        updateActivity,
        theme,
        toggleTheme,
        setTheme,
        resetToDefaultData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
