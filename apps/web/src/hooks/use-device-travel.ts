"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TravelEstimate } from "@/lib/google-travel";
import type { SalonMapInput } from "@/lib/salon-map";
import { getSalonFullAddress } from "@/lib/salon-map";

export type DeviceCoords = { lat: number; lng: number };

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable";

export function useDeviceTravel(salon: SalonMapInput | null) {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [origin, setOrigin] = useState<DeviceCoords | null>(null);
  const [estimate, setEstimate] = useState<TravelEstimate | null>(null);
  const [loadingTravel, setLoadingTravel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination = useMemo(() => {
    if (!salon) return null;
    return {
      latitude: salon.latitude ?? null,
      longitude: salon.longitude ?? null,
      placeId: salon.place_id ?? null,
      address: getSalonFullAddress(salon),
    };
  }, [
    salon?.place_id,
    salon?.latitude,
    salon?.longitude,
    salon?.address,
    salon?.city,
    salon?.district,
    salon?.province,
    salon?.name,
  ]);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setError("Location is not available on this device.");
      return;
    }

    setStatus("requesting");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus("granted");
      },
      () => {
        setStatus("denied");
        setError("Allow location access to see distance and travel time.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 }
    );
  }, []);

  useEffect(() => {
    if (!origin || !destination) {
      setEstimate(null);
      return;
    }

    const controller = new AbortController();
    setLoadingTravel(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch("/api/maps/travel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            originLat: origin.lat,
            originLng: origin.lng,
            ...destination,
          }),
        });
        const payload = (await response.json()) as TravelEstimate & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Could not calculate a route.");
        }
        setEstimate({ fastest: payload.fastest, options: payload.options });
      } catch (err) {
        if (controller.signal.aborted) return;
        setEstimate(null);
        setError(err instanceof Error ? err.message : "Could not calculate a route.");
      } finally {
        if (!controller.signal.aborted) setLoadingTravel(false);
      }
    })();

    return () => controller.abort();
  }, [origin, destination]);

  return { status, origin, estimate, loadingTravel, error, requestLocation };
}
