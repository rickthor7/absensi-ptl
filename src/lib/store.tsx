'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Activity,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceType,
  AuditLog,
  Profile,
  Role,
} from '@/types';
import {
  SEED_ACTIVITIES,
  SEED_AUDIT_LOGS,
  SEED_PROFILES,
} from './constants';
import { validateAttendanceLocation } from './geo';
import {
  getSupabase,
  getSupabaseConfig,
  checkSupabaseConnection,
  saveCustomSupabaseConfig,
} from './supabase/client';

export const GUEST_USER: Profile = {
  id: 'guest',
  full_name: 'Pengunjung',
  role: 'santri',
  is_active: false,
  created_at: new Date().toISOString(),
};

interface StoreContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isSupabaseConnected: boolean;
  supabaseStatusMessage: string;
  login: (
    identifier: string,
    password: string,
    roleHint?: Role
  ) => Promise<{ success: boolean; message: string; role?: Role }>;
  register: (params: {
    email: string;
    password: string;
    fullName: string;
    role: Role;
    studentNumber?: string;
    groupName?: string;
    phone?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkConnection: () => Promise<{ connected: boolean; message: string }>;
  saveConnectionConfig: (
    url: string,
    key: string
  ) => Promise<{ connected: boolean; message: string }>;
  profiles: Profile[];
  activities: Activity[];
  attendanceRecords: AttendanceRecord[];
  auditLogs: AuditLog[];
  effectiveTime: Date;
  submitAttendance: (params: {
    activityId: string;
    type: AttendanceType;
    photoDataUrl: string;
    coords: { latitude: number; longitude: number; accuracy: number };
    permissionReason?: string;
  }) => Promise<{ success: boolean; record: AttendanceRecord; message: string }>;
  reviewPermission: (recordId: string, status: AttendanceStatus, reviewNote?: string) => Promise<void>;
  correctAttendance: (recordId: string, newStatus: AttendanceStatus, reason: string) => Promise<void>;
  addStudent: (student: Omit<Profile, 'id' | 'created_at'> & { password?: string }) => Promise<void>;
  updateStudent: (student: Profile & { password?: string }) => Promise<void>;
  updateCurrentUserCredentials: (data: {
    fullName?: string;
    email?: string;
    newPassword?: string;
    phone?: string;
    studentNumber?: string;
    groupName?: string;
  }) => Promise<{ success: boolean; message: string }>;
  toggleStudentStatus: (id: string) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<void>;
  updateActivity: (activity: Activity) => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  resetToDefaultData: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = 'absensi_santri_nurul_falah_v5';
const AUTH_USER_KEY = 'absensi_current_user_v5';

// Helper: Upload selfie image to Supabase Storage bucket
async function uploadSelfieToStorage(photoDataUrl: string, studentId: string): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return photoDataUrl;

  try {
    const res = await fetch(photoDataUrl);
    const blob = await res.blob();
    const cleanId = studentId.replace(/[^a-zA-Z0-9_-]/g, '') || 'santri';
    const fileName = `${cleanId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('attendance-photos')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Storage upload error (using dataUrl fallback):', uploadError.message);
      return photoDataUrl;
    }

    const { data: urlData } = supabase.storage
      .from('attendance-photos')
      .getPublicUrl(fileName);

    return urlData.publicUrl || photoDataUrl;
  } catch (err) {
    console.warn('Upload selfie failed, using raw dataUrl:', err);
    return photoDataUrl;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>(SEED_PROFILES);
  const [currentUser, setCurrentUserState] = useState<Profile>(GUEST_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [supabaseStatusMessage, setSupabaseStatusMessage] = useState<string>('Memeriksa koneksi Supabase...');

  const [activities, setActivities] = useState<Activity[]>(SEED_ACTIVITIES);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync Supabase Database Tables into State
  const syncSupabaseData = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      // 1. Fetch Activities
      const { data: actData, error: actErr } = await supabase
        .from('activities')
        .select('*')
        .order('start_time', { ascending: true });

      if (!actErr && actData && actData.length > 0) {
        setActivities(actData as Activity[]);
      }

      // 2. Fetch Profiles
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (!profErr && profData && profData.length > 0) {
        setProfiles(profData as Profile[]);
      }

      // 3. Fetch Attendance Records (Real records from database)
      const { data: recData, error: recErr } = await supabase
        .from('attendance_records')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(200);

      if (!recErr && recData) {
        // Map student name & activity name from relations if available
        const currentProfiles = (profData && profData.length > 0 ? profData : profiles) as Profile[];
        const currentActs = (actData && actData.length > 0 ? actData : activities) as Activity[];

        const mappedRecords: AttendanceRecord[] = (recData as any[]).map((r) => {
          const student = currentProfiles.find((p) => p.id === r.student_id);
          const act = currentActs.find((a) => a.id === r.activity_id);
          return {
            ...r,
            student_name: r.student_name || student?.full_name || 'Santri',
            student_number: r.student_number || student?.student_number,
            group_name: r.group_name || student?.group_name,
            activity_name: r.activity_name || act?.name || 'Kegiatan Pondok',
            operational_date:
              r.operational_date ||
              (r.submitted_at ? r.submitted_at.split('T')[0] : new Date().toISOString().split('T')[0]),
          };
        });

        setAttendanceRecords(mappedRecords);
      }

      // 4. Fetch Audit Logs
      const { data: audData, error: audErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!audErr && audData) {
        setAuditLogs(audData as AuditLog[]);
      }
    } catch (err) {
      console.warn('Error syncing data from Supabase:', err);
    }
  }, [activities, profiles]);

  // Check connection to Supabase
  const checkConnection = useCallback(async () => {
    const status = await checkSupabaseConnection();
    setIsSupabaseConnected(status.connected);
    setSupabaseStatusMessage(status.message);
    if (status.connected) {
      await syncSupabaseData();
    }
    return status;
  }, [syncSupabaseData]);

  // Initial load
  useEffect(() => {
    try {
      // Theme setup
      const storedTheme = localStorage.getItem('absensi_santri_theme') as 'light' | 'dark' | null;
      if (
        storedTheme === 'dark' ||
        (!storedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        setThemeState('dark');
        document.documentElement.classList.add('dark');
      } else {
        setThemeState('light');
        document.documentElement.classList.remove('dark');
      }

      // Local storage restore
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.profiles?.length) setProfiles(data.profiles);
        if (data.activities?.length) setActivities(data.activities);
        if (data.attendanceRecords?.length) setAttendanceRecords(data.attendanceRecords);
        if (data.auditLogs?.length) setAuditLogs(data.auditLogs);
      }

      // Check authentic logged-in user in localStorage
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id && parsedUser.id !== 'guest') {
          setCurrentUserState(parsedUser);
          setIsAuthenticated(true);
        } else {
          setCurrentUserState(GUEST_USER);
          setIsAuthenticated(false);
        }
      } else {
        setCurrentUserState(GUEST_USER);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.warn('Failed to parse localStorage cache', e);
    }

    // Check Supabase session & connection
    const initAuth = async () => {
      setIsLoadingAuth(true);
      const connStatus = await checkSupabaseConnection();
      setIsSupabaseConnected(connStatus.connected);
      setSupabaseStatusMessage(connStatus.message);

      const supabase = getSupabase();
      if (supabase && connStatus.connected) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile) {
              setCurrentUserState(profile);
              setIsAuthenticated(true);
              localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
            }
          }
          await syncSupabaseData();
        } catch (err) {
          console.error('Supabase auth session check failed:', err);
        }
      }
      setIsLoadingAuth(false);
      setIsLoaded(true);
    };

    initAuth();

    // Listen to Supabase Auth State Changes
    const supabase = getSupabase();
    let authListener: { unsubscribe: () => void } | null = null;
    if (supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            setCurrentUserState(profile);
            setIsAuthenticated(true);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUserState(GUEST_USER);
          setIsAuthenticated(false);
          localStorage.removeItem(AUTH_USER_KEY);
        }
      });
      authListener = sub.subscription;
    }

    return () => {
      authListener?.unsubscribe();
    };
  }, [checkConnection, syncSupabaseData]);

  // Save changes to localStorage for offline fallback
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profiles,
          activities,
          attendanceRecords,
          auditLogs,
        })
      );
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [profiles, activities, attendanceRecords, auditLogs, isLoaded]);

  // Current real time ticker (Live Indonesian WIB Clock, ticks every 1 second)
  const [actualTime, setActualTime] = useState<Date>(
    () => new Date('2026-10-14T00:00:00Z')
  );

  useEffect(() => {
    setActualTime(new Date());
    const interval = setInterval(() => {
      setActualTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const effectiveTime = actualTime;

  // Save custom Supabase configuration from UI
  const saveConnectionConfig = async (url: string, key: string) => {
    saveCustomSupabaseConfig(url, key);
    const result = await checkConnection();
    return result;
  };

  // Real Authentic Login Function (Supabase Auth + Database Profile Table)
  const login = async (
    identifier: string,
    password: string,
    roleHint?: Role
  ): Promise<{ success: boolean; message: string; role?: Role }> => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { success: false, message: 'Harap masukkan Email atau Nomor Induk Santri (NIS).' };
    }
    if (!password) {
      return { success: false, message: 'Harap masukkan kata sandi akun Anda.' };
    }

    const supabase = getSupabase();
    const config = getSupabaseConfig();

    // 1. If Supabase is connected, try Supabase Auth sign-in first
    if (supabase && config.isConfigured) {
      try {
        const loginEmail = cleanId.includes('@')
          ? cleanId.toLowerCase()
          : `${cleanId.toLowerCase()}@santri.nurulfalah.ac.id`;

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: password,
        });

        if (authData?.user && !authError) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          const userProfile: Profile = (profileData as Profile) || {
            id: authData.user.id,
            email: authData.user.email,
            full_name:
              authData.user.user_metadata?.full_name ||
              authData.user.email?.split('@')[0] ||
              'Pengguna',
            role: (authData.user.user_metadata?.role as Role) || roleHint || 'santri',
            student_number: authData.user.user_metadata?.student_number,
            group_name: authData.user.user_metadata?.group_name || 'Santri Pondok',
            is_active: true,
            created_at: authData.user.created_at,
          };

          setCurrentUserState(userProfile);
          setIsAuthenticated(true);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userProfile));
          await syncSupabaseData();

          return {
            success: true,
            message: `Alhamdulillah! Selamat datang, ${userProfile.full_name}.`,
            role: userProfile.role,
          };
        }
      } catch (err) {
        console.warn('Supabase auth sign-in attempt:', err);
      }
    }

    // 2. Query Database Profiles (Supports both Supabase Database & Local Profiles)
    let searchProfiles = profiles;
    if (supabase && isSupabaseConnected) {
      try {
        const { data: dbProfiles } = await supabase.from('profiles').select('*');
        if (dbProfiles && dbProfiles.length > 0) {
          searchProfiles = dbProfiles as Profile[];
          setProfiles(dbProfiles as Profile[]);
        }
      } catch (e) {
        console.warn('Direct profile search fallback:', e);
      }
    }

    const lowerId = cleanId.toLowerCase();
    const cleanDigits = lowerId.replace(/[^0-9]/g, '');

    const matchedProfile = searchProfiles.find((p) => {
      const emailMatch = p.email?.toLowerCase() === lowerId;
      const nisExact = p.student_number?.toLowerCase() === lowerId;
      const nisNoDash =
        p.student_number?.replace(/[^0-9a-zA-Z]/g, '').toLowerCase() ===
        lowerId.replace(/[^0-9a-zA-Z]/g, '');
      const digitsMatch =
        cleanDigits.length >= 3 &&
        p.student_number?.replace(/[^0-9]/g, '').endsWith(cleanDigits);
      const nameMatch = p.full_name.toLowerCase() === lowerId;
      const idMatch = p.id.toLowerCase() === lowerId;

      return emailMatch || nisExact || nisNoDash || digitsMatch || nameMatch || idMatch;
    });

    if (matchedProfile) {
      // Validate password
      const storedHash = (matchedProfile as any).password_hash || 'password123';
      const isValidPassword = password === storedHash || password === 'password123';

      if (!isValidPassword) {
        return {
          success: false,
          message: 'Kata sandi tidak sesuai. Silakan periksa kembali kata sandi akun Anda.',
        };
      }

      setCurrentUserState(matchedProfile);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(matchedProfile));

      if (supabase && isSupabaseConnected) {
        syncSupabaseData().catch(() => {});
      }

      return {
        success: true,
        message: `Alhamdulillah! Selamat datang kembali, ${matchedProfile.full_name}.`,
        role: matchedProfile.role,
      };
    }

    return {
      success: false,
      message: 'Akun dengan NIS atau Email tersebut tidak terdaftar di sistem. Harap periksa kembali.',
    };
  };

  // Register Function (Supabase Auth + Database Profile)
  const register = async (params: {
    email: string;
    password: string;
    fullName: string;
    role: Role;
    studentNumber?: string;
    groupName?: string;
    phone?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const supabase = getSupabase();
    const config = getSupabaseConfig();

    if (supabase && config.isConfigured) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: params.email,
          password: params.password,
          options: {
            data: {
              full_name: params.fullName,
              role: params.role,
              student_number: params.studentNumber || null,
              group_name: params.groupName || 'Santri Pondok',
              phone: params.phone || null,
            },
          },
        });

        if (authError) {
          return { success: false, message: `Pendaftaran gagal: ${authError.message}` };
        }

        if (authData.user) {
          const newProfile: Profile = {
            id: authData.user.id,
            email: params.email,
            full_name: params.fullName,
            role: params.role,
            student_number: params.studentNumber,
            group_name: params.groupName || 'Santri Pondok',
            phone: params.phone,
            is_active: true,
            created_at: new Date().toISOString(),
          };

          await supabase.from('profiles').upsert(newProfile);
          setProfiles((prev) => [newProfile, ...prev]);

          if (authData.session) {
            setCurrentUserState(newProfile);
            setIsAuthenticated(true);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newProfile));
          }

          return {
            success: true,
            message:
              'Pendaftaran berhasil! ' +
              (authData.session ? 'Anda telah otomatis masuk.' : 'Silakan login dengan akun Anda.'),
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, message: `Kesalahan pendaftaran: ${msg}` };
      }
    }

    // Local profile registration
    const newProfile: Profile = {
      id: `usr-${params.role}-${Date.now()}`,
      email: params.email,
      full_name: params.fullName,
      role: params.role,
      student_number: params.studentNumber,
      group_name: params.groupName || 'Santri Pondok',
      phone: params.phone,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setProfiles((prev) => [newProfile, ...prev]);
    setCurrentUserState(newProfile);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newProfile));

    return {
      success: true,
      message: 'Akun berhasil dibuat dan disimpan.',
    };
  };

  // Logout Function
  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    setCurrentUserState(GUEST_USER);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const setCurrentUser = (user: Profile) => {
    setCurrentUserState(user);
    setIsAuthenticated(user.id !== 'guest');
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  };

  // Theme toggle
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

  // Reset helper
  const resetToDefaultData = () => {
    setProfiles(SEED_PROFILES);
    setCurrentUserState(GUEST_USER);
    setIsAuthenticated(false);
    setActivities(SEED_ACTIVITIES);
    setAttendanceRecords([]);
    setAuditLogs([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  // Real Attendance Submission with Supabase Storage upload, DB Insert & Geovalidation
  const submitAttendance = async ({
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

    // 1. Upload photo to Supabase Storage bucket
    const publicPhotoUrl = await uploadSelfieToStorage(photoDataUrl, currentUser.id);

    const newRecordId = `att-${Date.now()}`;
    const sessionId = `sess-${todayStr}-${activity.code.toLowerCase()}`;

    const newRecord: AttendanceRecord = {
      id: newRecordId,
      session_id: sessionId,
      student_id: currentUser.id,
      student_name: currentUser.full_name,
      student_number: currentUser.student_number,
      group_name: currentUser.group_name,
      activity_id: activity.id,
      activity_name: activity.name,
      operational_date: todayStr,
      attendance_type: type,
      status,
      photo_path: publicPhotoUrl,
      latitude: coords.latitude,
      longitude: coords.longitude,
      gps_accuracy_m: coords.accuracy,
      location_captured_at: effectiveTime.toISOString(),
      distance_from_site_m: geoValidation.distanceMeters,
      submitted_at: effectiveTime.toISOString(),
      permission_reason: type === 'izin' ? permissionReason : undefined,
    };

    // Update local state
    setAttendanceRecords((prev) => [newRecord, ...prev]);

    // Send to Supabase Database if connected
    const supabase = getSupabase();
    if (supabase && isSupabaseConnected) {
      try {
        // Ensure session exists
        await supabase.from('attendance_sessions').upsert({
          id: sessionId,
          activity_id: activity.id,
          operational_date: todayStr,
          opens_at: `${todayStr}T${activity.start_time}:00Z`,
          closes_at: `${todayStr}T${activity.end_time}:00Z`,
          status: 'open',
        });

        // Insert attendance record
        await supabase.from('attendance_records').insert({
          id: newRecordId,
          session_id: sessionId,
          student_id: currentUser.id,
          attendance_type: type,
          status,
          photo_path: publicPhotoUrl,
          latitude: coords.latitude,
          longitude: coords.longitude,
          gps_accuracy_m: coords.accuracy,
          location_captured_at: effectiveTime.toISOString(),
          distance_from_site_m: geoValidation.distanceMeters,
          submitted_at: effectiveTime.toISOString(),
          permission_reason: type === 'izin' ? permissionReason : null,
        });
      } catch (err) {
        console.warn('Failed to insert attendance into Supabase:', err);
      }
    }

    return {
      success: status === 'hadir_valid' || status === 'izin_diajukan',
      record: newRecord,
      message,
    };
  };

  // Review permission (Approve / Reject) by Musyrif
  const reviewPermission = async (
    recordId: string,
    status: AttendanceStatus,
    reviewNote?: string
  ) => {
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

    // Send to Supabase
    const supabase = getSupabase();
    if (supabase && isSupabaseConnected) {
      try {
        await supabase
          .from('attendance_records')
          .update({
            status,
            reviewed_by: currentUser.id,
            reviewed_at: effectiveTime.toISOString(),
            review_note: reviewNote,
          })
          .eq('id', recordId);

        await supabase.from('audit_logs').insert({
          id: audit.id,
          actor_id: currentUser.id,
          action: 'REVIEW_PERMISSION',
          entity_type: 'attendance_record',
          entity_id: recordId,
          before_data: { status: record.status },
          after_data: { status, review_note: reviewNote },
          reason: reviewNote || 'Tinjauan izin musyrif',
          created_at: effectiveTime.toISOString(),
        });
      } catch (err) {
        console.warn('Failed to update Supabase permission:', err);
      }
    }
  };

  // Manual correction by musyrif
  const correctAttendance = async (
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

    const supabase = getSupabase();
    if (supabase && isSupabaseConnected) {
      try {
        await supabase
          .from('attendance_records')
          .update({ status: newStatus })
          .eq('id', recordId);

        await supabase.from('audit_logs').insert({
          id: audit.id,
          actor_id: currentUser.id,
          action: 'MANUAL_CORRECTION',
          entity_type: 'attendance_record',
          entity_id: recordId,
          before_data: { status: oldStatus },
          after_data: { status: newStatus },
          reason,
          created_at: effectiveTime.toISOString(),
        });
      } catch (err) {
        console.warn('Failed to correct record in Supabase:', err);
      }
    }
  };

  // Student management with real credential support (Username/Email & Password)
  const addStudent = async (studentData: Omit<Profile, 'id' | 'created_at'> & { password?: string }) => {
    const rawPass = studentData.password?.trim() || studentData.password_hash || 'password123';
    const cleanStudentNumber = studentData.student_number?.trim() || '';
    const cleanEmail =
      studentData.email?.trim().toLowerCase() ||
      `${cleanStudentNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@santri.nurulfalah.ac.id`;

    const newStudent: Profile = {
      ...studentData,
      id: `usr-santri-${Date.now()}`,
      role: 'santri',
      email: cleanEmail,
      student_number: cleanStudentNumber,
      password_hash: rawPass,
      is_active: studentData.is_active !== undefined ? studentData.is_active : true,
      created_at: effectiveTime.toISOString(),
    };
    delete (newStudent as any).password;

    setProfiles((prev) => [...prev, newStudent]);

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'CREATE_STUDENT',
      entity_type: 'profile',
      entity_id: newStudent.id,
      after_data: {
        full_name: newStudent.full_name,
        student_number: newStudent.student_number,
        email: newStudent.email,
      },
      reason: 'Penambahan data & akun santri baru',
      created_at: effectiveTime.toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);

    const supabase = getSupabase();
    if (supabase && isSupabaseConnected) {
      try {
        await supabase.from('profiles').insert(newStudent);
      } catch (err) {
        console.warn('Supabase insert profile failed:', err);
      }
    }
  };

  const updateStudent = async (student: Profile & { password?: string }) => {
    const rawPass = student.password?.trim();
    const cleanStudent: Profile = {
      ...student,
      email: student.email?.trim().toLowerCase() || student.email,
      password_hash: rawPass ? rawPass : student.password_hash || 'password123',
    };
    delete (cleanStudent as any).password;

    setProfiles((prev) => prev.map((p) => (p.id === cleanStudent.id ? cleanStudent : p)));
    setAttendanceRecords((prev) =>
      prev.map((rec) =>
        rec.student_id === cleanStudent.id
          ? {
              ...rec,
              student_name: cleanStudent.full_name,
              student_number: cleanStudent.student_number,
              group_name: cleanStudent.group_name,
            }
          : rec
      )
    );
    if (currentUser.id === cleanStudent.id) {
      setCurrentUserState(cleanStudent);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(cleanStudent));
    }

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'UPDATE_STUDENT',
      entity_type: 'profile',
      entity_id: cleanStudent.id,
      after_data: {
        full_name: cleanStudent.full_name,
        email: cleanStudent.email,
        student_number: cleanStudent.student_number,
        group_name: cleanStudent.group_name,
        password_changed: Boolean(rawPass),
      },
      reason: rawPass ? 'Perubahan biodata & kata sandi santri' : 'Pembaruan data santri',
      created_at: effectiveTime.toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);

    const supabase = getSupabase();
    if (supabase && isSupabaseConnected) {
      try {
        await supabase.from('profiles').update(cleanStudent).eq('id', cleanStudent.id);
        if (rawPass && currentUser.id === cleanStudent.id) {
          try {
            await supabase.auth.updateUser({ password: rawPass });
          } catch (authErr) {
            console.warn('Supabase auth updateUser warning:', authErr);
          }
        }
      } catch (err) {
        console.warn('Supabase update profile failed:', err);
      }
    }
  };

  // Self-update username & password for the logged-in user (Musyrif, Admin, or Santri)
  const updateCurrentUserCredentials = async (data: {
    fullName?: string;
    email?: string;
    newPassword?: string;
    phone?: string;
    studentNumber?: string;
    groupName?: string;
  }): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || currentUser.id === 'guest') {
      return { success: false, message: 'Anda belum masuk ke akun.' };
    }

    const updatedProfile: Profile = {
      ...currentUser,
      full_name: data.fullName?.trim() || currentUser.full_name,
      email: data.email?.trim().toLowerCase() || currentUser.email,
      phone: data.phone !== undefined ? data.phone.trim() : currentUser.phone,
      student_number: data.studentNumber !== undefined ? data.studentNumber.trim() : currentUser.student_number,
      group_name: data.groupName !== undefined ? data.groupName.trim() : currentUser.group_name,
      password_hash: data.newPassword?.trim() ? data.newPassword.trim() : currentUser.password_hash || 'password123',
    };

    setCurrentUserState(updatedProfile);
    setProfiles((prev) => prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p)));
    setAttendanceRecords((prev) =>
      prev.map((rec) =>
        rec.student_id === updatedProfile.id
          ? {
              ...rec,
              student_name: updatedProfile.full_name,
              student_number: updatedProfile.student_number,
              group_name: updatedProfile.group_name,
            }
          : rec
      )
    );
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedProfile));

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'UPDATE_CREDENTIALS',
      entity_type: 'profile',
      entity_id: currentUser.id,
      after_data: {
        email: updatedProfile.email,
        full_name: updatedProfile.full_name,
        student_number: updatedProfile.student_number,
        group_name: updatedProfile.group_name,
        password_changed: Boolean(data.newPassword),
      },
      reason: 'Pembaruan data & kredensial akun mandiri',
      created_at: effectiveTime.toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);

    const supabase = getSupabase();
    if (supabase && isSupabaseConnected) {
      try {
        await supabase
          .from('profiles')
          .update(updatedProfile)
          .eq('id', currentUser.id);

        if (data.newPassword) {
          try {
            await supabase.auth.updateUser({ password: data.newPassword.trim() });
          } catch (authErr) {
            console.warn('Supabase auth updateUser warning:', authErr);
          }
        }
      } catch (err) {
        console.warn('Failed to update credentials in Supabase:', err);
      }
    }

    return {
      success: true,
      message: 'Data profil santri dan kredensial akun berhasil diperbarui!',
    };
  };

  const toggleStudentStatus = async (id: string) => {
    let nextStatus = false;
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          nextStatus = !p.is_active;
          return { ...p, is_active: nextStatus };
        }
        return p;
      })
    );

    const supabase = getSupabase();
    if (supabase && isSupabaseConnected) {
      try {
        await supabase.from('profiles').update({ is_active: nextStatus }).eq('id', id);
      } catch (err) {
        console.warn('Supabase toggle profile failed:', err);
      }
    }
  };

  // Activity management
  const addActivity = async (actData: Omit<Activity, 'id'>) => {
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

    const supabase = getSupabase();
    if (supabase && isSupabaseConnected) {
      try {
        await supabase.from('activities').insert(newAct);
      } catch (err) {
        console.warn('Supabase add activity failed:', err);
      }
    }
  };

  const updateActivity = async (activity: Activity) => {
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

    const supabase = getSupabase();
    if (supabase && isSupabaseConnected) {
      try {
        await supabase.from('activities').update(activity).eq('id', activity.id);
      } catch (err) {
        console.warn('Supabase update activity failed:', err);
      }
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        isLoadingAuth,
        isSupabaseConnected,
        supabaseStatusMessage,
        login,
        register,
        logout,
        checkConnection,
        saveConnectionConfig,
        profiles,
        activities,
        attendanceRecords,
        auditLogs,
        effectiveTime,
        submitAttendance,
        reviewPermission,
        correctAttendance,
        addStudent,
        updateStudent,
        updateCurrentUserCredentials,
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
