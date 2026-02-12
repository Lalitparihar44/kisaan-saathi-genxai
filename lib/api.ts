/**
 * API client functions for field operations
 */

import axios from 'axios';
import { apiCallWithRefresh } from './auth';
import type { FieldCollection } from './types';
import { makeApiCall } from '@/lib/api-utils';
import { toast } from 'react-toastify';
// import { AIInsight } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

/**
 * Fetch the most recent available Sentinel-2 image for a field
 * (used for "Today's Image")
 */
export async function fetchTodaysImage(fieldId: string): Promise<{
  tileUrl: string;
  date: string;
}> {
  try {
    const params = new URLSearchParams({ fieldId });
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(
        `${API_BASE}/api/v1/fields/image/latest?${params}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      );
    });
    if (res.tileUrl && res.date) {
      return res;
    } else {
      toast.error("Failed to fetch today's image");
    }
    throw new Error("Failed to fetch today's image");
  } catch (error: any) {
    toast.error("Failed to fetch today's image");
    console.log("Fetch today's image error", error);
    throw new Error(
      `Failed to fetch today's image: ${error.response?.status || 'Unknown error'}`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                               FIELD CRUD                                   */
/* -------------------------------------------------------------------------- */

/** Fetch all fields from the API */
export async function fetchFields(): Promise<FieldCollection> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE}/api/v1/fields`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    });
    if (res.statusCode == 200) {
      return res.data;
    } else {
      toast.error(res.message || 'Failed to fetch fields');
      return res.data;
    }
  } catch (error: any) {
    toast.error('Failed to fetch fields');
    console.log('Fetch fields error', error);
    throw new Error(
      `Failed to fetch fields: ${error.response?.status || 'Unknown error'}`,
    );
  }
}

/** Fetch a single field by ID */
export async function fetchFieldById(fieldId: string): Promise<any> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE}/api/v1/fields/${fieldId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    });
    return res.data;
  } catch (error: any) {
    throw new Error(
      `Failed to fetch field: ${error.response?.status || 'Unknown error'}`,
    );
  }
}

/**
 * Create a new field
 * @param data - Field creation data
 * @returns Created field response
 */
export async function createField(data: {
  name: string;
  crop_name?: string;
  notes?: string;
  sowing_date?: string;
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}): Promise<any> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE}/api/v1/fields`, {
        method: 'POST',
        data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    });
    return res;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error ||
        `Failed to create field: ${error.response?.status || 'Unknown error'}`,
    );
  }
}

/**
 * Calculate indices for a field
 * @param fieldId - Field ID
 * @param from - From date (optional)
 * @param to - To date (optional)
 */
export async function calculateIndices(
  fieldId: string,
  from?: string | null,
  to?: string | null,
): Promise<void> {
  try {
    const res = await apiCallWithRefresh(async () => {
      const token = localStorage.getItem("accessToken");
      return await makeApiCall(
        `${API_BASE}/api/v1/fields/indices`,
        {data: {
          fieldId,
          from,
          to,
        },
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      );
    });
    return res;
  } catch (error: any) {
    throw new Error(
      `Failed to calculate indices: ${
        error.response?.status || 'Unknown error'
      }`,
    );
  }
}

/**
 * Select a field
 * @param fieldId - UUID of field to select
 */
export async function selectDefaultField(fieldId: string): Promise<void> {
  try {
    await apiCallWithRefresh(async () => {
      return await makeApiCall(
        `${API_BASE}/api/v1/fields/${fieldId}/select`,
        {
          method: 'PATCH',
          data: {},
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
    });
  } catch (error: any) {
    throw new Error(
      `Failed to select field: ${error.response?.status || 'Unknown error'}`,
    );
  }
}

/**
 * Delete a field by ID
 */
export async function deleteField(fieldId: string): Promise<boolean> {
  try {
    const response = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE}/api/v1/fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    });
    if (response.statusCode == 200) {
      toast.success(response.message);
      return true;
    } else {
      toast.error(response.message || 'Failed to delete field');
      return false;
    }
  } catch (error: any) {
    console.log('Delete field error', error);
    toast.error(error.response?.data?.message || 'Failed to delete field');
    return false;
  }
}

/**
 * Update a field's properties
 */
export async function updateField(
  fieldId: string,
  data: {
    name?: string;
    crop_name?: string;
    notes?: string;
    sowing_date?: string;
  },
): Promise<void> {
  try {
    const response = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE}/api/v1/fields/${fieldId}`, {
        method: 'PATCH',
        data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    });
    return response;
  } catch (error: any) {
    console.log('Update field error', error);
    toast.error(error.response?.data?.message || 'Failed to update field');
    throw new Error(error);
  }
}

/* -------------------------------------------------------------------------- */
/*                               HEATMAP / NDVI                                */
/* -------------------------------------------------------------------------- */

/**
 * Fetch heatmap image URL for a field (NDVI / NDRE / etc.)
 * ❗ DO NOT use this for "Today's Image"
 */
export async function fetchHeatmap(
  fieldId: string,
  options: {
    layer: string;
    width: number;
    height: number;
    toDate: string;
  },
): Promise<string> {
  try {
    const params = new URLSearchParams({
      layer: options.layer,
      width: options.width.toString(),
      height: options.height.toString(),
      toDate: options.toDate,
      fieldId,
    });

    const res = await apiCallWithRefresh(async () => {
      const token = localStorage.getItem('accessToken');
      return await axios.get(`${API_BASE}/api/v1/fields/heatmap?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });
    });
    console.log('Heatmap response', URL.createObjectURL(res.data));

    return URL.createObjectURL(res.data);
  } catch (error: any) {
    console.log('Fetch heatmap error', error);
    throw new Error(
      `Failed to fetch heatmap: ${error.response?.status || 'Unknown error'}`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                          VEGETATION INDICES                                 */
/* -------------------------------------------------------------------------- */

/** Trigger vegetation indices calculation for a field */
// export async function calculateIndices(fieldId: string): Promise<void> {
//   const response = await fetch(`${API_BASE}/indices`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ fieldId }),
//   });

//   if (!response.ok) {
//     console.error("Indices calculation failed:", response.status);
//   }
// }

/* -------------------------------------------------------------------------- */
/*                          SATELLITE SCENES                                   */
/* -------------------------------------------------------------------------- */

export interface SatelliteScene {
  date: string;
  cloudCover: number | null;
  id?: string;
}

export interface ScenesResponse {
  scenes: SatelliteScene[];
  source: 'sentinel-hub' | 'fallback';
  nextImage?: string;
  message?: string;
}

/** Fetch available satellite scenes for a field from Sentinel Hub Catalog */
export async function fetchScenes(options?: {
  fieldId: string;
  maxCloudCover?: number;
  fromDate?: string;
  toDate?: string;
}): Promise<ScenesResponse> {
  try {
    const params = new URLSearchParams({
      fieldId: options?.fieldId || '',
      maxCloud: options?.maxCloudCover?.toString() || '',
      from: options?.fromDate || '',
      to: options?.toDate || '',
    });
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE}/api/v1/fields/scenes?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    });
    console.log('Scenes response', res);
    return res.data;
  } catch (error: any) {
    // Return fallback dates on error
    return generateFallbackScenes();
  }
}

/**
 * Generate fallback scenes when API is unavailable
 */
function generateFallbackScenes(): ScenesResponse {
  const scenes: SatelliteScene[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 3);

  const current = new Date(start);
  while (current <= today) {
    scenes.push({
      date: current.toISOString().split('T')[0],
      cloudCover: null,
    });
    current.setDate(current.getDate() + 5);
  }

  const nextImage = new Date(today);
  nextImage.setDate(nextImage.getDate() + 5);

  return {
    scenes,
    source: 'fallback',
    nextImage: nextImage.toISOString().split('T')[0],
    message: 'Using estimated dates',
  };
}

export async function fetchCommodities(pendingGeometry: any): Promise<any> {
  try {
    const lat = pendingGeometry[1];
    const lon = pendingGeometry[0];
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    const { data } = await axios.get(url);

    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE}/api/v1/crop/names`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    });
    return res.data.map((x: any) => x.crop_name);
  } catch (error: any) {
    console.log('Fetch commodities error', error);
    throw new Error(
      `Failed to fetch commodities: ${error.response?.status || 'Unknown error'}`,
    );
  }
}

export async function fetchFieldsData(
  columns: string,
  page?: number,
  limit?: number,
  sortBy?: string,
  sortOrder?: 'ASC' | 'DESC',
  columnSearch?: Record<string, any>,
): Promise<any> {
  try {
    const requestBody: any = { columns };

    if (page !== undefined) requestBody.page = page;
    if (limit !== undefined) requestBody.limit = limit;
    if (sortBy) requestBody.sortBy = sortBy;
    if (sortOrder) requestBody.sortOrder = sortOrder;
    if (columnSearch) requestBody.columnSearch = columnSearch;

    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE}/api/v1/fields/data`, {
        method: 'POST',
        data: requestBody,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    });
    return res;
  } catch (error: any) {
    console.log('Fetch fields data error', error);
    throw new Error(
      `Failed to fetch fields data: ${error.response?.status || 'Unknown error'}`,
    );
  }
}

export async function fetchFarmScore(
  state?: string,
  district?: string,
  parameters?: string,
  from?: string,
): Promise<any> {
  try {
    const queryParams: Record<string, string> = {};
    if (state) queryParams.state = state;
    if (district) queryParams.district = district;
    if (parameters) queryParams.parameters = parameters;
    if (from) queryParams.from = from;
    const queryString =
      Object.keys(queryParams).length > 0
        ? `?${new URLSearchParams(queryParams).toString()}`
        : '';
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE}/api/v1/fields/farm_score${queryString}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    });
    return res.data;
  } catch (error: any) {
    console.log(error, 'farm_score error');
    throw new Error(
      `Failed to fetch farm score: ${error.response?.status || 'Unknown error'}`,
    );
  }
}

export async function fetchLocationData(): Promise<Record<string, string[]>> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE}/api/v1/state-districts`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    });
    if (res.statusCode === 200) {
      const data: Record<string, string[]> = {};
      res.forEach((item: any) => {
        data[item.state_name] = item.districts;
      });
      return data;
    }
    throw new Error('Failed to fetch location data');
  } catch (error) {
    console.error('Failed to fetch location data:', error);
    throw error;
  }
}

export async function fetchSubDistricts(district: string): Promise<string[]> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE}/api/v1/sub-districts?district=${district}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    });
    if (res.statusCode === 200) {
      return res.map((x: any) => x.sub_districts).flat();
    }
    return [];
  } catch (error) {
    console.error('Error fetching sub-districts', error);
    return [];
  }
}
