// Utility to geocode a place name to coordinates using Mapbox Geocoding API
// Returns { center: [lng, lat], place_name }

export async function geocodePlace(query: string): Promise<{ center: [number, number]; place_name: string } | null> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!accessToken) throw new Error("Mapbox access token missing");

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.features?.length) return null;
  return {
    center: data.features[0].center,
    place_name: data.features[0].place_name,
  };
}
