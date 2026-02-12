/* ============================================================================
   TYPES
============================================================================ */

import type { LayerKey } from "./types";

export interface ColorStop {
  min: number;
  max: number;
  color: string;
  label?: string;
}

/* ============================================================================
   TIMELINE & DATE HELPERS
============================================================================ */

/**
 * Generate timeline dates dynamically
 * Creates weekly dates for the last 3 months from current date
 */
function generateTimelineDates(): string[] {
  const dates: string[] = [];
  const today = new Date();

  // Go back 90 days (approximately 3 months)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 90);

  // Round to the nearest previous Monday
  const dayOfWeek = startDate.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startDate.setDate(startDate.getDate() - daysToSubtract);

  const currentDate = new Date(startDate);
  while (currentDate <= today) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return dates;
}

/** Available satellite imagery dates (Sentinel-2) */
export const TIMELINE_DATES = generateTimelineDates();

/** Default selected date (most recent) */
export const DEFAULT_DATE = TIMELINE_DATES[TIMELINE_DATES.length - 1];

/* ============================================================================
   MAP CONFIGURATION
============================================================================ */

export const DEFAULT_MAP_CENTER: [number, number] = [78.9629, 20.5937];
export const DEFAULT_MAP_ZOOM = 5;
export const MAPBOX_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";
export const MAX_FIT_ZOOM = 17;
export const FIT_BOUNDS_PADDING = 100;

/* ============================================================================
   HEATMAP CONFIG
============================================================================ */

export const HEATMAP_BASE_SIZE = 512;
export const HEATMAP_OPACITY = 0.8;
export const DEFAULT_HISTORY_DAYS = 90;

/* ============================================================================
   FIELD STYLING
============================================================================ */

export const FIELD_OUTLINE_COLOR = "#00ff88";
export const FIELD_SELECTED_COLOR = "#00ffff";

/* ============================================================================
   HEALTH SCORE COLORS
============================================================================ */

export const HEALTH_COLORS = {
  excellent: "#22c55e",
  good: "#84cc16",
  moderate: "#eab308",
  poor: "#ef4444",
  processing: "#9ca3af",
} as const;

/* ============================================================================
   LEGACY THRESHOLDS (STILL USED ELSEWHERE)
============================================================================ */

export const VEGETATION_THRESHOLDS = {
  dense: 0.7,
  good: 0.5,
  moderate: 0.3,
  sparse: 0.15,
  bare: 0.0,
} as const;

export const NDWI_THRESHOLDS = {
  high: 0.3,
  moderate: 0.0,
  low: -0.3,
} as const;

/* ============================================================================
   EOS-EXACT COLOR RAMPS
============================================================================ */

/* ---------------- VEGETATION HEALTH ----------------
   NDVI / NDRE / SAVI / GNDVI / EVI
--------------------------------------------------- */

export const VEGETATION_RAMP: ColorStop[] = [
  { min: 0.95, max: 1.0, color: "#006400", label: "Better to use NDRE" },

  { min: 0.90, max: 0.95, color: "#0a7d3b", label: "Dense vegetation" },
  { min: 0.85, max: 0.90, color: "#128a3f", label: "Dense vegetation" },
  { min: 0.80, max: 0.85, color: "#1a9641", label: "Dense vegetation" },
  { min: 0.75, max: 0.80, color: "#2ca25f", label: "Dense vegetation" },
  { min: 0.70, max: 0.75, color: "#41ab5d", label: "Dense vegetation" },
  { min: 0.65, max: 0.70, color: "#66c2a4", label: "Dense vegetation" },
  { min: 0.60, max: 0.65, color: "#7fcdbb", label: "Dense vegetation" },

  { min: 0.55, max: 0.60, color: "#a1d99b", label: "Moderate vegetation" },
  { min: 0.50, max: 0.55, color: "#c7e9c0", label: "Moderate vegetation" },
  { min: 0.45, max: 0.50, color: "#e5f5e0", label: "Moderate vegetation" },
  { min: 0.40, max: 0.45, color: "#ffffcc", label: "Moderate vegetation" },

  { min: 0.35, max: 0.40, color: "#fed976", label: "Sparse vegetation" },
  { min: 0.30, max: 0.35, color: "#feb24c", label: "Sparse vegetation" },
  { min: 0.25, max: 0.30, color: "#fd8d3c", label: "Sparse vegetation" },
  { min: 0.20, max: 0.25, color: "#fc4e2a", label: "Sparse vegetation" },

  { min: 0.15, max: 0.20, color: "#e31a1c", label: "Open soil" },
  { min: 0.10, max: 0.15, color: "#bd0026", label: "Open soil" },
  { min: 0.05, max: 0.10, color: "#800026", label: "Open soil" },
  { min: -1.0, max: 0.05, color: "#4d0000", label: "Open soil" },
];

/* ---------------- MOISTURE / WATER ----------------
   NDMI / NDWI
--------------------------------------------------- */

export const MOISTURE_RAMP: ColorStop[] = [
  { min: 0.9, max: 1.0, color: "#08306b" },
  { min: 0.8, max: 0.9, color: "#08519c" },
  { min: 0.7, max: 0.8, color: "#2171b5" },
  { min: 0.6, max: 0.7, color: "#4292c6" },
  { min: 0.5, max: 0.6, color: "#6baed6" },
  { min: 0.4, max: 0.5, color: "#9ecae1" },
  { min: 0.3, max: 0.4, color: "#c6dbef" },
  { min: 0.2, max: 0.3, color: "#deebf7" },
  { min: 0.1, max: 0.2, color: "#f7fbff" },

  { min: -0.1, max: 0.1, color: "#e5e7eb" },

  { min: -0.2, max: -0.1, color: "#e7d8c9" },
  { min: -0.3, max: -0.2, color: "#d2b48c" },
  { min: -0.4, max: -0.3, color: "#c19a6b" },
  { min: -0.5, max: -0.4, color: "#a67c52" },
  { min: -0.6, max: -0.5, color: "#8b5a2b" },
  { min: -0.7, max: -0.6, color: "#7a4a1e" },
  { min: -0.8, max: -0.7, color: "#6b3e15" },
  { min: -0.9, max: -0.8, color: "#5a3310" },
  { min: -1.0, max: -0.9, color: "#4a2c0b" },
];

/* ---------------- STRESS ----------------
   SIPI (INVERTED)
--------------------------------------------------- */

export const SIPI_RAMP: ColorStop[] = [
  { min: 0.80, max: 0.85, color: "#006400", label: "Healthy" },
  { min: 0.85, max: 0.90, color: "#008000", label: "Healthy" },

  { min: 0.90, max: 0.95, color: "#66c2a4", label: "Early stress" },
  { min: 0.95, max: 1.00, color: "#9acd32", label: "Early stress" },
  { min: 1.00, max: 1.05, color: "#d9ef8b", label: "Early stress" },

  { min: 1.05, max: 1.10, color: "#fee08b", label: "Moderate stress" },
  { min: 1.10, max: 1.15, color: "#fdae61", label: "Moderate stress" },
  { min: 1.15, max: 1.20, color: "#f46d43", label: "Moderate stress" },
  { min: 1.20, max: 1.25, color: "#f46d43", label: "Moderate stress" },

  { min: 1.25, max: 1.30, color: "#d73027", label: "High stress" },
  { min: 1.30, max: 1.35, color: "#d73027", label: "High stress" },
  { min: 1.35, max: 1.40, color: "#a50026", label: "High stress" },

  { min: 1.40, max: 1.45, color: "#800026", label: "Severe stress" },
  { min: 1.45, max: 1.50, color: "#66001a", label: "Severe stress" },
  { min: 1.50, max: 1.60, color: "#4d0000", label: "Severe stress" },
];

/* ============================================================================
   FINAL INDEX → COLOR RAMP MAPPING
============================================================================ */

export const INDEX_COLOR_RAMPS: Record<LayerKey, ColorStop[]> = {
  ndvi: VEGETATION_RAMP,
  ndre: VEGETATION_RAMP,
  savi: VEGETATION_RAMP,
  gndvi: VEGETATION_RAMP,
  evi: VEGETATION_RAMP,

  ndmi: MOISTURE_RAMP,
  ndwi: MOISTURE_RAMP,

  sipi: SIPI_RAMP,

  todays_image: [],
};
