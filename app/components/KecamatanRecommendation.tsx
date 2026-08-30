'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { IKecamatan } from '@/app/types';
import {
  BookOpen,
  MapPin,
  Search,
  AlertCircle,
  FileText,
  Compass,
  Loader2,
  RotateCcw,
  Sparkles,
  Layers,
  Filter,
} from 'lucide-react';

interface KecamatanRecommendationProps {
  initialProvince?: string;
}

const provinceOptions = [
  { key: 'ALL', label: 'Semua Provinsi (Sumatera)' },
  { key: 'aceh', label: 'Aceh' },
  { key: 'sumut', label: 'Sumatera Utara' },
  { key: 'sumbar', label: 'Sumatera Barat' },
];

export const KecamatanRecommendation: React.FC<KecamatanRecommendationProps> = ({
  initialProvince = 'ALL',
}) => {
  const [selectedProv, setSelectedProv] = useState<string>(initialProvince);
  const [selectedKab, setSelectedKab] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allKecamatans, setAllKecamatans] = useState<IKecamatan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState<number>(30);

  // Fetch narratives/kecamatan.json once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchNarratives = async () => {
      try {
        setLoading(true);
        const res = await fetch('/data/narratives/kecamatan.json');
        if (!res.ok) {
          throw new Error('Gagal memuat berkas narasi rekomendasi kecamatan.');
        }
        const data: IKecamatan[] = await res.json();
        if (isMounted) {
          setAllKecamatans(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Terjadi kesalahan saat memuat narasi kecamatan.');
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

  // Available unique kabupaten list based on selected province
  const availableKabupatenList = useMemo(() => {
    const set = new Set<string>();
    allKecamatans.forEach((k) => {
      if (!k.nama_kab) return;
      if (selectedProv === 'ALL') {
        set.add(k.nama_kab);
      } else {
        const provMatch =
          (selectedProv === 'aceh' && k.nama_prov.toLowerCase().includes('aceh')) ||
          (selectedProv === 'sumut' && k.nama_prov.toLowerCase().includes('utara')) ||
          (selectedProv === 'sumbar' && k.nama_prov.toLowerCase().includes('barat'));
        if (provMatch) {
          set.add(k.nama_kab);
        }
      }
    });
    return Array.from(set).sort();
  }, [allKecamatans, selectedProv]);

  // Reset kabupaten filter if the selected kabupaten is not in the filtered province
  const handleProvinceChange = (newProv: string) => {
    setSelectedProv(newProv);
    setSelectedKab('ALL');
    setDisplayLimit(30);
  };

  const handleResetFilters = () => {
    setSelectedProv('ALL');
    setSelectedKab('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setDisplayLimit(30);
  };

  // Filtered kecamatan list (Default: ALL kecamatan across all provinces)
  const filteredKecamatans = useMemo(() => {
    return allKecamatans.filter((k) => {
      // 1. Province filter
      if (selectedProv !== 'ALL') {
        const provMatch =
          (selectedProv === 'aceh' && k.nama_prov.toLowerCase().includes('aceh')) ||
          (selectedProv === 'sumut' && k.nama_prov.toLowerCase().includes('utara')) ||
          (selectedProv === 'sumbar' && k.nama_prov.toLowerCase().includes('barat'));
        if (!provMatch) return false;
      }

      // 2. Kabupaten filter
      if (selectedKab !== 'ALL') {
        if (k.nama_kab.toLowerCase() !== selectedKab.toLowerCase()) return false;
      }

      // 3. Status filter
      if (selectedStatus !== 'ALL') {
        const text = k.text_narasi.toLowerCase();
        if (selectedStatus === 'defisit' && !text.includes('defisit')) return false;
        if (selectedStatus === 'surplus' && !text.includes('surplus')) return false;
        if (selectedStatus === 'darurat' && !text.includes('darurat') && !text.includes('berat')) return false;
      }

      // 4. Instant Search query across kecamatan, kabupaten, provinsi, and narasi text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchKec = k.nama_kec.toLowerCase().includes(query);
        const matchKab = k.nama_kab.toLowerCase().includes(query);
        const matchProv = k.nama_prov.toLowerCase().includes(query);
        const matchNarasi = k.text_narasi.toLowerCase().includes(query);
        const matchId = k.idkec?.toLowerCase().includes(query);
        if (!matchKec && !matchKab && !matchProv && !matchNarasi && !matchId) return false;
      }

      return true;
    });
  }, [allKecamatans, selectedProv, selectedKab, selectedStatus, searchQuery]);

  // Paginated/limited view to ensure high DOM performance
  const visibleKecamatans = useMemo(() => {
    return filteredKecamatans.slice(0, displayLimit);
  }, [filteredKecamatans, displayLimit]);

  return (
    <section id="recommendations-section" className="py-12 bg-background border-t border-border transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-3 py-1 font-semibold text-xs rounded-full flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Katalog Narasi Kebijakan
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono">
                {allKecamatans.length.toLocaleString('id-ID')} Total Kecamatan
              </Badge>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Rekomendasi Kebijakan Tingkat Kecamatan
            </h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-3xl">
              Daftar narasi rekomendasi kebijakan komprehensif untuk seluruh kecamatan di 3 provinsi Sumatera (Aceh, Sumatera Utara, dan Sumatera Barat) berbasis integrasi neraca pangan dan status ketahanan wilayah.
            </p>
          </div>

          {/* Quick Active Count Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Menampilkan <strong className="text-foreground font-mono">{filteredKecamatans.length.toLocaleString('id-ID')}</strong> narasi
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-card p-5 rounded-xl border border-border backdrop-blur-md shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Dropdown 1: Provinsi (4 Cols) */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Provinsi:</span>
              </label>
              <Select value={selectedProv} onValueChange={handleProvinceChange}>
                <SelectTrigger className="w-full bg-background border-border text-xs h-9">
                  <SelectValue placeholder="Semua Provinsi" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  {provinceOptions.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dropdown 2: Kabupaten / Kota (3 Cols) */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Kabupaten / Kota:</span>
              </label>
              <Select
                value={selectedKab}
                onValueChange={(val) => {
                  setSelectedKab(val);
                  setDisplayLimit(30);
                }}
                disabled={loading}
              >
                <SelectTrigger className="w-full bg-background border-border text-xs h-9">
                  <SelectValue placeholder="Semua Kabupaten/Kota" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground max-h-60">
                  <SelectItem value="ALL">Semua Kabupaten/Kota ({availableKabupatenList.length})</SelectItem>
                  {availableKabupatenList.map((kab) => (
                    <SelectItem key={kab} value={kab}>
                      {kab}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dropdown 3: Status Neraca / Prioritas (2 Cols) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Status Narasi:</span>
              </label>
              <Select
                value={selectedStatus}
                onValueChange={(val) => {
                  setSelectedStatus(val);
                  setDisplayLimit(30);
                }}
              >
                <SelectTrigger className="w-full bg-background border-border text-xs h-9">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="defisit">Defisit Pangan</SelectItem>
                  <SelectItem value="surplus">Surplus Pangan</SelectItem>
                  <SelectItem value="darurat">Bantuan Darurat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input (3 Cols) */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Cari Kecamatan / Kata Kunci:</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik nama kecamatan..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDisplayLimit(30);
                  }}
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

        {/* Results Content Area */}
        {loading ? (
          <div className="h-[380px] bg-card rounded-xl border border-border flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-500" />
            <span className="text-sm font-medium">Memuat katalog seluruh rekomendasi naratif...</span>
          </div>
        ) : error ? (
          <div className="h-[380px] bg-card rounded-xl border border-destructive/30 flex flex-col items-center justify-center text-rose-600 dark:text-rose-400 gap-2 p-6 text-center">
            <AlertCircle className="w-8 h-8" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        ) : filteredKecamatans.length === 0 ? (
          <div className="h-[340px] bg-card rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
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
          <div className="space-y-4">
            {/* Grid of Recommendation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleKecamatans.map((kec) => {
                const isDefisit = kec.text_narasi.toLowerCase().includes('defisit');
                const isDarurat = kec.text_narasi.toLowerCase().includes('darurat') || kec.text_narasi.toLowerCase().includes('berat');
                
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
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Prioritas Pasca-Bencana</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* View More Pagination / Infinite Scroll Bar */}
            {filteredKecamatans.length > displayLimit && (
              <div className="pt-4 flex flex-col items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDisplayLimit((prev) => prev + 30)}
                  className="px-6 text-xs font-semibold bg-card border-border hover:bg-muted"
                >
                  Tampilkan 30 Kecamatan Lainnya ({visibleKecamatans.length} dari {filteredKecamatans.length})
                </Button>
                <button
                  onClick={() => setDisplayLimit(filteredKecamatans.length)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  Tampilkan Semua ({filteredKecamatans.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
