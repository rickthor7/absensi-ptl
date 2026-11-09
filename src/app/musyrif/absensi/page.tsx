import { redirect } from 'next/navigation';

export default function MusyrifAbsensiPage() {
  // Presensi hanya dilakukan mandiri oleh santri, redirect musyrif ke beranda dashboard
  redirect('/musyrif');
}
