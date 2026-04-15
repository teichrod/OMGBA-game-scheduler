import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const body = req.body;

    const recipients = [
      body.homeCoachEmail,
      body.awayCoachEmail,
    ].filter(Boolean);

    const token = Buffer.from(JSON.stringify(body)).toString("base64");

    const approveUrl = `${process.env.APP_BASE_URL}/api/score-approve?token=${token}`;

    const html = `
      <h2>Score Reported</h2>
      <p>${body.away} @ ${body.home}</p>
      <p>${body.teamScore} - ${body.opponentScore}</p>
      <a href="${approveUrl}">Approve Score</a>
    `;

    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: process.env.SCORE_EMAIL_FROM },
        to: recipients.map((e) => ({ email: e })),
        subject: "Score Reported",
        htmlContent: html,
      }),
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
