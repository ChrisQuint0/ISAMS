// Simple test endpoint to verify Vercel functions work
export default function handler(req, res) {
  res.status(200).json({
    message: "Vercel functions are working!",
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  });
}
