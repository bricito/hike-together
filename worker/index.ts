export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/generate") {
      const hikeId = url.searchParams.get("hikeId");

      const token = crypto.randomUUID();

      return Response.json({
        hikeId,
        token,
        expiresAt: Date.now() + 30000,
      });
    }

    return new Response("OK");
  },
};
