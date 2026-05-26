export type SalonAmenityState = {
  has_amenity: boolean;
  quantity: number | null;
};

export type SalonAmenityRow = {
  amenity_id: string;
  value: string;
};

export type PublicSalonAmenity = {
  name: string;
  icon_name: string;
  quantity: number | null;
  type: string;
};

export function parseSalonAmenityValue(
  type: string,
  value: string | null | undefined
): SalonAmenityState {
  if (type === "number") {
    const quantity = parseInt(String(value ?? ""), 10) || 0;
    return {
      has_amenity: quantity > 0,
      quantity: quantity > 0 ? quantity : null,
    };
  }

  return {
    has_amenity: value === "true",
    quantity: null,
  };
}

export function buildSalonAmenityInsert(
  salonId: string,
  amenityId: string,
  type: string,
  state: SalonAmenityState
) {
  if (type === "number") {
    const quantity = state.quantity ?? 0;
    if (quantity <= 0) return null;
    return { salon_id: salonId, amenity_id: amenityId, value: String(quantity) };
  }

  if (!state.has_amenity) return null;
  return { salon_id: salonId, amenity_id: amenityId, value: "true" };
}

export function formatPublicSalonAmenity(
  globalAmenity: { name: string; icon_name: string; type: string },
  row: SalonAmenityRow
): PublicSalonAmenity | null {
  if (globalAmenity.type === "number") {
    const quantity = parseInt(String(row.value), 10) || 0;
    if (quantity <= 0) return null;
    return {
      name: globalAmenity.name,
      icon_name: globalAmenity.icon_name,
      quantity,
      type: globalAmenity.type,
    };
  }

  if (row.value !== "true") return null;
  return {
    name: globalAmenity.name,
    icon_name: globalAmenity.icon_name,
    quantity: null,
    type: globalAmenity.type,
  };
}
