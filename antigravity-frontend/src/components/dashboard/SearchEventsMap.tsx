'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export interface SearchEventMapItem {
  id: string;
  maskedImei: string;
  brand?: string;
  model?: string;
  searchTimestamp: string;
  locationSource: 'BROWSER_GPS' | 'IP_GEOLOCATION' | 'UNAVAILABLE';
  approximateLocation: string;
  latitude: number | null;
  longitude: number | null;
  accuracyRadius: number | null;
  isRead?: boolean;
}

interface SearchEventsMapProps {
  events: SearchEventMapItem[];
  selectedEventId?: string | null;
  onSelectEvent?: (event: SearchEventMapItem) => void;
}

export default function SearchEventsMap({ events, selectedEventId, onSelectEvent }: SearchEventsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const circlesLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Filter events that have valid coordinates
  const validEvents = events.filter(e => typeof e.latitude === 'number' && typeof e.longitude === 'number' && !isNaN(e.latitude) && !isNaN(e.longitude));

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;

      if (!isMounted) return;

      // Default center: Dhaka, Bangladesh [23.8103, 90.4125]
      const defaultCenter: [number, number] = [23.8103, 90.4125];
      const initialZoom = 12;

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: false,
      });

      // Use clean modern CartoDB Positron / OSM style tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomright', prefix: 'Leaflet | © OpenStreetMap contributors' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      const circlesGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersGroup;
      circlesLayerRef.current = circlesGroup;
      setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers whenever events or selectedEventId changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    async function updateMarkers() {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      const markersGroup = markersLayerRef.current;
      const circlesGroup = circlesLayerRef.current;

      markersGroup.clearLayers();
      circlesGroup.clearLayers();

      if (validEvents.length === 0) {
        map.setView([23.8103, 90.4125], 7);
        return;
      }

      const bounds = L.latLngBounds([]);

      validEvents.forEach((ev) => {
        const lat = ev.latitude!;
        const lng = ev.longitude!;
        const isGps = ev.locationSource === 'BROWSER_GPS';
        const isSelected = selectedEventId === ev.id;
        const brand = ev.brand || (ev as any).deviceBrand || 'Device';
        const model = ev.model || (ev as any).deviceModel || '';
        const locName = ev.approximateLocation || (ev as any).locationName || 'Unknown Location';
        const ts = ev.searchTimestamp || (ev as any).timestamp || new Date().toISOString();

        bounds.extend([lat, lng]);

        // Custom radar pin markup
        const markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute w-8 h-8 rounded-full ${isGps ? 'bg-red-500/25 animate-ping' : 'bg-amber-500/25 animate-pulse'}"></div>
            <div class="relative w-5 h-5 rounded-full ${isGps ? 'bg-red-600 ring-4 ring-red-200' : 'bg-amber-600 ring-4 ring-amber-200'} shadow-md flex items-center justify-center text-white text-[10px] font-black">
              ${isGps ? 'GPS' : 'IP'}
            </div>
            ${isSelected ? '<div class="absolute -top-6 bg-indigo-950 text-white font-mono text-[9px] px-2 py-0.5 rounded shadow uppercase font-bold whitespace-nowrap">Selected</div>' : ''}
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-radar-pin',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markersGroup);

        // Accuracy radius circle
        const radiusMeters = isGps ? (ev.accuracyRadius && ev.accuracyRadius > 5 ? ev.accuracyRadius : 35) : 3000;
        const circle = L.circle([lat, lng], {
          radius: radiusMeters,
          color: isGps ? '#ef4444' : '#f59e0b',
          weight: 1.5,
          opacity: 0.8,
          fillColor: isGps ? '#fee2e2' : '#fef3c7',
          fillOpacity: 0.35,
          dashArray: isGps ? undefined : '5, 5',
        }).addTo(circlesGroup);

        // Popup content with required disclaimers
        const popupContent = `
          <div class="p-2 space-y-1.5 font-sans min-w-[210px] text-slate-800">
            <div class="flex items-center justify-between gap-2 border-b border-slate-150 pb-1">
              <span class="font-bold text-xs text-indigo-950">${brand} ${model}</span>
              <span class="text-[9px] font-mono px-1.5 py-0.5 rounded ${isGps ? 'bg-red-100 text-red-700 font-bold' : 'bg-amber-100 text-amber-700 font-semibold'}">
                ${isGps ? 'Browser GPS' : 'IP Approx'}
              </span>
            </div>
            <div class="text-[11px] font-mono font-bold text-slate-600">IMEI: ${ev.maskedImei}</div>
            <div class="text-[10px] text-slate-500 font-medium">📍 ${locName}</div>
            <div class="text-[9px] text-slate-400">🕒 ${new Date(ts).toLocaleString('en-US', { timeZoneName: 'short' })}</div>
            ${isGps && ev.accuracyRadius ? `<div class="text-[9px] text-emerald-700 font-bold">Accuracy Radius: ±${ev.accuracyRadius}m</div>` : ''}
            <div class="pt-1 text-[8px] text-slate-400 leading-tight italic border-t border-slate-100">
              *Log of website search inquiry; does not represent physical device GPS beacon.
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          if (onSelectEvent) onSelectEvent(ev);
        });

        if (isSelected) {
          marker.openPopup();
          map.setView([lat, lng], isGps ? 15 : 12, { animate: true });
        }
      });

      if (!selectedEventId && validEvents.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }

    updateMarkers();
  }, [mapReady, events, selectedEventId]);

  return (
    <div className="relative w-full h-[360px] md:h-[420px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-inner bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-700">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-200 animate-pulse"></span>
          <span>Browser GPS (High Accuracy)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200"></span>
          <span>IP Approx (City Level)</span>
        </div>
      </div>

      {validEvents.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 text-center p-6 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            🗺️
          </div>
          <p className="text-xs font-bold text-indigo-950">No GPS Coordinates Recorded Yet</p>
          <p className="text-[11px] text-slate-400 font-medium max-w-xs">
            Coordinates are only plotted when a searcher grants browser geolocation permission. IP fallbacks and unavailable locations are logged in the event table.
          </p>
        </div>
      )}
    </div>
  );
}
