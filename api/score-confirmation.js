import { Resend } from "resend";

console.log("env check", {
  hasApiKey: Boolean(process.env.RESEND_API_KEY),
  apiKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 3),
  from: process.env.SCORE_EMAIL_FROM,
});
function getRequiredEnv(name) {
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
    `Approval mode: ${body.approvalMode ? "Yes" : "No"}`,
    `Submitted: ${safe(body.submittedAt)}`,
  ].join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = getRequiredEnv("RESEND_API_KEY");
    const from = getRequiredEnv("SCORE_EMAIL_FROM");
    const fallbackTo = String(process.env.SCORE_EMAIL_TO || "").trim().toLowerCase();

    const resend = new Resend(apiKey);
    const body = req.body || {};

    const recipients = [body.reporterEmail, fallbackTo]
      .map((x) => String(x || "").trim().toLowerCase())
      .filter(Boolean);

    const uniqueRecipients = [...new Set(recipients)];

    if (!uniqueRecipients.length) {
      return res.status(400).json({ error: "No recipients configured" });
    }

    const payload = {
      from,
      to: uniqueRecipients,
      subject: buildSubject(body),
      text: buildText(body),
    };

    console.log("score-confirmation send attempt", {
      from,
      to: uniqueRecipients,
      subject: payload.subject,
      hasApiKey: Boolean(apiKey),
    });

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error("Resend returned error:", error);
      return res.status(500).json({
        error: error.message || "Resend send failed",
        details: error,
      });
    }

    console.log("Resend send success:", data);

    return res.status(200).json({
      ok: true,
      id: data?.id || null,
    });
  } catch (error) {
    console.error("score-confirmation handler failed:", error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
}