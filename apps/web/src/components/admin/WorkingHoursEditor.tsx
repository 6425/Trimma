import React, { useState, useEffect } from "react";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function WorkingHoursEditor({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [periods, setPeriods] = useState<any[]>([]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const parsed = JSON.parse(value || "[]");
        if (Array.isArray(parsed)) {
          setPeriods(parsed);
        } else {
          setPeriods([]);
        }
      } catch {
        setPeriods([]);
      }
    });
  }, [value]);

  const handleUpdate = (day: number, openTime: string, closeTime: string, isClosed: boolean) => {
    let newPeriods = periods.filter(p => p.open?.day !== day);
    
    if (!isClosed) {
      newPeriods.push({
        open: { day, time: openTime },
        close: { day, time: closeTime }
      });
    }
    
    newPeriods.sort((a, b) => (a.open?.day || 0) - (b.open?.day || 0));
    onChange(JSON.stringify(newPeriods));
  };

  return (
    <div className="space-y-3">
      {DAYS_OF_WEEK.map(d => {
        const period = periods.find(p => p.open?.day === d.value);
        const isOpen = !!period;
        const openTime = period?.open?.time || "0900";
        const closeTime = period?.close?.time || "2000";

        const formatTimeForInput = (t: string) => {
          if (!t || t.length !== 4) return "09:00";
          return `${t.slice(0, 2)}:${t.slice(2)}`;
        };

        const parseTimeFromInput = (t: string) => {
          return t.replace(":", "");
        };

        return (
          <div key={d.value} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
            <div className="w-24 font-bold text-xs text-zinc-700">{d.label}</div>
            
            <button 
              type="button"
              onClick={() => handleUpdate(d.value, openTime, closeTime, isOpen)}
              className={`text-[10px] font-bold px-4 py-1.5 rounded-lg transition-all ${isOpen ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
            >
              {isOpen ? 'OPEN' : 'CLOSED'}
            </button>
            
            {isOpen && (
              <div className="flex items-center gap-2">
                <input 
                  type="time" 
                  value={formatTimeForInput(openTime)}
                  onChange={(e) => handleUpdate(d.value, parseTimeFromInput(e.target.value), closeTime, false)}
                  className="text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-brand/20 outline-none text-zinc-700"
                />
                <span className="text-zinc-500 text-xs font-medium">to</span>
                <input 
                  type="time" 
                  value={formatTimeForInput(closeTime)}
                  onChange={(e) => handleUpdate(d.value, openTime, parseTimeFromInput(e.target.value), false)}
                  className="text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-brand/20 outline-none text-zinc-700"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
