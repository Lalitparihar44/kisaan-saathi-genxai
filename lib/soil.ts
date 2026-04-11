import { makeApiCall } from "./api-utils";
import { apiCallWithRefresh } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";


export async function fetchSoilData(fieldId?: string): Promise<any> {
  try {
    const resolvedFieldId =
      fieldId ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('selectedFieldId') || ''
        : '');

    const params = new URLSearchParams();
    if (resolvedFieldId) {
      params.set('field_id', resolvedFieldId);
    }

    const endpoint = params.toString()
      ? `${API_BASE_URL}/api/v1/soil/overview?${params.toString()}`
      : `${API_BASE_URL}/api/v1/soil/overview`;

    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          "Content-Type": "application/json",
        },
      });
    });
    if ((res as any)?.success === false || (res as any)?.statusCode >= 400) {
      console.warn('Soil overview API returned unsuccessful payload:', res);
    } else {
      console.log('RAW BACKEND SOIL RESPONSE 👉', res);
    }
    return res;
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to fetch soil data";

    const wrappedError: any = new Error(backendMessage);
    wrappedError.status = error?.response?.status;
    wrappedError.response = error?.response;
    throw wrappedError;
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

export async function predictSoil(payload: any): Promise<any> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(
        `${API_BASE_URL}/api/v1/soil/predict`,
        {
          method: "POST",
          data: payload,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        }
      );
    });

    console.log("RAW PREDICT API RESPONSE:", res);
    return res;
  } catch (error: any) {
    throw new Error(error?.message || "Failed to predict soil report");
  }
}

export async function predictSoilByFieldId(fieldId: string): Promise<any> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(
        `${API_BASE_URL}/api/v1/soil/predict/${fieldId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });

    return res;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to predict soil report');
  }
}

export async function fetchSoilByDate(payload: {
  lat: number;
  lon: number;
  sample_date: string;
}): Promise<any> {
  try {
    const res = await apiCallWithRefresh(async () => {
      return await makeApiCall(
        `${API_BASE_URL}/api/v1/soil/date-based-report`,
        {
          method: "POST",
          data: payload,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        }
      );
    });

    console.log("RAW DATE API RESPONSE:", res);

    return res;

  } catch (error: any) {
    throw new Error(error?.message || "Failed to fetch soil report by date");
  }
}


