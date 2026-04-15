// api/score-confirmation.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function safe(value) {
  return value == null ? "" : String(value);
}

function buildSubject(body) {
  if (body.verified) {
    return `Verified score: ${body.away} ${body.officialAwayScore} - ${body.officialHomeScore} ${body.home}`;
  }
  return `Score reported: ${body.away} at ${body.home} (${body.date} ${body.time})`;
}

function buildText(body) {
  const lines = [
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
  ];

  if (body.verified) {
    lines.push(
      ``,
      `Official score verified.`,
      `${safe(body.away)} ${safe(body.officialAwayScore)} - ${safe(body.officialHomeScore)} ${safe(body.home)}`,
      `Reason: ${safe(body.verificationReason)}`
    );
  } else {
    lines.push(``, `This score is not official yet. Waiting for matching/close confirmation.`);
  }

  return lines.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};

    const recipients = [
      body.reporterEmail,
      process.env.SCORE_EMAIL_TO || "",
      ...(Array.isArray(body.notifyEmails) ? body.notifyEmails : []),
    ]
      .map((x) => String(x || "").trim().toLowerCase())
      .filter(Boolean);

    const uniqueRecipients = [...new Set(recipients)];

    if (!uniqueRecipients.length) {
      return res.status(400).json({ error: "No recipients configured" });
    }

    const subject = buildSubject(body);
    const text = buildText(body);

    const { error } = await resend.emails.send({
      from: process.env.SCORE_EMAIL_FROM,
      to: uniqueRecipients,
      subject,
      text,
    });

    if (error) {
      return res.status(500).json({ error: error.message || "Email send failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
}