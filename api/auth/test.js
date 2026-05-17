// Test endpoint for auth route
export default function handler(req, res) {
  res.status(200).json({
    message: "Auth handler test successful!",
    path: req.url,
    env_check: {
      has_google_client_id: !!process.env.GOOGLE_CLIENT_ID,
      has_google_client_secret: !!process.env.GOOGLE_CLIENT_SECRET
    }
  });
}
