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
export function normalizeSalonStaffInsertRow(
  staff: SalonStaffFormInput,
  salonId: string
): Record<string, unknown> | null {
  if (staff.id) return null;

  const assignedServices = staff.services
    ? Object.entries(staff.services)
        .filter(([, cfg]) => cfg?.enabled)
        .map(([serviceId, cfg]) => ({
          service_id: serviceId,
          commission_rate: parseFloat(String(cfg?.commission ?? 0)) || 0,
          buffer_time: parseInt(String(cfg?.buffer ?? 0), 10) || 0,
          service_time: parseInt(String(cfg?.duration ?? 30), 10) || 30,
        }))
    : [];

  const workingHours =
    staff.working_hours && typeof staff.working_hours === "object" && !Array.isArray(staff.working_hours)
      ? staff.working_hours
      : {
          schedule: staff.schedule || {},
          general_buffer_time: staff.general_buffer_time ?? 15,
          assigned_services: assignedServices,
        };

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
