import {
  getServiceIdsCoveredByStaff,
  salonHasActiveStaff,
  type SalonStaffForAllocation,
} from "@/lib/staff-allocation";

export type SalonSetupStep = {
  id: "staff" | "services" | "map" | "live";
  step: number;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  done: boolean;
  current: boolean;
};

type SalonServiceRow = { id: string; status?: string | null };

export function getSalonSetupSteps(
  services: SalonServiceRow[],
  staff: SalonStaffForAllocation[]
): SalonSetupStep[] {
  const hasStaff = salonHasActiveStaff(staff);
  const hasServices = services.length > 0;
  const covered = getServiceIdsCoveredByStaff(staff);
  const mappedCount = services.filter((service) => covered.has(service.id)).length;
  const allServicesMapped = hasServices && mappedCount === services.length;
  const liveCount = services.filter(
    (service) => (service.status || "").toLowerCase() === "active" && covered.has(service.id)
  ).length;
  const isLive = liveCount > 0;

  const steps: Omit<SalonSetupStep, "current">[] = [
    {
      id: "staff",
      step: 1,
      title: "Add your team",
      description: "Add at least one stylist or staff member before you can offer services.",
      href: "/dashboard/staff",
      actionLabel: "Add staff",
      done: hasStaff,
    },
    {
      id: "services",
      step: 2,
      title: "Add your services",
      description: "Import from the master catalog or add custom services to your salon menu.",
      href: "/dashboard/services",
      actionLabel: "Manage services",
      done: hasServices,
    },
    {
      id: "map",
      step: 3,
      title: "Assign staff to services",
      description:
        mappedCount > 0 && !allServicesMapped
          ? `${mappedCount} of ${services.length} services mapped — assign the rest in Staff.`
          : "Open each staff profile and map which services they perform, with commission rates.",
      href: "/dashboard/staff",
      actionLabel: "Map services",
      done: allServicesMapped,
    },
    {
      id: "live",
      step: 4,
      title: "Publish services",
      description:
        liveCount > 0
          ? `${liveCount} service${liveCount === 1 ? "" : "s"} live and bookable on your salon page.`
          : "Set mapped services to Active so customers can book them online.",
      href: "/dashboard/services",
      actionLabel: "Activate services",
      done: isLive,
    },
  ];

  const firstIncomplete = steps.findIndex((step) => !step.done);

  return steps.map((step, index) => ({
    ...step,
    current: firstIncomplete === index,
  }));
}

export function isSalonSetupComplete(services: SalonServiceRow[], staff: SalonStaffForAllocation[]): boolean {
  const steps = getSalonSetupSteps(services, staff);
  return steps.every((step) => step.done);
}

export function getSalonSetupProgressPercent(
  services: SalonServiceRow[],
  staff: SalonStaffForAllocation[]
): number {
  const steps = getSalonSetupSteps(services, staff);
  const done = steps.filter((step) => step.done).length;
  return Math.round((done / steps.length) * 100);
}
