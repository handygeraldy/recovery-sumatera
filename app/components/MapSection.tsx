'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { IDesaData, IDesaMetric, MapType, PeriodKey, ProvinceKey } from '@/app/types';
import {
  getGlobalQuantileBreaks,
  formatResilienceDisplay,
} from '@/utils/colorUtils';
import {
  isPeriodAvailable,
  isPeriodSelectorActive,
  getDefaultPeriodForMapType,
} from '@/utils/mapUtils';
import {
  Layers,
  Calendar,
  MapPin,
  Loader2,
  TrendingUp,
  Activity,
  Wheat,
  Scale,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react';

// Dynamic import for Leaflet map component to prevent Next.js SSR window errors
const MapComponent = dynamic(
  () => import('./MapComponent').then((mod) => mod.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[580px] md:h-[680px] rounded-xl border border-border bg-card flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-500" />
        <span className="text-sm font-medium">Memuat kanvas peta dan poligon desa...</span>
      </div>
    ),
  }
);

interface MapSectionProps {
  selectedProvince: ProvinceKey;
  onSelectProvince: (prov: ProvinceKey) => void;
  boundaryData: any | null;
  metricsData: IDesaData[];
  allDesaData?: IDesaData[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const MAP_TYPES: { id: MapType; label: string; icon: any }[] = [
  { id: 'Produktivitas', label: 'Produktivitas (Ton/km²)', icon: TrendingUp },
  { id: 'Produksi Padi', label: 'Produksi Padi (Ton)', icon: Wheat },
  { id: 'Kebutuhan Energi', label: 'Kebutuhan Energi (Mcal)', icon: Zap },
  { id: 'Neraca Pangan', label: 'Neraca Pangan (Kategori)', icon: Scale },
  { id: 'Resilience', label: 'Resilience (Kategori)', icon: ShieldCheck },
  { id: 'Recovery', label: 'Prioritas Recovery', icon: Activity },
];

const PERIODES: { id: PeriodKey; label: string; sublabel: string }[] = [
  { id: 'okt_2025', label: 'Okt 2025', sublabel: 'Pra-Bencana' },
  { id: 'des_2025', label: 'Des 2025', sublabel: 'Saat Bencana' },
  { id: 'mar_2026', label: 'Mar 2026', sublabel: 'Pasca-Bencana' },
];

export const MapSection: React.FC<MapSectionProps> = ({
  selectedProvince,
  onSelectProvince,
  boundaryData,
  metricsData,
  allDesaData = [],
  loading,
  error,
  onRetry,
}) => {
  const [selectedMapType, setSelectedMapType] = useState<MapType>('Neraca Pangan');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('mar_2026');
  const [selectedKab, setSelectedKab] = useState<string>('ALL');
  const [selectedKec, setSelectedKec] = useState<string>('ALL');
  const [selectedDesa, setSelectedDesa] = useState<IDesaData | null>(null);

  // Jika user memilih layer yang hanya tersedia di Pasca-Bencana (Resilience/Recovery), otomatis switch ke Mar 2026
  useEffect(() => {
    if (!isPeriodAvailable(selectedMapType, selectedPeriod)) {
      setSelectedPeriod('mar_2026');
    }
  }, [selectedMapType, selectedPeriod]);

  // Fast key-value metrics lookup map
  const metricsMap = useMemo(() => {
    const map = new Map<string, IDesaData>();
    metricsData.forEach((d) => map.set(String(d.iddesa), d));
    return map;
  }, [metricsData]);

  // 1. Hitung BREAKS GLOBAL (berdasarkan seluruh desa dari semua periode & provinsi)
  const globalBreaks = useMemo(() => {
    const dataSource = allDesaData.length > 0 ? allDesaData : metricsData;
    if (!dataSource || dataSource.length === 0) return [];

    let metricKey: keyof IDesaMetric;
    switch (selectedMapType) {
      case 'Produktivitas':
        metricKey = 'produktivitas';
        break;
      case 'Produksi Padi':
        metricKey = 'produksi';
        break;
      case 'Kebutuhan Energi':
        metricKey = 'energy_needs';
        break;
      case 'Recovery':
        metricKey = 'recovery';
        break;
      default:
        return [];
    }

    const breaks = getGlobalQuantileBreaks(dataSource, metricKey, 6);
    return breaks;
  }, [allDesaData, metricsData, selectedMapType]);

  // Unique kabupaten list for current province
  const kabupatenList = useMemo(() => {
    const set = new Set<string>();
    metricsData.forEach((d) => {
      if (d.nama_kab) set.add(d.nama_kab);
    });
    return Array.from(set).sort();
  }, [metricsData]);

  // Unique kecamatan list filtered by selected kabupaten
  const kecamatanList = useMemo(() => {
    const set = new Set<string>();
    metricsData.forEach((d) => {
      if (selectedKab === 'ALL' || d.nama_kab.toLowerCase() === selectedKab.toLowerCase()) {
        if (d.nama_kec) set.add(d.nama_kec);
      }
    });
    return Array.from(set).sort();
  }, [metricsData, selectedKab]);

  const multiPeriodSupported = isPeriodSelectorActive(selectedMapType);

  // Summary statistics for active filtered view
  const summaryStats = useMemo(() => {
    const filtered = metricsData.filter((d) => {
      const matchKab = selectedKab === 'ALL' || d.nama_kab.toLowerCase() === selectedKab.toLowerCase();
      const matchKec = selectedKec === 'ALL' || d.nama_kec.toLowerCase() === selectedKec.toLowerCase();
      return matchKab && matchKec;
    });

    const activePeriod = multiPeriodSupported ? selectedPeriod : 'mar_2026';
    let totalProd = 0;
    let totalProduksi = 0;
    let defisitCount = 0;
    let count = filtered.length;

    filtered.forEach((d) => {
      const m = d.metrics[activePeriod];
      if (m) {
        totalProd += m.produktivitas || 0;
        totalProduksi += m.produksi || 0;
        if (m.energy_balance_value < 0) defisitCount++;
      }
    });

    return {
      count,
      avgProd: count > 0 ? totalProd / count : 0,
      totalProduksi,
      defisitCount,
      defisitPercent: count > 0 ? (defisitCount / count) * 100 : 0,
    };
  }, [metricsData, selectedKab, selectedKec, selectedPeriod, multiPeriodSupported]);

  return (
    <section id="map-section" className="py-10 bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-3 py-1 font-semibold text-xs rounded-full flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                GIS Spatial Canvas
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono">
                {metricsData.length.toLocaleString('id-ID')} Poligon Desa
              </Badge>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Peta Geospasial Ketahanan & Pemulihan Pangan
            </h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
              Visualisasi spasial tingkat desa/kelurahan untuk
              eksplorasi produktivitas, neraca pangan, dan pemulihan pasca bencana.
            </p>
          </div>

          {/* Quick Province Switcher Tabs */}
          <div className="flex items-center gap-2 bg-card p-1.5 rounded-xl border border-border shadow-xs">
            {(['aceh', 'sumut', 'sumbar'] as ProvinceKey[]).map((prov) => {
              const names: Record<ProvinceKey, string> = {
                aceh: 'Aceh',
                sumut: 'Sumatera Utara',
                sumbar: 'Sumatera Barat',
              };
              const active = selectedProvince === prov;
              return (
                <button
                  key={prov}
                  onClick={() => {
                    onSelectProvince(prov);
                    setSelectedKab('ALL');
                    setSelectedKec('ALL');
                    setSelectedDesa(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                >
                  {names[prov]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Control Sidebar & Map Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Controls & Filters (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Layer Selection Card */}
            <Card className="border-border bg-card/90 backdrop-blur-xs shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Layer Metrik Spasial
                </CardTitle>
                <CardDescription className="text-xs">
                  Pilih variabel data yang akan divisualisasikan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 gap-1.5">
                  {MAP_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = selectedMapType === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedMapType(t.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${isSelected
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-xs'
                          : 'bg-background hover:bg-muted/60 text-foreground/80 border-border/70'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                              }`}
                          />
                          <span>{t.label}</span>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Time Period Card (Akurat: Neraca Pangan, Produktivitas, Produksi, Kebutuhan Energi mendukung 3 periode) */}
            <Card className="border-border bg-card/90 backdrop-blur-xs shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Periode Waktu
                  </CardTitle>
                  {!multiPeriodSupported && (
                    <Badge variant="outline" className="text-[10px] py-0 px-2 text-muted-foreground flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                      Hanya Pasca-Bencana
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {multiPeriodSupported
                    ? 'Pilih linimasa observasi untuk melihat pergerakan metrik lintas periode'
                    : `Layer ${selectedMapType} merupakan hasil pemodelan klasifikasi status pasca-bencana (Mar 2026)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {PERIODES.map((p) => {
                    const isAvailable = isPeriodAvailable(selectedMapType, p.id);
                    const isSelected = selectedPeriod === p.id && isAvailable;

                    return (
                      <button
                        key={p.id}
                        disabled={!isAvailable}
                        onClick={() => setSelectedPeriod(p.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold scale-[1.02]'
                          : isAvailable
                            ? 'bg-background hover:bg-muted/60 text-foreground border-border font-medium'
                            : 'bg-muted/30 text-muted-foreground/50 border-border/40 cursor-not-allowed opacity-50'
                          }`}
                        title={!isAvailable ? 'Hanya tersedia pada periode Pasca-Bencana (Mar 2026)' : p.label}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{p.label}</span>
                          {!isAvailable && <Lock className="w-2.5 h-2.5 opacity-60" />}
                        </div>
                        <span
                          className={`text-[9px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-muted-foreground'
                            }`}
                        >
                          {p.sublabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Filter Wilayah Card */}
            <Card className="border-border bg-card/90 backdrop-blur-xs shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Filter Batas Administrasi
                  </CardTitle>
                  {(selectedKab !== 'ALL' || selectedKec !== 'ALL') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedKab('ALL');
                        setSelectedKec('ALL');
                      }}
                      className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Kabupaten / Kota:
                  </label>
                  <Select
                    value={selectedKab}
                    onValueChange={(val) => {
                      setSelectedKab(val);
                      setSelectedKec('ALL');
                    }}
                  >
                    <SelectTrigger className="w-full text-xs h-9 bg-background">
                      <SelectValue placeholder="Semua Kabupaten/Kota" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="ALL">Semua Kabupaten/Kota ({kabupatenList.length})</SelectItem>
                      {kabupatenList.map((kab) => (
                        <SelectItem key={kab} value={kab}>
                          {kab}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Kecamatan:
                  </label>
                  <Select
                    value={selectedKec}
                    onValueChange={(val) => setSelectedKec(val)}
                    disabled={selectedKab === 'ALL'}
                  >
                    <SelectTrigger className="w-full text-xs h-9 bg-background">
                      <SelectValue
                        placeholder={
                          selectedKab === 'ALL' ? 'Pilih Kabupaten Terlebih Dahulu' : 'Semua Kecamatan'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="ALL">Semua Kecamatan ({kecamatanList.length})</SelectItem>
                      {kecamatanList.map((kec) => (
                        <SelectItem key={kec} value={kec}>
                          {kec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Live Filter Summary Card */}
            <Card className="border-border bg-gradient-to-br from-emerald-500/5 via-card to-card shadow-xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-border/70">
                  <span className="text-muted-foreground">Desa Terpilih:</span>
                  <span className="font-bold text-foreground">
                    {summaryStats.count.toLocaleString('id-ID')} Desa
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-border/70">
                  <span className="text-muted-foreground">Rata-rata Produktivitas:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {summaryStats.avgProd.toFixed(2)} Ton/km²
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-border/70">
                  <span className="text-muted-foreground">Total Estimasi Produksi:</span>
                  <span className="font-bold text-foreground font-mono">
                    {summaryStats.totalProduksi.toLocaleString('id-ID', { maximumFractionDigits: 1 })}{' '}
                    Ton
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Desa Defisit Pangan:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                    {summaryStats.defisitCount.toLocaleString('id-ID')} (
                    {summaryStats.defisitPercent.toFixed(1)}%)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Interactive Canvas Map & Village Detail Panel (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {loading ? (
              <div className="w-full h-[580px] md:h-[680px] rounded-xl border border-border bg-card flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-500" />
                <span className="text-sm font-medium">Memuat data batas spasial provinsi...</span>
              </div>
            ) : error ? (
              <div className="w-full h-[580px] md:h-[680px] rounded-xl border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center text-center p-6 gap-3">
                <p className="text-destructive font-semibold text-sm">{error}</p>
                {onRetry && (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    Coba Lagi
                  </Button>
                )}
              </div>
            ) : (
              <MapComponent
                boundaryData={boundaryData}
                metricsMap={metricsMap}
                selectedMapType={selectedMapType}
                selectedPeriod={selectedPeriod}
                selectedKab={selectedKab}
                selectedKec={selectedKec}
                globalBreaks={globalBreaks}
                onSelectDesa={(desa) => setSelectedDesa(desa)}
              />
            )}

            {/* Selected Village Detail Card */}
            {selectedDesa && (
              <Card className="border-emerald-500/30 bg-card/95 backdrop-blur-md shadow-lg animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white font-bold text-xs">
                        {selectedDesa.nama_desa}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        ID: {selectedDesa.iddesa}
                      </span>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      Kecamatan {selectedDesa.nama_kec}, Kabupaten {selectedDesa.nama_kab},{' '}
                      {selectedDesa.nama_prov}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDesa(null)}
                    className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                  >
                    Tutup
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    <div className="p-2.5 rounded-lg bg-background border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                        Produktivitas ({selectedPeriod === 'okt_2025' ? 'Okt 25' : selectedPeriod === 'des_2025' ? 'Des 25' : 'Mar 26'})
                      </span>
                      <span className="text-sm font-bold text-foreground font-mono">
                        {selectedDesa.metrics[selectedPeriod]?.produktivitas.toFixed(2) ?? '-'} Ton/km²
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                        Neraca Pangan ({selectedPeriod === 'okt_2025' ? 'Okt 25' : selectedPeriod === 'des_2025' ? 'Des 25' : 'Mar 26'})
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                        {selectedDesa.metrics[selectedPeriod]?.energy_balance_category ?? '-'}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {selectedDesa.metrics[selectedPeriod]?.energy_balance_value > 0 ? '+' : ''}
                        {selectedDesa.metrics[selectedPeriod]?.energy_balance_value.toFixed(0)} Mcal
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                        Status Resilience
                      </span>
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400 block truncate">
                        {formatResilienceDisplay(selectedDesa.metrics.mar_2026?.resilience)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                        Skor Recovery
                      </span>
                      <span className="text-sm font-bold text-foreground font-mono">
                        {((selectedDesa.metrics.mar_2026?.recovery ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
