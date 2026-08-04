import { sanitizeText } from "@/lib/sanitize-input";

type StaffServiceConfig = {
  enabled?: boolean;
  commission?: string | number;
  buffer?: string | number;
  duration?: string | number;
};

export type SalonStaffFormInput = {
  id?: string;
  name?: string;
  email?: string | null;
  role?: string;
  commission_rate?: number;
  general_buffer_time?: number;
  schedule?: Record<string, unknown>;
  services?: Record<string, StaffServiceConfig>;
  avatar_url?: string | null;
  avatarBlob?: unknown;
  status?: string;
  working_hours?: unknown;
  salon_id?: string;
};

export const DEFAULT_STAFF_ROLES = [
  { role_name: "Stylist", category: "Operational" },
  { role_name: "Barber", category: "Operational" },
  { role_name: "Therapist", category: "Operational" },
  { role_name: "Manager", category: "Admin" },
  { role_name: "Reception", category: "Admin" },
];

export function resolveEffectiveStaffRoles(
  globalRoles: Array<{ role_name?: string | null; category?: string | null; id?: string }> = []
) {
  const filtered = globalRoles.filter((role) => role.category !== "Grade" && role.role_name);
  return filtered.length > 0 ? filtered : DEFAULT_STAFF_ROLES;
}

/** Services the owner can map to staff (active + inactive/pending; not deleted). */
export function isAssignableSalonService(status?: string | null): boolean {
  const normalized = (status || "active").toLowerCase();
  return normalized !== "deleted";
}

export function parseStaffWorkingHours(workingHours: unknown): {
  schedule?: Record<string, unknown>;
  general_buffer_time?: number;
  assigned_services?: Array<{
    service_id: string;
    commission_rate?: number | null;
    buffer_time?: number | null;
    service_time?: number | null;
  }>;
} | null {
  if (!workingHours) return null;
  if (typeof workingHours === "string") {
    try {
      const parsed = JSON.parse(workingHours);
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as ReturnType<typeof parseStaffWorkingHours>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof workingHours === "object" && !Array.isArray(workingHours)) {
    return workingHours as ReturnType<typeof parseStaffWorkingHours>;
  }
  return null;
}

export function mapSalonServicesForStaffForm(
  salonServices: Array<{
    id: string;
    global_service_id?: string | null;
    name?: string | null;
    category?: string | null;
    duration_min?: number | null;
    status?: string | null;
  }>,
  globalServices: Array<{ id: string; name?: string | null; category?: string | null }> = []
): SalonServiceAssignmentRow[] {
  const globalMap = Object.fromEntries(globalServices.map((g) => [g.id, g]));
  const mapped = salonServices
    .filter((service) => isAssignableSalonService(service.status))
    .map((service) => {
      const globalMatch = service.global_service_id ? globalMap[service.global_service_id] : null;
      return {
        id: service.id,
        salonServiceId: service.id,
        global_service_id: service.global_service_id,
        name: service.name || globalMatch?.name || "Service",
        category: service.category || globalMatch?.category || "",
        duration_min: service.duration_min,
        duration: service.duration_min,
        status: (service.status || "active").toLowerCase(),
      };
    });

  return deduplicateSalonServicesForStaffForm(mapped);
}

function normalizeSalonServiceName(name?: string | null) {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function preferStaffServiceRow(
  candidate: SalonServiceAssignmentRow,
  incumbent: SalonServiceAssignmentRow
): boolean {
  const candidateActive = (candidate.status || "active") === "active";
  const incumbentActive = (incumbent.status || "active") === "active";
  if (candidateActive !== incumbentActive) {
    return candidateActive;
  }

  const candidateHasGlobal = Boolean(candidate.global_service_id);
  const incumbentHasGlobal = Boolean(incumbent.global_service_id);
  if (candidateHasGlobal !== incumbentHasGlobal) {
    return candidateHasGlobal;
  }
  return false;
}

/**
 * One row per catalog service for staff assignment UI.
 * Imported services often start as inactive until staff are mapped — include them.
 * When duplicates exist (same global id or display name), prefer the active row.
 */
export function deduplicateSalonServicesForStaffForm(
  rows: SalonServiceAssignmentRow[]
): SalonServiceAssignmentRow[] {
  const bestByGlobalId = new Map<string, SalonServiceAssignmentRow>();
  const bestByName = new Map<string, SalonServiceAssignmentRow>();
  const withoutKey: SalonServiceAssignmentRow[] = [];

  for (const row of rows) {
    if (row.global_service_id) {
      const key = row.global_service_id;
      const existing = bestByGlobalId.get(key);
      if (!existing || preferStaffServiceRow(row, existing)) {
        bestByGlobalId.set(key, row);
      }
      continue;
    }

    const nameKey = normalizeSalonServiceName(row.name);
    if (nameKey) {
      const existing = bestByName.get(nameKey);
      if (!existing || preferStaffServiceRow(row, existing)) {
        bestByName.set(nameKey, row);
      }
      continue;
    }

    withoutKey.push(row);
  }

  return [...bestByGlobalId.values(), ...bestByName.values(), ...withoutKey].sort((a, b) =>
    normalizeSalonServiceName(a.name).localeCompare(normalizeSalonServiceName(b.name))
  );
}

function serviceIdsMatch(
  assignedId: string,
  service: SalonServiceAssignmentRow
): boolean {
  return (
    assignedId === service.id ||
    assignedId === service.salonServiceId ||
    (service.global_service_id != null && assignedId === service.global_service_id)
  );
}

function lookupStaffServiceConfig(
  services: Record<string, StaffServiceConfig> | undefined,
  service: SalonServiceAssignmentRow
): StaffServiceConfig | undefined {
  if (!services) return undefined;
  return (
    services[service.id] ||
    (service.salonServiceId ? services[service.salonServiceId] : undefined) ||
    (service.global_service_id ? services[service.global_service_id] : undefined)
  );
}

export type SalonServiceAssignmentRow = {
  id: string;
  salonServiceId?: string | null;
  global_service_id?: string | null;
  name?: string | null;
  duration_min?: number | null;
  status?: string | null;
};

export const DEFAULT_STAFF_COMMISSION_RATE = 10;
export const DEFAULT_SERVICE_DURATION_MINUTES = 30;

export type StaffProfileAssignmentDefaults = {
  commissionRate: number;
  generalBufferTime: number;
};

/** Commission + buffer saved on the staff profile — used for every service allocation. */
export function resolveStaffProfileAssignmentDefaults(member: {
  commission_rate?: number | null;
  general_buffer_time?: number | null;
  working_hours?: {
    general_buffer_time?: number | null;
  } | null;
}): StaffProfileAssignmentDefaults {
  const workingHours = parseStaffWorkingHours(member.working_hours) || member.working_hours;
  const generalBufferRaw =
    member.general_buffer_time ??
    workingHours?.general_buffer_time;

  return {
    commissionRate: Number(member.commission_rate ?? DEFAULT_STAFF_COMMISSION_RATE) || DEFAULT_STAFF_COMMISSION_RATE,
    generalBufferTime:
      generalBufferRaw != null && String(generalBufferRaw).trim() !== ""
        ? Number(generalBufferRaw) || 0
        : 0,
  };
}

/** Defaults applied when a salon owner allocates a service to a staff member. */
export function buildDefaultStaffServiceConfig(
  service: SalonServiceAssignmentRow,
  staffCommissionRate?: number | null,
  generalBufferTime?: number | string | null
) {
  const duration =
    service.duration_min != null && service.duration_min > 0
      ? service.duration_min
      : DEFAULT_SERVICE_DURATION_MINUTES;

  const buffer =
    generalBufferTime != null && generalBufferTime !== ""
      ? String(generalBufferTime)
      : "0";

  return {
    enabled: false,
    commission: String(staffCommissionRate ?? DEFAULT_STAFF_COMMISSION_RATE),
    buffer,
    duration: String(duration),
  };
}

/** Merge salon service catalog into form state using staff profile defaults for new rows. */
export function mergeSalonServicesIntoStaffConfig(
  existing: Record<string, { enabled?: boolean; commission?: string; buffer?: string; duration?: string }>,
  salonServices: SalonServiceAssignmentRow[],
  profile: StaffProfileAssignmentDefaults
) {
  const merged: Record<string, { enabled: boolean; commission: string; buffer: string; duration: string }> = {};

  for (const service of salonServices) {
    const defaults = buildDefaultStaffServiceConfig(
      service,
      profile.commissionRate,
      profile.generalBufferTime
    );
    const current = existing[service.id];
    merged[service.id] = {
      enabled: Boolean(current?.enabled),
      commission: current?.commission ?? defaults.commission,
      buffer: current?.buffer ?? defaults.buffer,
      duration: current?.duration ?? defaults.duration,
    };
  }

  return merged;
}

/** Apply staff profile commission/buffer to every service row (keeps enabled state + durations). */
export function applyStaffProfileRatesToServiceConfig(
  config: Record<string, { enabled?: boolean; commission?: string; buffer?: string; duration?: string }>,
  salonServices: SalonServiceAssignmentRow[],
  profile: StaffProfileAssignmentDefaults
) {
  const next = { ...config };

  for (const service of salonServices) {
    const defaults = buildDefaultStaffServiceConfig(
      service,
      profile.commissionRate,
      profile.generalBufferTime
    );
    const current = next[service.id];
    next[service.id] = {
      enabled: Boolean(current?.enabled),
      commission: String(profile.commissionRate),
      buffer: String(profile.generalBufferTime),
      duration: current?.duration ?? defaults.duration,
    };
  }

  return next;
}

export function findSalonServiceForAssignmentId(
  salonServices: SalonServiceAssignmentRow[],
  assignedId: string
): SalonServiceAssignmentRow | undefined {
  return salonServices.find(
    (s) =>
      s.id === assignedId ||
      s.salonServiceId === assignedId ||
      (s.global_service_id != null && s.global_service_id === assignedId)
  );
}

export function buildStaffServicesConfigFromMember(
  member: {
    commission_rate?: number | null;
    general_buffer_time?: number | null;
    services?: Record<string, StaffServiceConfig>;
    working_hours?: {
      general_buffer_time?: number | null;
      assigned_services?: Array<{
        service_id: string;
        commission_rate?: number | null;
        buffer_time?: number | null;
        service_time?: number | null;
      }>;
    } | null;
  },
  salonServices: SalonServiceAssignmentRow[]
) {
  const workingHours = parseStaffWorkingHours(member.working_hours) || member.working_hours;
  const profile = resolveStaffProfileAssignmentDefaults(member);

  const configs: Record<string, { enabled: boolean; commission: string; buffer: string; duration: string }> = {};
  for (const service of salonServices) {
    const defaults = buildDefaultStaffServiceConfig(
      service,
      profile.commissionRate,
      profile.generalBufferTime
    );
    const assigned = workingHours?.assigned_services?.find((row) =>
      serviceIdsMatch(row.service_id, service)
    );
    const fromStaffServices = lookupStaffServiceConfig(member.services, service);
    if (fromStaffServices) {
      configs[service.id] = {
        enabled: Boolean(fromStaffServices.enabled),
        commission: fromStaffServices.commission?.toString() || defaults.commission,
        buffer:
          fromStaffServices.buffer != null && fromStaffServices.buffer !== ""
            ? String(fromStaffServices.buffer)
            : defaults.buffer,
        duration:
          fromStaffServices.duration?.toString() ||
          assigned?.service_time?.toString() ||
          defaults.duration,
      };
    } else if (assigned) {
      configs[service.id] = {
        enabled: true,
        commission:
          assigned.commission_rate != null
            ? String(assigned.commission_rate)
            : defaults.commission,
        buffer:
          assigned.buffer_time != null ? String(assigned.buffer_time) : defaults.buffer,
        duration:
          assigned.service_time != null
            ? String(assigned.service_time)
            : defaults.duration,
      };
    } else {
      configs[service.id] = defaults;
    }
  }
  return configs;
}

export function buildStaffWorkingHoursPayload(
  schedule: Record<string, unknown>,
  generalBufferTime: number | string,
  services: Record<string, { enabled?: boolean; commission?: string | number; buffer?: string | number; duration?: string | number }>,
  salonServices: SalonServiceAssignmentRow[]
) {
  const assignedByServiceId = new Map<
    string,
    {
      service_id: string;
      commission_rate: number;
      buffer_time: number;
      service_time: number;
    }
  >();

  for (const [serviceKey, cfg] of Object.entries(services)) {
    if (!cfg?.enabled) continue;

    const matched =
      findSalonServiceForAssignmentId(salonServices, serviceKey) ||
      salonServices.find((s) => (s.global_service_id || s.id) === serviceKey);
    const serviceId = matched?.salonServiceId || matched?.id || serviceKey;

    assignedByServiceId.set(serviceId, {
      service_id: serviceId,
      commission_rate: parseFloat(String(cfg?.commission ?? 0)) || 0,
      buffer_time: parseInt(String(cfg?.buffer ?? 0), 10) || 0,
      service_time: parseInt(String(cfg?.duration ?? 0), 10) || matched?.duration_min || 30,
    });
  }

  const assigned_services = Array.from(assignedByServiceId.values());

  return {
    schedule,
    general_buffer_time: parseFloat(String(generalBufferTime)) || 0,
    assigned_services,
  };
}

export function normalizeSalonStaffInsertRow(
  staff: SalonStaffFormInput,
  salonId: string
): Record<string, unknown> | null {
  if (staff.id) return null;

  const workingHours =
    staff.working_hours && typeof staff.working_hours === "object" && !Array.isArray(staff.working_hours)
      ? staff.working_hours
      : buildStaffWorkingHoursPayload(
          (staff.schedule || {}) as Record<string, unknown>,
          staff.general_buffer_time ?? 0,
          staff.services || {},
          []
        );

  return {
    salon_id: salonId,
    name: sanitizeText(staff.name || "Staff"),
    email: sanitizeText(staff.email || "") || null,
    role: sanitizeText(staff.role || "stylist"),
    commission_rate: staff.commission_rate ?? 0,
    status: staff.status || "active",
    avatar_url: staff.avatar_url || null,
    working_hours: workingHours,
  };
}
