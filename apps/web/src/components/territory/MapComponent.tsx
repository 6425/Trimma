/// <reference types="google.maps" />
"use client";

import React, { useState, useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { MapPin, Building2, Store } from "lucide-react";

export type BusinessResult = {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  logo_url: string | null;
  is_verified: boolean;
  rating: number;
  status: string;
};

export type Territory = {
  id: string;
  name: string;
  type: string;
};

function TerritoryBounds({ territories }: { territories: Territory[] }) {
  const map = useMap();
  const overlaysRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || territories.length === 0) return;
    
    let isActive = true;
    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();

    const processTerritories = async () => {
      let geocodedCount = 0;

      for (const t of territories) {
        if (!isActive) break;

        let success = false;
        
        // 1. Try Nominatim first for exact polygons
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(t.name + ", Sri Lanka")}&format=json&polygon_geojson=1&limit=1&email=admin@trimma.ai`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const data = await res.json();
          
          if (!isActive) break;

          if (data && data[0]) {
            const loc = new google.maps.LatLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
            const vp = data[0].boundingbox; // [latMin, latMax, lonMin, lonMax]
            
            bounds.extend(new google.maps.LatLng(parseFloat(vp[0]), parseFloat(vp[2])));
            bounds.extend(new google.maps.LatLng(parseFloat(vp[1]), parseFloat(vp[3])));
            geocodedCount++;
            success = true;

            if (data[0].geojson) {
              try {
                map.data.addGeoJson({
                  type: "Feature",
                  geometry: data[0].geojson,
                  properties: { name: t.name }
                });
                map.data.setStyle({
                  fillColor: "#F5B700",
                  fillOpacity: 0.25, 
                  strokeColor: "#F5B700",
                  strokeWeight: 2,
                  clickable: false 
                });
              } catch (e) {
                console.warn("GeoJSON parse failed", e);
              }
            }
            
            const labelMarker = new google.maps.Marker({
              position: loc,
              map,
              label: {
                text: t.name.toUpperCase() + " TERRITORY",
                color: "#000000",
                fontWeight: "900",
                fontSize: "14px",
                className: "bg-[#F5B700] px-2 py-1 rounded shadow font-sans"
              },
              icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 }
            });
            overlaysRef.current.push(labelMarker);

            // Sleep to respect Nominatim rate limits (1 req/sec)
            await new Promise(r => setTimeout(r, 1000));
          }
        } catch (err) {
          console.warn("Nominatim failed for " + t.name, err);
        }

        if (success) continue;
        if (!isActive) break;

        // 2. Fallback to Google Geocoder
        try {
          const response = await geocoder.geocode({ address: t.name + ", Sri Lanka" });
          if (response.results && response.results[0]) {
            const vp = response.results[0].geometry.viewport;
            const loc = response.results[0].geometry.location;
            if (vp) bounds.union(vp);
            geocodedCount++;
            
            const rectangle = new google.maps.Rectangle({
              bounds: vp,
              strokeColor: "#F5B700",
              strokeOpacity: 0.3,
              strokeWeight: 1,
              fillColor: "#F5B700",
              fillOpacity: 0.05,
              clickable: false,
              map
            });
            
            const labelMarker = new google.maps.Marker({
              position: loc,
              map,
              label: {
                text: t.name.toUpperCase() + " TERRITORY",
                color: "#000000",
                fontWeight: "900",
                fontSize: "14px",
                className: "bg-[#F5B700] px-2 py-1 rounded shadow font-sans"
              },
              icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 }
            });

            overlaysRef.current.push(rectangle, labelMarker);
          }
        } catch (err) {
          console.error("Google Geocoder failed for " + t.name, err);
        }
      }

      if (isActive && geocodedCount > 0) {
        map.fitBounds(bounds);
      }
    };

    processTerritories();

    return () => {
      isActive = false;
      overlaysRef.current.forEach(overlay => overlay.setMap(null));
      overlaysRef.current = [];
      if (map && map.data) {
        map.data.forEach((feature) => {
          map.data.remove(feature);
        });
      }
    };
  }, [map, territories]);

  return null;
}

type MapComponentProps = {
  businesses: BusinessResult[];
  territories: Territory[];
  selectedBusinessId: string | null;
  onBusinessSelect: (id: string | null) => void;
};

export function MapComponent({ businesses, territories, selectedBusinessId, onBusinessSelect }: MapComponentProps) {
  const [openInfoWindowId, setOpenInfoWindowId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBusinessId) {
      setTimeout(() => setOpenInfoWindowId(selectedBusinessId), 0);
    }
  }, [selectedBusinessId]);

  const center = businesses.length > 0 && businesses[0].latitude && businesses[0].longitude
    ? { lat: businesses[0].latitude, lng: businesses[0].longitude }
    : { lat: 6.9271, lng: 79.8612 };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div id="territory-map-container" className="w-full h-[400px] lg:h-[600px] bg-zinc-100 rounded-2xl overflow-hidden border border-slate-200 relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={12}
          mapId="trimma_territory_map"
          className="w-full h-full"
          disableDefaultUI={false}
          gestureHandling="greedy"
        >
          {businesses.map((biz) => {
            if (!biz.latitude || !biz.longitude) return null;
            const isSelected = selectedBusinessId === biz.id;
            
            return (
              <AdvancedMarker
                key={biz.id}
                position={{ lat: biz.latitude, lng: biz.longitude }}
                onClick={() => {
                  onBusinessSelect(biz.id);
                  setOpenInfoWindowId(biz.id);
                }}
              >
                <div className={`
                  flex items-center justify-center rounded-full shadow-lg transition-transform
                  ${isSelected ? 'scale-125 z-10 bg-zinc-900 text-[#FFC107]' : 'scale-100 bg-[#FFC107] text-black'}
                `} style={{ width: 40, height: 40, border: isSelected ? '2px solid white' : 'none' }}>
                  <Store className="w-5 h-5" />
                </div>
              </AdvancedMarker>
            );
          })}
          
          <TerritoryBounds territories={territories} />
        </Map>
      </APIProvider>
      {!apiKey && (
        <div className="absolute top-4 left-4 right-4 bg-red-50/90 text-red-600 p-3 rounded-xl border border-red-200 text-xs font-bold text-center backdrop-blur-sm z-50 shadow-sm">
          Google Maps API Key is missing (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY). Using restricted development map.
        </div>
      )}
    </div>
  );
}
