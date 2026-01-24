export default function handler(req, res) {
  const clientId = "f0cd086c71734ab287d5bac2266b52cc";
  const redirectUri = "https://reality-hack-callback.vercel.app/api/callback";
  const scope =
    "user-read-playback-state user-modify-playback-state user-read-currently-playing streaming";

  const session = req.query.session || "default";

  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${session}`;

  res.redirect(authUrl);
}
