"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SRI_LANKA_PROVINCES,
  type SriLankaProvince,
} from "@/lib/sri-lanka-locations";

const GEOGRAPHY_EVENT = "trimma:geography-updated";
const GEOGRAPHY_STORAGE_KEY = "trimma-geography-updated-at";
let cachedCatalog: SriLankaProvince[] | null = null;
let catalogRequest: Promise<SriLankaProvince[]> | null = null;

async function fetchGeographyCatalog(force = false): Promise<SriLankaProvince[]> {
  if (!force && cachedCatalog) return cachedCatalog;
  if (!force && catalogRequest) return catalogRequest;
  catalogRequest = fetch("/api/geography", { cache: "no-store", credentials: "same-origin" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Geography catalog failed (${response.status}).`);
      const payload = (await response.json()) as { provinces?: SriLankaProvince[] };
      cachedCatalog = payload.provinces?.length ? payload.provinces : SRI_LANKA_PROVINCES;
      return cachedCatalog;
    })
    .catch(() => SRI_LANKA_PROVINCES)
    .finally(() => {
      catalogRequest = null;
    });
  return catalogRequest;
}

export function notifyGeographyCatalogChanged() {
  cachedCatalog = null;
  catalogRequest = null;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GEOGRAPHY_EVENT));
  window.localStorage.setItem(GEOGRAPHY_STORAGE_KEY, String(Date.now()));
}

export function useGeographyCatalog(): SriLankaProvince[] {
  const [provinces, setProvinces] = useState<SriLankaProvince[]>(
    () => cachedCatalog || SRI_LANKA_PROVINCES
  );

  const reload = useCallback(() => {
    void fetchGeographyCatalog(true).then(setProvinces);
  }, []);

  useEffect(() => {
    void fetchGeographyCatalog().then(setProvinces);
    const onStorage = (event: StorageEvent) => {
      if (event.key === GEOGRAPHY_STORAGE_KEY) reload();
    };
    window.addEventListener(GEOGRAPHY_EVENT, reload);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(GEOGRAPHY_EVENT, reload);
      window.removeEventListener("storage", onStorage);
    };
  }, [reload]);

  return provinces;
}
