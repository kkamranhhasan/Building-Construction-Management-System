import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ExternalLink, Layers } from 'lucide-react';

interface SiteMiniMapProps {
  latitude: number;
  longitude: number;
  radiusMeters?: number | null;
  siteName: string;
}

export default function SiteMiniMap({
  latitude,
  longitude,
  radiusMeters = 300,
  siteName,
}: SiteMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);

  const googleRoadUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
  const googleSatUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const tile = L.tileLayer(isSatellite ? googleSatUrl : googleRoadUrl, {
        maxZoom: 21,
      }).addTo(map);

      tileLayerRef.current = tile;

      // Custom pulsing pin
      const icon = L.divIcon({
        className: 'mini-map-pin',
        html: `
          <div style="position: relative; width: 36px; height: 36px; transform: translate(-50%, -100%);">
            <div style="
              width: 32px;
              height: 32px;
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);
              border: 3px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 8px 16px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              margin: auto;
            ">
              <div style="width: 10px; height: 10px; background: #fff; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      L.marker([latitude, longitude], { icon })
        .addTo(map)
        .bindPopup(`<b>${siteName}</b>`);

      // Geofence circle
      L.circle([latitude, longitude], {
        radius: radiusMeters || 300,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map);

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, radiusMeters]);

  // Toggle satellite layer
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const tile = L.tileLayer(isSatellite ? googleSatUrl : googleRoadUrl, {
      maxZoom: 21,
    }).addTo(mapRef.current);
    tileLayerRef.current = tile;
  }, [isSatellite]);

  return (
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-border shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Controls Overlay */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsSatellite(!isSatellite)}
          className="bg-card/90 backdrop-blur-md border border-border hover:bg-card text-foreground px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-md flex items-center gap-1 transition-all"
        >
          <Layers className="w-3 h-3 text-primary" />
          <span>{isSatellite ? 'Road Map' : 'Satellite'}</span>
        </button>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary hover:bg-primary/90 text-foreground px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-md flex items-center gap-1 transition-all"
        >
          <span>Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Bottom Coordinates Overlay */}
      <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
        <div className="bg-card/90 backdrop-blur-md border border-border px-3 py-1 rounded-xl text-[10px] font-mono font-bold text-foreground shadow-sm">
          {latitude.toFixed(5)}, {longitude.toFixed(5)} (±{radiusMeters || 300}m)
        </div>
      </div>
    </div>
  );
}
