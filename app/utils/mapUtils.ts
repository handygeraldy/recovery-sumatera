import { MapType, PeriodKey } from '@/app/types';

/**
 * Menentukan apakah suatu layer peta mendukung pemilihan periode tertentu
 * - Neraca Pangan, Produktivitas, Produksi Padi, Kebutuhan Energi: TERSEDIA di semua periode
 * - Resilience & Recovery: HANYA tersedia untuk Mar 2026 (Pasca-Bencana)
 */
export function isPeriodAvailable(mapType: MapType | string, period: PeriodKey | string): boolean {
  const onlyPostDisaster = ['Resilience', 'Recovery'];
  if (onlyPostDisaster.includes(mapType)) {
    return period === 'mar_2026';
  }
  return true;
}

/**
 * Menentukan apakah selector periode secara umum aktif (multi-periode) untuk suatu layer
 */
export function isPeriodSelectorActive(mapType: MapType | string): boolean {
  const onlyPostDisaster = ['Resilience', 'Recovery'];
  return !onlyPostDisaster.includes(mapType);
}

/**
 * Mendapatkan periode default untuk suatu layer
 */
export function getDefaultPeriodForMapType(mapType: MapType | string, currentPeriod?: PeriodKey): PeriodKey {
  const onlyPostDisaster = ['Resilience', 'Recovery'];
  if (onlyPostDisaster.includes(mapType)) {
    return 'mar_2026';
  }
  return currentPeriod || 'mar_2026';
}

/**
 * Mendapatkan daftar periode yang tersedia untuk suatu layer
 */
export function getAvailablePeriods(mapType: MapType | string): PeriodKey[] {
  const onlyPostDisaster = ['Resilience', 'Recovery'];
  if (onlyPostDisaster.includes(mapType)) {
    return ['mar_2026'];
  }
  return ['okt_2025', 'des_2025', 'mar_2026'];
}
