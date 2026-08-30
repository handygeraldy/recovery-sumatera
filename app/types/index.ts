export type PeriodKey = 'okt_2025' | 'des_2025' | 'mar_2026';

export type MapType =
  | 'Produktivitas'
  | 'Produksi Padi'
  | 'Kebutuhan Energi'
  | 'Neraca Pangan'
  | 'Resilience'
  | 'Recovery';

export type MapMetricType = MapType;

export type ProvinceKey = 'aceh' | 'sumut' | 'sumbar';

export interface IDesaMetric {
  produktivitas: number;          // Ton/km² (sesuai productivity_ton_km2)
  produksi: number;               // Ton
  energy_needs: number;           // Mcal
  energy_balance_value: number;   // Mcal (untuk perhitungan persentase defisit/surplus)
  energy_balance_category: string; // Kategorik
  resilience: string;             // Nilai asli dataset (tidak_terdampak, resilient_pulih_penuh, pulih_lambat, pulih_sebagian, memburuk_tidak_pulih)
  recovery: number;               // 0-1 (priority score / recovery index)
}

export interface IDesaData {
  iddesa: string;
  nama_prov: string;
  nama_kab: string;
  nama_kec: string;
  nama_desa: string;
  luas_km2?: number;
  metrics: {
    okt_2025: IDesaMetric;
    des_2025: IDesaMetric;
    mar_2026: IDesaMetric;
    [key: string]: IDesaMetric | undefined;
  };
}

export interface IKecamatan {
  idkec: string;
  nama_prov: string;
  nama_kab: string;
  nama_kec: string;
  text_narasi: string;
  status_prioritas?: 'Tinggi' | 'Sedang' | 'Rendah' | string;
}

export interface IProvincialRecommendation {
  provinsi: string;
  kode: ProvinceKey;
  fokus_utama: string;
  rekomendasi: string[];
  indikator_kunci: string;
  program_prioritas: string[];
}

export interface IKPIStats {
  totalDesa: number;
  desaDefisit: number;
  rataRataProduktivitas: number;
  pulihPenuh: number;
}
