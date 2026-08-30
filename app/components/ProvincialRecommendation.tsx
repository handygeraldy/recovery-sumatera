'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { IProvincialRecommendation } from '@/app/types';
import {
  FileText,
  CheckCircle2,
  Droplets,
  Sprout,
  Mountain,
  Target,
} from 'lucide-react';

const provincialRecommendations: IProvincialRecommendation[] = [
  {
    provinsi: 'Aceh',
    kode: 'aceh',
    fokus_utama: 'Fokus pemulihan infrastruktur irigasi dan distribusi bibit tahan genangan.',
    rekomendasi: [
      'Normalisasi saluran irigasi primer dan sekunder pasca sedimentasi banjir bandang.',
      'Penyaluran varietas benih padi tahan genangan (Inpari 30 Ciherang Sub-1) di wilayah pesisir.',
      'Restorasi tanggul penahan luapan sungai pada sentra sawah produktif di pesisir barat dan utara.',
    ],
    indikator_kunci: 'Peningkatan efisiensi irigasi sawah > 85% & percepatan masa tanam',
    program_prioritas: ['Irigasi Tangguh Bencana', 'Subsidi Benih Unggul Submergence'],
  },
  {
    provinsi: 'Sumatera Utara',
    kode: 'sumut',
    fokus_utama: 'Intervensi pupuk bersubsidi dan optimalisasi lahan pertanian existing.',
    rekomendasi: [
      'Percepatan distribusi alokasi pupuk bersubsidi NPK dan urea pada wilayah sentra defisit.',
      'Optimalisasi indeks pertanaman (IP 200 ke IP 300) melalui mekanisasi pertanian modern.',
      'Penguatan logistik rantai pasok antar-kabupaten surplus (Deli Serdang/Sergai) ke daerah defisit.',
    ],
    indikator_kunci: 'Produktivitas rata-rata meningkat di atas 5.8 Ton/km²',
    program_prioritas: ['Distribusi Pupuk Presisi Spasial', 'Sentra Logistik Karbohidrat'],
  },
  {
    provinsi: 'Sumatera Barat',
    kode: 'sumbar',
    fokus_utama: 'Mitigasi risiko longsor dan perbaikan akses jalan pertanian.',
    rekomendasi: [
      'Pembangunan terasering bertulang vegetatif pada sawah lereng rawan pergerakan tanah.',
      'Rekonstruksi jalan usaha tani (JUT) untuk memulihkan akses distribusi hasil panen perbukitan.',
      'Sistem peringatan dini (EWS) curah hujan tinggi berbasis data satelit CHIRPS pada daerah aliran sungai.',
    ],
    indikator_kunci: 'Reduksi kerugian gagal panen akibat longsor sebesar 60%',
    program_prioritas: ['Sawah Lereng Berkelanjutan', 'Rehabilitasi Akses JUT Prioritas'],
  },
];

const provinceIcons = {
  aceh: <Droplets className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
  sumut: <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
  sumbar: <Mountain className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
};

export const ProvincialRecommendation: React.FC = () => {
  return (
    <section className="py-14 bg-background border-t border-border transition-colors duration-200">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Section 3 • Kebijakan Regional</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Rekomendasi Umum Tingkat Provinsi
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Arahan strategis dan intervensi prioritas per provinsi hasil sintesis pemodelan ketahanan pangan dan tingkat kerentanan pasca-bencana.
          </p>
        </div>

        {/* 3-Column Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {provincialRecommendations.map((item) => (
            <Card
              key={item.kode}
              className="bg-card border-border backdrop-blur-md shadow-md dark:shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                      {provinceIcons[item.kode]}
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs bg-emerald-500/10">
                      Provinsi {item.provinsi}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground tracking-tight">
                    {item.provinsi}
                  </CardTitle>
                  <CardDescription className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1 leading-relaxed">
                    {item.fokus_utama}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Action points */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-semibold text-foreground">Poin Intervensi Strategis:</div>
                    <ul className="space-y-2">
                      {item.rekomendasi.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Target Indicator */}
                  <div className="p-3 rounded-lg bg-muted/60 border border-border text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1">
                      <Target className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Target Kinerja Utama:</span>
                    </div>
                    <p className="text-foreground font-medium text-[11px]">
                      {item.indikator_kunci}
                    </p>
                  </div>
                </CardContent>
              </div>

              {/* Priority Programs Footer */}
              <div className="p-6 pt-0 mt-auto">
                <div className="text-[11px] text-muted-foreground mb-2 font-medium">Program Prioritas:</div>
                <div className="flex flex-wrap gap-1.5">
                  {item.program_prioritas.map((prog, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-muted border border-border text-foreground text-[11px] font-medium"
                    >
                      {prog}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
