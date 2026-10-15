'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import {
  CreditCard,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  FileText,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  X,
  Receipt,
  Eye,
  Info,
  ShieldCheck,
  Send,
  Building2,
  HelpCircle,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function SantriSppPage() {
  const {
    currentUser,
    sppSettings,
    sppPayments,
    submitSppPayment,
    effectiveTime,
  } = useStore();

  const [selectedYear, setSelectedYear] = useState<number>(effectiveTime.getFullYear());
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Modal Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMonth, setUploadMonth] = useState<number>(effectiveTime.getMonth() + 1);
  const [uploadYear, setUploadYear] = useState<number>(effectiveTime.getFullYear());
  const [uploadAmount, setUploadAmount] = useState<number>(sppSettings.monthly_amount);
  const [paymentDate, setPaymentDate] = useState<string>(
    effectiveTime.toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Modal View Receipt State
  const [viewPayment, setViewPayment] = useState<any | null>(null);

  // Filter payments for this student
  const myPayments = sppPayments.filter((p) => p.student_id === currentUser.id);

  // Copy Bank Account Number
  const handleCopyAccount = () => {
    if (sppSettings.bank_account_number) {
      navigator.clipboard.writeText(sppSettings.bank_account_number);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
    }
  };

  // Handle Image File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Format file harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Ukuran file maksimal 5MB.');
      return;
    }

    setSubmitError('');
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Open modal for specific month
  const openUploadForMonth = (month: number) => {
    setUploadMonth(month);
    setUploadYear(selectedYear);
    setUploadAmount(sppSettings.monthly_amount);
    setPreviewImage(null);
    setNotes('');
    setSubmitError('');
    setSubmitSuccess(false);
    setIsUploadModalOpen(true);
  };

  // Submit Handler
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewImage) {
      setSubmitError('Harap lampirkan foto/struk bukti transfer.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await submitSppPayment({
        month: uploadMonth,
        year: uploadYear,
        amount: uploadAmount,
        paymentDate,
        proofDataUrl: previewImage,
        notes,
      });

      if (res.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setSubmitSuccess(false);
          setPreviewImage(null);
        }, 1500);
      } else {
        setSubmitError(res.message || 'Gagal mengirim bukti pembayaran.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get status of a month
  const getMonthPayment = (month: number, year: number) => {
    return myPayments.find((p) => p.month === month && p.year === year);
  };

  // Format currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="mesh-bg min-h-[calc(100vh-8rem)] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Top Header / Breadcrumb ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/santri"
              className="inline-flex items-center gap-1.5 text-xs text-[#0D7B5F] dark:text-[#D4A24C] hover:underline font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
              <span>Pembayaran SPP Bulanan</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D4A24C]/15 text-[#D4A24C] border border-[#D4A24C]/30">
                Santri
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Kewajiban SPP santri Pesantren Nurul Falah. Unggah bukti transfer secara aman dan pantau status verifikasi.
            </p>
          </div>

          <button
            onClick={() => openUploadForMonth(effectiveTime.getMonth() + 1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D7B5F] to-[#0A664E] text-white text-sm font-bold shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:from-[#0b8668] transition-all btn-press"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Bukti SPP</span>
          </button>
        </div>

        {/* ── Informasi Rekening Pondok & Tarif ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Tarif SPP */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A24C]/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs text-[#D4A24C] font-semibold mb-2">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Tarif SPP Bulanan
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                  Resmi
                </span>
              </div>
              <div className="text-3xl font-extrabold tracking-tight text-white mb-1">
                {formatRupiah(sppSettings.monthly_amount)}
              </div>
              <p className="text-xs text-emerald-100/70">
                Per santri / bulan. Termasuk ta’lim, operasional asrama, dan kajian kitab.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-emerald-200/80 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4A24C]" />
              <span>Dikonfirmasi oleh Pengasuhan Musyrif</span>
            </div>
          </div>

          {/* Card 2: Rekening Transfer */}
          <div className="md:col-span-2 rounded-2xl p-5 bg-white dark:bg-[#0F1E18] border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#0D7B5F]/10 dark:bg-[#D4A24C]/10 text-[#0D7B5F] dark:text-[#D4A24C]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Tujuan Rekening Resmi
                    </h3>
                    <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {sppSettings.bank_name}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  Aktif
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between bg-stone-50 dark:bg-[#152922] p-3 rounded-xl border border-stone-200/70 dark:border-stone-800">
                <div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">Nomor Rekening:</div>
                  <div className="font-mono text-lg font-extrabold text-stone-900 dark:text-stone-100 tracking-wider">
                    {sppSettings.bank_account_number}
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                    a.n. <span className="font-bold">{sppSettings.bank_account_holder}</span>
                  </div>
                </div>

                <button
                  onClick={handleCopyAccount}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-[#1C3A2E] text-stone-700 dark:text-stone-200 text-xs font-semibold border border-stone-200 dark:border-stone-700 hover:border-[#0D7B5F] transition-all shadow-sm active:scale-95"
                >
                  {copiedAccount ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Rekening</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              💡 {sppSettings.notes || 'Cantumkan berita transfer: SPP [Bulan] [Nama Santri] [NIS].'}
            </p>
          </div>
        </div>

        {/* ── Matriks Status Pembayaran 12 Bulan ── */}
        <div className="bg-white dark:bg-[#0F1E18] rounded-2xl p-5 sm:p-6 border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0D7B5F] dark:text-[#D4A24C]" />
                <span>Status SPP Tahun {selectedYear}</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Pilih bulan untuk melihat rincian pembayaran atau mengunggah bukti transfer.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid 12 Bulan */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {MONTH_NAMES.map((monthName, idx) => {
              const monthNum = idx + 1;
              const payment = getMonthPayment(monthNum, selectedYear);
              const isCurrentMonth =
                monthNum === effectiveTime.getMonth() + 1 &&
                selectedYear === effectiveTime.getFullYear();

              let statusBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500 bg-stone-100 dark:bg-stone-800 dark:text-stone-400 px-2 py-0.5 rounded-md">
                  <AlertCircle className="w-3 h-3" />
                  Belum Bayar
                </span>
              );

              let borderClass = 'border-stone-200 dark:border-stone-800';
              let bgClass = 'bg-stone-50/60 dark:bg-[#12231c]/40';

              if (payment) {
                if (payment.status === 'verified') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Lunas
                    </span>
                  );
                  borderClass = 'border-emerald-300 dark:border-emerald-800';
                  bgClass = 'bg-emerald-50/40 dark:bg-emerald-950/20';
                } else if (payment.status === 'pending') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Verifikasi
                    </span>
                  );
                  borderClass = 'border-amber-300 dark:border-amber-800';
                  bgClass = 'bg-amber-50/40 dark:bg-amber-950/20';
                } else if (payment.status === 'rejected') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      Ditolak
                    </span>
                  );
                  borderClass = 'border-rose-300 dark:border-rose-800';
                  bgClass = 'bg-rose-50/40 dark:bg-rose-950/20';
                }
              }

              return (
                <div
                  key={monthName}
                  className={`rounded-xl p-3.5 border ${borderClass} ${bgClass} transition-all hover:shadow-md flex flex-col justify-between relative ${
                    isCurrentMonth ? 'ring-2 ring-[#0D7B5F] dark:ring-[#D4A24C]' : ''
                  }`}
                >
                  {isCurrentMonth && (
                    <span className="absolute -top-2 right-2 text-[9px] font-extrabold uppercase tracking-wider bg-[#0D7B5F] text-white px-1.5 py-0.2 rounded shadow-sm">
                      Bulan Ini
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {monthName}
                      </span>
                      {statusBadge}
                    </div>

                    <div className="text-xs text-stone-600 dark:text-stone-300">
                      Tagihan:{' '}
                      <span className="font-semibold">
                        {payment ? formatRupiah(payment.amount) : formatRupiah(sppSettings.monthly_amount)}
                      </span>
                    </div>

                    {payment && (
                      <div className="text-[10px] text-stone-500 mt-1">
                        Tgl Bayar: {payment.payment_date}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between">
                    {payment ? (
                      <button
                        onClick={() => setViewPayment(payment)}
                        className="text-[11px] font-bold text-[#0D7B5F] dark:text-[#D4A24C] hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Lihat Bukti</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone-400">Belum ada data</span>
                    )}

                    {(!payment || payment.status === 'rejected') && (
                      <button
                        onClick={() => openUploadForMonth(monthNum)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#0D7B5F] text-white hover:bg-[#0b6b52] transition-colors shadow-sm"
                      >
                        Bayar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Riwayat Pembayaran Santri ── */}
        <div className="bg-white dark:bg-[#0F1E18] rounded-2xl p-5 sm:p-6 border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#0D7B5F] dark:text-[#D4A24C]" />
                <span>Riwayat Pengajuan Pembayaran</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Daftar semua bukti transfer yang pernah Anda kirimkan.
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-500 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
              {myPayments.length} Pembayaran
            </span>
          </div>

          {myPayments.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs">
              Belum ada riwayat pembayaran SPP yang tercatat.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {myPayments.map((p) => (
                <div
                  key={p.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-[#13261e]/40 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        SPP {MONTH_NAMES[p.month - 1]} {p.year}
                      </span>
                      <span className="font-mono text-xs font-extrabold text-[#0D7B5F] dark:text-[#D4A24C]">
                        {formatRupiah(p.amount)}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Tanggal Transfer: {p.payment_date}</span>
                      {p.notes && <span>• Catatan: &quot;{p.notes}&quot;</span>}
                    </div>
                    {p.status === 'rejected' && p.rejection_reason && (
                      <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        Alasan ditolak: {p.rejection_reason}
                      </div>
                    )}
                    {p.status === 'verified' && p.reviewed_by_name && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        Diverifikasi oleh: {p.reviewed_by_name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {p.status === 'verified' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Lunas Terverifikasi
                      </span>
                    )}
                    {p.status === 'pending' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Menunggu Musyrif
                      </span>
                    )}
                    {p.status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Ditolak
                      </span>
                    )}

                    <button
                      onClick={() => setViewPayment(p)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rincian</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Public Transparency Banner Link ── */}
        <div className="rounded-2xl p-5 bg-gradient-to-r from-emerald-900/10 via-[#D4A24C]/10 to-transparent border border-emerald-600/20 dark:border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D7B5F] dark:text-[#D4A24C]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparansi Kas Terbuka</span>
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Ingin tahu dana SPP & kas pondok digunakan untuk apa saja?
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Pesantren Nurul Falah menyajikan transparansi seluruh pengeluaran operasional, konsumsi, dan perawatan fasilitas secara publik dan akuntabel.
            </p>
          </div>
          <Link
            href="/transparansi"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#152922] text-[#0D7B5F] dark:text-[#D4A24C] border border-stone-200 dark:border-stone-700 text-xs font-bold shadow-sm hover:shadow transition-all shrink-0"
          >
            <span>Buka Laporan Transparansi</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* ══════════════════════════════════════════════
          MODAL UPLOAD BUKTI PEMBAYARAN SPP
         ══════════════════════════════════════════════ */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0F1E18] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-[#1C3A2E] space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0D7B5F]/15 dark:bg-[#D4A24C]/15 flex items-center justify-center text-[#0D7B5F] dark:text-[#D4A24C]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Upload Bukti Pembayaran SPP
                  </h3>
                  <p className="text-xs text-stone-500">
                    Santri: {currentUser.full_name} ({currentUser.student_number || 'Santri'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  Bukti Berhasil Terkirim!
                </h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Bukti pembayaran SPP bulan {MONTH_NAMES[uploadMonth - 1]} {uploadYear} telah masuk antrean verifikasi Musyrif.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitProof} className="space-y-4">
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Pilih Bulan & Tahun */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Bulan SPP
                    </label>
                    <select
                      value={uploadMonth}
                      onChange={(e) => setUploadMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Tahun
                    </label>
                    <select
                      value={uploadYear}
                      onChange={(e) => setUploadYear(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                    >
                      {[2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nominal & Tanggal Bayar */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Nominal Transfer (Rp)
                    </label>
                    <input
                      type="number"
                      value={uploadAmount}
                      onChange={(e) => setUploadAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Tanggal Transfer
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                      required
                    />
                  </div>
                </div>

                {/* File / Camera Upload Area */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Foto Struk / Tangkapan Layar M-Banking *
                  </label>

                  {previewImage ? (
                    <div className="relative rounded-2xl border border-stone-300 dark:border-stone-700 overflow-hidden bg-black/5 dark:bg-black/20">
                      <img
                        src={previewImage}
                        alt="Bukti Transfer"
                        className="w-full max-h-56 object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-[#0D7B5F] rounded-2xl p-6 cursor-pointer bg-stone-50/50 dark:bg-[#152922]/40 transition-colors">
                      <Upload className="w-8 h-8 text-stone-400 mb-2" />
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-200">
                        Klik untuk memilih foto / kamera
                      </span>
                      <span className="text-[10px] text-stone-400 mt-1">
                        JPG, PNG, atau WebP (Maksimal 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Catatan Tambahan */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Catatan / Nama Rekening Pengirim (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Transfer via BSI Bpk Ridwan (Wali)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !previewImage}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D7B5F] to-[#0A664E] text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Bukti Pembayaran</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL DETAIL / BUKTI PEMBAYARAN
         ══════════════════════════════════════════════ */}
      {viewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0F1E18] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-[#1C3A2E] space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#0D7B5F] dark:text-[#D4A24C]" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Detail Bukti Pembayaran
                </h3>
              </div>
              <button
                onClick={() => setViewPayment(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#152922] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Periode:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    SPP {MONTH_NAMES[viewPayment.month - 1]} {viewPayment.year}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Nominal:</span>
                  <span className="font-bold text-[#0D7B5F] dark:text-[#D4A24C]">
                    {formatRupiah(viewPayment.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Tgl Transfer:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {viewPayment.payment_date}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Status:</span>
                  <span className="font-bold">
                    {viewPayment.status === 'verified' && (
                      <span className="text-emerald-600">Disetujui / Lunas</span>
                    )}
                    {viewPayment.status === 'pending' && (
                      <span className="text-amber-600">Menunggu Verifikasi</span>
                    )}
                    {viewPayment.status === 'rejected' && (
                      <span className="text-rose-600">Ditolak</span>
                    )}
                  </span>
                </div>
                {viewPayment.notes && (
                  <div className="flex justify-between pt-1 border-t border-stone-200/50 dark:border-stone-800">
                    <span className="text-stone-500">Catatan:</span>
                    <span className="text-stone-700 dark:text-stone-300 italic">
                      &quot;{viewPayment.notes}&quot;
                    </span>
                  </div>
                )}
                {viewPayment.rejection_reason && (
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px]">
                    Alasan Ditolak: {viewPayment.rejection_reason}
                  </div>
                )}
              </div>

              {viewPayment.proof_image_url ? (
                <div>
                  <div className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                    Foto Bukti Transfer:
                  </div>
                  <div className="rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden bg-black/5 max-h-64 flex items-center justify-center">
                    <img
                      src={viewPayment.proof_image_url}
                      alt="Struk Transfer"
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-stone-400 italic text-center py-4 bg-stone-50 dark:bg-[#152922] rounded-xl">
                  Pembayaran tunai langsung tercatat di kantor pesantren (tanpa lampiran foto).
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
              <button
                onClick={() => setViewPayment(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold hover:bg-stone-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
