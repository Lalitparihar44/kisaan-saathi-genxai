const TOKEN_URL = "https://services.sentinel-hub.com/oauth/token";

export async function getSentinelToken() {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=client_credentials&client_id=${process.env.SENTINEL_CLIENT_ID}&client_secret=${process.env.SENTINEL_CLIENT_SECRET}`,
  });

  if (!res.ok) {
    throw new Error("Failed to get Sentinel token");
  }

  const data = await res.json();
  return data.access_token;
}
