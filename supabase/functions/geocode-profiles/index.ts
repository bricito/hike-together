import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async () => {
  console.log("Starting geocode-profiles...");
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log("Fetching profiles without coordinates...");
  
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, city")
    .not("city", "is", null)
    .is("latitude", null);

  if (error) {
    console.error("Error fetching profiles:", JSON.stringify(error));
    return new Response(JSON.stringify(error), { status: 500 });
  }

  console.log(`Found ${profiles?.length ?? 0} profiles to geocode`);

  if (!profiles?.length) {
    return new Response("Nothing to geocode", { status: 200 });
  }

  let success = 0;
  let failed = 0;

  for (const profile of profiles) {
    console.log(`Geocoding: ${profile.city}`);
    
    const coords = await geocode(profile.city);

    if (!coords) {
      console.warn(`Failed to geocode: ${profile.city}`);
      failed++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ latitude: coords.lat, longitude: coords.lng })
      .eq("id", profile.id);

    if (updateError) {
      console.error(`Update error for ${profile.id}:`, JSON.stringify(updateError));
      failed++;
    } else {
      console.log(`✓ ${profile.city} → ${coords.lat}, ${coords.lng}`);
      success++;
    }

    await delay(1100);
  }

  const result = { success, failed };
  console.log("Done:", JSON.stringify(result));
  
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

async function geocode(city: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&countrycodes=fr`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BlablaHike/1.0" },
    });
    const data = await res.json();
    if (!data?.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (e) {
    console.error("Geocode fetch error:", e);
    return null;
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
