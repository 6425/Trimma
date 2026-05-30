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
  const geocodedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!map || territories.length === 0) return;

    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();
    let geocodedCount = 0;

    territories.forEach(t => {
      if (geocodedRef.current.has(t.name)) return;
      
      const query = t.name + ", Sri Lanka";
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          bounds.union(results[0].geometry.viewport);
          geocodedCount++;
          geocodedRef.current.add(t.name);
          
          // Draw a light polygon for the viewport as a mock boundary if we want
          const vp = results[0].geometry.viewport;
          if (vp) {
            const ne = vp.getNorthEast();
            const sw = vp.getSouthWest();
            const paths = [
              { lat: ne.lat(), lng: ne.lng() },
              { lat: ne.lat(), lng: sw.lng() },
              { lat: sw.lat(), lng: sw.lng() },
              { lat: sw.lat(), lng: ne.lng() },
            ];
            const polygon = new google.maps.Polygon({
              paths,
              strokeColor: "#3f3f46",
              strokeOpacity: 0.5,
              strokeWeight: 2,
              fillColor: "#FFC107",
              fillOpacity: 0.05,
              map
            });
          }
          
          if (geocodedCount > 0) {
            map.fitBounds(bounds);
          }
        }
      });
    });

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
      setOpenInfoWindowId(selectedBusinessId);
    }
  }, [selectedBusinessId]);

  const center = businesses.length > 0 && businesses[0].latitude && businesses[0].longitude
    ? { lat: businesses[0].latitude, lng: businesses[0].longitude }
    : { lat: 6.9271, lng: 79.8612 };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="w-full h-[600px] bg-zinc-100 rounded-2xl overflow-hidden border border-slate-200 relative">
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

                {openInfoWindowId === biz.id && (
                  <InfoWindow
                    position={{ lat: biz.latitude, lng: biz.longitude }}
                    onCloseClick={() => {
                      setOpenInfoWindowId(null);
                      onBusinessSelect(null);
                    }}
                  >
                    <div className="p-1 min-w-[200px] text-zinc-900">
                      <h4 className="font-extrabold text-sm mb-0.5">{biz.name}</h4>
                      <p className="text-xs text-zinc-500 font-semibold mb-2">{biz.category || 'Beauty'}</p>
                      <p className="text-[11px] text-zinc-600 mb-2 leading-relaxed">{biz.address}</p>
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 bg-zinc-900 text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                          Details
                        </button>
                        <button className="flex-1 bg-[#FFC107] text-black text-[10px] font-bold py-1.5 rounded-lg hover:bg-[#FFC107]/90 transition-colors">
                          Directions
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                )}
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
