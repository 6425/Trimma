"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface MultiSelectProps {
  label: string;
  options: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function MultiSelect({ label, options, selectedIds, onChange, disabled }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedCount = selectedIds.length;

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 px-3 border rounded-xl text-xs font-semibold flex items-center justify-between transition-colors
          ${disabled 
            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
            : "bg-slate-50 border-slate-200 text-zinc-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
          }
        `}
      >
        <span className="truncate">
          {selectedCount === 0 ? label : `${label} (${selectedCount} selected)`}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto custom-scrollbar">
          {options.length === 0 ? (
            <div className="p-3 text-xs text-slate-500 italic text-center">No options available</div>
          ) : (
            <div className="p-1 space-y-0.5">
              {options.map(option => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <div 
                    key={option.id} 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleOption(option.id);
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs font-bold
                      ${isSelected ? "bg-brand/10 text-brand" : "hover:bg-slate-50 text-zinc-700"}
                    `}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center
                      ${isSelected ? "bg-brand border-brand text-zinc-900" : "border-slate-300 bg-white"}
                    `}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    {option.name}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
