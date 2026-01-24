export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`Error: ${error}`);
  }

  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  const clientId = "f0cd086c71734ab287d5bac2266b52cc";
  const clientSecret = "3b25e195e4254814bd5d9a56d224eb11";
  const redirectUri = "https://reality-hack-callback.vercel.app/api/callback";

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
        }),
      },
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return res.status(400).send(`Token exchange failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    const session = state || "default";

    // Store in Upstash Redis
    const redisUrl = "https://precise-parrot-31832.upstash.io";
    const redisToken =
      "AXxYAAIncDI0NDFlNTQ1YjM0MWI0YmQwOWU0MzBhM2IxZDQ1ZTlmMnAyMzE4MzI";

    await fetch(
      `${redisUrl}/set/spotify_session_${session}/${encodeURIComponent(
        JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
        }),
      )}?EX=600`,
      {
        headers: { Authorization: `Bearer ${redisToken}` },
      },
    );

    // Show success page with refresh token for manual entry
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Spotify Connected!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #121212; color: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
          .container { text-align: center; padding: 40px; max-width: 600px; }
          h1 { color: #1DB954; }
          .token-box { background: #282828; border-radius: 8px; padding: 20px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 12px; }
          .copy-btn { background: #1DB954; color: white; border: none; padding: 12px 24px; border-radius: 24px; font-size: 16px; cursor: pointer; margin-top: 10px; }
          .copy-btn:hover { background: #1ed760; }
          .note { color: #b3b3b3; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Spotify Connected!</h1>
          <p>You can close this window and return to VR.</p>
          <p class="note">If auto-login doesn't work, copy this refresh token:</p>
          <div class="token-box" id="token">${tokens.refresh_token}</div>
          <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('token').innerText); this.innerText='Copied!';">Copy Token</button>
          <p class="note">Paste it in Unity Inspector → Manual Refresh Token field</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Callback error:", err);
    res.status(500).send(`Error: ${err.message}`);
  }
}
