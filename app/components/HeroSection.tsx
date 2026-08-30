'use client';

import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { IKPIStats, ProvinceKey } from '@/app/types';
import {
  Layers,
  AlertTriangle,
  Wheat,
  CheckCircle2,
  ArrowDown,
  MapPin,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface HeroSectionProps {
  kpiStats: IKPIStats;
  loading: boolean;
  selectedProvince: ProvinceKey;
  onSelectProvince: (prov: ProvinceKey) => void;
}

const provinceLabels: Record<ProvinceKey, string> = {
  aceh: 'Aceh',
  sumut: 'Sumatera Utara',
  sumbar: 'Sumatera Barat',
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  kpiStats,
  loading,
  selectedProvince,
  onSelectProvince,
}) => {
  const scrollToMap = () => {
    const el = document.getElementById('map-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center pt-24 pb-16 overflow-hidden bg-gradient-to-b from-[var(--hero-bg-from)] via-[var(--hero-bg-via)] to-[var(--hero-bg-to)] transition-colors duration-500">
      {/* Background Decorative SVG Silhouette */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.07] overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full object-cover scale-125"
          fill="currentColor"
        >
          <path d="M150,50 L220,90 L300,160 L380,240 L420,350 L460,450 L520,520 L480,550 L380,480 L320,380 L260,280 L180,180 L120,90 Z" />
          <path d="M350,180 L430,220 L510,310 L560,420 L580,510 L520,480 L440,380 L380,290 Z" />
          <circle cx="280" cy="180" r="14" />
          <circle cx="390" cy="300" r="18" />
          <circle cx="480" cy="460" r="16" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        {/* Main Hero Header */}
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold tracking-wide shadow-xs backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dashboard Pemulihan Pasca-Bencana Spasial</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Recovery Sumatera
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-normal">
            Memantau ketahanan pangan dan pemulihan pasca-bencana di{' '}
            <strong className="text-foreground font-semibold">Aceh</strong>,{' '}
            <strong className="text-foreground font-semibold">Sumatera Utara</strong>, dan{' '}
            <strong className="text-foreground font-semibold">Sumatera Barat</strong> menggunakan
            pemodelan spasial multi-temporal dan estimasi produktivitas padi berbasis machine learning.
          </p>

          {/* Quick Province Switcher Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground mr-2 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Pilih Provinsi:
            </span>
            {(['aceh', 'sumut', 'sumbar'] as ProvinceKey[]).map((prov) => (
              <button
                key={prov}
                onClick={() => onSelectProvince(prov)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${selectedProvince === prov
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-semibold shadow-md shadow-emerald-600/25 scale-105'
                  : 'bg-card hover:bg-muted text-foreground border border-border'
                  }`}
              >
                {provinceLabels[prov]}
              </button>
            ))}
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            <Button
              onClick={scrollToMap}
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-500 dark:to-teal-600 hover:from-emerald-700 hover:to-teal-800 text-white font-medium shadow-lg shadow-emerald-900/20 px-8 gap-2 rounded-xl group transition-all duration-300"
            >
              <span>Eksplorasi Peta</span>
              <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-1" />
            </Button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="mt-14 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Desa */}
            <Card className="bg-card border-border backdrop-blur-md shadow-md dark:shadow-xl hover:border-emerald-500/40 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Total Desa Terpantau</span>
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-1">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs">Memuat data...</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-foreground tracking-tight">
                      {kpiStats.totalDesa.toLocaleString('id-ID')}{' '}
                      <span className="text-xs font-normal text-muted-foreground">Desa</span>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Cakupan pemodelan spasial tingkat desa
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* KPI 2: Desa Defisit */}
            <Card className="bg-card border-border backdrop-blur-md shadow-md dark:shadow-xl hover:border-rose-500/40 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Desa Rawan Pangan (Defisit)</span>
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-1">
                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      <span className="text-xs">Memuat data...</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                      {kpiStats.desaDefisit.toLocaleString('id-ID')}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({kpiStats.totalDesa > 0 ? ((kpiStats.desaDefisit / kpiStats.totalDesa) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Neraca energi &lt; 0 Mcal (Mar 2026)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* KPI 3: Rata-rata Produktivitas */}
            <Card className="bg-card border-border backdrop-blur-md shadow-md dark:shadow-xl hover:border-amber-500/40 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Rata-rata Produktivitas</span>
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Wheat className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-1">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      <span className="text-xs">Memuat data...</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-300 tracking-tight">
                      {kpiStats.rataRataProduktivitas.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-muted-foreground">Ton/km²</span>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Estimasi produktivitas panen Mar 2026
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* KPI 4: Desa Pulih Penuh (resilient_pulih_penuh) */}
            <Card className="bg-card border-border backdrop-blur-md shadow-md dark:shadow-xl hover:border-emerald-500/40 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Desa Pulih Penuh</span>
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-1">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      <span className="text-xs">Memuat data...</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {kpiStats.pulihPenuh.toLocaleString('id-ID')}{' '}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Status Resilient - Pulih Penuh (Mar 2026)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
