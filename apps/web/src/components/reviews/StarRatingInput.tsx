"use client";

import { Star } from "lucide-react";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
  disabled?: boolean;
};

export function StarRatingInput({
  value,
  onChange,
  size = "md",
  disabled = false,
}: StarRatingInputProps) {
  const starClass = size === "sm" ? "w-4 h-4" : "w-6 h-6";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;
        return (
          <button
            key={starValue}
            type="button"
            disabled={disabled}
            onClick={() => onChange(starValue)}
            className={`transition-transform ${disabled ? "cursor-not-allowed opacity-60" : "hover:scale-110"}`}
            aria-label={`Rate ${starValue} star${starValue === 1 ? "" : "s"}`}
          >
            <Star
              className={`${starClass} ${
                active ? "fill-amber-500 text-amber-500" : "text-zinc-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export function StarRatingDisplay({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const starClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`${starClass} ${index < rating ? "fill-amber-500 text-amber-500" : "text-zinc-200"}`}
        />
      ))}
    </div>
  );
}
