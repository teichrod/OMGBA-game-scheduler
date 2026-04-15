function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

console.log("Sending score email to:", uniqueRecipients);
console.log("From sender:", fromEmail, fromName);
console.log("Subject:", buildSubject(body));
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
    const apiKey = requiredEnv("BREVO_API_KEY");
    const fromEmail = requiredEnv("SCORE_EMAIL_FROM");
    const fromName = String(process.env.SCORE_EMAIL_FROM_NAME || "Scheduler").trim();
    const fallbackTo = String(process.env.SCORE_EMAIL_TO || "").trim().toLowerCase();

    const body = req.body || {};

    const recipients = [body.reporterEmail, fallbackTo]
      .map((x) => String(x || "").trim().toLowerCase())
      .filter(Boolean);

    const uniqueRecipients = [...new Set(recipients)];

    if (!uniqueRecipients.length) {
      return res.status(400).json({ error: "No recipients configured" });
    }

    const payload = {
      sender: {
        email: fromEmail,
        name: fromName,
      },
      to: uniqueRecipients.map((email) => ({ email })),
      subject: buildSubject(body),
      textContent: buildText(body),
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Brevo returned error:", {
        status: response.status,
        data,
      });

      return res.status(500).json({
        error: data?.message || `Brevo send failed with status ${response.status}`,
        details: data,
      });
    }

    return res.status(200).json({
      ok: true,
      id: data?.messageId || null,
    });
  } catch (error) {
    console.error("score-confirmation handler failed:", error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
}