export default async function handler(req, res) {
  try {
    const token = req.query.token;
    const data = JSON.parse(Buffer.from(token, "base64").toString());

    // TODO: load published schedule and apply approval

    res.send("Score approved successfully!");
  } catch (e) {
    res.send("Could not approve score: " + e.message);
  }
}
