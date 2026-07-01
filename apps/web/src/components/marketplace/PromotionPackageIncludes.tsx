import { CheckCircle2 } from "lucide-react";

type PromotionPackageIncludesProps = {
  services: string[];
  className?: string;
  /** Full checklist (salon/deals pages) or compact pills (landing cards). */
  variant?: "list" | "chips";
  label?: string;
};

export function PromotionPackageIncludes({
  services,
  className = "",
  variant = "list",
  label,
}: PromotionPackageIncludesProps) {
  const items = services.map((item) => item.trim()).filter(Boolean);
  if (items.length === 0) return null;

  const heading =
    label ?? (variant === "chips" ? "Includes" : `What's included (${items.length})`);

  if (variant === "chips") {
    return (
      <div className={className}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
          {heading}
        </p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Package includes">
          {items.map((service) => (
            <li
              key={service}
              className="text-xs font-medium text-zinc-700 bg-white/80 border border-slate-200 rounded-lg px-2.5 py-1 break-words max-w-full"
            >
              {service}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
        {heading}
      </p>
      <ul className="space-y-1.5" aria-label="Package includes">
        {items.map((service) => (
          <li key={service} className="flex items-start gap-2 text-sm text-zinc-700 leading-snug">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" aria-hidden />
            <span className="break-words min-w-0">{service}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
