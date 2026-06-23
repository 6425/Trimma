import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Trimma Global Button Component
 * 
 * Brand colors: Yellow (#ffc800) on Black, never pink.
 * All buttons are constrained to their container — they will never overflow a card.
 * 
 * Variants:
 *   default   – Solid yellow (#ffc800) fill, black text. Primary CTA.
 *   hero      – Black fill on yellow hero sections, white text.
 *   secondary – Dark surface (#1A1A1A) with yellow text. Secondary action.
 *   outline   – Transparent with yellow border + yellow text. Tertiary action.
 *   ghost     – No border, subtle hover. Icon buttons or low-emphasis actions.
 *   destructive – Red tint. Delete / danger actions.
 *   link      – Underline text link style.
 */
const buttonVariants = cva(
  // ─── Base: constrained to container, never overflows ───
  "group/button inline-flex shrink-0 items-center justify-center max-w-full " +
  "rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap " +
  "transition-all duration-200 outline-none select-none cursor-pointer " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc800]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent " +
  "active:not-aria-[haspopup]:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-40 " +
  "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // ── Primary: Yellow fill, black text ──
        default:
          "bg-[#ffc800] !text-black border-[#ffc800] hover:bg-[#ffd633] hover:!text-black hover:border-[#ffd633] shadow-[0_2px_8px_rgba(255,200,0,0.25)] hover:shadow-[0_4px_16px_rgba(255,200,0,0.35)]",

        // ── Hero: Black fill, brand-yellow text/icons on yellow hero panels ──
        hero:
          "hero-btn-primary !text-[#ffc800] hover:!text-[#ffd633] bg-transparent border-transparent shadow-none hover:shadow-none [&_svg]:!text-[#ffc800] hover:[&_svg]:!text-[#ffd633]",

        // ── Secondary: explicit light-surface secondary ──
        secondary:
          "bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-zinc-200 hover:text-zinc-950",

        // ── Outline: Transparent, yellow border + text ──
        outline:
          "bg-transparent text-[#ffc800] border-[#ffc800]/50 hover:bg-[#ffc800]/10 hover:border-[#ffc800] hover:text-[#e6b400]",

        // ── Ghost: explicit readable gray on light dashboards ──
        ghost:
          "bg-transparent text-zinc-600 border-transparent hover:bg-zinc-100 hover:text-zinc-900",

        // ── Destructive: Red danger actions ──
        destructive:
          "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300",

        // ── Dark: Black fill, white text (dashboard secondary CTAs) ──
        dark:
          "bg-black !text-white border-black hover:bg-zinc-800 hover:!text-white [&_svg]:!text-white shadow-sm",

        // ── Link: Underline only ──
        link:
          "bg-transparent text-[#ffc800] border-transparent underline-offset-4 hover:underline hover:text-[#ffd633]",
      },
      size: {
        default: "h-9 gap-2 px-4",
        xs:      "h-6 gap-1 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-8 gap-1.5 px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg:      "h-11 gap-2 px-5 text-base",
        xl:      "h-12 gap-2 px-6 text-base font-bold",
        icon:    "size-9 p-0",
        "icon-xs": "size-6 p-0 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 p-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: any) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
