export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/generate") {
      const hikeId = url.searchParams.get("hikeId");

      const token = crypto.randomUUID();
      const expiresAt = Date.now() + 60 * 1000; // 60 sec

      // ici tu pourrais update Supabase via API
      return Response.json({
        hikeId,
        token,
        expiresAt,
      });
    }

    return new Response("OK");
  },
};
