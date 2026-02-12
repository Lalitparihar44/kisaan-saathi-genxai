import { apiCallWithRefresh } from './auth';
import { makeApiCall } from './api-utils';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function getAllCrops(): Promise<any> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE_URL}/api/v1/crop`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
    });
    console.log('CROP RESPONSE', res);
    return res;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to fetch crops data');
  }
}

export async function getCropById(id: string): Promise<any> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE_URL}/api/v1/crop?id=${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
    });
    console.log('RAW BACKEND CROP BY ID RESPONSE 👉', res);
    return res;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to fetch crop by ID');
  }
}

export async function getCropGuide(cropName: string): Promise<any> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(
        `${API_BASE_URL}/api/v1/crop?cropName=${encodeURIComponent(cropName)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });
    console.log('RAW BACKEND CROP GUIDE RESPONSE 👉', res);
    return res;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to fetch crop guide');
  }
}
