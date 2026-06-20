import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_STAFF_BUFFER_MINUTES,
  DEFAULT_STAFF_COMMISSION_RATE,
  DEFAULT_SERVICE_DURATION_MINUTES,
} from "@/lib/salon-staff-insert";

type SalonServiceRow = {
  id: string;
  duration_min?: number | null;
  global_service_id?: string | null;
};

type SalonStaffRow = {
  id: string;
  commission_rate?: number | null;
  working_hours?: unknown;
};

function normalizeStaffWorkingHours(workingHours: unknown) {
  if (Array.isArray(workingHours)) {
    return {
      schedule: workingHours,
      general_buffer_time: DEFAULT_STAFF_BUFFER_MINUTES,
      assigned_services: [] as Array<Record<string, unknown>>,
    };
  }

  if (workingHours && typeof workingHours === "object") {
    const wh = workingHours as Record<string, unknown>;
    return {
      schedule: wh.schedule || [],
      general_buffer_time: wh.general_buffer_time ?? DEFAULT_STAFF_BUFFER_MINUTES,
      assigned_services: Array.isArray(wh.assigned_services) ? wh.assigned_services : [],
    };
  }

  return {
    schedule: [],
    general_buffer_time: DEFAULT_STAFF_BUFFER_MINUTES,
    assigned_services: [] as Array<Record<string, unknown>>,
  };
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

/** Ensure every active salon service is mapped to active staff using salon service UUIDs. */
export async function syncStaffServiceAssignmentsForSalon(
  supabase: SupabaseClient,
  salonId: string
) {
  const [servicesRes, staffRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, duration_min, global_service_id")
      .eq("salon_id", salonId)
      .eq("status", "active"),
    supabase
      .from("salon_staff")
      .select("id, commission_rate, working_hours, status")
      .eq("salon_id", salonId)
      .eq("status", "active"),
  ]);

  const services = (servicesRes.data || []) as SalonServiceRow[];
  const staff = (staffRes.data || []) as SalonStaffRow[];
  if (!services.length || !staff.length) return;

  for (const member of staff) {
    const base = normalizeStaffWorkingHours(member.working_hours);
    const normalizedAssigned = (base.assigned_services as Array<Record<string, unknown>>)
      .map((row) => {
        const rawId = String(row.service_id || "");
        const salonServiceId = resolveSalonServiceId(rawId, services);
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

    const staffCommission = Number(member.commission_rate ?? DEFAULT_STAFF_COMMISSION_RATE) || DEFAULT_STAFF_COMMISSION_RATE;

    for (const svc of services) {
      if (!covered.has(svc.id)) {
        normalizedAssigned.push({
          service_id: svc.id,
          commission_rate: staffCommission,
          buffer_time: DEFAULT_STAFF_BUFFER_MINUTES,
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
          assigned_services: normalizedAssigned,
        },
      })
      .eq("id", member.id);
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
