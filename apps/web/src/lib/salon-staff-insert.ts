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

/** Map AddProfessionalForm / profile staff payload to salon_staff table columns only. */
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
  return salonServices
    .filter((service) => isAssignableSalonService(service.status))
    .map((service) => {
      const globalMatch = service.global_service_id ? globalMap[service.global_service_id] : null;
      return {
        id: service.global_service_id || service.id,
        salonServiceId: service.id,
        global_service_id: service.global_service_id,
        name: service.name || globalMatch?.name || "Service",
        category: service.category || globalMatch?.category || "",
        duration_min: service.duration_min,
        duration: service.duration_min,
      };
    });
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
};

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
    services?: Record<string, StaffServiceConfig>;
    working_hours?: {
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
  const configs: Record<string, { enabled: boolean; commission: string; buffer: string; duration: string }> = {};
  for (const service of salonServices) {
    const assigned = workingHours?.assigned_services?.find((row) =>
      serviceIdsMatch(row.service_id, service)
    );
    const fromStaffServices = lookupStaffServiceConfig(member.services, service);
    if (fromStaffServices) {
      configs[service.id] = {
        enabled: Boolean(fromStaffServices.enabled),
        commission: fromStaffServices.commission?.toString() || "10",
        buffer: fromStaffServices.buffer?.toString() || "15",
        duration:
          fromStaffServices.duration?.toString() ||
          service.duration_min?.toString() ||
          "30",
      };
    } else if (assigned) {
      configs[service.id] = {
        enabled: true,
        commission: assigned.commission_rate?.toString() || "10",
        buffer: assigned.buffer_time?.toString() || "15",
        duration:
          assigned.service_time?.toString() ||
          service.duration_min?.toString() ||
          "30",
      };
    } else {
      configs[service.id] = {
        enabled: false,
        commission: "10",
        buffer: "15",
        duration: service.duration_min?.toString() || "30",
      };
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
  const assigned_services = Object.entries(services)
    .filter(([, cfg]) => cfg?.enabled)
    .map(([serviceKey, cfg]) => {
      const matched =
        findSalonServiceForAssignmentId(salonServices, serviceKey) ||
        salonServices.find((s) => (s.global_service_id || s.id) === serviceKey);
      return {
        service_id: matched?.salonServiceId || matched?.id || serviceKey,
        commission_rate: parseFloat(String(cfg?.commission ?? 0)) || 0,
        buffer_time: parseInt(String(cfg?.buffer ?? 0), 10) || 0,
        service_time: parseInt(String(cfg?.duration ?? 0), 10) || matched?.duration_min || 30,
      };
    });

  return {
    schedule,
    general_buffer_time: parseFloat(String(generalBufferTime)) || 15,
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
          staff.general_buffer_time ?? 15,
          staff.services || {},
          []
        );

  return {
    salon_id: salonId,
    name: staff.name || "Staff",
    email: staff.email || null,
    role: staff.role || "stylist",
    commission_rate: staff.commission_rate ?? 0,
    status: staff.status || "active",
    avatar_url: staff.avatar_url || null,
    working_hours: workingHours,
  };
}
