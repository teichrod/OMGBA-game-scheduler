import crypto from "crypto";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

function verifyApprovalToken(token, secret) {
  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature) throw new Error("Invalid token format");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  if (expected !== signature) throw new Error("Invalid token signature");

  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
}

function getOfficialScoreFromReports(game, reports) {
  const gameReports = reports.filter((r) => r.gameId === game.gameId || r.gameId === `${game.date}|${game.time}|${game.court}|${game.home}|${game.away}`);
  const byTeam = new Map();
  for (const report of gameReports) {
    byTeam.set(report.reportingTeam, report);
  }
  const homeReport = byTeam.get(game.home);
  const awayReport = byTeam.get(game.away);
  if (!homeReport || !awayReport) return { verified: false, official: null, reportSummary: "" };

  const homePerspectiveHome =
    homeReport.reportingTeam === game.home ? Number(homeReport.teamScore) : Number(homeReport.opponentScore);
  const homePerspectiveAway =
    homeReport.reportingTeam === game.home ? Number(homeReport.opponentScore) : Number(homeReport.teamScore);

  const awayPerspectiveAway =
    awayReport.reportingTeam === game.away ? Number(awayReport.teamScore) : Number(awayReport.opponentScore);
  const awayPerspectiveHome =
    awayReport.reportingTeam === game.away ? Number(awayReport.opponentScore) : Number(awayReport.teamScore);

  const matches = homePerspectiveHome === awayPerspectiveHome && homePerspectiveAway === awayPerspectiveAway;

  if (!matches) return { verified: false, official: null, reportSummary: "" };

  return {
    verified: true,
    official: {
      homeScore: homePerspectiveHome,
      awayScore: homePerspectiveAway,
    },
    reportSummary: "Approved by opposing coach via email link",
  };
}

async function getPublishedPayload(baseUrl) {
  const res = await fetch(`${baseUrl}/api/published-schedule?t=${Date.now()}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Could not load published schedule");
  const data = await res.json();
  return data?.payload || null;
}

async function savePublishedPayload(baseUrl, payload) {
  const res = await fetch(`${baseUrl}/api/published-schedule?t=${Date.now()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Could not save published schedule");
}

export default async function handler(req, res) {
  try {
    const appBaseUrl = requiredEnv("APP_BASE_URL");
    const secret = requiredEnv("SCORE_APPROVAL_SECRET");
    const token = req.query?.token || "";

    const data = verifyApprovalToken(token, secret);

    const published = await getPublishedPayload(appBaseUrl);
    if (!published?.result || !Array.isArray(published.scoreReports)) {
      throw new Error("Published schedule data not found");
    }

    const schedule = published.result.schedule || [];
    const scoreReports = [...published.scoreReports];
    const game = schedule.find((g) => {
      const id = `${g.date}|${g.time}|${g.court}|${g.home}|${g.away}`;
      return id === data.gameId;
    });

    if (!game) throw new Error("Game not found");

    const existingApproval = scoreReports.find(
      (r) =>
        r.gameId === data.gameId &&
        String(r.reporterEmail || "").trim().toLowerCase() === String(data.opponentEmail || "").trim().toLowerCase()
    );

    if (!existingApproval) {
      const approvingTeam = data.reportingTeam === game.home ? game.away : game.home;

      scoreReports.push({
        id: `score_approve_${Date.now()}`,
        gameId: data.gameId,
        division: game.division,
        date: game.date,
        time: game.time,
        court: game.court,
        home: game.home,
        away: game.away,
        reportingTeam: approvingTeam,
        reporterEmail: data.opponentEmail,
        teamScore: approvingTeam === game.home ? Number(data.opponentScore) : Number(data.teamScore),
        opponentScore: approvingTeam === game.home ? Number(data.teamScore) : Number(data.opponentScore),
        approvalMode: true,
        submittedAt: new Date().toISOString(),
      });
    }

    const status = getOfficialScoreFromReports({ ...game, gameId: data.gameId }, scoreReports);

    const nextReports = status.verified
      ? scoreReports.map((report) =>
          report.gameId === data.gameId
            ? {
                ...report,
                verifiedFinal: true,
                verifiedAt: new Date().toISOString(),
                officialHomeScore: status.official.homeScore,
                officialAwayScore: status.official.awayScore,
                verificationReason: status.reportSummary,
              }
            : report
        )
      : scoreReports;

    await savePublishedPayload(appBaseUrl, {
      ...published,
      scoreReports: nextReports,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <html>
        <body style="font-family:Arial,sans-serif;padding:24px;">
          <h2>Score approved</h2>
          <p>${game.away} ${status.official?.awayScore ?? "?"} - ${status.official?.homeScore ?? "?"} ${game.home}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(500).send(`
      <html>
        <body style="font-family:Arial,sans-serif;padding:24px;">
          <h2>Could not approve score</h2>
          <p>${error instanceof Error ? error.message : "Unknown error"}</p>
        </body>
      </html>
    `);
  }
}