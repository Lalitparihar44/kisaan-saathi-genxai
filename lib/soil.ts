import { makeApiCall } from "./api-utils";
import { apiCallWithRefresh } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";


export async function fetchSoilData(): Promise<any> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE_URL}/api/v1/soil/overview`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          "Content-Type": "application/json",
        },
      });
    });
    console.log("RAW BACKEND SOIL RESPONSE 👉", res);
    return res;
  } catch (error: any) {
    throw new Error(error?.message || "Failed to fetch soil data");
  }
}

export async function fetchFertilizerRecommendation(body: any): Promise<any> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(`${API_BASE_URL}/api/v1/soil/fertilizer-recommendation`, {
        method: 'POST',
        data: body,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          "Content-Type": "application/json",
        },
      });
    });
    
    return res;
  } catch (error: any) {
    throw new Error(
      error?.response?.message ||
      error?.message ||
      "Failed to fetch fertilizer recommendation"
    );
  }
}
