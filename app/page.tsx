'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HeroSection } from '@/app/components/HeroSection';
import { MapSection } from '@/app/components/MapSection';
import { ProvincialRecommendation } from '@/app/components/ProvincialRecommendation';
import { KecamatanRecommendation } from '@/app/components/KecamatanRecommendation';
import { Chatbot } from '@/app/components/Chatbot';
import { Footer } from '@/app/components/Footer';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { IDesaData, IKPIStats, ProvinceKey } from '@/app/types';
import { Activity, Layers, BookOpen } from 'lucide-react';

export default function Home() {
  const [selectedProvince, setSelectedProvince] = useState<ProvinceKey>('aceh');
  const [boundaryData, setBoundaryData] = useState<any | null>(null);
  const [metricsData, setMetricsData] = useState<IDesaData[]>([]);
  const [allDesaData, setAllDesaData] = useState<IDesaData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Muat seluruh data metrik desa dari 3 provinsi untuk komputasi Global Quantiles
  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        const provinsiList: ProvinceKey[] = ['aceh', 'sumut', 'sumbar'];
        const results = await Promise.all(
          provinsiList.map(async (prov) => {
            const res = await fetch(`/data/metrics/desa_${prov}.json`);
            if (!res.ok) throw new Error(`Gagal memuat metrik untuk ${prov.toUpperCase()}`);
            return res.json();
          })
        );

        if (isMounted) {
          const combined: IDesaData[] = results.flat();
          setAllDesaData(combined);
        }
      } catch (err: any) {
        console.error('Error fetching global dataset for quantiles:', err);
      }
    };

    fetchAllData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Muat data spasial (boundary TopoJSON) dan metrik khusus untuk provinsi aktif
  const fetchProvinceData = useCallback(async (province: ProvinceKey) => {
    try {
      setLoading(true);
      setError(null);

      const [boundaryRes, metricsRes] = await Promise.all([
        fetch(`/data/boundaries/${province}.topojson`),
        fetch(`/data/metrics/desa_${province}.json`),
      ]);

      if (!boundaryRes.ok) {
        throw new Error(`Gagal memuat batas wilayah spasial untuk ${province.toUpperCase()}`);
      }
      if (!metricsRes.ok) {
        throw new Error(`Gagal memuat metrik ketahanan pangan untuk ${province.toUpperCase()}`);
      }

      const boundaryJson = await boundaryRes.json();
      const metricsJson = await metricsRes.json();

      setBoundaryData(boundaryJson);
      setMetricsData(metricsJson);
    } catch (err: any) {
      console.error('Error fetching province data:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data spasial dan metrik.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProvinceData(selectedProvince);
  }, [selectedProvince, fetchProvinceData]);

  // Perhitungan dinamis 4 KPI Stats untuk provinsi aktif
  const kpiStats: IKPIStats = useMemo(() => {
    if (!metricsData || metricsData.length === 0) {
      return {
        totalDesa: 0,
        desaDefisit: 0,
        rataRataProduktivitas: 0,
        pulihPenuh: 0,
      };
    }

    const totalDesa = metricsData.length;
    let defisitCount = 0;
    let totalProd = 0;
    let prodCount = 0;
    let pulihPenuhCount = 0;

    metricsData.forEach((d) => {
      const mar = d.metrics?.mar_2026;

      // 1. Desa Rawan Pangan (Defisit): energy_balance_value < 0
      if (mar?.energy_balance_value !== undefined && mar.energy_balance_value < 0) {
        defisitCount++;
      }

      // 2. Rata-rata Produktivitas (Mar 2026)
      if (mar?.produktivitas !== undefined) {
        totalProd += mar.produktivitas;
        prodCount++;
      }

      // 3. Desa Pulih Penuh: status resilient_pulih_penuh pada Mar 2026
      if (mar?.resilience === 'resilient_pulih_penuh') {
        pulihPenuhCount++;
      }
    });

    const rataRataProduktivitas = prodCount > 0 ? totalProd / prodCount : 0;

    return {
      totalDesa,
      desaDefisit: defisitCount,
      rataRataProduktivitas,
      pulihPenuh: pulihPenuhCount,
    };
  }, [metricsData]);

  const handleRetry = () => {
    fetchProvinceData(selectedProvince);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Sticky Header Navigation */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/85 border-b border-border transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight tracking-tight">
                Recovery Sumatera
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium">
                Pemulihan Pasca-Bencana
              </p>
            </div>
          </div>

          {/* Quick Anchor Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a
              href="#map-section"
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Peta Spasial</span>
            </a>
            <a
              href="#prov-section"
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Rekomendasi Provinsi</span>
            </a>
            <a
              href="#recommendations-section"
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Rekomendasi Kecamatan</span>
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
              Live Spasial 2026
            </span>
            {/* Theme Toggle Button */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Section 1: Hero & KPI Summary Cards */}
      <HeroSection
        kpiStats={kpiStats}
        loading={loading}
        selectedProvince={selectedProvince}
        onSelectProvince={setSelectedProvince}
      />

      {/* Section 2: Pemetaan Ketahanan Pangan (Map Dashboard dengan Global Quantiles) */}
      <MapSection
        selectedProvince={selectedProvince}
        onSelectProvince={setSelectedProvince}
        boundaryData={boundaryData}
        metricsData={metricsData}
        allDesaData={allDesaData}
        loading={loading}
        error={error}
        onRetry={handleRetry}
      />

      {/* Section 3: Rekomendasi Umum Tingkat Provinsi */}
      <div id="prov-section" className="scroll-mt-14">
        <ProvincialRecommendation />
      </div>

      {/* Section 4: Rekomendasi Khusus Tingkat Kecamatan (Semua Provinsi) */}
      <div id="recommendations-section" className="scroll-mt-14">
        <KecamatanRecommendation initialProvince="ALL" />
      </div>

      {/* Section 5: AI RAG Assistant Chatbot */}
      <Chatbot />

      {/* Section 6: Footer */}
      <Footer />
    </main>
  );
}
