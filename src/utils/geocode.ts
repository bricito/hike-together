// utils/geocode.ts
export async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&countrycodes=fr`;

  const res = await fetch(url, {
    headers: { "User-Agent": "BlablaHike/1.0" },
  });

  const data = await res.json();
  if (!data?.length) return null;

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}
