'use client';

import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { IDesaData } from '@/app/types';
import { Layers, AlertTriangle, Wheat, CheckCircle2 } from 'lucide-react';

export interface KPISummaryProps {
  data: IDesaData[];
  provinsi?: string | null;
  loading?: boolean;
}

export function KPISummary({ data, provinsi, loading = false }: KPISummaryProps) {
  // Filter data berdasarkan provinsi yang dipilih (jika ada)
  const filteredData = provinsi && provinsi !== 'Semua' && provinsi !== 'ALL'
    ? data.filter((d) => d.nama_prov.toLowerCase() === provinsi.toLowerCase())
    : data;

  const totalDesa = filteredData.length;

  // Hitung desa rawan pangan (defisit) - Mar 2026
  const defisitDesa = filteredData.filter((d) => {
    const mar = d.metrics.mar_2026;
    return mar && mar.energy_balance_value < 0;
  }).length;

  const defisitPercentage = totalDesa > 0 ? (defisitDesa / totalDesa) * 100 : 0;

  // Hitung rata-rata produktivitas - Mar 2026
  const avgProduktivitas =
    totalDesa > 0
      ? filteredData.reduce((sum, d) => sum + (d.metrics.mar_2026?.produktivitas || 0), 0) / totalDesa
      : 0;

  // Hitung desa dengan status resilient_pulih_penuh - Mar 2026
  const pulihPenuh = filteredData.filter((d) => {
    const resilience = d.metrics.mar_2026?.resilience;
    return resilience === 'resilient_pulih_penuh';
  }).length;


  const kpis = [
    {
      label: 'Total Desa Terpantau',
      value: `${totalDesa.toLocaleString('id-ID')} Desa`,
      sub: 'Cakupan pemodelan spasial tingkat desa',
      icon: Layers,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      trend: 'neutral',
    },
    {
      label: 'Desa Rawan Pangan (Defisit)',
      value: `${defisitDesa.toLocaleString('id-ID')} (${defisitPercentage.toFixed(1)}%)`,
      sub: 'Neraca energi < 0 Mcal (Mar 2026)',
      icon: AlertTriangle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      trend: 'negative',
    },
    {
      label: 'Rata-rata Produktivitas',
      value: `${avgProduktivitas.toFixed(2)} Ton/km²`,
      sub: 'Estimasi produktivitas Mar 2026',
      icon: Wheat,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      trend: 'neutral',
    },
    {
      label: 'Desa Pulih Penuh',
      value: `${pulihPenuh.toLocaleString('id-ID')}`,
      sub: 'Status resilient_pulih_penuh (Mar 2026)',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      trend: 'positive',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={idx}
            className="bg-card border-border backdrop-blur-md shadow-md dark:shadow-xl hover:border-emerald-500/40 transition-all duration-300"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-bold tracking-tight ${kpi.color}`}>
                  {kpi.value}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{kpi.sub}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
