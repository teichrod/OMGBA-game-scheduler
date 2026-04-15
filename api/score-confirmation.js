// score-confirmation.js (Brevo + approval)

import crypto from "crypto";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

function safe(value) {
  return value == null ? "" : String(value);
}

function buildSubject(body) {
  return `Score reported: ${safe(body.away)} at ${safe(body.home)} (${safe(body.date)} ${safe(body.time)})`;
}

function buildText(body) {
  return [
    `Division: ${safe(body.division)}`,
    `Date: ${safe(body.date)}`,
    `Time: ${safe(body.time)}`,
    `Court: ${safe(body.court)}`,
    `Matchup: ${safe(body.away)} at ${safe(body.home)}`,
    ``,
    `Reported by: ${safe(body.reportingTeam)}`,
    `Reporter email: ${safe(body.reporterEmail)}`,
    `Reported score: ${safe(body.reportingTeam)} ${safe(body.teamScore)} - Opponent ${safe(body.opponentScore)}`,
    `Submitted: ${safe(body.submittedAt)}`,
  ].join("\n");
}

function createApprovalToken(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export default async function handler(req, res) {
  try {
    const apiKey = requiredEnv("BREVO_API_KEY");
    const fromEmail = requiredEnv("SCORE_EMAIL_FROM");
    const fromName = process.env.SCORE_EMAIL_FROM_NAME || "Scheduler";
    const appBaseUrl = requiredEnv("APP_BASE_URL");
    const secret = requiredEnv("SCORE_APPROVAL_SECRET");

    const body = req.body || {};

    const reporterEmail = (body.reporterEmail || "").toLowerCase();
    const homeCoachEmail = (body.homeCoachEmail || "").toLowerCase();
    const awayCoachEmail = (body.awayCoachEmail || "").toLowerCase();

    const opponentEmail =
      reporterEmail === homeCoachEmail ? awayCoachEmail :
      reporterEmail === awayCoachEmail ? homeCoachEmail : "";

    const recipients = [homeCoachEmail, awayCoachEmail]
      .filter(Boolean);

    const token = opponentEmail
      ? createApprovalToken({
          gameId: body.gameId,
          reportingTeam: body.reportingTeam,
          reporterEmail,
          opponentEmail,
          teamScore: body.teamScore,
          opponentScore: body.opponentScore,
          submittedAt: body.submittedAt,
        }, secret)
      : "";

    const approveUrl = token
      ? `${appBaseUrl}/api/score-approve?token=${encodeURIComponent(token)}`
      : "";

    const html = `
      <div style="font-family:Arial;">
        <h3>Score Reported</h3>
        <p>${body.away} at ${body.home}</p>
        <p><b>${body.reportingTeam}</b> reported: ${body.teamScore}-${body.opponentScore}</p>
        ${approveUrl ? `<a href="${approveUrl}" style="padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Approve Score</a>` : ""}
      </div>
    `;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: recipients.map(email => ({ email })),
        subject: buildSubject(body),
        htmlContent: html,
        textContent: buildText(body),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(500).json({ error: data });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
