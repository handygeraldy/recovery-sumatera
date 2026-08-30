'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Search,
  BookOpen,
  Filter,
  RotateCcw,
  Sparkles,
  MapPin,
  Loader2,
  FileText,
  AlertCircle,
  Building,
} from 'lucide-react';
import { ProvinceKey } from '@/app/types';

interface IKecamatanNarrative {
  idkec?: string;
  nama_prov: string;
  nama_kab: string;
  nama_kec: string;
  text_narasi: string;
}

interface KecamatanRecommendationProps {
  initialProvince?: ProvinceKey | 'ALL';
}

export const KecamatanRecommendation: React.FC<KecamatanRecommendationProps> = ({
  initialProvince = 'ALL',
}) => {
  const [allKecamatans, setAllKecamatans] = useState<IKecamatanNarrative[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>(initialProvince);
  const [selectedKabupatenFilter, setSelectedKabupatenFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch data narasi seluruh kecamatan
  useEffect(() => {
    let isMounted = true;

    const fetchNarratives = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/data/narratives/kecamatan.json');
        if (!res.ok) {
          throw new Error('Gagal memuat katalog rekomendasi naratif kecamatan.');
        }

        const data: IKecamatanNarrative[] = await res.json();
        if (isMounted) {
          setAllKecamatans(data);
        }
      } catch (err: any) {
        console.error('Error fetching narratives:', err);
        if (isMounted) {
          setError(err.message || 'Terjadi kendala saat memuat data rekomendasi.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNarratives();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update filter provinsi jika initialProvince berubah
  useEffect(() => {
    if (initialProvince) {
      setSelectedProvinceFilter(initialProvince);
      setSelectedKabupatenFilter('ALL');
    }
  }, [initialProvince]);

  // Unique list of provinces
  const provinceOptions = useMemo(() => {
    const set = new Set<string>();
    allKecamatans.forEach((k) => {
      if (k.nama_prov) set.add(k.nama_prov);
    });
    return Array.from(set).sort();
  }, [allKecamatans]);

  // Unique list of kabupaten filtered by selected province
  const kabupatenOptions = useMemo(() => {
    const set = new Set<string>();
    allKecamatans.forEach((k) => {
      if (
        selectedProvinceFilter === 'ALL' ||
        k.nama_prov.toLowerCase() === selectedProvinceFilter.toLowerCase() ||
        (selectedProvinceFilter === 'aceh' && k.nama_prov.toLowerCase() === 'aceh') ||
        (selectedProvinceFilter === 'sumut' && k.nama_prov.toLowerCase() === 'sumatera utara') ||
        (selectedProvinceFilter === 'sumbar' && k.nama_prov.toLowerCase() === 'sumatera barat')
      ) {
        if (k.nama_kab) set.add(k.nama_kab);
      }
    });
    return Array.from(set).sort();
  }, [allKecamatans, selectedProvinceFilter]);

  // Filtered dataset
  const filteredKecamatans = useMemo(() => {
    return allKecamatans.filter((kec) => {
      // 1. Filter Provinsi
      if (selectedProvinceFilter !== 'ALL') {
        const provNorm = kec.nama_prov.toLowerCase();
        if (selectedProvinceFilter === 'aceh' && provNorm !== 'aceh') return false;
        if (selectedProvinceFilter === 'sumut' && provNorm !== 'sumatera utara') return false;
        if (selectedProvinceFilter === 'sumbar' && provNorm !== 'sumatera barat') return false;
        if (
          !['aceh', 'sumut', 'sumbar'].includes(selectedProvinceFilter) &&
          provNorm !== selectedProvinceFilter.toLowerCase()
        ) {
          return false;
        }
      }

      // 2. Filter Kabupaten
      if (
        selectedKabupatenFilter !== 'ALL' &&
        kec.nama_kab.toLowerCase() !== selectedKabupatenFilter.toLowerCase()
      ) {
        return false;
      }

      // 3. Filter Status (Defisit vs Surplus vs Darurat)
      if (selectedStatusFilter !== 'ALL') {
        const text = kec.text_narasi.toLowerCase();
        if (selectedStatusFilter === 'defisit' && !text.includes('defisit')) return false;
        if (selectedStatusFilter === 'surplus' && !text.includes('surplus')) return false;
        if (
          selectedStatusFilter === 'darurat' &&
          !text.includes('darurat') &&
          !text.includes('berat')
        )
          return false;
      }

      // 4. Search Query (Nama Kecamatan, Kabupaten, atau isi narasi)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchKec = kec.nama_kec.toLowerCase().includes(q);
        const matchKab = kec.nama_kab.toLowerCase().includes(q);
        const matchProv = kec.nama_prov.toLowerCase().includes(q);
        const matchText = kec.text_narasi.toLowerCase().includes(q);
        if (!matchKec && !matchKab && !matchProv && !matchText) return false;
      }

      return true;
    });
  }, [allKecamatans, selectedProvinceFilter, selectedKabupatenFilter, selectedStatusFilter, searchQuery]);

  const handleResetFilters = () => {
    setSelectedProvinceFilter('ALL');
    setSelectedKabupatenFilter('ALL');
    setSelectedStatusFilter('ALL');
    setSearchQuery('');
  };

  return (
    <section className="py-12 bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 px-3 py-1 font-semibold text-xs rounded-full flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Katalog Rekomendasi Spasial
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono">
                {allKecamatans.length.toLocaleString('id-ID')} Total Kecamatan
              </Badge>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Rekomendasi Kebijakan Tingkat Kecamatan
            </h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
              Panduan tindak lanjut berbasis bukti data untuk intervensi logistik pangan, rehabilitasi
              irigasi, dan bantuan darurat di tingkat kecamatan.
            </p>
          </div>

          <div className="text-xs text-muted-foreground font-medium bg-card px-3 py-2 rounded-lg border border-border">
            Menampilkan <span className="font-bold text-foreground">{filteredKecamatans.length}</span> dari {allKecamatans.length} kecamatan
          </div>
        </div>

        {/* Filter Toolbar Container */}
        <div className="bg-card/90 backdrop-blur-xs p-4 rounded-xl border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border/80 text-xs font-bold text-foreground">
            <Filter className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Filter Rekomendasi Kecamatan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
            {/* Filter Provinsi (3 Cols) */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span>Provinsi:</span>
              </label>
              <Select
                value={selectedProvinceFilter}
                onValueChange={(val) => {
                  setSelectedProvinceFilter(val);
                  setSelectedKabupatenFilter('ALL');
                }}
              >
                <SelectTrigger className="w-full text-xs h-9 bg-background">
                  <SelectValue placeholder="Semua Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Provinsi (Sumatera)</SelectItem>
                  <SelectItem value="aceh">Aceh</SelectItem>
                  <SelectItem value="sumut">Sumatera Utara</SelectItem>
                  <SelectItem value="sumbar">Sumatera Barat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Kabupaten (3 Cols) */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Building className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span>Kabupaten / Kota:</span>
              </label>
              <Select
                value={selectedKabupatenFilter}
                onValueChange={(val) => setSelectedKabupatenFilter(val)}
              >
                <SelectTrigger className="w-full text-xs h-9 bg-background">
                  <SelectValue placeholder="Semua Kabupaten" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="ALL">Semua Kabupaten/Kota ({kabupatenOptions.length})</SelectItem>
                  {kabupatenOptions.map((kab) => (
                    <SelectItem key={kab} value={kab}>
                      {kab}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Status (2 Cols) */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Kondisi Pangan:
              </label>
              <Select
                value={selectedStatusFilter}
                onValueChange={(val) => setSelectedStatusFilter(val)}
              >
                <SelectTrigger className="w-full text-xs h-9 bg-background">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="defisit">Defisit Pangan</SelectItem>
                  <SelectItem value="surplus">Surplus Pangan</SelectItem>
                  <SelectItem value="darurat">Bantuan Darurat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input (3 Cols) */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Search className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span>Cari Kecamatan:</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik nama kecamatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 rounded-md bg-background border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Reset Button (1 Col) */}
            <div className="md:col-span-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                title="Reset Semua Filter"
                className="w-full h-9 text-xs flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground border-border"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Reset</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ✅ CONTAINER DENGAN FIXED HEIGHT & VERTICAL SCROLL */}
        <div className="border border-border rounded-2xl overflow-hidden bg-card/60 backdrop-blur-xs shadow-md">
          {/* Scrollable Area */}
          <div className="h-[520px] md:h-[580px] overflow-y-auto p-4 md:p-5 scrollbar-thin">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-500" />
                <span className="text-sm font-medium">Memuat katalog seluruh rekomendasi naratif...</span>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-rose-600 dark:text-rose-400 gap-2 p-6 text-center">
                <AlertCircle className="w-8 h-8" />
                <span className="text-sm font-semibold">{error}</span>
              </div>
            ) : filteredKecamatans.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <FileText className="w-10 h-10 text-muted-foreground/60 mb-2" />
                <h4 className="text-sm font-bold text-foreground">Tidak Ada Rekomendasi yang Cocok</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Tidak ditemukan kecamatan yang memenuhi kriteria filter atau kata kunci &quot;{searchQuery}&quot;.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="mt-4 text-xs h-8"
                >
                  Reset Filter
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredKecamatans.map((kec) => {
                  const textLower = kec.text_narasi.toLowerCase();
                  const isDarurat = textLower.includes('darurat') || textLower.includes('berat');
                  const isDefisit = textLower.includes('defisit');

                  return (
                    <Card
                      key={`${kec.idkec || ''}-${kec.nama_prov}-${kec.nama_kab}-${kec.nama_kec}`}
                      className="bg-card border-border hover:border-emerald-500/50 transition-all duration-200 shadow-xs flex flex-col justify-between group"
                    >
                      <CardHeader className="p-4 pb-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-sm font-bold text-foreground tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              Kec. {kec.nama_kec}
                            </CardTitle>
                            <CardDescription className="text-[11px] text-muted-foreground font-medium mt-0.5">
                              {kec.nama_kab}, {kec.nama_prov}
                            </CardDescription>
                          </div>

                          {/* Status Pill Badge */}
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 flex-shrink-0 font-semibold border ${
                              isDarurat
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : isDefisit
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isDarurat ? 'Defisit Berat' : isDefisit ? 'Defisit' : 'Surplus'}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-between">
                        <div className="text-xs text-foreground/90 leading-relaxed bg-background/80 p-3 rounded-lg border border-border/80 text-justify">
                          {kec.text_narasi}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50 font-mono">
                          <span>ID: {kec.idkec || '-'}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Prioritas Pasca-Bencana
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Bar di bawah Container */}
          <div className="px-4 py-2.5 text-xs text-muted-foreground border-t border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-medium">
              Menampilkan <span className="font-bold text-foreground">{filteredKecamatans.length}</span> narasi rekomendasi kecamatan
            </span>
            <span className="text-[11px] text-muted-foreground/80">
              Scroll secara vertikal di dalam area untuk menelusuri seluruh data
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
