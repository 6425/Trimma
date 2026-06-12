"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_PLATFORM_ROLE_OPTIONS,
  EDITABLE_USER_ROLE_OPTIONS,
  type PlatformRoleOption,
  type PlatformRoleValue,
} from "@/lib/platform-role-options";

type PlatformRoleSelectProps = {
  value: string;
  onValueChange: (value: PlatformRoleValue) => void;
  mode?: "create" | "edit";
  disabled?: boolean;
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

export function PlatformRoleSelect({
  value,
  onValueChange,
  mode = "edit",
  disabled = false,
  placeholder = "Select role",
  triggerClassName,
  contentClassName,
}: PlatformRoleSelectProps) {
  const options: PlatformRoleOption[] =
    mode === "create" ? ALL_PLATFORM_ROLE_OPTIONS : EDITABLE_USER_ROLE_OPTIONS;

  return (
    <Select value={value} onValueChange={(val) => onValueChange(val as PlatformRoleValue)} disabled={disabled}>
      <SelectTrigger
        className={
          triggerClassName ||
          "w-full h-12 bg-zinc-50 border-0 outline-none focus:ring-2 focus:ring-brand/20 rounded-xl px-4 font-medium text-zinc-900 shadow-none"
        }
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        className={
          contentClassName ||
          "rounded-xl border-0 ring-0 shadow-2xl p-1.5 w-auto min-w-[11rem]"
        }
      >
        {options.map((role) => (
          <SelectItem
            key={role.value}
            value={role.value}
            className="font-medium rounded-lg py-2.5 pl-4 pr-3 cursor-pointer"
          >
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
