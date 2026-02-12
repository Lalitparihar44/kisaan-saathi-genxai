/** Supported vegetation index layers */
export type LayerKey =
  | "ndvi"
  | "ndre"
  | "evi"
  | "savi"
  | "ndwi"
  | "ndmi"
  | "gndvi"
  | "sipi"
  | "todays_image";

/** Array of all supported layers (ordered for UI) */
export const SUPPORTED_LAYERS: LayerKey[] = [
  "ndvi",
  "ndre",
  "evi",
  "savi",
  "ndwi",

  // Water / stress / nutrients
  "ndmi",
  "gndvi",
  "sipi",

  "todays_image",
];

/** Layer display names (UI labels) */
export const LAYER_NAMES: Record<LayerKey, string> = {
  ndvi: "NDVI – Vegetation Health",
  ndre: "NDRE – Crop Nitrogen",
  evi: "EVI – Canopy Density",
  savi: "SAVI – Soil Adjusted Vegetation",
  ndwi: "NDWI – Surface Water",
  ndmi: "NDMI – Crop Water Stress",
  gndvi: "GNDVI – Nitrogen / Chlorophyll",
  sipi: "SIPI – Plant Stress Index",
  todays_image: "Today's Image (Sentinel-2 RGB)",
};

/** Supported satellite sources */
export type SourceKey = "sentinel2";

/** Display names for sources */
export const SOURCE_NAMES: Record<SourceKey, string> = {
  sentinel2: "Sentinel-2",
};

/* ============================================================================
   FIELD & GEOJSON TYPES
============================================================================ */

/** Properties of a field polygon */
export interface FieldProperties {
  id: string;
  name?: string;
  crop_name?: string;
  notes?: string;
  sowing_date?: string;
  health_score?: number;
  area?: number;
  is_selected?: boolean;
}

/** A selected field with its geometry */
export interface SelectedField {
  id: string;
  properties: FieldProperties;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

/** GeoJSON Feature for a field */
export interface FieldFeature {
  type: "Feature";
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  properties: FieldProperties;
}

/** GeoJSON FeatureCollection of fields */
export interface FieldCollection {
  type: "FeatureCollection";
  features: FieldFeature[];
}

/** Hover tooltip information */
export interface HoverInfo {
  x: number;
  y: number;
  value: number;
  label: string;
  color: string;
}

/** Health score interpretation */
export interface HealthLabel {
  label: string;
  color: string;
}

/** Response from POST /api/fields */
export interface CreateFieldResponse {
  id: string;
}

/** Response from DELETE /api/fields/[id] */
export interface DeleteFieldResponse {
  success: boolean;
  deletedId: string;
}

/** Response from POST /api/indices */
export interface IndicesResponse {
  fieldId: string;
  scenesProcessed: number;
  series: IndexDataPoint[];
}

/** Single data point from indices calculation */
export interface IndexDataPoint {
  date: string;
  ndvi: number;
  ndre: number;
  evi: number;
  savi: number;
  ndwi: number;
  ndmi: number;
  gndvi: number;
  sipi: number;
}
