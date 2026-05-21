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
    <div className="commission-card glassmorphism flex items-center gap-3 p-4 rounded-xl">
      <div className="text-2xl">{icons[entity_type] || "💰"}</div>
      <div className="flex flex-col">
        <span className="font-bold text-lg text-white">{formatted}</span>
        <span className="text-sm text-white/70">{description}</span>
        <span className="text-xs uppercase text-white/50 mt-1">{entity_type}</span>
      </div>
    </div>
  );
};
