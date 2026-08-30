import { IDesaData, IDesaMetric, MapType } from '@/app/types';

/**
 * Standard continuous color palettes (6 classes for optimal contrast)
 */
export const PALETTES = {
  produktivitas: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#2171b5'],
  produksi: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#756bb1', '#54278f'],
  energy_needs: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#e6550d', '#a63603'],
  recovery: ['#edf8fb', '#b2e2e2', '#66c2a4', '#2ca25f', '#006d2c'],
};

/**
 * Quantile calculation with linear interpolation (standard R-7 / D3 algorithm)
 */
export function quantile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (p <= 0) return sortedValues[0];
  if (p >= 1) return sortedValues[sortedValues.length - 1];
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const fraction = index - lower;
  if (lower + 1 < sortedValues.length) {
    return sortedValues[lower] + fraction * (sortedValues[lower + 1] - sortedValues[lower]);
  }
  return sortedValues[lower];
}

/**
 * Menghitung breakpoints berdasarkan distribusi GLOBAL (semua periode & seluruh provinsi)
 * Menggunakan metode quantile agar setiap kelas memiliki jumlah desa yang seimbang.
 */
export function getGlobalQuantileBreaks(
  allData: IDesaData[],
  metricKey: keyof IDesaMetric,
  numClasses: number = 6
): number[] {
  if (!allData || allData.length === 0) return [];

  // Kumpulkan semua nilai numerik dari 3 periode
  const values: number[] = [];
  const periods: Array<keyof IDesaData['metrics']> = ['okt_2025', 'des_2025', 'mar_2026'];

  for (const desa of allData) {
    if (!desa.metrics) continue;
    for (const period of periods) {
      const metric = desa.metrics[period];
      if (metric) {
        const val = metric[metricKey];
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          values.push(val);
        }
      }
    }
  }

  if (values.length === 0) return [];

  // Urutkan nilai menaik
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;

  // Jika variasi sangat kecil (< 0.01) atau semua bernilai sama
  if (range < 0.01 || (min === 0 && max === 0)) {
    const step = Math.max(0.01, range / numClasses || 1);
    const breaks: number[] = [];
    for (let i = 1; i < numClasses; i++) {
      breaks.push(min + i * step);
    }
    breaks.push(max + step);
    return breaks;
  }

  // Hitung quantiles untuk membentuk interval kelas seimbang
  const breaks: number[] = [];
  for (let i = 1; i < numClasses; i++) {
    const q = quantile(sorted, i / numClasses);
    breaks.push(q);
  }
  // Tambahkan nilai maksimum sebagai batas akhir
  breaks.push(max);

  // Bersihkan duplikat (jika banyak nilai identik)
  const uniqueBreaks = Array.from(new Set(breaks.map((b) => Number(b.toFixed(4))))).sort(
    (a, b) => a - b
  );

  return uniqueBreaks;
}

/**
 * Mapping warna poligon berdasarkan breakpoints global
 */
export function getColorFromBreaks(
  value: number,
  breaks: number[],
  palette: string[]
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '#d3d3d3'; // Abu-abu jika data kosong
  }

  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]) {
      return palette[i] || palette[palette.length - 1];
    }
  }
  return palette[palette.length - 1];
}

/**
 * Warna kategorik Neraca Pangan (Diverging RdYlGn)
 */
export function getEnergyBalanceColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Rawan Pangan Berat': '#d73027',    // Merah tua
    'Rawan Pangan': '#fc8d59',          // Merah-oranye
    'Rentan Pangan': '#fee08b',         // Kuning
    'Tahan Pangan': '#d9ef8b',          // Hijau muda
    'Sangat Tahan Pangan': '#91cf60',   // Hijau sedang
    'Swasembada (Imbang)': '#1a9850',   // Hijau tua
    'Swasembada': '#1a9850',
    'Data Tidak Tersedia': '#d3d3d3',   // Abu-abu
  };
  return colorMap[category] || colorMap['Data Tidak Tersedia'];
}

/**
 * Warna kategorik Resilience Class (5 kelas resmi)
 */
export function getResilienceColor(category: string): string {
  const colorMap: Record<string, string> = {
    'tidak_terdampak': '#2b83ba',        // Biru
    'resilient_pulih_penuh': '#abdda4',  // Hijau muda
    'pulih_lambat': '#fdae61',           // Oranye
    'pulih_sebagian': '#fee08b',         // Kuning
    'memburuk_tidak_pulih': '#d7191c',   // Merah
    'Tidak Tersedia': '#d3d3d3',         // Abu-abu
  };
  const key = String(category || '').toLowerCase().trim();
  return colorMap[key] || colorMap['Tidak Tersedia'];
}

/**
 * Format teks display untuk Resilience Class
 */
export function formatResilienceDisplay(val: string | undefined): string {
  if (!val || val === 'Tidak Tersedia') return 'Tidak Tersedia';
  const mapping: Record<string, string> = {
    tidak_terdampak: 'Tidak Terdampak',
    resilient_pulih_penuh: 'Resilient - Pulih Penuh',
    pulih_lambat: 'Pulih Lambat',
    pulih_sebagian: 'Pulih Sebagian',
    memburuk_tidak_pulih: 'Memburuk - Tidak Pulih',
  };
  const lower = val.toLowerCase().trim();
  return mapping[lower] || val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
