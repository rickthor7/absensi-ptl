'use client';

import React, { useState, useMemo } from 'react';
import { AttendanceRecord } from '@/types';
import { formatIndonesianDate } from '@/lib/schedule';
import {
  X,
  Share2,
  Copy,
  Check,
  BookOpen,
  Calendar,
  User,
  Users,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface TahfidzWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  ustadzName: string;
  dateStr: string;
  records: AttendanceRecord[];
}

export default function TahfidzWhatsAppModal({
  isOpen,
  onClose,
  classNameTitle,
  ustadzName,
  dateStr,
  records,
}: TahfidzWhatsAppModalProps) {
  const [copied, setCopied] = useState(false);

  // Filter only records that have tahfidz data
  const validSetoranList = useMemo(() => {
    return records.filter((r) => r.tahfidz_juz !== undefined && r.tahfidz_juz !== null);
  }, [records]);

  // Generate standardized text format matching user requirement
  // Format: [Nama Panjang] - [Jenis Setoran] - [Data Setoran]
  // Contoh: M Thoriq Dhiya Ul Haq - Murojaah - Juz 10 halaman 2
  const defaultShareText = useMemo(() => {
    const dateObj = new Date(dateStr);
    const formattedDate = formatIndonesianDate(isNaN(dateObj.getTime()) ? new Date() : dateObj);

    const items = validSetoranList.map((r, idx) => {
      const modeLabel = r.tahfidz_mode === 'murojaah' ? 'Murojaah' : 'Ziyadah';
      let pageData = `Juz ${r.tahfidz_juz} halaman ${r.tahfidz_halaman || 1}`;
      if (r.tahfidz_halaman_end && r.tahfidz_halaman_end !== r.tahfidz_halaman) {
        pageData = `Juz ${r.tahfidz_juz} halaman ${r.tahfidz_halaman}-${r.tahfidz_halaman_end}`;
      }
      return `${idx + 1}. ${r.student_name} - ${modeLabel} - ${pageData}`;
    });

    const listText =
      items.length > 0
        ? items.join('\n')
        : '_Belum ada santri yang tervalidasi setoran pada sesi ini._';

    return `*LAPORAN SETORAN TAHFIDZ SANTRI*
*Pondok Pesantren Nurul Falah Ketintang, Surabaya*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 *Hari/Tanggal:* ${formattedDate}
📖 *Kelas:* ${classNameTitle}
👳‍♂️ *Penyimak:* ${ustadzName}
👥 *Total Santri Setor:* ${validSetoranList.length} Santri
━━━━━━━━━━━━━━━━━━━━━━━━━━
*DAFTAR SANTRI YANG SUDAH SETOR:*

${listText}

━━━━━━━━━━━━━━━━━━━━━━━━━━
_Alhamdulillah, sesi setoran tahfidz telah selesai dan tervalidasi._`;
  }, [validSetoranList, dateStr, classNameTitle, ustadzName]);

  const [shareText, setShareText] = useState(defaultShareText);

  // Sync if defaultShareText changes
  React.useEffect(() => {
    setShareText(defaultShareText);
  }, [defaultShareText]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B4A37] via-[#0E5B44] to-[#146B50] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-[#D6A84F]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                Rekap Data Setoran Tahfidz WhatsApp
              </h3>
              <p className="text-xs text-emerald-100/80">
                {classNameTitle} • {ustadzName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Quick Info Strip */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
            <div className="text-center">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-semibold">
                Sesi
              </span>
              <span className="font-extrabold text-stone-900 dark:text-stone-100 truncate block">
                {classNameTitle}
              </span>
            </div>
            <div className="text-center border-x border-emerald-200/60 dark:border-emerald-800/60 px-1">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-semibold">
                Penyimak
              </span>
              <span className="font-extrabold text-stone-900 dark:text-stone-100 truncate block">
                {ustadzName}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-semibold">
                Total Setor
              </span>
              <span className="font-extrabold text-[#146B50] dark:text-[#D6A84F] block">
                {validSetoranList.length} Santri
              </span>
            </div>
          </div>

          {/* Textarea Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#146B50]" />
                <span>Format Teks Siap Kirim (Dapat Diedit Manual):</span>
              </label>
              <span className="text-[10px] text-stone-400 font-mono">
                {validSetoranList.length} baris data
              </span>
            </div>

            <textarea
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              rows={11}
              className="w-full text-xs font-mono p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-[#146B50] outline-none leading-relaxed"
            />
          </div>

          {/* Format Note */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700 text-[11px] text-stone-500 dark:text-stone-400 flex items-start gap-2">
            <span className="text-emerald-600 font-bold">ℹ️</span>
            <span>
              Format baris per santri otomatis: <strong className="text-stone-700 dark:text-stone-300">[Nama Panjang] - [Jenis Setoran] - [Data Setoran]</strong> sesuai standar laporan WhatsApp pondok.
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            Tutup
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>

            {/* WhatsApp Direct Share Button */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-black transition shadow-md cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Kirim ke WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
