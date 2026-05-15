export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)

    /**
     * =========================
     * 1. GENERATE QR TOKEN
     * =========================
     */
    if (url.pathname === "/generate") {
      const hikeId = url.searchParams.get("hikeId")

      if (!hikeId) {
        return Response.json({ error: "Missing hikeId" }, { status: 400 })
      }

      const token = crypto.randomUUID()

      // expire dans 30 min
      const expiresAt = Date.now() + 30 * 60 * 1000

      // sauvegarde en DB
      await fetch(`${env.SUPABASE_URL}/rest/v1/hike_checkins`, {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_KEY,
          Authorization: `Bearer ${env.SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hike_id: hikeId,
          token,
          expires_at: new Date(expiresAt).toISOString(),
        }),
      })

      return Response.json({
        hikeId,
        token,
        expiresAt,
        qrUrl: `https://blablahike.eu/checkin?token=${token}`,
      })
    }

    /**
     * =========================
     * 2. CHECK-IN VALIDATION
     * =========================
     */
    if (url.pathname === "/checkin") {
      const token = url.searchParams.get("token")
      const userId = url.searchParams.get("userId")

      if (!token || !userId) {
        return Response.json({ error: "Missing data" }, { status: 400 })
      }

      // récupérer token
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/hike_checkins?token=eq.${token}&select=*`,
        {
          headers: {
            apikey: env.SUPABASE_KEY,
            Authorization: `Bearer ${env.SUPABASE_KEY}`,
          },
        }
      )

      const data = await res.json()
      const checkin = data?.[0]

      if (!checkin) {
        return Response.json({ error: "Invalid token" }, { status: 401 })
      }

      if (new Date(checkin.expires_at).getTime() < Date.now()) {
        return Response.json({ error: "Token expired" }, { status: 401 })
      }

      // empêcher double check-in
      const already = await fetch(
        `${env.SUPABASE_URL}/rest/v1/hike_participants?hike_id=eq.${checkin.hike_id}&user_id=eq.${userId}`,
        {
          headers: {
            apikey: env.SUPABASE_KEY,
            Authorization: `Bearer ${env.SUPABASE_KEY}`,
          },
        }
      ).then(r => r.json())

      if (already?.[0]?.checked_in) {
        return Response.json({ error: "Already checked in" })
      }

      // update participation
      await fetch(
        `${env.SUPABASE_URL}/rest/v1/hike_participants?hike_id=eq.${checkin.hike_id}&user_id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            apikey: env.SUPABASE_KEY,
            Authorization: `Bearer ${env.SUPABASE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checked_in: true,
            checked_in_at: new Date().toISOString(),
          }),
        }
      )

      return Response.json({
        success: true,
        message: "Check-in validé",
      })
    }

    /**
     * =========================
     * DEFAULT
     * =========================
     */
    return new Response("OK")
  },
}

/**
 * TYPES ENV
 */
type Env = {
  SUPABASE_URL: string
  SUPABASE_KEY: string
}
