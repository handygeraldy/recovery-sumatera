# Metodologi Penelitian & Knowledge Base: Studi Ketahanan Pangan & Pemulihan Pasca-Bencana (Sumatera)

## 1. Ringkasan Penelitian & Ruang Lingkup
Penelitian ini mengembangkan sistem pemantauan dan pemodelan spasial multi-temporal untuk menganalisis dampak bencana hidrometeorologi terhadap ketahanan pangan dan kapasitas pemulihan (resilience) di tiga provinsi pulau Sumatera:
1. **Aceh** (6.519 desa)
2. **Sumatera Utara** (6.113 desa)
3. **Sumatera Barat** (1.268 desa)
Total cakupan wilayah adalah 13.900 desa / kelurahan.

## 2. Periode Waktu Analisis
- **Okt 2025 (Pra-Bencana):** Kondisi dasar (baseline) produktivitas dan ketersediaan pangan sebelum puncak anomali cuaca / bencana.
- **Des 2025 (Saat Bencana):** Periode terjadinya dampak bencana (banjir, tanah longsor, anomali curah hujan ekstrem) yang memicu penurunan panen dan kerusakan lahan.
- **Mar 2026 (Pasca-Bencana):** Periode pemulihan awal dan panen raya pasca-rehabilitasi, evaluasi ketahanan (resilience) dan indeks pemulihan (recovery).

## 3. Sumber Data & Variabel Penginderaan Jauh (Remote Sensing)
- **Sentinel-2 Multispectral Imagery (ESA):** Ekstraksi indeks vegetasi NDVI (Normalized Difference Vegetation Index) dan NDDI (Normalized Difference Drought Index) untuk mendeteksi kesehatan tanaman padi dan cekaman air.
- **CHIRPS (Climate Hazards Group InfraRed Precipitation with Station data):** Estimasi curah hujan presipitasi bulanan (mm).
- **NASA SMAP (Soil Moisture Active Passive):** Kelembapan tanah pada lapisan perakaran (root zone soil moisture).
- **NASADEM / Copernicus DEM:** Elevasi (Altitude, meter) dan kemiringan lereng (Slope, derajat).
- **Dynamic World (ESA / Google):** Klasifikasi tutupan lahan (LULC) real-time resolusi 10m (crops, trees, water, flooded vegetation, built).
- **Data Sosial Ekonomi BPS (2018-2025):** Rekapitulasi muatan statistik desa, data luas sawah panen historis, jumlah penduduk per desa, dan Angka Kecukupan Energi (AKE).

## 4. Definisi Variabel & Rumus Perhitungan
- **Produktivitas Padi (`produktivitas`):** Dihitung dalam satuan **Ton per kilometer persegi (Ton/km²)**. Diestimasi menggunakan model CatBoost Regressor berbasis fitur biofisik dan penginderaan jauh.
- **Produksi Padi (`produksi`):** Total estimasi gabah kering panen dalam satuan **Ton** per desa.
- **Kebutuhan Energi (`energy_needs`):** Total kebutuhan kalori penduduk desa per periode dalam satuan **Megakalori (Mcal)**, dihitung dari: $\text{Populasi Desa} \times 2.100\text{ kcal/kapita/hari} \times \text{Jumlah Hari}$.
- **Neraca Pangan / Energy Balance (`energy_balance_value`):** Selisih ketersediaan energi kalori beras dikurangi total kebutuhan energi penduduk (Mcal).
  - Nilai $> 0$: Surplus Pangan
  - Nilai $< 0$: Defisit Pangan (Rawan Pangan)
- **Kategori Neraca Pangan (`energy_balance_category`):**
  - **Rawan Pangan Berat:** Defisit $> 50\%$ dari total kebutuhan energi.
  - **Rawan Pangan:** Defisit $10\% - 50\%$ dari total kebutuhan.
  - **Rentan Pangan:** Defisit $< 10\%$ dari total kebutuhan.
  - **Swasembada (Imbang):** Defisit / Surplus $= 0$.
  - **Tahan Pangan:** Surplus $\le 50\%$ dari total kebutuhan.
  - **Sangat Tahan Pangan:** Surplus $> 50\%$ dari total kebutuhan.
- **Klasifikasi Resilience (`resilience`):**
  1. `resilient_pulih_penuh`: Wilayah terdampak yang berhasil memulihkan kapasitas produksi secara optimal pasca-bencana.
  2. `tidak_terdampak`: Wilayah yang tidak mengalami penurunan signifikan atau relatif aman dari dampak bencana.
  3. `pulih_sebagian`: Wilayah yang menunjukkan pemulihan parsial namun belum mencapai level pra-bencana.
  4. `pulih_lambat`: Wilayah dengan pemulihan lambat akibat kerusakan infrastruktur irigasi atau logistik.
  5. `memburuk_tidak_pulih`: Wilayah kritis yang mengalami kegagalan panen berkepanjangan dan membutuhkan bantuan darurat.
- **Skor Recovery (`recovery`):** Indeks kuantitatif kontinu bernilai $0.0 - 1.0$ yang mengukur laju kecepatan pemulihan produktivitas desa dari Des 2025 ke Mar 2026.
