"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TravelEstimate } from "@/lib/google-travel";
import type { SalonMapInput } from "@/lib/salon-map";
import { getSalonFullAddress } from "@/lib/salon-map";
import {
  hasLocationConsent,
  readStoredDeviceLocation,
  requestDeviceLocation,
  saveCookieConsent,
  readCookieConsent,
  DEFAULT_COOKIE_CONSENT,
} from "@/lib/cookie-consent";

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

  const applyCoords = useCallback((coords: DeviceCoords) => {
    setOrigin(coords);
    setStatus("granted");
    setError(null);
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setError("Location is not available on this device. Turn on GPS or location services, then try again.");
      return;
    }

    const storedConsent = readCookieConsent() || DEFAULT_COOKIE_CONSENT;
    saveCookieConsent({
      essential: true,
      analytics: storedConsent.analytics,
      functional: storedConsent.functional,
      marketing: storedConsent.marketing,
      location: true,
    });

    setStatus("requesting");
    setError(null);
    requestDeviceLocation({
      onGranted: (coords) => applyCoords({ lat: coords.lat, lng: coords.lng }),
      onDenied: (message) => {
        setStatus("denied");
        setError(message);
      },
    });
  }, [applyCoords]);

  useEffect(() => {
    const stored = readStoredDeviceLocation();
    if (stored) {
      applyCoords({ lat: stored.lat, lng: stored.lng });
      return;
    }
    if (hasLocationConsent()) {
      setStatus("requesting");
      requestDeviceLocation({
        onGranted: (coords) => applyCoords({ lat: coords.lat, lng: coords.lng }),
        onDenied: (message) => {
          setStatus("denied");
          setError(message);
        },
      });
    }
  }, [applyCoords]);

  useEffect(() => {
    const onStored = (event: Event) => {
      const detail = (event as CustomEvent<DeviceCoords>).detail;
      if (detail?.lat && detail?.lng) applyCoords(detail);
    };
    window.addEventListener("trimma-device-location-updated", onStored);
    return () => window.removeEventListener("trimma-device-location-updated", onStored);
  }, [applyCoords]);

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
