import { FilterXSS } from "xss";

const plainTextFilter = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
});

export function sanitizeText<T>(value: T): T {
  if (typeof value !== "string") return value;
  return plainTextFilter.process(value) as unknown as T;
}

/**
 * Return a shallow copy of `obj` with the listed keys sanitized via `sanitizeText`.
 * Only string values are touched; null/undefined/other types are left as-is.
 */
export function sanitizeTextFields<T extends Record<string, unknown>>(
  obj: T,
  keys: ReadonlyArray<keyof T>
): T {
  const next: T = { ...obj };
  for (const key of keys) {
    const current = next[key];
    if (typeof current === "string") {
      next[key] = sanitizeText(current) as T[typeof key];
    }
  }
  return next;
}

// SVG stored in `global_branding_settings.logo_svg_raw` is intentionally rendered as raw
// markup via dangerouslySetInnerHTML, so it can't be flattened to plain text. Instead we
// allow a safe SVG element/attribute set and drop scripts, event handlers, and foreignObject.
const svgTagWhiteList: Record<string, string[]> = {
  svg: ["xmlns", "viewbox", "width", "height", "fill", "stroke", "class", "role", "aria-hidden", "focusable", "preserveaspectratio"],
  g: ["fill", "stroke", "transform", "class", "opacity"],
  path: ["d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "transform", "opacity", "fill-rule", "clip-rule"],
  circle: ["cx", "cy", "r", "fill", "stroke", "stroke-width", "transform", "opacity"],
  ellipse: ["cx", "cy", "rx", "ry", "fill", "stroke", "transform", "opacity"],
  rect: ["x", "y", "width", "height", "rx", "ry", "fill", "stroke", "stroke-width", "transform", "opacity"],
  line: ["x1", "y1", "x2", "y2", "stroke", "stroke-width", "transform", "opacity"],
  polyline: ["points", "fill", "stroke", "stroke-width", "transform", "opacity"],
  polygon: ["points", "fill", "stroke", "stroke-width", "transform", "opacity"],
  text: ["x", "y", "fill", "font-size", "font-family", "text-anchor", "transform", "opacity"],
  tspan: ["x", "y", "fill", "font-size", "font-family", "transform"],
  defs: [],
  lineargradient: ["id", "x1", "y1", "x2", "y2", "gradientunits", "gradienttransform"],
  radialgradient: ["id", "cx", "cy", "r", "fx", "fy", "gradientunits", "gradienttransform"],
  stop: ["offset", "stop-color", "stop-opacity"],
  clippath: ["id"],
  title: [],
};

const svgFilter = new FilterXSS({
  whiteList: svgTagWhiteList,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "foreignobject"],
  onIgnoreTagAttr(_tag, name, value) {
    // Never allow event handlers or javascript: URLs even on allowed tags.
    if (/^on/i.test(name)) return "";
    if (/^(href|xlink:href)$/i.test(name) && /^\s*javascript:/i.test(value)) return "";
    return undefined;
  },
});

export function sanitizeSvgMarkup(value: unknown): string {
  if (typeof value !== "string") return "";
  return svgFilter.process(value);
}
