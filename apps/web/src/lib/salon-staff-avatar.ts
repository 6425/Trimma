/** Salon staff portrait crop + display spec (3:4 portrait). */
export const STAFF_AVATAR_WIDTH_PX = 300;
export const STAFF_AVATAR_HEIGHT_PX = 400;
export const STAFF_AVATAR_ASPECT = STAFF_AVATAR_WIDTH_PX / STAFF_AVATAR_HEIGHT_PX;

/** Shared Tailwind frame: fixed width, 300:400 aspect, rounded rect (not circle). */
export function staffAvatarFrameClass(widthClass = "w-20"): string {
  return `${widthClass} aspect-[300/400] rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50`;
}
