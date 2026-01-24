export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const session = req.query.session || "default";

  const redisUrl = "https://precise-parrot-31832.upstash.io";
  const redisToken =
    "AXxYAAIncDI0NDFlNTQ1YjM0MWI0YmQwOWU0MzBhM2IxZDQ1ZTlmMnAyMzE4MzI";

  try {
    const response = await fetch(`${redisUrl}/get/spotify_session_${session}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });

    const data = await response.json();

    if (data.result) {
      const tokens = JSON.parse(data.result);

      // Delete after reading (one-time use)
      await fetch(`${redisUrl}/del/spotify_session_${session}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });

      return res.json({
        success: true,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
    }

    return res.json({ success: false, message: "No tokens found" });
  } catch (err) {
    console.error("Tokens error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
