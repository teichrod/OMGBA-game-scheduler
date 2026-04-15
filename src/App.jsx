// NOTE: This is a PATCHED VERSION (only relevant sections shown)
// Replace ONLY the indicated sections in your existing App.jsx

// === 1. Team Setup Grid Header ===
const TEAM_GRID = "40px 90px 60px 140px 240px 1fr";

// Replace your header JSX with:
/*
<div style={{
  display: "grid",
  gridTemplateColumns: TEAM_GRID,
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
}}>
  <div>Team</div>
  <div>Assoc.</div>
  <div>No.</div>
  <div>Coach</div>
  <div>Email</div>
  <div>Preview</div>
</div>
*/

// === 2. Team Row (inside details.map) ===
// Replace your row block with:
/*
<div style={{
  display: "grid",
  gridTemplateColumns: TEAM_GRID,
  gap: 6,
  alignItems: "center"
}}>
  <div>{idx + 1}</div>

  <select ... />

  <input ... />

  <input ... />

  <input
    value={entry.coachEmail || ""}
    placeholder="coach@email.com"
    onChange={(e) =>
      updateDivisionTeamDetail(division, idx, {
        coachEmail: e.target.value.trim().toLowerCase(),
      })
    }
  />

  <div>{buildFormattedTeamName(...)} </div>
</div>
*/

// === 3. Publish Schedule Fix ===
// Replace your savePublishedPayload call with:
/*
const ok = await savePublishedPayload({
  result,
  meta,
  scoreReports: retainedReports,
  config: normalizeConfig(config),
});
*/

// === 4. Load Schedule Fix ===
/*
if (published.config) {
  setConfig(normalizeConfig(published.config));
}
*/

// === 5. Updated sendScoreConfirmationEmail ===
async function sendScoreConfirmationEmail(game, report) {
  const homeCoachEmail = getCoachEmailForTeam(config, game.home);
  const awayCoachEmail = getCoachEmailForTeam(config, game.away);

  return fetch("/api/score-confirmation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gameId: getGameScoreKey(game),
      division: game.division,
      date: game.date,
      time: game.time,
      court: game.court || "",
      home: game.home,
      away: game.away,
      homeCoachEmail,
      awayCoachEmail,
      reporterEmail: report.reporterEmail,
      reportingTeam: report.reportingTeam,
      teamScore: report.teamScore,
      opponentScore: report.opponentScore,
      submittedAt: report.submittedAt,
    }),
  });
}
