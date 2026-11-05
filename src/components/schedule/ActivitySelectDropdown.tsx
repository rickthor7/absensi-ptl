'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Activity } from '@/types';
import {
  ChevronDown,
  Clock,
  Check,
  Sparkles,
  BookOpen,
  Moon,
  Sunrise,
  Sunset,
  GraduationCap,
  BookMarked,
  Calendar,
  Radio,
  MapPin,
} from 'lucide-react';

interface ActivitySelectDropdownProps {
  activities: Activity[];
  selectedActivityId: string;
  onSelect: (activity: Activity) => void;
  activeActivityId?: string | null;
  className?: string;
  label?: string;
}

// Clean helper to strip seconds (:00) from time strings
export function formatTimeRange(start?: string, end?: string): string {
  if (!start) return '';
  const clean = (t: string) => {
    const parts = t.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
  };
  return `${clean(start)} - ${clean(end || '')} WIB`;
}

// Visual themes & icons per activity code
function getActivityVisuals(code: string = '', name: string = '') {
  const upper = code.toUpperCase();
  const n = name.toLowerCase();

  if (upper.includes('QIYAM') || n.includes('qiyam') || n.includes('lail')) {
    return {
      icon: Moon,
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200',
      label: 'Malam / Tahajjud',
    };
  }
  if (upper.includes('SHUBUH') || n.includes('shubuh') || n.includes('subuh')) {
    return {
      icon: Sunrise,
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
      label: 'Fajar / Shubuh',
    };
  }
  if (upper.includes('SETORAN_PAGI') || (n.includes('tahfidz') && n.includes('pagi'))) {
    return {
      icon: BookOpen,
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
      label: 'Tahfidz Pagi',
    };
  }
  if (upper.includes('KITAB') || n.includes('kitab')) {
    return {
      icon: BookMarked,
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-700',
      badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200',
      label: 'Ta’lim Kitab',
    };
  }
  if (upper.includes('MADIN') || n.includes('madin') || n.includes('diniyah')) {
    return {
      icon: GraduationCap,
      bg: 'bg-teal-50 dark:bg-teal-950/60',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800',
      badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200',
      label: 'Madrasah',
    };
  }
  if (upper.includes('MAGHRIB') || n.includes('maghrib')) {
    return {
      icon: Sunset,
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
      label: 'Maghrib & Wirid',
    };
  }
  if (upper.includes('ISYA') || n.includes('isya')) {
    return {
      icon: Moon,
      bg: 'bg-sky-50 dark:bg-sky-950/60',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800',
      badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
      label: 'Isya Berjamaah',
    };
  }
  if (upper.includes('SETORAN_MALAM') || (n.includes('tahfidz') && n.includes('malam'))) {
    return {
      icon: Sparkles,
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
      label: 'Tahfidz Malam',
    };
  }

  return {
    icon: Calendar,
    bg: 'bg-stone-50 dark:bg-stone-800',
    text: 'text-stone-700 dark:text-stone-300',
    border: 'border-stone-200 dark:border-stone-700',
    badge: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    label: 'Kegiatan',
  };
}

export default function ActivitySelectDropdown({
  activities,
  selectedActivityId,
  onSelect,
  activeActivityId,
  className = '',
  label,
}: ActivitySelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedActivity =
    activities.find((a) => a.id === selectedActivityId) || activities[0] || null;

  // Close on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentVisuals = selectedActivity
    ? getActivityVisuals(selectedActivity.code, selectedActivity.name)
    : getActivityVisuals();
  const SelectedIcon = currentVisuals.icon;

  const isCurrentLive = selectedActivity && selectedActivity.id === activeActivityId;

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {label && (
        <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button: Modern Custom Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`group w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
          isOpen
            ? 'bg-white dark:bg-stone-900 border-[#146B50] ring-4 ring-[#146B50]/15 dark:ring-[#146B50]/30'
            : 'bg-stone-50/90 dark:bg-stone-900 hover:bg-white dark:hover:bg-stone-800/90 border-stone-200/90 dark:border-stone-700/80 hover:border-emerald-500/50'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Activity Icon */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${currentVisuals.bg} ${currentVisuals.text} border ${currentVisuals.border}`}
          >
            <SelectedIcon className="w-4 h-4" />
          </div>

          {/* Text labels */}
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate block">
                {selectedActivity ? selectedActivity.name : 'Pilih Kegiatan'}
              </span>
              {isCurrentLive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white animate-pulse shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Live
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
              <Clock className="w-3 h-3 text-[#146B50] dark:text-[#D6A84F] shrink-0" />
              <span className="font-semibold truncate">
                {selectedActivity
                  ? formatTimeRange(selectedActivity.start_time, selectedActivity.end_time)
                  : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Chevron Indicator */}
        <div className="pl-1 shrink-0">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-stone-400 group-hover:text-[#146B50] dark:group-hover:text-emerald-400 transition-all ${
              isOpen ? 'rotate-180 text-[#146B50] bg-emerald-50 dark:bg-emerald-950/50' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4 transition-transform duration-200" />
          </div>
        </div>
      </button>

      {/* Custom Dropdown Menu Card (NO DEFAULT HTML SELECT!) */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 sm:right-0 sm:left-auto mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-3xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-emerald-500/30 dark:border-emerald-700/40 shadow-2xl overflow-hidden p-2.5 animate-in fade-in-0 zoom-in-95 duration-200"
        >
          {/* Header Bar */}
          <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D6A84F]" />
              <span className="text-[11px] font-black tracking-wider uppercase text-stone-700 dark:text-stone-300">
                Pilih Sesi Kegiatan
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#146B50] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {activities.length} Jadwal
            </span>
          </div>

          {/* Activity Cards List */}
          <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {activities.map((act) => {
              const isSelected = act.id === selectedActivityId;
              const isLive = act.id === activeActivityId;
              const visuals = getActivityVisuals(act.code, act.name);
              const Icon = visuals.icon;

              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => {
                    onSelect(act);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50/40 dark:from-emerald-950/70 dark:via-emerald-900/40 dark:to-emerald-950/50 border border-emerald-300 dark:border-emerald-700 shadow-xs'
                      : 'hover:bg-stone-100/80 dark:hover:bg-stone-800/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Activity Icon */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
                        isSelected
                          ? 'bg-[#146B50] text-white shadow-emerald-950/20'
                          : `${visuals.bg} ${visuals.text} border ${visuals.border}`
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-extrabold text-xs sm:text-sm truncate ${
                            isSelected
                              ? 'text-[#146B50] dark:text-emerald-300'
                              : 'text-stone-800 dark:text-stone-100 group-hover:text-[#146B50] dark:group-hover:text-emerald-300'
                          }`}
                        >
                          {act.name}
                        </span>

                        {isLive && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Live
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          {formatTimeRange(act.start_time, act.end_time)}
                        </span>
                        <span>•</span>
                        <span className="text-[10px] text-stone-400">
                          Radius {act.radius_m}m
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selected checkmark indicator */}
                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#146B50] to-[#0B3D2E] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-stone-300 dark:border-stone-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 px-3 py-1 flex items-center justify-between text-[10px] text-stone-400">
            <span>Pondok Pesantren Nurul Falah</span>
            <span className="font-semibold text-[#146B50] dark:text-emerald-400">
              Absensi Geotag &amp; Selfie
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
