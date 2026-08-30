'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Check } from 'lucide-react';

export type BasemapType = 'hybrid' | 'satellite' | 'streets' | 'esri' | 'osm';

interface BasemapOption {
  id: BasemapType;
  label: string;
  sublabel: string;
  url: string;
  subdomains: string[];
  attribution: string;
  maxZoom: number;
}

export const BASEMAP_CONFIGS: Record<BasemapType, BasemapOption> = {
  hybrid: {
    id: 'hybrid',
    label: 'Google Hybrid',
    sublabel: 'Satelit + Label Jalan (Publik)',
    url: 'https://{s}.google.com/vt?lyrs=s,h&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  satellite: {
    id: 'satellite',
    label: 'Google Satellite',
    sublabel: 'Citra Satelit Murni',
    url: 'https://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  streets: {
    id: 'streets',
    label: 'Google Streets',
    sublabel: 'Peta Jalan Standar',
    url: 'https://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  esri: {
    id: 'esri',
    label: 'Esri World Imagery',
    sublabel: 'High-Res Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    attribution: '&copy; Esri, Maxar, Earthstar',
    maxZoom: 19,
  },
  osm: {
    id: 'osm',
    label: 'OpenStreetMap',
    sublabel: 'Peta Komunitas Terbuka',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
};

interface BasemapSelectorProps {
  currentBasemap: BasemapType;
  onBasemapChange: (basemap: BasemapType) => void;
  className?: string;
}

export function BasemapSelector({
  currentBasemap,
  onBasemapChange,
  className = '',
}: BasemapSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = BASEMAP_CONFIGS[currentBasemap] || BASEMAP_CONFIGS.hybrid;

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative z-[500] ${className}`}>
      {/* Tombol Selector Utama (Kiri Atas Peta, Kontras Tinggi & Bersih) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
        title="Pilih Jenis Basemap Peta"
        aria-label="Pilih Jenis Basemap"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-xs">
            <Layers className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider leading-none mb-0.5">
              Basemap Peta
            </div>
            <div className="font-extrabold text-slate-900 dark:text-slate-50 text-xs tracking-tight">
              {activeOption.label}
            </div>
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-slate-600 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </button>

      {/* Dropdown Menu (Membuka ke Bawah dari Kiri Atas dengan Background Solid & Kontras Tinggi) */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[260px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Pilih Basemap</span>
          </div>

          <div className="p-1.5 space-y-1">
            {Object.values(BASEMAP_CONFIGS).map((opt) => {
              const isSelected = currentBasemap === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onBasemapChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center justify-between ${isSelected
                      ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700/80 shadow-xs'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 font-medium'
                    }`}
                >
                  <div>
                    <div className="font-bold text-xs leading-tight text-slate-900 dark:text-white">
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                      {opt.sublabel}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white dark:bg-emerald-500 flex items-center justify-center flex-shrink-0 ml-2 shadow-xs">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
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
