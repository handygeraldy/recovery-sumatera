'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import * as topojson from 'topojson-client';
import { useTheme } from 'next-themes';
import { IDesaData, MapType, PeriodKey } from '@/app/types';
import { Legend } from '@/app/components/Legend';
import { BasemapSelector, BasemapType, BASEMAP_CONFIGS } from '@/app/components/BasemapSelector';
import {
  PALETTES,
  getColorFromBreaks,
  getEnergyBalanceColor,
  getResilienceColor,
  formatResilienceDisplay,
} from '@/utils/colorUtils';

interface MapComponentProps {
  boundaryData: any | null;
  metricsMap: Map<string, IDesaData>;
  selectedMapType: MapType;
  selectedPeriod: PeriodKey;
  selectedKab: string;
  selectedKec: string;
  globalBreaks?: number[];
  onSelectDesa?: (desa: IDesaData | null) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  boundaryData,
  metricsMap,
  selectedMapType,
  selectedPeriod,
  selectedKab,
  selectedKec,
  globalBreaks = [],
  onSelectDesa,
}) => {
  const { resolvedTheme, theme } = useTheme();
  const isDark = resolvedTheme === 'dark' || theme === 'dark';

  // State Basemap default ke Google Hybrid (tanpa API Key)
  const [currentBasemap, setCurrentBasemap] = useState<BasemapType>('hybrid');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);

  // Initialize Leaflet map instance once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const canvasRenderer = L.canvas({ padding: 0.5 });
    canvasRendererRef.current = canvasRenderer;

    const map = L.map(mapContainerRef.current, {
      center: [2.5, 98.5],
      zoom: 7,
      preferCanvas: true,
      zoomControl: false,
    });

    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tile Layer dynamically (Google Hybrid, Satellite, Streets, Esri, OSM)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const config = BASEMAP_CONFIGS[currentBasemap] || BASEMAP_CONFIGS.hybrid;

    const tileLayerOptions: L.TileLayerOptions = {
      attribution: config.attribution,
      maxZoom: config.maxZoom || 20,
    };

    if (config.subdomains && config.subdomains.length > 0) {
      tileLayerOptions.subdomains = config.subdomains;
    }

    const tileLayer = L.tileLayer(config.url, tileLayerOptions).addTo(map);
    tileLayerRef.current = tileLayer;
  }, [currentBasemap, isDark]);

  // Convert TopoJSON to GeoJSON
  const geojsonFeatures = useMemo(() => {
    if (!boundaryData) return null;

    if (boundaryData.type === 'Topology' && boundaryData.objects) {
      const firstKey = Object.keys(boundaryData.objects)[0];
      return topojson.feature(boundaryData, boundaryData.objects[firstKey]) as any;
    }

    if (boundaryData.type === 'FeatureCollection') {
      return boundaryData;
    }

    return null;
  }, [boundaryData]);

  // Dynamic polygon color resolver with Global Quantile Breaks
  const resolvePolygonColor = (metric: any): string => {
    if (!metric) return '#d3d3d3';

    if (selectedMapType === 'Neraca Pangan') {
      return getEnergyBalanceColor(metric.energy_balance_category);
    }
    if (selectedMapType === 'Resilience') {
      return getResilienceColor(metric.resilience);
    }

    let val = 0;
    let palette = PALETTES.produktivitas;

    switch (selectedMapType) {
      case 'Produktivitas':
        val = metric.produktivitas;
        palette = PALETTES.produktivitas;
        break;
      case 'Produksi Padi':
        val = metric.produksi;
        palette = PALETTES.produksi;
        break;
      case 'Kebutuhan Energi':
        val = metric.energy_needs;
        palette = PALETTES.energy_needs;
        break;
      case 'Recovery':
        val = metric.recovery;
        palette = PALETTES.recovery;
        break;
      default:
        return '#d3d3d3';
    }

    return getColorFromBreaks(val, globalBreaks, palette);
  };

  // Re-render GeoJSON polygons when data, breaks, metric, period, or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geojsonFeatures) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }

    const canvasRenderer = canvasRendererRef.current || L.canvas({ padding: 0.5 });

    const geoLayer = L.geoJSON(geojsonFeatures, {
      renderer: canvasRenderer,
      style: (feature: any) => {
        if (!feature || !feature.properties) return {};

        const iddesa = String(
          feature.properties.iddesa || feature.properties.id_desa || feature.id || ''
        );
        const desaData = metricsMap.get(iddesa);

        const periodKey =
          selectedMapType === 'Resilience' || selectedMapType === 'Recovery'
            ? 'mar_2026'
            : selectedPeriod;

        const metric = desaData?.metrics[periodKey];
        const fillColor = resolvePolygonColor(metric);

        const featKab = String(feature.properties.nama_kab || '').toLowerCase();
        const featKec = String(feature.properties.nama_kec || '').toLowerCase();

        // Penyesuaian opasitas poligon agar kontras di atas citra satelit Google Hybrid
        let opacity = 0.78;
        let strokeColor = 'rgba(255, 255, 255, 0.4)';
        let weight = 0.6;

        if (selectedKab && selectedKab !== 'ALL') {
          if (featKab !== selectedKab.toLowerCase()) {
            opacity = 0.15;
            weight = 0.2;
            strokeColor = 'rgba(255, 255, 255, 0.1)';
          } else if (selectedKec && selectedKec !== 'ALL') {
            if (featKec !== selectedKec.toLowerCase()) {
              opacity = 0.25;
              weight = 0.3;
              strokeColor = 'rgba(255, 255, 255, 0.2)';
            } else {
              opacity = 0.92;
              strokeColor = '#10b981';
              weight = 1.6;
            }
          } else {
            opacity = 0.90;
            weight = 1.0;
            strokeColor = '#ffffff';
          }
        }

        return {
          renderer: canvasRenderer,
          fillColor,
          fillOpacity: opacity,
          color: strokeColor,
          weight,
          className: 'desa-polygon',
        } as any;
      },
      onEachFeature: (feature: any, layer: any) => {
        if (!feature || !feature.properties) return;

        const props = feature.properties;
        const iddesa = String(props.iddesa || props.id_desa || feature.id || '');
        const desaData = metricsMap.get(iddesa);

        if (!desaData) return;

        const periodKey =
          selectedMapType === 'Resilience' || selectedMapType === 'Recovery'
            ? 'mar_2026'
            : selectedPeriod;

        const metric = desaData.metrics[periodKey];
        if (!metric) return;

        // Persentase defisit / surplus untuk neraca pangan
        let percentageText = '';
        if (selectedMapType === 'Neraca Pangan') {
          if (metric.energy_needs > 0) {
            const percentage = (metric.energy_balance_value / metric.energy_needs) * 100;
            if (percentage > 0) {
              percentageText = `+${percentage.toFixed(1)}% surplus`;
            } else if (percentage < 0) {
              percentageText = `${percentage.toFixed(1)}% defisit`;
            } else {
              percentageText = '0% (imbang)';
            }
          } else {
            percentageText = '0% (imbang)';
          }
        }

        // Format nilai tooltip
        let valueText = '';
        switch (selectedMapType) {
          case 'Produktivitas':
            valueText = `${metric.produktivitas.toFixed(2)} Ton/km²`;
            break;
          case 'Produksi Padi':
            valueText = `${metric.produksi.toFixed(1)} Ton`;
            break;
          case 'Kebutuhan Energi':
            valueText = `${metric.energy_needs.toFixed(0)} Mcal`;
            break;
          case 'Neraca Pangan':
            valueText = `${metric.energy_balance_category} (${percentageText})`;
            break;
          case 'Resilience':
            valueText = formatResilienceDisplay(metric.resilience);
            break;
          case 'Recovery':
            valueText = `${(metric.recovery * 100).toFixed(0)}%`;
            break;
        }

        const tooltipContent = `
          <div class="space-y-1">
            <div class="font-bold text-emerald-600 dark:text-emerald-400 text-xs">${desaData.nama_desa}</div>
            <div class="text-[10px] text-slate-600 dark:text-slate-300">Kec. ${desaData.nama_kec}, Kab. ${desaData.nama_kab}</div>
            <div class="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-[11px]">
              <span class="text-slate-500 dark:text-slate-400">${selectedMapType}:</span>
              <span class="font-semibold text-slate-900 dark:text-white">${valueText}</span>
            </div>
            ${
              selectedMapType === 'Neraca Pangan'
                ? `<div class="text-[10px] text-slate-500 dark:text-slate-400">Ketersediaan: ${metric.energy_balance_value > 0 ? '+' : ''}${metric.energy_balance_value.toFixed(0)} Mcal</div>`
                : ''
            }
          </div>
        `;

        layer.bindTooltip(tooltipContent, {
          className: 'leaflet-tooltip-custom',
          sticky: true,
          direction: 'top',
        });

        layer.on({
          click: () => {
            if (onSelectDesa) {
              onSelectDesa(desaData);
            }
          },
        });
      },
    } as any);

    geoLayer.addTo(map);
    geojsonLayerRef.current = geoLayer;

    // Zoom to matching bounds
    try {
      if (selectedKab && selectedKab !== 'ALL') {
        const matchingLayers: L.Layer[] = [];
        geoLayer.eachLayer((layer: any) => {
          const props = layer.feature?.properties;
          if (props) {
            const featKab = String(props.nama_kab || '').toLowerCase();
            const featKec = String(props.nama_kec || '').toLowerCase();
            if (featKab === selectedKab.toLowerCase()) {
              if (!selectedKec || selectedKec === 'ALL' || featKec === selectedKec.toLowerCase()) {
                matchingLayers.push(layer);
              }
            }
          }
        });

        if (matchingLayers.length > 0) {
          const group = L.featureGroup(matchingLayers);
          map.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 12 });
        }
      } else {
        const bounds = geoLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      }
    } catch (err) {
      console.error('Error fitting bounds:', err);
    }
  }, [
    geojsonFeatures,
    metricsMap,
    selectedMapType,
    selectedPeriod,
    selectedKab,
    selectedKec,
    globalBreaks,
    onSelectDesa,
    isDark,
  ]);

  return (
    <div className="relative w-full h-[580px] md:h-[680px] rounded-xl overflow-hidden border border-border bg-card shadow-lg dark:shadow-2xl">
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 🧭 1. BASEMAP SELECTOR: KIRI ATAS (Top-Left) 🧭 */}
      <div className="absolute top-4 left-4 z-[500] pointer-events-auto">
        <BasemapSelector
          currentBasemap={currentBasemap}
          onBasemapChange={setCurrentBasemap}
        />
      </div>

      {/* 📊 2. LEGENDA METRIK: KIRI BAWAH (Bottom-Left) 📊 */}
      <div className="absolute bottom-4 left-4 z-[400] pointer-events-auto">
        <Legend
          mapType={selectedMapType}
          period={selectedPeriod}
          breaks={globalBreaks}
        />
      </div>
    </div>
  );
};
