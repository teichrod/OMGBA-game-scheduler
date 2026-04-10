let publishedPayload = null;

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!publishedPayload) {
      return res.status(404).json({ ok: false, message: "No published schedule found yet." });
    }
    return res.status(200).json({ ok: true, payload: publishedPayload });
  }

  if (req.method === "POST") {
    try {
      publishedPayload = req.body;
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ ok: false, message: "Failed to save published schedule." });
    }
  }

  if (req.method === "DELETE") {
    publishedPayload = null;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, message: "Method not allowed." });
}
