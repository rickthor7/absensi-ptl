'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { FINANCIAL_CATEGORIES } from '@/lib/constants';
import { SppPayment, FinancialTransaction } from '@/types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  Settings,
  Users,
  Search,
  Filter,
  Trash2,
  Eye,
  Check,
  X,
  CreditCard,
  Building2,
  Save,
  MessageSquare,
  Sparkles,
  Download,
  Calendar,
  DollarSign,
  ArrowLeft,
  FileSpreadsheet,
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
    financialTransactions,
    updateSppSettings,
    reviewSppPayment,
    addManualSppPayment,
    addFinancialTransaction,
    deleteFinancialTransaction,
    effectiveTime,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'ringkasan' | 'verifikasi' | 'matriks' | 'pengaturan'>('ringkasan');

  // Filter Transactions State
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');

  // Modal New Transaction State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState<string>(FINANCIAL_CATEGORIES.expense[0]);
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDate, setTxDate] = useState<string>(effectiveTime.toISOString().split('T')[0]);
  const [txDesc, setTxDesc] = useState('');
  const [txProofImage, setTxProofImage] = useState<string>('');
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txError, setTxError] = useState('');

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
  const [settingsBankName, setSettingsBankName] = useState<string>(sppSettings.bank_name);
  const [settingsAccountNumber, setSettingsAccountNumber] = useState<string>(sppSettings.bank_account_number);
  const [settingsAccountHolder, setSettingsAccountHolder] = useState<string>(sppSettings.bank_account_holder);
  const [settingsNotes, setSettingsNotes] = useState<string>(sppSettings.notes || '');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Matriks Month/Year Filter
  const [matriksMonth, setMatriksMonth] = useState<number>(effectiveTime.getMonth() + 1);
  const [matriksYear, setMatriksYear] = useState<number>(effectiveTime.getFullYear());
  const [matriksGroupFilter, setMatriksGroupFilter] = useState<string>('all');
  const [copiedWaStudentId, setCopiedWaStudentId] = useState<string | null>(null);

  // Active students only
  const santriList = profiles.filter((p) => p.role === 'santri' && p.is_active);

  // Group list for filtering
  const kamarGroups = Array.from(new Set(santriList.map((s) => s.group_name).filter(Boolean))) as string[];

  // Pending SPP count
  const pendingPayments = sppPayments.filter((p) => p.status === 'pending');

  // Calculations for Treasury / Arus Kas
  const totalIncome = financialTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = financialTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const currentBalance = totalIncome - totalExpense;

  // Format currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSppSettings({
      monthly_amount: Number(settingsMonthlyAmount),
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

  // Handle Add Transaction Submit
  const handleAddTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || txAmount <= 0) {
      setTxError('Harap lengkapi judul transaksi dan nominal yang valid (> 0).');
      return;
    }

    setTxSubmitting(true);
    setTxError('');

    try {
      await addFinancialTransaction({
        type: txType,
        category: txCategory,
        title: txTitle.trim(),
        amount: Number(txAmount),
        transaction_date: txDate,
        description: txDesc.trim(),
        proof_image_url: txProofImage,
      });

      setIsTxModalOpen(false);
      setTxTitle('');
      setTxAmount(0);
      setTxDesc('');
      setTxProofImage('');
    } catch (err: any) {
      setTxError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setTxSubmitting(false);
    }
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
      paymentDate: effectiveTime.toISOString().split('T')[0],
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
    const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYth. Wali Santri dari ananda *${student.full_name}* (${student.student_number || 'Santri'} - ${student.group_name || 'Nurul Falah'}).\n\nKami menginformasikan bahwa tagihan SPP bulanan untuk bulan *${monthName} ${matriksYear}* sebesar *${formatRupiah(sppSettings.monthly_amount)}* dapat ditransfer melalui:\n\nBank: *${sppSettings.bank_name}*\nNo Rekening: *${sppSettings.bank_account_number}*\na.n. *${sppSettings.bank_account_holder}*\n\nSetelah transfer, mohon untuk mengunggah bukti pembayaran langsung melalui tautan portal santri berikut:\n👉 https://www.absenptl.web.id/santri/spp\natau konfirmasi langsung ke Musyrif. Syukron Katsiran atas perhatian dan kerjasamanya.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.\n*Pengasuhan Pondok Pesantren Nurul Falah Ketintang*`;

    navigator.clipboard.writeText(text);
    setCopiedWaStudentId(student.id);
    setTimeout(() => setCopiedWaStudentId(null), 2500);
  };

  // Filtered Financial Transactions
  const filteredTransactions = financialTransactions.filter((t) => {
    if (txTypeFilter !== 'all' && t.type !== txTypeFilter) return false;
    if (txCategoryFilter !== 'all' && t.category !== txCategoryFilter) return false;
    if (txSearchQuery) {
      const q = txSearchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Calculate expense categories breakdown
  const expenseByCategory: Record<string, number> = {};
  financialTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Number(t.amount);
    });

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
              <span>Keuangan & SPP Pesantren</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0D7B5F]/15 text-[#0D7B5F] dark:text-[#D4A24C] border border-[#0D7B5F]/30">
                Musyrif
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Kelola pembayaran SPP santri, verifikasi bukti transfer, pencatatan kas keluar-masuk, dan transparansi publik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/transparansi"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#152922] border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 hover:border-[#0D7B5F] transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" />
              <span>Lihat Halaman Publik</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => {
                setTxType('expense');
                setTxCategory(FINANCIAL_CATEGORIES.expense[0]);
                setIsTxModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Catat Pengeluaran</span>
            </button>

            <button
              onClick={() => {
                setTxType('income');
                setTxCategory(FINANCIAL_CATEGORIES.income[1]);
                setIsTxModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Catat Pemasukan / Infaq</span>
            </button>
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Saldo Kas */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A24C]/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs text-[#D4A24C] font-semibold mb-2">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  Saldo Kas Riil
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                  Tersedia
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
                {formatRupiah(currentBalance)}
              </div>
              <p className="text-[11px] text-emerald-100/70">
                Net akumulasi kas kasir pondok
              </p>
            </div>
          </div>

          {/* Card 2: Total Pemasukan */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0F1E18] border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4" />
                  Total Kas Masuk
                </span>
              </div>
              <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-1">
                {formatRupiah(totalIncome)}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                SPP terverifikasi, infaq & donasi
              </p>
            </div>
          </div>

          {/* Card 3: Total Pengeluaran */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0F1E18] border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4" />
                  Total Pengeluaran
                </span>
              </div>
              <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-1">
                {formatRupiah(totalExpense)}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Logistik dapur, listrik & sarana
              </p>
            </div>
          </div>

          {/* Card 4: Antrean Verifikasi SPP */}
          <div
            onClick={() => setActiveTab('verifikasi')}
            className={`rounded-2xl p-5 border cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${
              pendingPayments.length > 0
                ? 'bg-amber-500/10 border-amber-300 dark:border-amber-800'
                : 'bg-white dark:bg-[#0F1E18] border-stone-200/80 dark:border-[#1C3A2E]'
            }`}
          >
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
                <span className="text-sm font-semibold text-stone-500">Santri</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Klik untuk memeriksa bukti transfer
              </p>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ringkasan'
                ? 'border-[#0D7B5F] text-[#0D7B5F] dark:text-[#D4A24C] dark:border-[#D4A24C] bg-white/70 dark:bg-[#0F1E18]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Pencatatan Kas & Pengeluaran</span>
          </button>

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
            <span>Status SPP Santri</span>
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
            <span>Tarif & Rekening SPP</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: RINGKASAN KAS & PENCATATAN PENGELUARAN
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6">

            {/* Breakdown Pengeluaran per Kategori */}
            <div className="bg-white dark:bg-[#0F1E18] rounded-2xl p-5 sm:p-6 border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0D7B5F] dark:text-[#D4A24C]" />
                    <span>Transparansi Alokasi Dana (Dananya Digunakan Apa Saja)</span>
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Distribusi seluruh pengeluaran kas pesantren berdasarkan sektor peruntukan dana.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {FINANCIAL_CATEGORIES.expense.map((cat) => {
                  const amount = expenseByCategory[cat] || 0;
                  const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;

                  return (
                    <div
                      key={cat}
                      className="p-3.5 rounded-xl border border-stone-200/70 dark:border-stone-800 bg-stone-50/50 dark:bg-[#13251e]/40 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-800 dark:text-stone-200 truncate pr-2">
                          {cat}
                        </span>
                        <span className="font-bold text-stone-900 dark:text-stone-100 shrink-0">
                          {formatRupiah(amount)}
                        </span>
                      </div>

                      <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#0D7B5F] to-[#D4A24C] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="text-[10px] text-stone-500 text-right font-medium">
                        {percentage}% dari total pengeluaran
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabel Transaksi Kas */}
            <div className="bg-white dark:bg-[#0F1E18] rounded-2xl p-5 sm:p-6 border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Buku Kas Umum (Pemasukan & Pengeluaran)
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Catatan seluruh mutasi kas riil pondok yang tersinkronisasi.
                  </p>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Cari transaksi..."
                      value={txSearchQuery}
                      onChange={(e) => setTxSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#0D7B5F]"
                    />
                  </div>

                  <select
                    value={txTypeFilter}
                    onChange={(e: any) => setTxTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-semibold text-stone-700 dark:text-stone-200"
                  >
                    <option value="all">Semua Tipe</option>
                    <option value="income">Pemasukan (+)</option>
                    <option value="expense">Pengeluaran (-)</option>
                  </select>

                  <select
                    value={txCategoryFilter}
                    onChange={(e) => setTxCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-semibold text-stone-700 dark:text-stone-200 max-w-[150px] truncate"
                  >
                    <option value="all">Semua Kategori</option>
                    {FINANCIAL_CATEGORIES.expense.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {FINANCIAL_CATEGORIES.income.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs">
                  Tidak ditemukan catatan transaksi yang sesuai filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Tipe</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3">Uraian / Keperluan</th>
                        <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                        <th className="py-2.5 px-3">Pencatat</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
                      {filteredTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-stone-50/60 dark:hover:bg-[#142820]/40 transition-colors"
                        >
                          <td className="py-3 px-3 font-medium text-stone-600 dark:text-stone-400 whitespace-nowrap">
                            {tx.transaction_date}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {tx.type === 'income' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                <ArrowUpRight className="w-3 h-3" />
                                Masuk
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                                <ArrowDownLeft className="w-3 h-3" />
                                Keluar
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-stone-700 dark:text-stone-300 font-semibold whitespace-nowrap">
                            {tx.category}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-stone-900 dark:text-stone-100">
                              {tx.title}
                            </div>
                            {tx.description && (
                              <div className="text-[11px] text-stone-500 truncate max-w-xs">
                                {tx.description}
                              </div>
                            )}
                          </td>
                          <td className={`py-3 px-3 text-right font-mono font-extrabold whitespace-nowrap ${
                            tx.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-stone-500 dark:text-stone-400 whitespace-nowrap">
                            {tx.created_by_name?.split(',')[0] || 'Musyrif'}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus transaksi "${tx.title}"?`)) {
                                  deleteFinancialTransaction(tx.id);
                                }
                              }}
                              title="Hapus Transaksi"
                              className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: VERIFIKASI BUKTI SPP
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
                            className="relative rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden bg-black/5 cursor-pointer group max-h-40 flex items-center justify-center"
                          >
                            <img
                              src={payment.proof_image_url}
                              alt="Bukti Transfer"
                              className="w-full max-h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                              <Eye className="w-4 h-4" />
                              <span>Klik Perbesar</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 text-center text-xs text-stone-400 italic bg-stone-50 dark:bg-[#142820] rounded-xl">
                            Pembayaran tunai langsung kantor
                          </div>
                        )}

                        {payment.notes && (
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 italic">
                            &quot;{payment.notes}&quot;
                          </p>
                        )}

                        {payment.status === 'rejected' && payment.rejection_reason && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                            Alasan: {payment.rejection_reason}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons for Pending */}
                      {payment.status === 'pending' && (
                        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleOpenReject(payment)}
                            className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => handleApprove(payment.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white text-xs font-bold shadow-sm transition-all"
                          >
                            Setujui
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: MATRIKS STATUS SPP SEMUA SANTRI
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'matriks' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-[#0F1E18] rounded-2xl p-5 sm:p-6 border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#0D7B5F] dark:text-[#D4A24C]" />
                    <span>Matriks Pembayaran Santri — {MONTH_NAMES[matriksMonth - 1]} {matriksYear}</span>
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
                      setCashAmount(sppSettings.monthly_amount);
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
                              {student.full_name}
                            </td>
                            <td className="py-3 px-3 text-stone-600 dark:text-stone-400 font-mono">
                              {student.student_number || '-'}
                            </td>
                            <td className="py-3 px-3 text-stone-600 dark:text-stone-400">
                              {student.group_name || '-'}
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
                                        setCashAmount(sppSettings.monthly_amount);
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
            TAB 4: PENGATURAN TARIF & REKENING SPP
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'pengaturan' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-[#0F1E18] rounded-2xl p-6 border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#0D7B5F] dark:text-[#D4A24C]" />
                  <span>Pengaturan Tarif & Rekening SPP</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Ubah besaran iuran bulanan santri (default Rp 120.000) dan tujuan transfer resmi pondok.
                </p>
              </div>

              {settingsSaved && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Tarif dan rekening SPP berhasil diperbarui!</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Biaya SPP Bulanan (Rupiah) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-stone-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={settingsMonthlyAmount}
                      onChange={(e) => setSettingsMonthlyAmount(Number(e.target.value))}
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-sm font-extrabold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                      required
                    />
                  </div>
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Besaran tagihan yang akan tampil otomatis di akun seluruh santri.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Nama Bank Resmi *
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
          MODAL CATAT TRANSAKSI KAS BARU (PENGELUARAN / PEMASUKAN)
         ══════════════════════════════════════════════════════════════ */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0F1E18] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-[#1C3A2E] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#0D7B5F] dark:text-[#D4A24C]" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {txType === 'expense' ? 'Catat Pengeluaran Kas' : 'Catat Pemasukan Kas / Donasi'}
                </h3>
              </div>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {txError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{txError}</span>
              </div>
            )}

            <form onSubmit={handleAddTxSubmit} className="space-y-3.5">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-stone-100 dark:bg-[#152922]">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setTxCategory(FINANCIAL_CATEGORIES.expense[0]);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    txType === 'expense'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Pengeluaran (-)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setTxCategory(FINANCIAL_CATEGORIES.income[1]);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    txType === 'income'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Pemasukan (+)
                </button>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Kategori Transaksi *
                </label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                >
                  {(txType === 'expense'
                    ? FINANCIAL_CATEGORIES.expense
                    : FINANCIAL_CATEGORIES.income
                  ).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Judul Transaksi */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Keperluan / Judul Transaksi *
                </label>
                <input
                  type="text"
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  placeholder={
                    txType === 'expense'
                      ? 'Contoh: Beras Ramos 50kg & Minyak Goreng Dapur'
                      : 'Contoh: Infaq Jumat dari H. Ahmad Surabaya'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                  required
                />
              </div>

              {/* Nominal & Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Nominal (Rp) *
                  </label>
                  <input
                    type="number"
                    value={txAmount || ''}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-extrabold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Tanggal Transaksi *
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                    required
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Keterangan / Rincian Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="Keterangan peruntukan dana atau nomor kuitansi..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={txSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {txSubmitting ? 'Menyimpan...' : 'Simpan Transaksi Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                Tgl Transfer: <span className="font-semibold text-stone-800 dark:text-stone-200">{selectedPayment.payment_date}</span>
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
                    Setujui & Catat Kas
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
                <CreditCard className="w-5 h-5 text-[#0D7B5F] dark:text-[#D4A24C]" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Catat SPP Tunai Langsung
                </h3>
              </div>
              <button
                onClick={() => setIsCashModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cashSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {cashSuccess}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCashSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Pilih Santri *
                  </label>
                  <select
                    value={cashStudentId}
                    onChange={(e) => setCashStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                    required
                  >
                    <option value="">-- Pilih Santri --</option>
                    {santriList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.student_number || 'Santri'} - {s.group_name || 'Asrama'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Bulan SPP
                    </label>
                    <select
                      value={cashMonth}
                      onChange={(e) => setCashMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100"
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
                      value={cashYear}
                      onChange={(e) => setCashYear(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100"
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
                    Nominal Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#0D7B5F]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Catatan Kasir
                  </label>
                  <input
                    type="text"
                    value={cashNotes}
                    onChange={(e) => setCashNotes(e.target.value)}
                    placeholder="Contoh: Diterima tunai oleh Ustadz Mansur di kantor"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsCashModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0D7B5F] hover:bg-[#0b6b52] text-white text-xs font-bold shadow-md"
                  >
                    Catat Lunas & Masuk Kas
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
