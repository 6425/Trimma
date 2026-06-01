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
    let geocodedCount = 0;

    territories.forEach(t => {
      const query = t.name + ", Sri Lanka";
      geocoder.geocode({ address: query }, (results, status) => {
        if (!isActive) return;
        
        if (status === 'OK' && results && results[0]) {
          const vp = results[0].geometry.viewport;
          const loc = results[0].geometry.location;
          const placeId = results[0].place_id;
          
          if (vp) {
            bounds.union(vp);
            geocodedCount++;
            
            // 1. Give it to Google: Use Data-Driven Styling for exact map demarcation
            try {
              const localityLayer = map.getFeatureLayer(google.maps.FeatureType.LOCALITY);
              const adminArea1Layer = map.getFeatureLayer(google.maps.FeatureType.ADMINISTRATIVE_AREA_LEVEL_1);
              const adminArea2Layer = map.getFeatureLayer(google.maps.FeatureType.ADMINISTRATIVE_AREA_LEVEL_2);
              const postalCodeLayer = map.getFeatureLayer(google.maps.FeatureType.POSTAL_CODE);
              
              const styleFunction = (params: any) => {
                if (params.feature.placeId === placeId) {
                  return {
                    fillColor: "#F5B700",
                    fillOpacity: 0.25, // Light yellow gradient fill
                    strokeColor: "#F5B700",
                    strokeWeight: 3,
                  };
                }
                return null;
              };

              if (localityLayer) localityLayer.style = styleFunction;
              if (adminArea1Layer) adminArea1Layer.style = styleFunction;
              if (adminArea2Layer) adminArea2Layer.style = styleFunction;
              if (postalCodeLayer) postalCodeLayer.style = styleFunction;
            } catch (err) {
              console.warn("Data-driven styling not fully supported on this map");
            }
            
            // 2. Fallback visual bounds (very subtle rectangle) just in case Data-Driven styling is not enabled in GCP Console
            const rectangle = new google.maps.Rectangle({
              bounds: vp,
              strokeColor: "#F5B700",
              strokeOpacity: 0.3, // made subtle so it doesn't overpower the exact boundary
              strokeWeight: 1,
              fillColor: "#F5B700",
              fillOpacity: 0.05,
              map
            });
            
            // Add a text label in the center of the territory
            const labelMarker = new google.maps.Marker({
              position: loc,
              map,
              label: {
                text: t.name.toUpperCase() + " TERRITORY",
                color: "#000000",
                fontWeight: "900",
                fontSize: "14px",
                className: "bg-[#F5B700] px-2 py-1 rounded shadow"
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0
              }
            });

            overlaysRef.current.push(rectangle, labelMarker);
            
            if (geocodedCount === territories.length || geocodedCount > 0) {
              map.fitBounds(bounds);
            }
          }
        }
      });
    });

    return () => {
      isActive = false;
      overlaysRef.current.forEach(overlay => overlay.setMap(null));
      overlaysRef.current = [];
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
    <div id="territory-map-container" className="w-full h-[600px] bg-zinc-100 rounded-2xl overflow-hidden border border-slate-200 relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={12}
          mapId="trimma_territory_map"
          className="w-full h-full"
          disableDefaultUI={false}
          gestureHandling="auto"
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
