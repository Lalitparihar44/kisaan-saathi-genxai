import { apiCallWithRefresh } from "./auth";
import { makeApiCall } from "./api-utils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/* ---------------- AUTH HEADER ---------------- */

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/* ---------------- MARKET DATA ---------------- */

export async function fetchMarkets(params: {
  state?: string;
  district?: string;
  commodity?: string;
}) {
  const res = await apiCallWithRefresh(async () => {
    return await makeApiCall(`${API_BASE_URL}/api/v1/markets`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        "Content-Type": "application/json",
      },
      params,
    });
  });
  return res;
}

/* ---------------- STATES ---------------- */

export async function fetchStates() {
  const res = await apiCallWithRefresh(async () => {
    return await makeApiCall(`${API_BASE_URL}/api/v1/markets/states`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        "Content-Type": "application/json",
      },
    });
  });
  return res;
}

/* ---------------- DISTRICTS ---------------- */

export async function fetchDistrictsByState(state: string) {
  const res = await apiCallWithRefresh(async () => {
    return await makeApiCall(`${API_BASE_URL}/api/v1/markets/districts`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        "Content-Type": "application/json",
      },
      params: { state },
    });
  });
  return res;
}
/// ---------------- PRICE DYNAMICS ----------------
export async function fetchPriceDynamics(params: {
  state: string;
  district: string;
  commodity: string;
  days?: number;
}) {
  console.log("fetchPriceDynamics params",params);
  return apiCallWithRefresh(async () => {
    return await makeApiCall(`${API_BASE_URL}/api/v1/markets/price-dynamics`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        "Content-Type": "application/json",
      },
      params,
    });
  });
}


  

