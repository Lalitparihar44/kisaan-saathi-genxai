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

export async function fetchWeatherData(): Promise<BackendResponse> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE_URL}/api/v1/weather`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          "Content-Type": "application/json",
        },
      });
    });
    
    // Handle different response structures
    const data = res.data?.data || res.data || res;
    
    // Validate required properties exist
    if (!data.current) {
      console.error('Weather API response missing current data:', data);
      throw new Error('Invalid weather data structure');
    }
    
    return data;
  } catch (error: any) {
    console.error('Weather API error:', error);
    throw new Error(error?.message || "Failed to fetch weather data");
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