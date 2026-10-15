'use client';

import React, { useState } from 'react';
import { StudentMonthlyScore } from '@/lib/scoring';
import { Activity, Profile } from '@/types';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User,
  GraduationCap,
  Calendar,
  Sparkles,
  Phone,
  MapPin,
  Building2,
} from 'lucide-react';
import { formatIndonesianDate } from '@/lib/schedule';

interface RaportSantriModalProps {
  studentsScores: StudentMonthlyScore[];
  initialStudentId?: string;
  activities: Activity[];
  monthLabel: string;
  monthKey: string;
  musyrifUser?: Profile;
  onClose: () => void;
}

export default function RaportSantriModal({
  studentsScores,
  initialStudentId,
  activities,
  monthLabel,
  monthKey,
  musyrifUser,
  onClose,
}: RaportSantriModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!initialStudentId) return 0;
    const idx = studentsScores.findIndex((s) => s.student.id === initialStudentId);
    return idx >= 0 ? idx : 0;
  });

  const [includeAllInPrint, setIncludeAllInPrint] = useState(false);

  const currentScore = studentsScores[currentIndex] || studentsScores[0];
  if (!currentScore) return null;

  const currentStudent = currentScore.student;

  const getPredicate = (percentage: number) => {
    if (percentage >= 85) return { grade: 'A', label: 'Sangat Baik (Mumtaz)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (percentage >= 70) return { grade: 'B', label: 'Baik (Jayyid Jiddan)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (percentage >= 60) return { grade: 'C', label: 'Cukup (Maqbul)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { grade: 'D', label: 'Pembinaan (Rasib)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const overallPred = getPredicate(currentScore.scorePercentage);

  // Trigger print dialog for current student or all
  const handlePrintPDF = (printAll = false) => {
    setIncludeAllInPrint(printAll);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Export Single Student Raport as CSV
  const exportSingleStudentCSV = () => {
    const s = currentScore;
    const pred = getPredicate(s.scorePercentage);

    const lines = [
      'PESANTREN AL-QURAN NURUL FALAH KETINTANG',
      'Jl. Ketintang PTT V-B No. 24, Gayungan, Kota Surabaya, Jawa Timur 60231',
      `Telp: (031) 828-4456 / WA Musyrif: ${musyrifUser?.phone || '+62 812-3456-7890'}`,
      'RAPORT EVALUASI PRESENSI & KEDISIPLINAN SANTRI',
      `Periode: ${monthLabel}`,
      '',
      `Nama Santri,${s.student.full_name}`,
      `NIS,${s.student.student_number || '-'}`,
      `Kamar / Asrama,${s.student.group_name || '-'}`,
      `Musyrif Pembina,${musyrifUser?.full_name || 'Ustadz Pembina'}`,
      `Status Kelulusan,${s.isWarning ? 'PERINGATAN (< 70%)' : 'AMAN (LULUS)'}`,
      `Skor Akhir,${s.scorePercentage}% (Predikat ${pred.grade} - ${pred.label})`,
      '',
      'RINCIAN KEHADIRAN PER KEGIATAN',
      'No,Nama Kegiatan,Waktu Kegiatan,Total Sesi,Hadir (Poin 1),Izin (Poin 0.5),Alpa (Poin 0),Persentase (%),Predikat Mutu',
      ...activities.map((act, i) => {
        const sc = s.activityScores[act.id] || { hadir: 0, izin: 0, alpa: 0, sessions: 0, percentage: 100 };
        const p = getPredicate(sc.percentage);
        return `${i + 1},"${act.name}","${act.start_time} - ${act.end_time} WIB",${sc.sessions},${sc.hadir},${sc.izin},${sc.alpa},${sc.percentage}%,${p.grade}`;
      }),
      '',
      'RINGKASAN AKUMULATIF',
      `Total Sesi Wajib,${s.totalSessions}`,
      `Total Hadir,${s.hadirCount}`,
      `Total Izin,${s.izinCount}`,
      `Total Alpa,${s.alpaCount}`,
      `Total Poin Diperoleh,${s.totalScore}`,
      `Persentase Kehadiran,${s.scorePercentage}%`,
      `Hasil Evaluasi,${s.isWarning ? 'Wajib Mengikuti Sidang Evaluasi Pembinaan' : 'Memenuhi Standar Kelulusan Kehadiran Santri'}`,
      '',
      `Surabaya, ${formatIndonesianDate(new Date())}`,
      'Mengetahui Musyrif Pembina,Pengasuh Pondok Pesantren',
      `"${musyrifUser?.full_name || 'Ustadz Pembina'}","K.H. Pengasuh Nurul Falah"`,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `raport-santri-${currentStudent.student_number || 'nis'}-${monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export All Students Raport as CSV
  const exportAllStudentsCSV = () => {
    const headers = [
      'NIS',
      'Nama Santri',
      'Kamar / Asrama',
      'Hadir (x1)',
      'Izin (x0.5)',
      'Alpa (x0)',
      'Total Sesi',
      'Total Skor',
      'Persentase (%)',
      'Predikat',
      'Status Kelulusan',
      ...activities.map((a) => `Persentase ${a.name} (%)`),
      ...activities.map((a) => `Predikat ${a.name}`),
    ];

    const rows = studentsScores.map((s) => {
      const pred = getPredicate(s.scorePercentage);
      const actPercentages = activities.map((a) => {
        const sc = s.activityScores[a.id];
        return sc ? `${sc.percentage}%` : '100%';
      });
      const actGrades = activities.map((a) => {
        const sc = s.activityScores[a.id];
        return sc ? getPredicate(sc.percentage).grade : 'A';
      });

      return [
        `"${s.student.student_number || ''}"`,
        `"${s.student.full_name}"`,
        `"${s.student.group_name || ''}"`,
        s.hadirCount,
        s.izinCount,
        s.alpaCount,
        s.totalSessions,
        s.totalScore,
        `${s.scorePercentage}%`,
        pred.grade,
        s.isWarning ? 'PERINGATAN (< 70%)' : 'AMAN (>= 70%)',
        ...actPercentages,
        ...actGrades,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [
        'PESANTREN AL-QURAN NURUL FALAH KETINTANG',
        'Jl. Ketintang PTT V-B No. 24, Gayungan, Kota Surabaya, Jawa Timur',
        `REKAPITULASI RAPORT BULANAN SANTRI - ${monthLabel}`,
        '',
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `buku-raport-santri-nurul-falah-${monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSingleRaportCard = (scoreItem: StudentMonthlyScore, idx: number) => {
    const s = scoreItem;
    const st = s.student;
    const pred = getPredicate(s.scorePercentage);

    return (
      <div
        key={st.id}
        className={`raport-page bg-white text-stone-900 p-6 sm:p-10 rounded-2xl shadow-xl border border-stone-200 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none ${
          idx > 0 ? 'print:break-before-page' : ''
        }`}
        style={{ fontFamily: "'Times New Roman', serif" }}
      >
        {/* ── KOP RESMI PONDOK PESANTREN ── */}
        <div className="flex items-center justify-between border-b-4 border-double border-stone-800 pb-3 mb-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#0D7B5F] flex items-center justify-center p-1.5 shrink-0 bg-emerald-50/50">
            <div className="w-full h-full rounded-full bg-[#082F23] flex items-center justify-center text-[#D4A24C]">
              <span className="text-2xl sm:text-3xl font-serif font-black leading-none">ن</span>
            </div>
          </div>

          <div className="text-center flex-1 px-3">
            <h1 className="text-base sm:text-xl font-black tracking-wider uppercase text-emerald-950 font-serif">
              Pesantren Al-Qur&apos;an Nurul Falah
            </h1>
            <p className="text-xs sm:text-sm font-bold text-stone-800 tracking-tight">
              Pondok Pesantren Mahasiswa &amp; Pelajar Tahfidzul Qur&apos;an
            </p>
            <p className="text-[10px] sm:text-[11px] text-stone-600 leading-tight mt-0.5 font-sans">
              Jl. Ketintang PTT V-B No. 24, Kel. Ketintang, Kec. Gayungan, Kota Surabaya, Jawa Timur 60231
            </p>
            <p className="text-[10px] text-stone-500 font-sans">
              Telp: (031) 828-4456 • WA Musyrif: {musyrifUser?.phone || '+62 812-3456-7890'} • Web: nurulfalah.sch.id
            </p>
          </div>

          <div className="w-16 sm:w-20 hidden sm:flex items-center justify-center">
            <div className="text-center text-[10px] border border-stone-400 p-1.5 rounded text-stone-600 font-sans">
              <span>Formulir</span>
              <span className="block font-bold">RAP-01</span>
            </div>
          </div>
        </div>

        {/* ── JUDUL DOKUMEN ── */}
        <div className="text-center space-y-0.5 mb-5 font-sans">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-stone-900 border-b border-stone-300 pb-1 inline-block">
            Raport Evaluasi Presensi &amp; Kedisiplinan Santri
          </h2>
          <p className="text-xs font-semibold text-stone-600">
            Periode: <span className="font-bold text-stone-900">{monthLabel}</span>
          </p>
        </div>

        {/* ── IDENTITAS SANTRI ── */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-sans bg-stone-50/80 p-3 sm:p-4 rounded-xl border border-stone-200 mb-5">
          <div className="flex">
            <span className="w-28 text-stone-500 shrink-0">Nama Santri</span>
            <span className="font-bold text-stone-900">: {st.full_name}</span>
          </div>
          <div className="flex">
            <span className="w-28 text-stone-500 shrink-0">Musyrif Pembina</span>
            <span className="font-semibold text-stone-900">: {musyrifUser?.full_name || 'Ustadz Pembina Asrama'}</span>
          </div>
          <div className="flex">
            <span className="w-28 text-stone-500 shrink-0">Nomor Induk (NIS)</span>
            <span className="font-mono font-bold text-stone-900">: {st.student_number || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-28 text-stone-500 shrink-0">Status Kehadiran</span>
            <span className={`font-bold ${s.isWarning ? 'text-rose-600' : 'text-emerald-700'}`}>
              : {s.isWarning ? 'Peringatan (< 70%)' : 'Aman (Memenuhi Syarat)'}
            </span>
          </div>
          <div className="flex">
            <span className="w-28 text-stone-500 shrink-0">Kamar / Asrama</span>
            <span className="font-semibold text-stone-900">: {st.group_name || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-28 text-stone-500 shrink-0">Predikat Mutu</span>
            <span className="font-bold text-stone-900">: {pred.grade} ({pred.label})</span>
          </div>
        </div>

        {/* ── TABEL RINCIAN KEGIATAN ── */}
        <div className="mb-5 overflow-x-auto font-sans">
          <table className="w-full text-left text-xs border-collapse border border-stone-300">
            <thead>
              <tr className="bg-stone-100 text-stone-800 text-[11px] font-bold">
                <th className="border border-stone-300 py-2 px-2.5 text-center w-8">No</th>
                <th className="border border-stone-300 py-2 px-3">Kegiatan Harian Santri</th>
                <th className="border border-stone-300 py-2 px-2.5 text-center">Jadwal Sesi</th>
                <th className="border border-stone-300 py-2 px-2 text-center">Wajib</th>
                <th className="border border-stone-300 py-2 px-2 text-center text-emerald-800">Hadir</th>
                <th className="border border-stone-300 py-2 px-2 text-center text-amber-800">Izin</th>
                <th className="border border-stone-300 py-2 px-2 text-center text-rose-800">Alpa</th>
                <th className="border border-stone-300 py-2 px-2 text-center">Kehadiran</th>
                <th className="border border-stone-300 py-2 px-2 text-center">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act, i) => {
                const sc = s.activityScores[act.id] || { hadir: 0, izin: 0, alpa: 0, sessions: 0, percentage: 100 };
                const p = getPredicate(sc.percentage);
                return (
                  <tr key={act.id} className={i % 2 === 1 ? 'bg-stone-50/50' : 'bg-white'}>
                    <td className="border border-stone-300 py-2 px-2 text-center font-mono">{i + 1}</td>
                    <td className="border border-stone-300 py-2 px-3 font-semibold text-stone-900">
                      {act.name}
                    </td>
                    <td className="border border-stone-300 py-2 px-2.5 text-center text-[11px] font-mono text-stone-600">
                      {act.start_time} - {act.end_time}
                    </td>
                    <td className="border border-stone-300 py-2 px-2 text-center font-bold text-stone-700">
                      {sc.sessions}
                    </td>
                    <td className="border border-stone-300 py-2 px-2 text-center font-bold text-emerald-700">
                      {sc.hadir}
                    </td>
                    <td className="border border-stone-300 py-2 px-2 text-center font-bold text-amber-700">
                      {sc.izin}
                    </td>
                    <td className="border border-stone-300 py-2 px-2 text-center font-bold text-rose-700">
                      {sc.alpa}
                    </td>
                    <td className="border border-stone-300 py-2 px-2 text-center font-bold font-mono">
                      {sc.percentage}%
                    </td>
                    <td className="border border-stone-300 py-2 px-2 text-center font-black">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        p.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        p.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        p.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {p.grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-stone-100 font-bold border-t-2 border-stone-400">
                <td colSpan={3} className="border border-stone-300 py-2 px-3 text-right">
                  Akumulasi Total:
                </td>
                <td className="border border-stone-300 py-2 px-2 text-center">{s.totalSessions}</td>
                <td className="border border-stone-300 py-2 px-2 text-center text-emerald-800">{s.hadirCount}</td>
                <td className="border border-stone-300 py-2 px-2 text-center text-amber-800">{s.izinCount}</td>
                <td className="border border-stone-300 py-2 px-2 text-center text-rose-800">{s.alpaCount}</td>
                <td className="border border-stone-300 py-2 px-2 text-center font-black text-sm text-stone-900 font-mono">
                  {s.scorePercentage}%
                </td>
                <td className="border border-stone-300 py-2 px-2 text-center font-black text-sm">
                  {pred.grade}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── KETERANGAN SKOR & PREDIKAT ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans mb-6">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
            <span className="font-bold text-stone-800 block">Kriteria Penilaian Kehadiran:</span>
            <ul className="text-[11px] text-stone-600 space-y-0.5 list-disc list-inside">
              <li>Hadir Tepat Waktu (Swafoto &amp; GPS): <strong>1.0 Poin</strong></li>
              <li>Izin Syar&apos;i (Disetujui Musyrif): <strong>0.5 Poin</strong></li>
              <li>Alpa / Tidak Hadir / Ditolak: <strong>0.0 Poin</strong></li>
              <li>Batas Minimal Kelulusan Presensi: <strong>70.0%</strong></li>
            </ul>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
            <span className="font-bold text-stone-800 block">Catatan Musyrif Pembina:</span>
            <p className="text-[11px] text-stone-600 italic">
              {s.isWarning
                ? 'Perlu peningkatan kedisiplinan pada kegiatan berjamaah dan tilawah harian. Santri wajib menghadap musyrif untuk pendampingan khusus.'
                : s.scorePercentage >= 85
                ? 'Alhamdulillah, santri menunjukkan komitmen kedisiplinan dan akhlak yang sangat baik. Pertahankan istiqomah.'
                : 'Kehadiran santri cukup baik dan memenuhi kriteria pondok pesantren. Tetap jaga konsistensi sholat berjamaah.'}
            </p>
          </div>
        </div>

        {/* ── TANDA TANGAN PENGESAHAN ── */}
        <div className="pt-2 font-sans">
          <div className="flex justify-end text-xs mb-3 text-stone-700">
            <p>Surabaya, {formatIndonesianDate(new Date())}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="text-stone-600 mb-14">Musyrif Pembina Kamar,</p>
              <p className="font-bold text-stone-900 underline">{musyrifUser?.full_name || 'Ustadz Pembina Asrama'}</p>
              <p className="text-[10px] text-stone-500 font-mono">NIY. NF-2024-MSY</p>
            </div>

            <div>
              <p className="text-stone-600 mb-14">Pengasuh Pondok Pesantren,</p>
              <p className="font-bold text-stone-900 underline">K.H. Pengasuh Nurul Falah</p>
              <p className="text-[10px] text-stone-500">Pondok Pesantren Nurul Falah Ketintang</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
      <div className="relative w-full max-w-4xl bg-stone-100 dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="no-print p-4 sm:p-5 bg-white dark:bg-[#0F1E18] border-b border-stone-200 dark:border-[#1C3A2E] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#0D7B5F] dark:text-[#1AA37A] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                Pratinjau Raport Bulanan Santri
              </h3>
              <p className="text-[11px] text-stone-500">
                Pondok Pesantren Al-Qur&apos;an Nurul Falah Ketintang • {monthLabel}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Student Selector */}
            <select
              value={currentStudent.id}
              onChange={(e) => {
                const idx = studentsScores.findIndex((s) => s.student.id === e.target.value);
                if (idx >= 0) setCurrentIndex(idx);
              }}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none max-w-[180px] sm:max-w-xs truncate"
            >
              {studentsScores.map((s, idx) => (
                <option key={s.student.id} value={s.student.id}>
                  {idx + 1}. {s.student.full_name} ({s.scorePercentage}%)
                </option>
              ))}
            </select>

            {/* Print Current Student Button */}
            <button
              onClick={() => handlePrintPDF(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D7B5F] hover:bg-[#096B52] text-white text-xs font-bold transition shadow-sm cursor-pointer btn-press"
              title="Cetak atau Simpan sebagai PDF untuk santri ini"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            {/* Export CSV for this student */}
            <button
              onClick={exportSingleStudentCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer"
              title="Ekspor raport santri ini ke file CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#D4A24C]" />
              <span className="hidden sm:inline">CSV Raport</span>
            </button>

            {/* Export All CSV */}
            <button
              onClick={exportAllStudentsCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer"
              title="Ekspor seluruh rekap raport santri ke CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Semua CSV</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation bar between students */}
        <div className="no-print px-6 py-2.5 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <button
              disabled={currentIndex <= 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold">
              Santri {currentIndex + 1} dari {studentsScores.length}
            </span>
            <button
              disabled={currentIndex >= studentsScores.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(studentsScores.length - 1, prev + 1))}
              className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrintPDF(true)}
              className="text-[11px] font-bold text-[#0D7B5F] dark:text-[#D4A24C] hover:underline cursor-pointer"
            >
              Cetak Raport Semua Santri ({studentsScores.length}) →
            </button>
          </div>
        </div>

        {/* Scrollable Printable Container */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-8 flex-1" id="raport-printable-area">
          {includeAllInPrint
            ? studentsScores.map((s, idx) => renderSingleRaportCard(s, idx))
            : renderSingleRaportCard(currentScore, 0)}
        </div>
      </div>
    </div>
  );
}
