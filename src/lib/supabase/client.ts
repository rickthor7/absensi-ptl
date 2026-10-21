'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Also check browser localStorage in case user configured it via the UI
  let customUrl = '';
  let customKey = '';
  if (typeof window !== 'undefined') {
    try {
      customUrl = localStorage.getItem('custom_supabase_url') || '';
      customKey = localStorage.getItem('custom_supabase_key') || '';
    } catch {
      // Ignore localStorage errors
    }
  }

  const rawUrl = (customUrl || envUrl).trim();
  const anonKey = (customKey || envKey).trim();
  // Strip /rest/v1 or trailing slashes if present
  const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    anonKey.length > 20 &&
    !url.includes('your-project-id')
  );

  return { url, anonKey, isConfigured };
}

export function saveCustomSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    if (url && anonKey) {
      localStorage.setItem('custom_supabase_url', url.trim());
      localStorage.setItem('custom_supabase_key', anonKey.trim());
    } else {
      localStorage.removeItem('custom_supabase_url');
      localStorage.removeItem('custom_supabase_key');
    }
  }
  // Reset singleton instance so it re-initializes
  supabaseInstance = null;
}

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  hasTables?: boolean;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      connected: false,
      message: 'Supabase URL dan Anon Key belum dikonfigurasi.',
    };
  }

  try {
    // Try pinging public.activities or public.profiles with 3500ms timeout
    const pingPromise = supabase.from('activities').select('id').limit(1);
    const timeoutPromise = new Promise<{ data: null; error: { code: string; message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { code: 'TIMEOUT', message: 'Koneksi timeout (3.5 detik).' } }), 3500)
    );
    const { data, error } = (await Promise.race([pingPromise, timeoutPromise])) as any;

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST204' ||
        error.code === 'PGRST205' ||
        error.message?.toLowerCase().includes('relation') ||
        error.message?.toLowerCase().includes('could not find the table') ||
        error.message?.toLowerCase().includes('not found')
      ) {
        // Table doesn't exist yet, but project is connected
        return {
          connected: true,
          hasTables: false,
          message:
            'Terhubung ke project Supabase! Tabel database belum dibuat. Harap jalankan script migration SQL di Supabase SQL Editor.',
        };
      }
      return {
        connected: false,
        message: `Koneksi Supabase error: ${error.message}`,
      };
    }

    return {
      connected: true,
      hasTables: true,
      message: 'Berhasil terhubung ke Supabase Database.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Gagal menghubungi Supabase: ${errorMsg}`,
    };
  }
}
