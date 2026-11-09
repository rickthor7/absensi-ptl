import { Profile } from '@/types';

export const SESSION_COOKIE_NAME = 'absensi_santri_session_v1';

/**
 * Menyimpan sesi login pengguna (santri / musyrif) ke dalam cookies browser dengan masa berlaku 365 hari (1 tahun),
 * sehingga sesi tetap terjaga saat browser ditutup, ponsel restart, atau halaman dimuat ulang.
 */
export function setSessionCookie(user: Profile, days = 365): void {
  if (typeof document === 'undefined') return;

  try {
    const payload = JSON.stringify({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      nickname: user.nickname,
      student_number: user.student_number,
      role: user.role,
      group_name: user.group_name,
      avatar_url: user.avatar_url,
      class_tahfidz_pagi: user.class_tahfidz_pagi,
      class_tahfidz_malam: user.class_tahfidz_malam,
      is_active: user.is_active,
      created_at: user.created_at,
    });

    const maxAge = days * 24 * 60 * 60;
    // Set cookie with SameSite=Lax and path=/
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(
      payload
    )}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch (err) {
    console.warn('Gagal menyimpan auth cookie:', err);
  }
}

/**
 * Membaca data sesi login pengguna dari cookies browser.
 */
export function getSessionCookie(): Profile | null {
  if (typeof document === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === SESSION_COOKIE_NAME && value) {
        const decoded = decodeURIComponent(value);
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.id && parsed.id !== 'guest') {
          return parsed as Profile;
        }
      }
    }
  } catch (err) {
    console.warn('Gagal membaca auth cookie:', err);
  }

  return null;
}

/**
 * Menghapus cookie sesi login saat pengguna melakukan logout resmi.
 */
export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

