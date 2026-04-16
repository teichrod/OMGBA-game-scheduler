import crypto from "crypto";

function verifyToken(token) {
  const secret = process.env.SCORE_APPROVAL_SECRET;
  if (!secret) {
    throw new Error("Missing SCORE_APPROVAL_SECRET");
  }

  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature) {
    throw new Error("Invalid token format");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error("Invalid token signature");
  }

  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
}

async function loadPublishedPayload() {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) throw new Error("Missing APP_BASE_URL");

  const res = await fetch(`${appBaseUrl}/api/published-schedule?t=${Date.now()}`, {
    method: "GET",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!res.ok) {
    throw new Error(`Could not load published schedule (${res.status})`);
  }

  const data = await res.json();
  return data?.payload || null;
}

async function savePublishedPayload(payload) {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) throw new Error("Missing APP_BASE_URL");

  const res = await fetch(`${appBaseUrl}/api/published-schedule?t=${Date.now()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    body: JSON.stringify({ payload }),
  });

  if (!res.ok) {
    throw new Error(`Could not save published schedule (${res.status})`);
  }

  return true;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function createRowId(prefix = "score") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeScoreReportForGame(game, report) {
  if (!game || !report) return null;

  const teamScore = Number(report.teamScore);
  const opponentScore = Number(report.opponentScore);
  if (!Number.isFinite(teamScore) || !Number.isFinite(opponentScore)) return null;

  if (report.reportingTeam === game.home) {
    return { homeScore: teamScore, awayScore: opponentScore };
  }

  if (report.reportingTeam === game.away) {
    return { homeScore: opponentScore, awayScore: teamScore };
  }

  return null;
}

function getOfficialScoreFromReports(game, reports) {
  const gameReports = (Array.isArray(reports) ? reports : []).filter(
    (report) => report.gameId === game.gameId
  );

  if (!gameReports.length) {
    return {
      verified: false,
      official: null,
      reportSummary: "No reports yet.",
    };
  }

  const normalized = gameReports
    .map((report) => ({
      report,
      normalized: normalizeScoreReportForGame(game, report),
    }))
    .filter((entry) => entry.normalized);

  const verifiedMarked = normalized.find((entry) => entry.report.verifiedFinal);
  if (verifiedMarked) {
    return {
      verified: true,
      official: {
        homeScore: Number(verifiedMarked.report.officialHomeScore),
        awayScore: Number(verifiedMarked.report.officialAwayScore),
      },
      reportSummary: verifiedMarked.report.verificationReason || "Verified",
    };
  }

  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = i + 1; j < normalized.length; j += 1) {
      const a = normalized[i];
      const b = normalized[j];

      if (a.report.reportingTeam === b.report.reportingTeam) continue;
      if (
        a.normalized.homeScore === b.normalized.homeScore &&
        a.normalized.awayScore === b.normalized.awayScore
      ) {
        return {
          verified: true,
          official: {
            homeScore: a.normalized.homeScore,
            awayScore: a.normalized.awayScore,
          },
          reportSummary: "Verified by matching coach reports.",
        };
      }
    }
  }

  return {
    verified: false,
    official: null,
    reportSummary: "Waiting for matching coach report.",
  };
}

function buildPublicRedirectUrl(status, data, extraMessage = "") {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) throw new Error("Missing APP_BASE_URL");

  const url = new URL(appBaseUrl);
  url.searchParams.set("view", "public");

  if (data?.recipientTeam) {
    url.searchParams.set("team", data.recipientTeam);
  }

  url.searchParams.set("approval", status);

  if (extraMessage) {
    url.searchParams.set("message", extraMessage);
  }

  return url.toString();
}

function getExpectedCoachEmail(published, teamName) {
  return normalizeEmail(published?.coachDirectory?.[teamName] || "");
}

export default async function handler(req, res) {
  let data = null;

  try {
    const token = req.query.token;
    data = verifyToken(token);

    const published = await loadPublishedPayload();
    if (!published?.result?.schedule) {
      return res.redirect(buildPublicRedirectUrl("error", data, "No published schedule was found."));
    }

    const schedule = Array.isArray(published.result.schedule) ? published.result.schedule : [];
    const game = schedule.find((entry) => entry.gameId === data.gameId);

    if (!game) {
      return res.redirect(buildPublicRedirectUrl("error", data, "That game was not found."));
    }

    const existingReports = Array.isArray(published.scoreReports) ? published.scoreReports : [];
    const currentStatus = getOfficialScoreFromReports(game, existingReports);

    if (currentStatus.verified) {
      return res.redirect(buildPublicRedirectUrl("already-verified", data, "This score was already verified."));
    }

    const recipientEmail = normalizeEmail(data.recipientEmail);
    const reporterEmail = normalizeEmail(data.reporterEmail);
    const expectedRecipientEmail = getExpectedCoachEmail(published, data.recipientTeam);

    if (!recipientEmail) {
      return res.redirect(buildPublicRedirectUrl("error", data, "Approval token is missing the recipient email."));
    }

    if (recipientEmail === reporterEmail) {
      return res.redirect(buildPublicRedirectUrl("error", data, "The reporting coach cannot approve their own score."));
    }

    if (data.recipientTeam !== game.home && data.recipientTeam !== game.away) {
      return res.redirect(buildPublicRedirectUrl("error", data, "Approval token has an invalid team."));
    }

    if (data.recipientTeam === data.reportingTeam) {
      return res.redirect(buildPublicRedirectUrl("error", data, "The reporting coach cannot approve their own score."));
    }

    if (expectedRecipientEmail && expectedRecipientEmail !== recipientEmail) {
      return res.redirect(buildPublicRedirectUrl("error", data, "This approval link no longer matches the current coach email on file."));
    }

    const duplicateReport = existingReports.find(
      (report) =>
        report.gameId === data.gameId &&
        report.reportingTeam === data.recipientTeam &&
        normalizeEmail(report.reporterEmail) === recipientEmail
    );

    if (duplicateReport) {
      return res.redirect(buildPublicRedirectUrl("already-approved", data, "You already approved this score."));
    }

    const nextReport = {
      id: createRowId("score"),
      gameId: data.gameId,
      division: data.division,
      date: data.date,
      time: data.time,
      court: data.court,
      home: data.home,
      away: data.away,
      reportingTeam: data.recipientTeam,
      reporterEmail: recipientEmail,
      teamScore:
        data.recipientTeam === data.home ? Number(data.opponentScore) : Number(data.teamScore),
      opponentScore:
        data.recipientTeam === data.home ? Number(data.teamScore) : Number(data.opponentScore),
      approvalMode: true,
      approvalOfReportId: data.reportId || "",
      submittedAt: new Date().toISOString(),
    };

    let nextReports = [...existingReports, nextReport];

    const status = getOfficialScoreFromReports(game, nextReports);
    if (status.verified && status.official) {
      const verifiedAt = new Date().toISOString();
      nextReports = nextReports.map((report) =>
        report.gameId === data.gameId
          ? {
              ...report,
              verifiedFinal: true,
              verifiedAt,
              officialHomeScore: status.official.homeScore,
              officialAwayScore: status.official.awayScore,
              verificationReason: status.reportSummary || "Verified",
            }
          : report
      );
    }

    await savePublishedPayload({
      result: published.result,
      meta: published.meta || null,
      scoreReports: nextReports,
      config: published.config || null,
      coachDirectory: published.coachDirectory || null,
    });

    if (status.verified && status.official) {
      return res.redirect(
        buildPublicRedirectUrl(
          "success",
          data,
          `Score approved and verified: ${game.away} ${status.official.awayScore} - ${status.official.homeScore} ${game.home}.`
        )
      );
    }

    return res.redirect(
      buildPublicRedirectUrl("saved", data, "Approval was saved, but the score is still waiting for matching verification.")
    );
  } catch (e) {
    return res.redirect(
      buildPublicRedirectUrl("error", data, e?.message || "Could not approve score.")
    );
  }
}
