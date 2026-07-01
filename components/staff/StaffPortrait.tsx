import { staffAvatarFrameClass } from "@/lib/salon-staff-avatar";
import { cn } from "@/lib/utils";

type StaffPortraitProps = {
  name: string;
  avatarUrl?: string | null;
  widthClass?: string;
  className?: string;
};

export function StaffPortrait({
  name,
  avatarUrl,
  widthClass = "w-20",
  className,
}: StaffPortraitProps) {
  const imageSrc =
    avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "Staff")}`;

  return (
    <div className={cn(staffAvatarFrameClass(widthClass), className)}>
      <img src={imageSrc} alt={name} className="h-full w-full object-cover" />
    </div>
  );
}
