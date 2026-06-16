// apps/web/src/components/CommissionCard.tsx
import React from "react";
import type { CommissionRow } from "@/lib/types/commission";

interface Props {
  row: CommissionRow;
}

export const CommissionCard: React.FC<Props> = ({ row }) => {
  const { entity_type, amount, description } = row;
  const formatted = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(amount);
  const icons: Record<string, string> = {
    platform: "💼",
    salon: "🏢",
    agent: "🤝",
  };
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-[#ffc800]/10 border border-[#ffc800]/30 dark:bg-[#ffc800]/10 dark:border-[#ffc800]/20">
      <div className="text-2xl">{icons[entity_type] || "💰"}</div>
      <div className="flex flex-col">
        <span className="font-bold text-lg text-zinc-950 dark:text-zinc-50">{formatted}</span>
        <span className="text-sm text-zinc-800 dark:text-zinc-100">{description}</span>
        <span className="text-xs uppercase text-[#8a7600] dark:text-[#ffc800] mt-1">{entity_type}</span>
      </div>
    </div>
  );
};
