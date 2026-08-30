'use client';

import React from 'react';
import { MapType, PeriodKey, IDesaData } from '@/app/types';
import { PALETTES } from '@/utils/colorUtils';

interface LegendProps {
  mapType: MapType;
  period: PeriodKey;
  breaks?: number[];
  data?: IDesaData[];
  className?: string;
}

export function Legend({ mapType, period, breaks, data, className = '' }: LegendProps) {
  const getLegendItems = (): { label: string; color: string }[] => {
    switch (mapType) {
      case 'Produktivitas': {
        const palette = PALETTES.produktivitas;
        if (!breaks || breaks.length === 0) {
          return [
            { label: '< 430.0 Ton/km²', color: palette[0] },
            { label: '430.0 - 470.0 Ton/km²', color: palette[1] },
            { label: '470.0 - 495.0 Ton/km²', color: palette[2] },
            { label: '495.0 - 515.0 Ton/km²', color: palette[3] },
            { label: '515.0 - 540.0 Ton/km²', color: palette[4] },
            { label: '> 540.0 Ton/km²', color: palette[5] },
          ];
        }
        return breaks.map((breakVal, idx) => {
          const prevBreak = idx === 0 ? 0 : breaks[idx - 1];
          const label =
            idx === 0
              ? `≤ ${breakVal.toFixed(1)} Ton/km²`
              : `${prevBreak.toFixed(1)} - ${breakVal.toFixed(1)} Ton/km²`;
          return {
            label,
            color: palette[idx] || palette[palette.length - 1],
          };
        });
      }

      case 'Produksi Padi': {
        const palette = PALETTES.produksi;
        if (!breaks || breaks.length === 0) {
          return [
            { label: '0 - 50 Ton', color: palette[0] },
            { label: '50 - 100 Ton', color: palette[1] },
            { label: '100 - 200 Ton', color: palette[2] },
            { label: '200 - 500 Ton', color: palette[3] },
            { label: '500 - 1000 Ton', color: palette[4] },
            { label: '> 1000 Ton', color: palette[5] },
          ];
        }
        return breaks.map((breakVal, idx) => {
          const prevBreak = idx === 0 ? 0 : breaks[idx - 1];
          const label =
            idx === 0
              ? `≤ ${breakVal.toFixed(1)} Ton`
              : `${prevBreak.toFixed(1)} - ${breakVal.toFixed(1)} Ton`;
          return {
            label,
            color: palette[idx] || palette[palette.length - 1],
          };
        });
      }

      case 'Kebutuhan Energi': {
        const palette = PALETTES.energy_needs;
        if (!breaks || breaks.length === 0) {
          return [
            { label: '0 - 100 Mcal', color: palette[0] },
            { label: '100 - 300 Mcal', color: palette[1] },
            { label: '300 - 500 Mcal', color: palette[2] },
            { label: '500 - 1000 Mcal', color: palette[3] },
            { label: '1000 - 2000 Mcal', color: palette[4] },
            { label: '> 2000 Mcal', color: palette[5] },
          ];
        }
        return breaks.map((breakVal, idx) => {
          const prevBreak = idx === 0 ? 0 : breaks[idx - 1];
          const label =
            idx === 0
              ? `≤ ${breakVal.toFixed(0)} Mcal`
              : `${prevBreak.toFixed(0)} - ${breakVal.toFixed(0)} Mcal`;
          return {
            label,
            color: palette[idx] || palette[palette.length - 1],
          };
        });
      }

      case 'Recovery': {
        const palette = PALETTES.recovery;
        if (!breaks || breaks.length === 0) {
          return [
            { label: '< 20% (Sangat Rendah)', color: palette[0] },
            { label: '20% - 40% (Rendah)', color: palette[1] },
            { label: '40% - 60% (Sedang)', color: palette[2] },
            { label: '60% - 80% (Baik)', color: palette[3] },
            { label: '80% - 100% (Sangat Baik)', color: palette[4] },
          ];
        }
        return breaks.map((breakVal, idx) => {
          const prevBreak = idx === 0 ? 0 : breaks[idx - 1];
          const label =
            idx === 0
              ? `≤ ${(breakVal * 100).toFixed(0)}%`
              : `${(prevBreak * 100).toFixed(0)}% - ${(breakVal * 100).toFixed(0)}%`;
          return {
            label,
            color: palette[idx] || palette[palette.length - 1],
          };
        });
      }

      case 'Neraca Pangan':
        return [
          { label: 'Rawan Pangan Berat (Defisit >50%)', color: '#d73027' },
          { label: 'Rawan Pangan (Defisit 10-50%)', color: '#fc8d59' },
          { label: 'Rentan Pangan (Defisit <10%)', color: '#fee08b' },
          { label: 'Tahan Pangan (Surplus ≤50%)', color: '#d9ef8b' },
          { label: 'Sangat Tahan Pangan (Surplus >50%)', color: '#91cf60' },
          { label: 'Swasembada / Imbang (0%)', color: '#1a9850' },
        ];

      case 'Resilience':
        return [
          { label: 'Tidak Terdampak', color: '#2b83ba' },
          { label: 'Resilient - Pulih Penuh', color: '#abdda4' },
          { label: 'Pulih Lambat', color: '#fdae61' },
          { label: 'Pulih Sebagian', color: '#fee08b' },
          { label: 'Memburuk - Tidak Pulih', color: '#d7191c' },
        ];

      default:
        return [];
    }
  };

  const items = getLegendItems();

  return (
    <div
      className={`legend-container bg-card/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl shadow-xl border border-border text-xs transition-all pointer-events-auto w-full max-w-[280px] ${className}`}
    >
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/80">
        <h4 className="text-xs font-bold text-foreground truncate">{mapType}</h4>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider ml-2">
          Legenda
        </span>
      </div>

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-[11px] leading-tight">
            <span
              className="w-3.5 h-3.5 rounded-sm flex-shrink-0 border border-black/10 dark:border-white/10 shadow-xs"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-foreground/90 font-medium truncate">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Global Scale Info Footer */}
      <div className="text-[10px] text-muted-foreground border-t border-border/70 pt-2 mt-2 space-y-0.5">
        <div className="flex items-center justify-between">
          <span>Skala sebaran data</span>
          <span className="font-semibold">{items.length} kelas</span>
        </div>
        <div className="text-[9px] text-muted-foreground/80">
          Warna konsisten antar linimasa
        </div>
      </div>
    </div>
  );
}
