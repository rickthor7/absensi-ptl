'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { FINANCIAL_CATEGORIES } from '@/lib/constants';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  Copy,
  Check,
  Receipt,
  Heart,
  ExternalLink,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { formatIndonesianDate, getEstimatedHijriDate } from '@/lib/schedule';

export default function TransparansiKeuanganPublikPage() {
  const {
    financialTransactions,
    sppSettings,
    effectiveTime,
  } = useStore();

  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Calculations
  const totalIncome = financialTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = financialTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const currentBalance = totalIncome - totalExpense;

  // Expense breakdown per category
  const expenseByCategory: Record<string, number> = {};
  financialTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Number(t.amount);
    });

  // Filtered transactions
  const filteredList = financialTransactions.filter((tx) => {
    if (activeTypeTab !== 'all' && tx.type !== activeTypeTab) return false;
    if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchDesc = tx.description?.toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Format currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopyAccount = () => {
    if (sppSettings.bank_account_number) {
      navigator.clipboard.writeText(sppSettings.bank_account_number);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
    }
  };

  return (
    <div className="mesh-bg min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Top Navigation / Back to Home ── */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0D7B5F] dark:text-[#D4A24C] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Utama</span>
          </Link>

          <div className="text-[11px] text-stone-500 font-medium">
            {getEstimatedHijriDate(effectiveTime)} • {formatIndonesianDate(effectiveTime)}
          </div>
        </div>

        {/* ── Hero Banner Transparansi Publik ── */}
        <div className="relative overflow-hidden rounded-3xl animated-gradient bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] text-white shadow-2xl shadow-emerald-950/30 p-6 sm:p-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A24C]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#0D7B5F]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold text-[#D4A24C] border border-[#D4A24C]/30 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transparansi Publik & Akuntabilitas Terbuka</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Laporan Keuangan Terbuka<br />
              <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #D4A24C, #F0D78C, #D4A24C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Pondok Pesantren Nurul Falah
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-2xl">
              Sebagai wujud amanah kepada seluruh wali santri, jamaah, donatur, dan masyarakat, seluruh mutasi pemasukan iuran SPP serta peruntukan dana operasional dipublikasikan secara transparan, akurat, dan dapat diakses oleh publik setiap saat.
            </p>
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl p-6 bg-white dark:bg-[#0F1E18] border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#0D7B5F] dark:text-[#D4A24C]" />
                Saldo Kas Tersedia
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                Amanah
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              {formatRupiah(currentBalance)}
            </div>
            <p className="text-[11px] text-stone-500">
              Saldo kas operasional aktif saat ini
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-white dark:bg-[#0F1E18] border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                Total Dana Masuk
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              {formatRupiah(totalIncome)}
            </div>
            <p className="text-[11px] text-stone-500">
              Akumulasi iuran SPP terverifikasi & infaq
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-white dark:bg-[#0F1E18] border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
              <span className="flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4" />
                Total Dana Tersalurkan
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              {formatRupiah(totalExpense)}
            </div>
            <p className="text-[11px] text-stone-500">
              Operasional, konsumsi santri & sarana asrama
            </p>
          </div>
        </div>

        {/* ── Transparansi Alokasi: Dananya Digunakan Apa Saja? ── */}
        <div className="bg-white dark:bg-[#0F1E18] rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4A24C]" />
                <span>Dananya Digunakan Untuk Apa Saja?</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Rincian transparansi proporsi pengeluaran dana pesantren per sektor kebutuhan santri.
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-500 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full self-start sm:self-auto">
              {FINANCIAL_CATEGORIES.expense.length} Sektor Utama
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FINANCIAL_CATEGORIES.expense.map((category) => {
              const amount = expenseByCategory[category] || 0;
              const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;

              return (
                <div
                  key={category}
                  className="p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-[#13251e]/40 space-y-2.5 transition-all hover:shadow-md hover:border-[#0D7B5F]/40"
                >
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200 min-h-[32px] line-clamp-2">
                    {category}
                  </div>

                  <div className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                    {formatRupiah(amount)}
                  </div>

                  <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0D7B5F] via-[#0b8668] to-[#D4A24C] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-stone-500 font-semibold pt-1">
                    <span>Proporsi</span>
                    <span className="text-[#0D7B5F] dark:text-[#D4A24C] font-bold">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Buku Mutasi Pengeluaran & Pemasukan Terbuka ── */}
        <div className="bg-white dark:bg-[#0F1E18] rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-[#1C3A2E] shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#0D7B5F] dark:text-[#D4A24C]" />
                <span>Rincian Riwayat Transaksi Terbuka</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Daftar terperinci setiap transaksi pengeluaran dan pemasukan kas pesantren.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#0D7B5F]"
                />
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#152922]">
                <button
                  onClick={() => setActiveTypeTab('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTypeTab === 'all'
                      ? 'bg-white dark:bg-[#0D7B5F] text-stone-900 dark:text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setActiveTypeTab('expense')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTypeTab === 'expense'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  onClick={() => setActiveTypeTab('income')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTypeTab === 'income'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#152922] text-xs font-semibold text-stone-700 dark:text-stone-200"
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

          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              Tidak ada catatan transaksi yang sesuai dengan filter pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Tipe</th>
                    <th className="py-2.5 px-3">Sektor / Kategori</th>
                    <th className="py-2.5 px-3">Uraian Keperluan</th>
                    <th className="py-2.5 px-3 text-right">Jumlah (Rp)</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
                  {filteredList.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-[#142820]/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-stone-600 dark:text-stone-400 whitespace-nowrap">
                        {item.transaction_date}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.type === 'income' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                            <ArrowUpRight className="w-3 h-3" />
                            Pemasukan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                            <ArrowDownLeft className="w-3 h-3" />
                            Pengeluaran
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-stone-800 dark:text-stone-200 whitespace-nowrap">
                        {item.category}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-extrabold whitespace-nowrap ${
                        item.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.type === 'income' ? '+' : '-'} {formatRupiah(item.amount)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          Terverifikasi
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Rekening Resmi Infaq & Donasi ── */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#082F23] via-[#0D7B5F] to-[#051A13] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#D4A24C]">
              <Heart className="w-4 h-4 fill-current" />
              <span>Infaq, Sedekah & Wakaf Pesantren</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold">
              Salurkan Amal Jariyah Anda Untuk Pendidikan Santri
            </h3>
            <p className="text-xs text-emerald-100/70 leading-relaxed">
              Dukungan Anda membantu kebutuhan makan santri, pemeliharaan asrama tahfidz, dan pengadaan kitab kajian kuning di Pondok Pesantren Nurul Falah Ketintang, Surabaya.
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15 space-y-3 shrink-0">
            <div>
              <div className="text-[10px] text-emerald-200/80 uppercase font-semibold">
                Rekening Resmi Pesantren:
              </div>
              <div className="text-sm font-bold text-[#D4A24C]">
                {sppSettings.bank_name}
              </div>
              <div className="font-mono text-xl font-extrabold text-white tracking-wider mt-0.5">
                {sppSettings.bank_account_number}
              </div>
              <div className="text-xs text-emerald-100/90 font-medium">
                a.n. {sppSettings.bank_account_holder}
              </div>
            </div>

            <button
              onClick={handleCopyAccount}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A24C] to-[#E8C36E] text-[#082F23] text-xs font-extrabold shadow-md hover:shadow-lg transition-all"
            >
              {copiedAccount ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Nomor Rekening Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Nomor Rekening</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
