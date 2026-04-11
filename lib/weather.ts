import axios from "axios";
import { apiCallWithRefresh } from "./auth";
import { makeApiCall } from "./api-utils";
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export interface BackendResponse {
  location: { latitude: number; longitude: number; timezone: string };
  current: {
    time: string;
    temperature: number;
    humidity: number;
    rain: number;
    wind: number;
  };
  forecast7d: Array<{
    date: string;
    minTemp: number;
    maxTemp: number;
    avgTemp: number;
    avgHumidity: number;
    rain: number;
  }>;
  trend7d: { avgTemp: number[]; rain: number[]; humidity: number[] };
  trend30d: { avgTemp: number[]; rain: number[]; humidity: number[] };
  temperatureTrend: { trend: string; change: number };
  advisory: { label: string; title: string; message: string; advice: string[] };
  generatedAt: string;
}

const EMPTY_WEATHER_RESPONSE: BackendResponse = {
  location: { latitude: 0, longitude: 0, timezone: 'UTC' },
  current: {
    time: '',
    temperature: 0,
    humidity: 0,
    rain: 0,
    wind: 0,
  },
  forecast7d: [],
  trend7d: { avgTemp: [], rain: [], humidity: [] },
  trend30d: { avgTemp: [], rain: [], humidity: [] },
  temperatureTrend: { trend: 'stable', change: 0 },
  advisory: { label: '--', title: '', message: '', advice: [] },
  generatedAt: '',
};

export async function fetchWeatherData(): Promise<BackendResponse> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    return EMPTY_WEATHER_RESPONSE;
  }

  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE_URL}/api/v1/weather`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
    });
    
    const payload =
      (res as any)?.data?.data ??
      (res as any)?.data ??
      (res as any);

    if ((payload as any)?.success === false) {
      console.warn('Weather API returned unsuccessful payload:', payload);
      return EMPTY_WEATHER_RESPONSE;
    }

    if (!payload?.current) {
      console.warn('Weather API response missing current data:', payload);
      return EMPTY_WEATHER_RESPONSE;
    }

    return payload as BackendResponse;
  } catch (error: any) {
    if (error?.response?.status === 500) {
      return EMPTY_WEATHER_RESPONSE;
    }
    console.error('Weather API error:', error);
    return EMPTY_WEATHER_RESPONSE;
  }
}

export async function createWeatherStream(
  onMessage: (data: any) => void, 
  onError: () => void,
  interval: number = 60000
): Promise<() => void> {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const res = await apiCallWithRefresh(async () => {
        return await makeApiCall(`${API_BASE_URL}/api/v1/weather/stream`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            "Content-Type": "application/json",
          },
        });
      });
      const data = res.data?.data ?? res.data;
      onMessage(data);
    } catch (error: any) {
      console.error("Weather stream error:", error);
      onError();
      return;
    }
    
    if (isActive) {
      setTimeout(poll, interval);
    }
  };
  
  poll();
  
  // Return cleanup function
  return () => {
    isActive = false;
  };
}