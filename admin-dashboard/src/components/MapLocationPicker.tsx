import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Check, 
  X, 
  Loader2 
} from 'lucide-react';

export interface MapLocationResult {
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

interface MapLocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  initialRadius?: number | null;
  initialAddress?: string;
  onSelect: (result: MapLocationResult) => void;
  onClose: () => void;
}

// Google Maps & OSM tile layers
const MAP_LAYERS = {
  googleRoadmap: {
    name: 'Google Maps (Road)',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 21,
  },
  googleHybrid: {
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite',
    maxZoom: 21,
  },
  googleTerrain: {
    name: 'Google Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Terrain',
    maxZoom: 20,
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
};

type LayerKey = keyof typeof MAP_LAYERS;

export default function MapLocationPicker({
  initialLat,
  initialLng,
  initialRadius = 300,
  initialAddress = '',
  onSelect,
  onClose,
}: MapLocationPickerProps) {
  // Default to Dhaka coordinates if nothing provided
  const defaultLat = initialLat && !isNaN(initialLat) ? initialLat : 23.8103;
  const defaultLng = initialLng && !isNaN(initialLng) ? initialLng : 90.4125;

  const [selectedLat, setSelectedLat] = useState<number>(defaultLat);
  const [selectedLng, setSelectedLng] = useState<number>(defaultLng);
  const [radius, setRadius] = useState<number>(initialRadius || 300);
  const [address, setAddress] = useState<string>(initialAddress || '');
  const [activeLayer, setActiveLayer] = useState<LayerKey>('googleRoadmap');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Custom pulsing pin icon using L.divIcon
  const createCustomIcon = () => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position: relative; width: 44px; height: 44px; transform: translate(-50%, -100%);">
          <div style="
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: rgba(37, 99, 235, 0.35);
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border: 3px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: auto;
          ">
            <div style="
              width: 14px;
              height: 14px;
              background: #ffffff;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
    });
  };

  // Reverse geocode to get readable address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'S-Islam-ERP-Construction-App/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          // Format a clean address
          const addr = data.address || {};
          const parts = [
            addr.building || addr.road || addr.suburb || addr.neighbourhood,
            addr.city_district || addr.city || addr.town || addr.municipality,
            addr.state || addr.country
          ].filter(Boolean);

          const cleanAddr = parts.length > 0 ? parts.join(', ') : data.display_name;
          setAddress(cleanAddr);
        }
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    } finally {
      setGeocoding(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 16,
        zoomControl: false,
      });

      // Add zoom control top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Add default tile layer
      const layerConfig = MAP_LAYERS[activeLayer];
      const tileLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Add marker
      const marker = L.marker([defaultLat, defaultLng], {
        icon: createCustomIcon(),
        draggable: true,
      }).addTo(map);

      markerRef.current = marker;

      // Add geofence circle
      const circle = L.circle([defaultLat, defaultLng], {
        radius: radius,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.18,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(map);

      circleRef.current = circle;

      // Map click handler: snap marker to clicked spot
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setSelectedLat(lat);
        setSelectedLng(lng);
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
      });

      // Marker drag handler
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setSelectedLat(pos.lat);
        setSelectedLng(pos.lng);
        circle.setLatLng(pos);
        reverseGeocode(pos.lat, pos.lng);
      });

      mapRef.current = map;

      // If no address was provided initially, reverse geocode default position
      if (!initialAddress) {
        reverseGeocode(defaultLat, defaultLng);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when layer key changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const layerConfig = MAP_LAYERS[activeLayer];
    const newLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
    }).addTo(mapRef.current);
    tileLayerRef.current = newLayer;
  }, [activeLayer]);

  // Update Geofence Circle Radius
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  // Handle Search Places via Nominatim
  const handleSearchPlaces = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        { headers: { 'User-Agent': 'S-Islam-ERP-Construction-App/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.warn('Place search error:', e);
    } finally {
      setSearching(false);
    }
  };

  // Select place from search results
  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSelectedLat(lat);
    setSelectedLng(lng);
    setAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery('');

    if (mapRef.current && markerRef.current && circleRef.current) {
      mapRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
    }
  };

  // Detect GPS
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setDetectingGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedLat(lat);
        setSelectedLng(lng);

        if (mapRef.current && markerRef.current && circleRef.current) {
          mapRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
          markerRef.current.setLatLng([lat, lng]);
          circleRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
      },
      err => {
        setDetectingGps(false);
        alert('Could not acquire GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    onSelect({
      address: address || `Lat: ${selectedLat.toFixed(5)}, Lng: ${selectedLng.toFixed(5)}`,
      latitude: Number(selectedLat.toFixed(6)),
      longitude: Number(selectedLng.toFixed(6)),
      radiusMeters: radius,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl w-full max-w-5xl h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        
        {/* Top Header */}
        <div className="p-4 sm:px-6 bg-card border-b border-border flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <span>Google Maps Location Picker</span>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                  Interactive
                </span>
              </h2>
              <p className="text-muted-foreground text-xs font-medium">
                Click anywhere on the map or drag the pin to select site coordinates & address.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Layer Controls Bar */}
        <div className="p-3 sm:px-6 bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Place Search Form */}
          <form onSubmit={handleSearchPlaces} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search city, area, road (e.g. Gulshan 2, Dhaka)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border text-foreground pl-9 pr-20 py-2 rounded-2xl text-xs outline-none focus:border-primary font-medium shadow-sm"
            />
            <button
              type="submit"
              disabled={searching}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 text-foreground px-3 py-1 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
            </button>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-muted border-b border-border/50 last:border-0 flex items-start gap-2 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Map Layer Switcher & GPS Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleUseCurrentGPS}
              disabled={detectingGps}
              className="px-3 py-1.5 rounded-xl bg-card hover:bg-muted text-foreground border border-border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Fly to your GPS location"
            >
              {detectingGps ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-primary" />
              )}
              <span>GPS</span>
            </button>

            <div className="flex items-center bg-card border border-border rounded-xl p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveLayer('googleRoadmap')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeLayer === 'googleRoadmap'
                    ? 'bg-primary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Google Road
              </button>
              <button
                type="button"
                onClick={() => setActiveLayer('googleHybrid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeLayer === 'googleHybrid'
                    ? 'bg-primary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setActiveLayer('googleTerrain')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeLayer === 'googleTerrain'
                    ? 'bg-primary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Terrain
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Leaflet Map Container */}
        <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Floating Instructions Pill */}
          <div className="absolute top-3 left-14 z-20 pointer-events-none hidden sm:block">
            <div className="bg-card/90 backdrop-blur-md border border-border/80 px-3.5 py-1.5 rounded-2xl shadow-lg text-[11px] font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Click map or drag pin to position site</span>
            </div>
          </div>
        </div>

        {/* Bottom Details & Confirmation Panel */}
        <div className="p-4 sm:px-6 bg-card border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0">
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Selected Location:
              </span>
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                Geofence: ±{radius}m
              </span>
            </div>

            {/* Editable address field */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Address or location name..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-muted border border-border text-foreground px-3 py-2 rounded-xl text-xs outline-none focus:border-primary font-medium"
                />
                {geocoding && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    <span>Resolving...</span>
                  </div>
                )}
              </div>

              {/* Radius Quick Selector */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border shrink-0">
                {[150, 300, 500, 1000].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadius(r)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      radius === r ? 'bg-primary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-primary hover:bg-primary/90 text-foreground px-6 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-lg shadow-primary/25 flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
