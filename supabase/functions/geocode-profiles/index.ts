import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Récupérer les profils sans coordonnées mais avec une ville
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, ville")
    .not("ville", "is", null)
    .is("latitude", null);

  if (error) return new Response(JSON.stringify(error), { status: 500 });
  if (!profiles?.length) return new Response("Nothing to geocode", { status: 200 });

  let success = 0;
  let failed = 0;

  for (const profile of profiles) {
    const coords = await geocode(profile.ville);

    if (!coords) { failed++; continue; }

    await supabase
      .from("profiles")
      .update({ latitude: coords.lat, longitude: coords.lng })
      .eq("id", profile.id);

    success++;

    // Respecter le rate limit Nominatim : 1 requête/seconde
    await delay(1100);
  }

  return new Response(
    JSON.stringify({ success, failed }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

async function geocode(city: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&countrycodes=fr`;

  const res = await fetch(url, {
    headers: { "User-Agent": "BlablaHike/1.0" }, // requis par Nominatim
  });

  const data = await res.json();
  if (!data?.length) return null;

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
