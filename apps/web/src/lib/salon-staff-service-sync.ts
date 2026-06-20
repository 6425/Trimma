import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_SERVICE_DURATION_MINUTES,
  DEFAULT_STAFF_COMMISSION_RATE,
  resolveStaffProfileAssignmentDefaults,
} from "@/lib/salon-staff-insert";

type SalonServiceRow = {
  id: string;
  duration_min?: number | null;
  global_service_id?: string | null;
  status?: string | null;
};

type SalonStaffRow = {
  id: string;
  commission_rate?: number | null;
  working_hours?: unknown;
};

type NormalizedStaffWorkingHours = {
  schedule: unknown;
  general_buffer_time: number;
  assigned_services: Array<Record<string, unknown>>;
};

function normalizeStaffWorkingHours(workingHours: unknown): NormalizedStaffWorkingHours {
  if (Array.isArray(workingHours)) {
    return {
      schedule: workingHours,
      general_buffer_time: 0,
      assigned_services: [] as Array<Record<string, unknown>>,
    };
  }

  if (workingHours && typeof workingHours === "object") {
    const wh = workingHours as Record<string, unknown>;
    return {
      schedule: wh.schedule || [],
      general_buffer_time: Number(wh.general_buffer_time ?? 0) || 0,
      assigned_services: Array.isArray(wh.assigned_services) ? wh.assigned_services : [],
    };
  }

  return {
    schedule: [],
    general_buffer_time: 0,
    assigned_services: [] as Array<Record<string, unknown>>,
  };
}

function isActiveServiceStatus(status: string | null | undefined): boolean {
  return (status || "active").toLowerCase() === "active";
}

function resolveSalonServiceId(
  assignedId: string,
  services: SalonServiceRow[]
): string | null {
  const match = services.find(
    (svc) => svc.id === assignedId || svc.global_service_id === assignedId
  );
  return match?.id || null;
}

/** Ensure salon services are mapped to active staff using salon service UUIDs. */
export async function syncStaffServiceAssignmentsForSalon(
  supabase: SupabaseClient,
  salonId: string
) {
  const [servicesRes, staffRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, duration_min, global_service_id, status")
      .eq("salon_id", salonId),
    supabase
      .from("salon_staff")
      .select("id, commission_rate, working_hours, status")
      .eq("salon_id", salonId)
      .eq("status", "active"),
  ]);

  const allServices = (servicesRes.data || []) as SalonServiceRow[];
  const staff = (staffRes.data || []) as SalonStaffRow[];
  if (!allServices.length || !staff.length) return;

  const activeServices = allServices.filter((svc) => isActiveServiceStatus(svc.status));
  const servicesToSync = activeServices.length > 0 ? activeServices : allServices;

  for (const member of staff) {
    const base = normalizeStaffWorkingHours(member.working_hours);
    const profile = resolveStaffProfileAssignmentDefaults({
      commission_rate: member.commission_rate,
      working_hours: base,
    });

    const normalizedAssigned = (base.assigned_services as Array<Record<string, unknown>>)
      .map((row) => {
        const rawId = String(row.service_id || "");
        const salonServiceId = resolveSalonServiceId(rawId, allServices);
        if (!salonServiceId) return null;
        return {
          ...row,
          service_id: salonServiceId,
          enabled: row.enabled !== false,
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    const covered = new Set(
      normalizedAssigned.map((row) => String(row.service_id))
    );

    for (const svc of servicesToSync) {
      if (!covered.has(svc.id)) {
        normalizedAssigned.push({
          service_id: svc.id,
          commission_rate: profile.commissionRate,
          buffer_time: profile.generalBufferTime,
          service_time: svc.duration_min || DEFAULT_SERVICE_DURATION_MINUTES,
          enabled: true,
        });
      }
    }

    await supabase
      .from("salon_staff")
      .update({
        working_hours: {
          ...base,
          general_buffer_time: profile.generalBufferTime,
          assigned_services: normalizedAssigned,
        },
      })
      .eq("id", member.id);
  }

  if (activeServices.length === 0) {
    const idsToActivate = servicesToSync.map((svc) => svc.id);
    await supabase
      .from("services")
      .update({ status: "active" })
      .in("id", idsToActivate)
      .eq("salon_id", salonId);
  }
}

export function dedupeStaffByNameRole<
  T extends { id?: string; name?: string | null; role?: string | null }
>(staff: T[]): T[] {
  const seen = new Set<string>();
  return staff.filter((member) => {
    const key = `${(member.name || "").trim().toLowerCase()}|${(member.role || "").trim().toLowerCase()}`;
    if (!key || key === "|") return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
