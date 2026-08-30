import { MapType } from '@/app/types';

export function getProductivityColor(value: number): string {
  const breaks = [0, 10, 20, 40, 60, 100];
  const colors = [
    '#f7fbff', // 0-10
    '#deebf7', // 10-20
    '#c6dbef', // 20-40
    '#9ecae1', // 40-60
    '#6baed6', // 60-100
    '#2171b5', // >100
  ];
  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]) return colors[i];
  }
  return colors[colors.length - 1];
}

export function getProductionColor(value: number): string {
  const breaks = [0, 50, 100, 200, 500, 1000];
  const colors = [
    '#fcfbfd',
    '#efedf5',
    '#dadaeb',
    '#bcbddc',
    '#9e9ac8',
    '#756bb1',
    '#54278f',
  ];
  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]) return colors[i];
  }
  return colors[colors.length - 1];
}

export function getEnergyNeedsColor(value: number): string {
  const breaks = [0, 100, 300, 500, 1000, 2000];
  const colors = [
    '#fff5eb',
    '#fee6ce',
    '#fdd0a2',
    '#fdae6b',
    '#fd8d3c',
    '#e6550d',
    '#a63603',
  ];
  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]) return colors[i];
  }
  return colors[colors.length - 1];
}

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

export function getRecoveryColor(value: number): string {
  const intensity = Math.min(Math.max(value, 0), 1);
  const colors = ['#edf8fb', '#b2e2e2', '#66c2a4', '#2ca25f', '#006d2c'];
  const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
  return colors[index];
}

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
