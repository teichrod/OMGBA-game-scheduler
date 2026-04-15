import crypto from "crypto";

function signToken(payload) {
  const secret = process.env.SCORE_APPROVAL_SECRET;
  if (!secret) {
    throw new Error("Missing SCORE_APPROVAL_SECRET");
  }

  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const appBaseUrl = process.env.APP_BASE_URL;
    const senderEmail = process.env.SCORE_EMAIL_FROM;

    if (!apiKey) throw new Error("Missing BREVO_API_KEY");
    if (!appBaseUrl) throw new Error("Missing APP_BASE_URL");
    if (!senderEmail) throw new Error("Missing SCORE_EMAIL_FROM");

    const body = req.body || {};

    const allRecipients = [
      { email: String(body.homeCoachEmail || "").trim().toLowerCase(), team: body.home },
      { email: String(body.awayCoachEmail || "").trim().toLowerCase(), team: body.away },
      ...((Array.isArray(body.notifyEmails) ? body.notifyEmails : [])
        .map((email) => ({ email: String(email || "").trim().toLowerCase(), team: null }))),
    ].filter((entry) => entry.email);

    const uniqueRecipients = [];
    const seen = new Set();
    for (const entry of allRecipients) {
      if (seen.has(entry.email)) continue;
      seen.add(entry.email);
      uniqueRecipients.push(entry);
    }

    const reporterEmail = String(body.reporterEmail || "").trim().toLowerCase();
    const reportingTeam = String(body.reportingTeam || "").trim();

    const emailJobs = uniqueRecipients.map(async (recipient) => {
      const recipientEmail = recipient.email;
      const recipientTeam = recipient.team;

      const isCoachRecipient =
        recipientTeam &&
        (recipientTeam === body.home || recipientTeam === body.away);

      const canApprove =
        isCoachRecipient &&
        recipientEmail !== reporterEmail &&
        recipientTeam !== reportingTeam &&
        !body.verified;

      let approveSection = `
        <p>This email is for score notification only.</p>
      `;

      if (canApprove) {
        const tokenPayload = {
          gameId: body.gameId,
          division: body.division,
          date: body.date,
          time: body.time,
          court: body.court,
          home: body.home,
          away: body.away,
          reportingTeam,
          reporterEmail,
          teamScore: body.teamScore,
          opponentScore: body.opponentScore,
          submittedAt: body.submittedAt,
          recipientEmail,
          recipientTeam,
          issuedAt: new Date().toISOString(),
        };

        const token = signToken(tokenPayload);
        const approveUrl = `${appBaseUrl}/api/score-approve?token=${encodeURIComponent(token)}`;

        approveSection = `
          <p>You are receiving this as the opposing coach for <strong>${recipientTeam}</strong>.</p>
          <p><a href="${approveUrl}">Approve Score</a></p>
        `;
      }

      const finalText = body.verified
        ? `<p><strong>Verified final score:</strong> ${body.away} ${body.officialAwayScore} - ${body.officialHomeScore} ${body.home}</p>`
        : `<p><strong>Reported score:</strong> ${body.teamScore} - ${body.opponentScore} from ${reportingTeam}</p>`;

      const html = `
        <h2>Score Reported</h2>
        <p><strong>${body.away}</strong> @ <strong>${body.home}</strong></p>
        <p>${body.date} at ${body.time}${body.court ? `, ${body.court}` : ""}</p>
        ${finalText}
        ${body.verificationReason ? `<p>${body.verificationReason}</p>` : ""}
        ${approveSection}
      `;

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { email: senderEmail },
          to: [{ email: recipientEmail }],
          subject: body.verified ? "Score Verified" : "Score Reported",
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Brevo send failed for ${recipientEmail}: ${response.status} ${text}`);
      }
    });

    await Promise.all(emailJobs);

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}