'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { SppPayment } from '@/types';
import { getSppAmountForStudent } from '@/lib/constants';
import { getWibDateStr } from '@/lib/schedule';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  Settings,
  Users,
  Eye,
  Check,
  X,
  CreditCard,
  Save,
  MessageSquare,
  Calendar,
  ArrowLeft,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function MusyrifKeuanganPage() {
  const {
    currentUser,
    profiles,
    sppSettings,
    sppPayments,
    updateSppSettings,
    reviewSppPayment,
    addManualSppPayment,
    effectiveTime,
  } = useStore();

  // Pending SPP count
  const pendingPayments = sppPayments.filter((p) => p.status === 'pending');

  const [activeTab, setActiveTab] = useState<'verifikasi' | 'matriks' | 'pengaturan'>(
    pendingPayments.length > 0 ? 'verifikasi' : 'matriks'
  );

  // Modal Review Payment State
  const [selectedPayment, setSelectedPayment] = useState<SppPayment | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Modal Manual Cash SPP State
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashStudentId, setCashStudentId] = useState<string>('');
  const [cashMonth, setCashMonth] = useState<number>(effectiveTime.getMonth() + 1);
  const [cashYear, setCashYear] = useState<number>(effectiveTime.getFullYear());
  const [cashAmount, setCashAmount] = useState<number>(sppSettings.monthly_amount);
  const [cashNotes, setCashNotes] = useState<string>('');
  const [cashSuccess, setCashSuccess] = useState<string>('');

  // Settings State
  const [settingsMonthlyAmount, setSettingsMonthlyAmount] = useState<number>(sppSettings.monthly_amount);
  const [settingsAmount2026, setSettingsAmount2026] = useState<number>(
    sppSettings.generation_amounts?.['2026'] ?? 170000
  );
  const [settingsBankName, setSettingsBankName] = useState<string>(sppSettings.bank_name);
  const [settingsAccountNumber, setSettingsAccountNumber] = useState<string>(sppSettings.bank_account_number);
  const [settingsAccountHolder, setSettingsAccountHolder] = useState<string>(sppSettings.bank_account_holder);
  const [settingsNotes, setSettingsNotes] = useState<string>(sppSettings.notes || '');
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setSettingsMonthlyAmount(sppSettings.monthly_amount);
    setSettingsAmount2026(sppSettings.generation_amounts?.['2026'] ?? 170000);
    setSettingsBankName(sppSettings.bank_name);
    setSettingsAccountNumber(sppSettings.bank_account_number);
    setSettingsAccountHolder(sppSettings.bank_account_holder);
    setSettingsNotes(sppSettings.notes || '');
  }, [sppSettings]);

  // Matriks Month/Year Filter
  const [matriksMonth, setMatriksMonth] = useState<number>(effectiveTime.getMonth() + 1);
  const [matriksYear, setMatriksYear] = useState<number>(effectiveTime.getFullYear());
  const [matriksGroupFilter, setMatriksGroupFilter] = useState<string>('all');
  const [copiedWaStudentId, setCopiedWaStudentId] = useState<string | null>(null);

  // Active students only
  const santriList = profiles.filter((p) => p.role === 'santri' && p.is_active);

  // Group list for filtering
  const kamarGroups = Array.from(new Set(santriList.map((s) => s.group_name).filter(Boolean))) as string[];

  // Format currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Metrics for Current Month
  const currentMonthNum = effectiveTime.getMonth() + 1;
  const currentYearNum = effectiveTime.getFullYear();

  const totalSppThisMonth = sppPayments
    .filter((p) => p.month === currentMonthNum && p.year === currentYearNum && p.status === 'verified')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const lunasThisMonthCount = santriList.filter((s) => {
    return sppPayments.some(
      (p) => p.student_id === s.id && p.month === currentMonthNum && p.year === currentYearNum && p.status === 'verified'
    );
  }).length;

  const lunasPercentage = santriList.length > 0
    ? Math.round((lunasThisMonthCount / santriList.length) * 100)
    : 0;

  const belumLunasThisMonthCount = Math.max(0, santriList.length - lunasThisMonthCount);

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSppSettings({
      monthly_amount: Number(settingsMonthlyAmount),
      generation_amounts: {
        ...(sppSettings.generation_amounts || {}),
        '2026': Number(settingsAmount2026),
      },
      bank_name: settingsBankName,
      bank_account_number: settingsAccountNumber,
      bank_account_holder: settingsAccountHolder,
      notes: settingsNotes,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  // Handle Review (Accept / Reject)
  const handleApprove = async (paymentId: string) => {
    await reviewSppPayment(paymentId, 'verified');
    setSelectedPayment(null);
  };

  const handleOpenReject = (payment: SppPayment) => {
    setSelectedPayment(payment);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedPayment) return;
    await reviewSppPayment(selectedPayment.id, 'rejected', rejectReason || 'Bukti transfer tidak valid');
    setIsRejectModalOpen(false);
    setSelectedPayment(null);
  };

  // Handle Manual Cash SPP
  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashStudentId) return;

    const res = await addManualSppPayment({
      studentId: cashStudentId,
      month: cashMonth,
      year: cashYear,
      amount: cashAmount,
      paymentDate: getWibDateStr(effectiveTime),
      notes: cashNotes,
    });

    if (res.success) {
      setCashSuccess(res.message);
      setTimeout(() => {
        setIsCashModalOpen(false);
        setCashSuccess('');
        setCashNotes('');
      }, 1500);
    }
  };

  // Copy WhatsApp Reminder for Student
  const handleCopyWaReminder = (student: typeof santriList[0]) => {
    const monthName = MONTH_NAMES[matriksMonth - 1];
    const studentAmount = getSppAmountForStudent(student, sppSettings);
    const angkatanInfo = student.generation ? ` - Angkatan ${student.generation}` : '';
    const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYth. Wali Santri dari ananda *${student.full_name}* (${student.student_number || 'Santri'} - ${student.group_name || 'Nurul Falah'}${angkatanInfo}).\n\nKami menginformasikan bahwa tagihan SPP bulanan untuk bulan *${monthName} ${matriksYear}* sebesar *${formatRupiah(studentAmount)}* dapat ditransfer melalui:\n\nBank: *${sppSettings.bank_name}*\nNo Rekening: *${sppSettings.bank_account_number}*\na.n. *${sppSettings.bank_account_holder}*\n\nSetelah transfer, mohon untuk mengunggah bukti pembayaran langsung melalui tautan portal santri berikut:\n👉 https://www.absenptl.web.id/santri/spp\natau konfirmasi langsung ke Musyrif. Syukron Katsiran atas perhatian dan kerjasamanya.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.\n*Pengasuhan Pondok Pesantren Nurul Falah Ketintang*`;

    navigator.clipboard.writeText(text);
    setCopiedWaStudentId(student.id);
    setTimeout(() => setCopiedWaStudentId(null), 2500);
  };

  return (
    <div className="mesh-bg min-h-[calc(100vh-8rem)] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Top Header / Breadcrumb ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/musyrif"
              className="inline-flex items-center gap-1.5 text-xs text-[#0D7B5F] dark:text-[#D4A24C] hover:underline font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard Musyrif</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
              <span>Data &amp; Pembayaran SPP Santri</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0D7B5F]/15 text-[#0D7B5F] dark:text-[#D4A24C] border border-[#0D7B5F]/30">
                Musyrif
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Verifikasi upload bukti transfer, kelola data pembayaran santri, dan atur rekening SPP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setCashMonth(currentMonthNum);
                setCashYear(currentYearNum);
                const firstStudent = santriList[0];
                if (firstStudent) {
                  setCashStudentId(firstStudent.id);
                  setCashAmount(getSppAmountForStudent(firstStudent, sppSettings));
                } else {
                  setCashAmount(sppSettings.monthly_amount);
                }
                setIsCashModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Catat Bayar Tunai (Cash)</span>
            </button>
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total SPP Bulan Ini */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A24C]/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs text-[#D4A24C] font-semibold mb-2">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  SPP Terkumpul Bulan Ini
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                  {MONTH_NAMES[currentMonthNum - 1]}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
                {formatRupiah(totalSppThisMonth)}
              </div>
              <p className="text-[11px] text-emerald-100/70">
                Total pembayaran terverifikasi
              </p>
            </div>
          </div>

          {/* Card 2: Santri Sudah Lunas */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0F1E18] border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Santri Sudah Lunas
                </span>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                  {lunasPercentage}%
                </span>
              </div>
              <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-1">
                {lunasThisMonthCount}{' '}
                <span className="text-sm font-semibold text-stone-500">/ {santriList.length} Santri</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Bulan {MONTH_NAMES[currentMonthNum - 1]} {currentYearNum}
              </p>
            </div>
          </div>

          {/* Card 3: Santri Belum Lunas */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0F1E18] border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Santri Belum Lunas
                </span>
              </div>
              <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-1">
                {belumLunasThisMonthCount}{' '}
                <span className="text-sm font-semibold text-stone-500">Santri</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Belum bayar / ditolak
              </p>
            </div>
          </div>

          {/* Card 4: Antrean Verifikasi */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0F1E18] border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Antrean Verifikasi
                </span>
                {pendingPayments.length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-1">
                {pendingPayments.length}{' '}
                <span className="text-sm font-semibold text-stone-500">Bukti Transfer</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Klik untuk memeriksa bukti transfer santri
              </p>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('verifikasi')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap relative ${
              activeTab === 'verifikasi'
                ? 'border-[#0D7B5F] text-[#0D7B5F] dark:text-[#D4A24C] dark:border-[#D4A24C] bg-white/70 dark:bg-[#0F1E18]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Verifikasi Bukti SPP</span>
            {pendingPayments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                {pendingPayments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('matriks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'matriks'
                ? 'border-[#0D7B5F] text-[#0D7B5F] dark:text-[#D4A24C] dark:border-[#D4A24C] bg-white/70 dark:bg-[#0F1E18]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data &amp; Status SPP Santri</span>
          </button>

          <button
            onClick={() => setActiveTab('pengaturan')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'pengaturan'
                ? 'border-[#0D7B5F] text-[#0D7B5F] dark:text-[#D4A24C] dark:border-[#D4A24C] bg-white/70 dark:bg-[#0F1E18]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Tarif &amp; Rekening SPP</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: VERIFIKASI BUKTI SPP
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'verifikasi' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Antrean Konfirmasi Pembayaran SPP Santri</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Periksa keaslian bukti transfer dan cocokkan nominal sebelum menyetujui.
                </p>
              </div>

              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full">
                {pendingPayments.length} Menunggu Konfirmasi
              </span>
            </div>

            {sppPayments.length === 0 ? (
              <div className="text-center py-16 text-stone-400 text-xs bg-white dark:bg-[#0F1E18] rounded-2xl border border-stone-200 dark:border-[#1C3A2E]">
                Belum ada data pengajuan pembayaran SPP.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sppPayments.map((payment) => {
                  const monthName = MONTH_NAMES[payment.month - 1];

                  return (
                    <div
                      key={payment.id}
                      className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                        payment.status === 'pending'
                          ? 'bg-white dark:bg-[#0F1E18] border-amber-300 dark:border-amber-800 shadow-md ring-1 ring-amber-400/30'
                          : payment.status === 'verified'
                          ? 'bg-white/80 dark:bg-[#0F1E18]/80 border-emerald-200 dark:border-emerald-900 opacity-90'
                          : 'bg-white/60 dark:bg-[#0F1E18]/60 border-rose-200 dark:border-rose-900 opacity-75'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                            SPP {monthName} {payment.year}
                          </span>

                          {payment.status === 'pending' && (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Menunggu
                            </span>
                          )}
                          {payment.status === 'verified' && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Disetujui
                            </span>
                          )}
                          {payment.status === 'rejected' && (
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Ditolak
                            </span>
                          )}
                        </div>

                        {/* Student Details */}
                        <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#142820] space-y-1 text-xs">
                          <div className="font-bold text-stone-900 dark:text-stone-100">
                            {payment.student_name}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400">
                            {payment.student_number || '-'} • {payment.group_name || 'Asrama'}
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-stone-200/50 dark:border-stone-800">
                            <span className="text-stone-500">Nominal Transfer:</span>
                            <span className="font-mono font-extrabold text-[#0D7B5F] dark:text-[#D4A24C]">
                              {formatRupiah(payment.amount)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-stone-500">Tanggal Bayar:</span>
                            <span className="text-stone-700 dark:text-stone-300 font-medium">
                              {payment.payment_date}
                            </span>
                          </div>
                        </div>

                        {/* Struk Image Preview */}
                        {payment.proof_image_url ? (
                          <div
                            onClick={() => setSelectedPayment(payment)}
                            className="relative h-28 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 cursor-pointer group bg-black/5"
                          >
                            <img
                              src={payment.proof_image_url}
                              alt="Bukti Transfer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <Eye className="w-4 h-4" />
                              <span>Perbesar</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 text-center text-xs text-stone-400 bg-stone-50 dark:bg-[#142820] rounded-xl italic">
                            Pembayaran Tunai (Tanpa Struk Digital)
                          </div>
                        )}

                        {payment.notes && (
                          <div className="text-[11px] text-stone-500 bg-stone-50 dark:bg-[#142820] p-2 rounded-lg italic">
                            &quot;{payment.notes}&quot;
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 mt-3 flex items-center gap-2">
                        {payment.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleOpenReject(payment)}
                              className="flex-1 py-1.5 px-3 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold transition-colors"
                            >
                              Tolak
                            </button>
                            <button
                              onClick={() => handleApprove(payment.id)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white text-xs font-bold shadow-sm transition-all"
                            >
                              ACC / Sah
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="w-full py-1.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50"
                          >
                            Lihat Rincian
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: DATA & MATRIKS STATUS SPP SEMUA SANTRI
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'matriks' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-[#0F1E18] rounded-2xl p-5 sm:p-6 border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#0D7B5F] dark:text-[#D4A24C]" />
                    <span>Data Pembayaran Santri — {MONTH_NAMES[matriksMonth - 1]} {matriksYear}</span>
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Cek santri yang telah lunas, menunggu verifikasi, atau belum bayar pada bulan ini.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={matriksMonth}
                    onChange={(e) => setMatriksMonth(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <select
                    value={matriksYear}
                    onChange={(e) => setMatriksYear(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>

                  <select
                    value={matriksGroupFilter}
                    onChange={(e) => setMatriksGroupFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-semibold text-stone-700 dark:text-stone-200"
                  >
                    <option value="all">Semua Kamar</option>
                    {kamarGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setCashMonth(matriksMonth);
                      setCashYear(matriksYear);
                      const firstStudent = santriList[0];
                      if (firstStudent) {
                        setCashStudentId(firstStudent.id);
                        setCashAmount(getSppAmountForStudent(firstStudent, sppSettings));
                      } else {
                        setCashAmount(sppSettings.monthly_amount);
                      }
                      setIsCashModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0D7B5F] text-white text-xs font-bold hover:bg-[#0b6b52] transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Catat Bayar Tunai</span>
                  </button>
                </div>
              </div>

              {/* Rekap Singkat Bulan Terpilih */}
              {(() => {
                const filteredSantri = santriList.filter((s) =>
                  matriksGroupFilter === 'all' ? true : s.group_name === matriksGroupFilter
                );

                const lunasCount = filteredSantri.filter((s) => {
                  const p = sppPayments.find(
                    (pay) => pay.student_id === s.id && pay.month === matriksMonth && pay.year === matriksYear
                  );
                  return p?.status === 'verified';
                }).length;

                const pendingCount = filteredSantri.filter((s) => {
                  const p = sppPayments.find(
                    (pay) => pay.student_id === s.id && pay.month === matriksMonth && pay.year === matriksYear
                  );
                  return p?.status === 'pending';
                }).length;

                const belumBayarCount = filteredSantri.length - lunasCount - pendingCount;

                return (
                  <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-stone-50 dark:bg-[#142820] text-center">
                    <div>
                      <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {lunasCount}
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase font-semibold">
                        Lunas
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                        {pendingCount}
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase font-semibold">
                        Menunggu Verifikasi
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                        {belumBayarCount}
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase font-semibold">
                        Belum Bayar
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tabel Status Santri */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Santri</th>
                      <th className="py-2.5 px-3">NIS</th>
                      <th className="py-2.5 px-3">Kamar / Kelompok</th>
                      <th className="py-2.5 px-3">Tagihan</th>
                      <th className="py-2.5 px-3 text-center">Status {MONTH_NAMES[matriksMonth - 1]}</th>
                      <th className="py-2.5 px-3 text-right">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
                    {santriList
                      .filter((s) => (matriksGroupFilter === 'all' ? true : s.group_name === matriksGroupFilter))
                      .map((student, idx) => {
                        const payment = sppPayments.find(
                          (p) => p.student_id === student.id && p.month === matriksMonth && p.year === matriksYear
                        );

                        return (
                          <tr
                            key={student.id}
                            className="hover:bg-stone-50/60 dark:hover:bg-[#142820]/40 transition-colors"
                          >
                            <td className="py-3 px-3 text-stone-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{student.full_name}</span>
                                {student.generation && (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    String(student.generation) === '2026'
                                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                                  }`}>
                                    Angk. {student.generation}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-stone-600 dark:text-stone-400 font-mono">
                              {student.student_number || '-'}
                            </td>
                            <td className="py-3 px-3 text-stone-600 dark:text-stone-400">
                              {student.group_name || '-'}
                            </td>
                            <td className="py-3 px-3 font-semibold text-stone-800 dark:text-stone-200 font-mono">
                              {formatRupiah(getSppAmountForStudent(student, sppSettings))}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {payment?.status === 'verified' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Lunas ({payment.payment_date})
                                </span>
                              )}
                              {payment?.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Perlu Verifikasi
                                </span>
                              )}
                              {(!payment || payment.status === 'rejected') && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  Belum Bayar
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {(!payment || payment.status === 'rejected') && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setCashStudentId(student.id);
                                        setCashMonth(matriksMonth);
                                        setCashYear(matriksYear);
                                        setCashAmount(getSppAmountForStudent(student, sppSettings));
                                        setIsCashModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#0D7B5F] text-white hover:bg-[#0b6b52] transition-colors"
                                    >
                                      Terima Tunai
                                    </button>

                                    <button
                                      onClick={() => handleCopyWaReminder(student)}
                                      title="Salin Pesan Pengingat WhatsApp"
                                      className="p-1 rounded-md border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-emerald-600 transition-colors"
                                    >
                                      {copiedWaStudentId === student.id ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </>
                                )}

                                {payment && (
                                  <button
                                    onClick={() => setSelectedPayment(payment)}
                                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                                  >
                                    Lihat Bukti
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: PENGATURAN TARIF & REKENING SPP
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'pengaturan' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-[#0F1E18] rounded-2xl p-6 border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#0D7B5F] dark:text-[#D4A24C]" />
                  <span>Pengaturan Tarif &amp; Rekening SPP</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Data rekening ini akan tampil otomatis di dashboard masing-masing santri saat melakukan pembayaran.
                </p>
              </div>

              {settingsSaved && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pengaturan tarif &amp; rekening SPP berhasil diperbarui!</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Tarif SPP Standar / Umum (Rp) *
                    </label>
                    <input
                      type="number"
                      value={settingsMonthlyAmount}
                      onChange={(e) => setSettingsMonthlyAmount(Number(e.target.value))}
                      placeholder="Contoh: 120000"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                      required
                    />
                    <p className="text-[10px] text-stone-400 mt-1">Tarif umum santri angkatan sebelum 2026.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#D4A24C] mb-1 flex items-center justify-between">
                      <span>Tarif Khusus Angkatan 2026 (Rp) *</span>
                      <span className="text-[10px] bg-[#D4A24C]/15 text-[#D4A24C] px-1.5 py-0.5 rounded font-bold">Kustom</span>
                    </label>
                    <input
                      type="number"
                      value={settingsAmount2026}
                      onChange={(e) => setSettingsAmount2026(Number(e.target.value))}
                      placeholder="170000"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-[#1f2b20] text-xs font-bold text-amber-900 dark:text-amber-300 focus:outline-none focus:ring-2 focus:ring-[#D4A24C]"
                      required
                    />
                    <p className="text-[10px] text-stone-400 mt-1">Khusus santri baru angkatan 2026.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Nama Bank Tujuan *
                    </label>
                    <input
                      type="text"
                      value={settingsBankName}
                      onChange={(e) => setSettingsBankName(e.target.value)}
                      placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Nomor Rekening *
                    </label>
                    <input
                      type="text"
                      value={settingsAccountNumber}
                      onChange={(e) => setSettingsAccountNumber(e.target.value)}
                      placeholder="Contoh: 7128938475"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Atas Nama Pemilik Rekening *
                  </label>
                  <input
                    type="text"
                    value={settingsAccountHolder}
                    onChange={(e) => setSettingsAccountHolder(e.target.value)}
                    placeholder="Contoh: Pondok Pesantren Nurul Falah"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Petunjuk / Format Berita Transfer untuk Santri
                  </label>
                  <textarea
                    rows={3}
                    value={settingsNotes}
                    onChange={(e) => setSettingsNotes(e.target.value)}
                    placeholder="Contoh: Harap cantumkan berita transfer: SPP [Bulan] [Nama Santri] [NIS]."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                  />
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL DETAIL / ZOOM BUKTI TRANSFER
         ══════════════════════════════════════════════════════════════ */}
      {selectedPayment && !isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0F1E18] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-[#1C3A2E] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Bukti Pembayaran SPP — {selectedPayment.student_name}
                </h3>
                <p className="text-xs text-stone-500">
                  Periode: SPP {MONTH_NAMES[selectedPayment.month - 1]} {selectedPayment.year} • {formatRupiah(selectedPayment.amount)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedPayment.proof_image_url ? (
              <div className="rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={selectedPayment.proof_image_url}
                  alt="Bukti Struk"
                  className="w-full max-h-[55vh] object-contain"
                />
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-stone-400 italic bg-stone-50 dark:bg-[#152922] rounded-xl">
                Pembayaran tunai langsung kantor pesantren.
              </div>
            )}

            {selectedPayment.notes && (
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#152922] text-xs text-stone-700 dark:text-stone-300">
                <span className="font-semibold text-stone-500">Catatan Santri:</span> &quot;{selectedPayment.notes}&quot;
              </div>
            )}

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                Tgl Bayar: <span className="font-semibold text-stone-800 dark:text-stone-200">{selectedPayment.payment_date}</span>
              </span>

              {selectedPayment.status === 'pending' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenReject(selectedPayment)}
                    className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPayment.id)}
                    className="px-4 py-2 rounded-xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white text-xs font-bold shadow-md"
                  >
                    Setujui / Sah
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL ALASAN PENOLAKAN SPP
         ══════════════════════════════════════════════════════════════ */}
      {isRejectModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0F1E18] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-[#1C3A2E] space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Tolak Bukti SPP
              </h3>
            </div>

            <p className="text-xs text-stone-500">
              Tuliskan alasan penolakan agar santri dapat mengunggah bukti pembayaran yang benar.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Nominal kurang dari tarif SPP atau struk transfer buram tidak terbaca."
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL CATAT SPP TUNAI (OFFLINE DI KANTOR)
         ══════════════════════════════════════════════════════════════ */}
      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0F1E18] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-[#1C3A2E] space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0D7B5F]" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Catat Pembayaran SPP Tunai
                </h3>
              </div>
              <button
                onClick={() => setIsCashModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cashSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{cashSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCashSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Pilih Santri *
                </label>
                <select
                  value={cashStudentId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setCashStudentId(id);
                    const selected = santriList.find((s) => s.id === id);
                    if (selected) {
                      setCashAmount(getSppAmountForStudent(selected, sppSettings));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                  required
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.student_number || 'Santri'} - {s.group_name || 'Nurul Falah'}{s.generation ? ` • Angk. ${s.generation}` : ''} • {formatRupiah(getSppAmountForStudent(s, sppSettings))})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Bulan *
                  </label>
                  <select
                    value={cashMonth}
                    onChange={(e) => setCashMonth(Number(e.target.value))}
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
                    Tahun *
                  </label>
                  <select
                    value={cashYear}
                    onChange={(e) => setCashYear(Number(e.target.value))}
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

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nominal Pembayaran (Rp) *
                </label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Catatan / Tanda Terima (Opsional)
                </label>
                <input
                  type="text"
                  value={cashNotes}
                  onChange={(e) => setCashNotes(e.target.value)}
                  placeholder="Contoh: Diterima langsung di kantor musyrif lunas"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCashModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white text-xs font-bold shadow-md transition-all"
                >
                  Simpan Pembayaran Tunai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
