'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Shield, Clock, User, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function MusyrifAuditPage() {
  const { auditLogs } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#146B50] mb-0.5">
            <Shield className="w-4 h-4 text-[#D6A84F]" />
            <span>Audit Trail & Integritas Data</span>
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Log Audit Perubahan Data
          </h1>
          <p className="text-xs text-stone-500">
            Rekam jejak seluruh koreksi manual absensi, persetujuan izin, dan perubahan jadwal
          </p>
        </div>

        <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-[#146B50] font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
          Total Log: {auditLogs.length}
        </span>
      </div>

      {/* Audit Log Entries List */}
      <div className="space-y-3">
        {auditLogs.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center text-stone-400 text-xs">
            Belum ada aktivitas audit yang tercatat.
          </div>
        ) : (
          auditLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-2 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold px-2 py-0.5 rounded-md bg-[#146B50]/10 text-[#146B50] font-mono text-[11px]">
                    {log.action}
                  </span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    Oleh: {log.actor_name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(log.created_at).toLocaleString('id-ID')} WIB</span>
                </div>
              </div>

              {log.reason && (
                <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                    Alasan / Justifikasi Tindakan:
                  </span>
                  <p className="italic text-stone-700 dark:text-stone-300">
                    &quot;{log.reason}&quot;
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1 font-mono">
                {log.before_data && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 text-rose-800 dark:text-rose-300">
                    <span className="font-sans font-bold block mb-1">Data Sebelumnya:</span>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.before_data, null, 2)}</pre>
                  </div>
                )}
                {log.after_data && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 text-emerald-800 dark:text-emerald-300">
                    <span className="font-sans font-bold block mb-1">Data Baru:</span>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.after_data, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
