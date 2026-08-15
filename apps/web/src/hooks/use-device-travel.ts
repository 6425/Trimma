"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function readInitialOrigin(): DeviceCoords | null {
  if (typeof window === "undefined") return null;
  const stored = readStoredDeviceLocation();
  return stored ? { lat: stored.lat, lng: stored.lng } : null;
}

function sameCoords(a: DeviceCoords | null, b: DeviceCoords | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return Math.abs(a.lat - b.lat) < 0.00001 && Math.abs(a.lng - b.lng) < 0.00001;
}

export function useDeviceTravel(
  salon: SalonMapInput | null,
  originOverride: DeviceCoords | null = null
) {
  const [deviceOrigin, setDeviceOrigin] = useState<DeviceCoords | null>(readInitialOrigin);
  const [status, setStatus] = useState<LocationStatus>(() =>
    originOverride || readInitialOrigin() ? "granted" : "idle"
  );
  const [estimate, setEstimate] = useState<TravelEstimate | null>(null);
  const [loadingTravel, setLoadingTravel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const origin = originOverride || deviceOrigin;

  const destinationKey = useMemo(() => {
    if (!salon) return "";
    return [
      salon.place_id || "",
      salon.latitude ?? "",
      salon.longitude ?? "",
      getSalonFullAddress(salon),
    ].join("|");
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
    setDeviceOrigin((current) => (sameCoords(current, coords) ? current : coords));
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
    if (originOverride) return;
    if (deviceOrigin) return;
    if (!hasLocationConsent()) return;
    requestDeviceLocation({
      onGranted: (coords) => applyCoords({ lat: coords.lat, lng: coords.lng }),
      onDenied: (message) => {
        setStatus("denied");
        setError(message);
      },
    });
  }, [applyCoords, deviceOrigin, originOverride]);

  useEffect(() => {
    const onStored = (event: Event) => {
      const detail = (event as CustomEvent<DeviceCoords>).detail;
      if (detail?.lat && detail?.lng) applyCoords(detail);
    };
    window.addEventListener("trimma-device-location-updated", onStored);
    return () => window.removeEventListener("trimma-device-location-updated", onStored);
  }, [applyCoords]);

  const salonRef = useRef(salon);
  salonRef.current = salon;

  useEffect(() => {
    const currentSalon = salonRef.current;
    if (!origin || !destinationKey || !currentSalon) return;

    const controller = new AbortController();
    const destination = {
      latitude: currentSalon.latitude ?? null,
      longitude: currentSalon.longitude ?? null,
      placeId: currentSalon.place_id ?? null,
      address: getSalonFullAddress(currentSalon),
    };

    void (async () => {
      setLoadingTravel(true);
      setError(null);
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
  }, [origin?.lat, origin?.lng, destinationKey]);

  return {
    status: originOverride ? ("granted" as LocationStatus) : status,
    origin,
    estimate: origin && destinationKey ? estimate : null,
    loadingTravel: Boolean(origin && destinationKey && loadingTravel),
    error,
    requestLocation,
  };
}
