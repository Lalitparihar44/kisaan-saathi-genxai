// lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { LayerKey, HealthLabel } from "@/lib/types";
import {
  VEGETATION_THRESHOLDS,
  NDWI_THRESHOLDS,
  HEALTH_COLORS,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/*                               Tailwind helper                               */
/* -------------------------------------------------------------------------- */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* -------------------------------------------------------------------------- */
/*                           GIS / Agritech helpers                            */
/* -------------------------------------------------------------------------- */

/** Calculate bounding box for a GeoJSON polygon */
export function getBBox(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const coords =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.coordinates;

  for (const poly of coords) {
    for (const ring of poly) {
      for (const [lng, lat] of ring) {
        minX = Math.min(minX, lng);
        minY = Math.min(minY, lat);
        maxX = Math.max(maxX, lng);
        maxY = Math.max(maxY, lat);
      }
    }
  }

  return [minX, minY, maxX, maxY];
}

/** Mask an image to a polygon shape using Canvas */
export async function maskImageToPolygon(
  imageUrl: string,
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  bbox: [number, number, number, number],
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context not available"));

      const [minX, minY, maxX, maxY] = bbox;
      const geoWidth = maxX - minX;
      const geoHeight = maxY - minY;

      function geoToPixel(lng: number, lat: number): [number, number] {
        const x = ((lng - minX) / geoWidth) * width;
        const y = ((maxY - lat) / geoHeight) * height;
        return [x, y];
      }

      const rings =
        geometry.type === "Polygon"
          ? geometry.coordinates
          : geometry.coordinates.flat();

      ctx.beginPath();
      for (const ring of rings) {
        const [startX, startY] = geoToPixel(ring[0][0], ring[0][1]);
        ctx.moveTo(startX, startY);
        for (let i = 1; i < ring.length; i++) {
          const [x, y] = geoToPixel(ring[i][0], ring[i][1]);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
      }

      ctx.clip();
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () =>
      reject(new Error("Failed to load image for masking"));
    img.src = imageUrl;
  });
}

/** Calculate image dimensions maintaining aspect ratio */
export function calculateImageDimensions(
  bbox: [number, number, number, number],
  baseSize: number
): [number, number] {
  const bboxWidth = bbox[2] - bbox[0];
  const bboxHeight = bbox[3] - bbox[1];
  const aspectRatio = bboxWidth / bboxHeight;

  const width =
    aspectRatio >= 1 ? baseSize : Math.round(baseSize * aspectRatio);
  const height =
    aspectRatio >= 1
      ? Math.round(baseSize / aspectRatio)
      : baseSize;

  return [width, height];
}

/** Format a date string for display */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

/** Format a date for API requests */
export function toISODate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/** Convert RGB pixel color back to vegetation index value (NDVI-like scale) */
export function rgbToIndexValue(
  r: number,
  g: number,
  b: number
): number | null {
  if (r === 0 && g === 0 && b === 0) return null;

  const stops = [
    { v: -0.3, color: [0, 0, 130] },
    { v: 0.0, color: [90, 0, 160] },
    { v: 0.2, color: [255, 0, 0] },
    { v: 0.35, color: [255, 120, 0] },
    { v: 0.5, color: [255, 230, 0] },
    { v: 0.7, color: [120, 200, 60] },
    { v: 0.9, color: [0, 90, 0] },
  ];

  let bestMatch = { index: 0, distance: Infinity, t: 0 };

  for (let i = 0; i < stops.length - 1; i++) {
    const c1 = stops[i].color;
    const c2 = stops[i + 1].color;

    for (let t = 0; t <= 1; t += 0.05) {
      const ir = c1[0] + (c2[0] - c1[0]) * t;
      const ig = c1[1] + (c2[1] - c1[1]) * t;
      const ib = c1[2] + (c2[2] - c1[2]) * t;
      const dist = Math.sqrt(
        (r - ir) ** 2 + (g - ig) ** 2 + (b - ib) ** 2
      );
      if (dist < bestMatch.distance)
        bestMatch = { index: i, distance: dist, t };
    }
  }

  const v1 = stops[bestMatch.index].v;
  const v2 = stops[bestMatch.index + 1].v;
  return v1 + (v2 - v1) * bestMatch.t;
}

/* -------------------------------------------------------------------------- */
/*                    Index interpretation (CRITICAL)                          */
/* -------------------------------------------------------------------------- */

/** Get human-readable label and color for an index value */
export function getVegetationLabel(
  value: number,
  layer: LayerKey
): { label: string; color: string } {

  // NDWI — surface water
  if (layer === "ndwi") {
    if (value > NDWI_THRESHOLDS.high)
      return { label: "High water content", color: "#3b82f6" };
    if (value > NDWI_THRESHOLDS.moderate)
      return { label: "Moderate water", color: "#60a5fa" };
    if (value > NDWI_THRESHOLDS.low)
      return { label: "Low water content", color: "#fbbf24" };
    return { label: "Very dry", color: "#ef4444" };
  }

  // NDMI — water stress
  if (layer === "ndmi") {
    if (value < 0.0)
      return { label: "Severe water stress", color: "#ef4444" };
    if (value < 0.3)
      return { label: "Moderate water stress", color: "#f97316" };
    if (value < 0.6)
      return { label: "Adequate moisture", color: "#22c55e" };
    return {
      label: "High moisture / over-irrigation",
      color: "#3b82f6",
    };
  }

  // GNDVI — nitrogen
  if (layer === "gndvi") {
    if (value < 0.4)
      return { label: "Nitrogen deficient", color: "#fde047" };
    if (value < 0.6)
      return { label: "Adequate nitrogen", color: "#86efac" };
    return { label: "Optimal nitrogen", color: "#166534" };
  }

  // SIPI — plant stress (higher = worse)
  if (layer === "sipi") {
    if (value > 0.8)
      return { label: "Severe plant stress", color: "#dc2626" };
    if (value > 0.6)
      return { label: "Early stress detected", color: "#f97316" };
    return { label: "Healthy crop", color: "#16a34a" };
  }

  // Default — NDVI, NDRE, EVI, SAVI
  if (value >= VEGETATION_THRESHOLDS.dense)
    return { label: "Dense vegetation", color: "#22c55e" };
  if (value >= VEGETATION_THRESHOLDS.good)
    return { label: "Good vegetation", color: "#84cc16" };
  if (value >= VEGETATION_THRESHOLDS.moderate)
    return { label: "Moderate vegetation", color: "#eab308" };
  if (value >= VEGETATION_THRESHOLDS.sparse)
    return { label: "Sparse vegetation", color: "#f97316" };
  if (value >= VEGETATION_THRESHOLDS.bare)
    return { label: "Very sparse / bare soil", color: "#ef4444" };

  return { label: "Water / no vegetation", color: "#3b82f6" };
}

/* -------------------------------------------------------------------------- */
/*                           Health & misc helpers                             */
/* -------------------------------------------------------------------------- */

export function getHealthLabel(
  score: number | undefined | null
): HealthLabel {
  if (score == null)
    return { label: "Processing", color: HEALTH_COLORS.processing };
  if (score >= 75)
    return { label: "Excellent", color: HEALTH_COLORS.excellent };
  if (score >= 55)
    return { label: "Good", color: HEALTH_COLORS.good };
  if (score >= 35)
    return { label: "Moderate", color: HEALTH_COLORS.moderate };
  return { label: "Poor", color: HEALTH_COLORS.poor };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Check if a value is a valid LayerKey */
export function isValidLayer(layer: string): layer is LayerKey {
  return [
    "ndvi",
    "ndre",
    "evi",
    "ndwi",
    "savi",
    "ndmi",
    "gndvi",
    "sipi",
    "todays_image",
  ].includes(layer);
}
