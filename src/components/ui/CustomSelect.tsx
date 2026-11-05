'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi',
  className = '',
  icon: LeadingIcon,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
          isOpen
            ? 'bg-white dark:bg-stone-900 border-[#146B50] ring-4 ring-[#146B50]/15 dark:ring-[#146B50]/30 shadow-xs'
            : 'bg-stone-50 dark:bg-stone-800/90 hover:bg-white dark:hover:bg-stone-800 border-stone-200 dark:border-stone-700/80 text-stone-800 dark:text-stone-200 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {LeadingIcon && <LeadingIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />}
          {selectedOption?.icon && (
            <selectedOption.icon className="w-3.5 h-3.5 text-[#146B50] shrink-0" />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#146B50]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Card */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 mt-1.5 w-full min-w-[200px] max-w-xs rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden p-1.5 animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const ItemIcon = opt.icon;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#146B50] dark:text-emerald-300 font-bold'
                      : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {ItemIcon && (
                      <ItemIcon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-[#146B50] dark:text-emerald-300' : 'text-stone-400'
                        }`}
                      />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>

                  {opt.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 shrink-0">
                      {opt.badge}
                    </span>
                  )}

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#146B50] dark:text-emerald-300 shrink-0 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
