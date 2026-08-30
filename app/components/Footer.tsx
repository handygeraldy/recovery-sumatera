'use client';

import React from 'react';
import { ShieldCheck, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-muted/30 border-t border-border text-muted-foreground text-xs py-12 transition-colors duration-200">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-border">
          {/* Col 1: Brand & Description */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-700 dark:from-emerald-500 dark:to-teal-600 flex items-center justify-center text-white dark:text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20">
                RS
              </div>
              <span className="text-base font-bold text-foreground tracking-tight">
                Recovery <span className="text-emerald-600 dark:text-emerald-400">Sumatera</span>
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-xs max-w-md">
              Platform dashboard analisis geospasial ketahanan pangan dan pemantauan pemulihan pasca-bencana tingkat desa/kelurahan di Aceh, Sumatera Utara, dan Sumatera Barat.
            </p>
          </div>

          {/* Col 2: Sumber Data Satelit & Sensor */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-foreground font-semibold text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Sumber Data & Citra Penginderaan Jauh</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded bg-card border border-border text-foreground">
                BPS (Badan Pusat Statistik)
              </span>
              <span className="px-2.5 py-1 rounded bg-card border border-border text-foreground">
                Sentinel-2 (MSI ESA)
              </span>
              <span className="px-2.5 py-1 rounded bg-card border border-border text-foreground">
                CHIRPS (Precipitation)
              </span>
              <span className="px-2.5 py-1 rounded bg-card border border-border text-foreground">
                SMAP (Soil Moisture)
              </span>
              <span className="px-2.5 py-1 rounded bg-card border border-border text-foreground">
                NASADEM (Topografi & Elevasi)
              </span>
              <span className="px-2.5 py-1 rounded bg-card border border-border text-foreground">
                Dynamic World (LULC Real-time)
              </span>
            </div>
          </div>

          {/* Col 3: Disclaimer Resmi */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-foreground font-semibold text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Disclaimer Indikatif</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed bg-card p-3 rounded-lg border border-border">
              Data ini merupakan hasil estimasi pemodelan spasial dan bersifat indikatif. Untuk keperluan resmi, harap merujuk pada data resmi yang dirilis.
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted-foreground text-[11px]">
          <div>
            &copy; 2026 Handy Bayu. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Sistem Informasi Geografis Recovery Sumatera</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
