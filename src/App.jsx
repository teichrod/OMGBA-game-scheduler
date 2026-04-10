import { useMemo, useState, useEffect } from "react";
import {
  CalendarDays,
  Trophy,
  Settings,
  AlertTriangle,
  Wand2,
  Download,
  Building2,
} from "lucide-react";

const DIVISIONS = [
  "5th Boys",
  "6th Boys",
  "7th Boys",
  "8th Boys",
  "5th/6th Girls",
  "7th/8th Girls",
];

const DEFAULT_COURTS = [
  { name: "MGMS-AB", enabled: true },
  { name: "MGMS-DE", enabled: true },
  { name: "MGCG-FG", enabled: true },
  { name: "MGCG-HI", enabled: true },
  { name: "MGCG-JK", enabled: true },
  { name: "OMS", enabled: false },
  { name: "OSH 1", enabled: false },
  { name: "OSH 2", enabled: false },
  { name: "OSH 3", enabled: false },
  { name: "AR 1", enabled: false },
  { name: "AR 2", enabled: false },
  { name: "", enabled: false },
];

const DEFAULT_TIMES = [
  "8:00",
  "9:05",
  "10:10",
  "11:15",
  "12:20",
  "1:25",
  "2:30",
  "3:35",
  "4:40",
  "5:45",
];

const SEASON_YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => 2026 + i);
const TEAM_COUNT_OPTIONS = Array.from({ length: 21 }, (_, i) => String(i + 4));
const GAME_COUNT_OPTIONS = ["6", "7", "8", "9", "10", "11", "12"];
const MAX_EARLY_OPTIONS = ["0", "1", "2", "3", "4"];


const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 24,
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "grid",
    gap: 24,
  },
  row: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  title: {
    fontSize: 30,
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    marginTop: 6,
  },
  button: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  primaryButton: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  successButton: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #16a34a",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  dangerButton: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #dc2626",
    background: "white",
    color: "#b91c1c",
    cursor: "pointer",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "white",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "white",
    boxSizing: "border-box",
  },
  smallLabel: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    display: "block",
  },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: "#e2e8f0",
  },
  badgeDanger: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: "#fee2e2",
    color: "#991b1b",
  },
  alert: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    border: "1px solid #fecaca",
    background: "#fff7ed",
    color: "#9a3412",
    borderRadius: 14,
    padding: 14,
  },
  publicBanner: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontWeight: 600,
  },
  publishBanner: {
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontWeight: 600,
  },
  tabBar: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 8,
  },
  tabButton: {
    padding: "12px 10px",
    border: "1px solid #cbd5e1",
    background: "white",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  tabButtonActive: {
    padding: "12px 10px",
    border: "1px solid #2563eb",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "420px minmax(0,1fr)",
    gap: 24,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
    gap: 16,
  },
  statsGrid5: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0,1fr))",
    gap: 16,
  },
  tableWrap: {
    maxHeight: 700,
    overflow: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    position: "sticky",
    top: 0,
    background: "white",
    textAlign: "left",
    padding: 12,
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "top",
  },
};

function Card({ children }) {
  return <div style={styles.card}>{children}</div>;
}

function StatCard({ label, value, subvalue }) {
  return (
    <Card>
      <div style={{ fontSize: 14, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {subvalue ? <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>{subvalue}</div> : null}
    </Card>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20, fontWeight: 700, marginBottom: 14 }}>
      {Icon ? <Icon size={20} /> : null}
      {children}
    </div>
  );
}

function Badge({ children, danger = false }) {
  return <span style={danger ? styles.badgeDanger : styles.badge}>{children}</span>;
}

function formatShortDate(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = String(date.getFullYear()).slice(-2);
  return `${m}/${d}/${y}`;
}

function getSeasonSaturdays(startYear) {
  const dates = [];
  const start = new Date(startYear, 10, 1);
  const end = new Date(startYear + 1, 1, 28);
  const cursor = new Date(start);
  while (cursor <= end) {
    if (cursor.getDay() === 6) dates.push(formatShortDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function buildDateCourtSettings(dates, previous = {}, baseCourts = DEFAULT_COURTS) {
  const next = {};
  for (const date of dates) {
    const prior = previous[date] || [];
    next[date] = baseCourts.map((court, idx) => {
      const priorCourt = prior[idx];
      const match = prior.find((p) => p.name === court.name);
      return {
        name: priorCourt?.name ?? match?.name ?? court.name,
        enabled: priorCourt?.enabled ?? match?.enabled ?? court.enabled,
        startTime: priorCourt?.startTime ?? match?.startTime ?? "8:00",
      };
    });
  }
  return next;
}

function createInitialState() {
  const seasonYear = 2026;
  const saturdays = getSeasonSaturdays(seasonYear).map((date) => ({ date, enabled: false }));
  return {
    seasonYear,
    maxEarlyGames: 2,
    globalAllowDoubleheaders: false,
    selectedDateForCourts: saturdays[0]?.date || "",
    fifthBoysDoubleheaderDate: "",
    timeSlots: DEFAULT_TIMES.map((time) => ({ time, enabled: true })),
    divisions: {
      "5th Boys": 8,
      "6th Boys": 8,
      "7th Boys": 8,
      "8th Boys": 8,
      "5th/6th Girls": 8,
      "7th/8th Girls": 8,
    },
    divisionGames: {
      "5th Boys": 10,
      "6th Boys": 8,
      "7th Boys": 8,
      "8th Boys": 8,
      "5th/6th Girls": 8,
      "7th/8th Girls": 8,
    },
    saturdays,
    dateCourtSettings: buildDateCourtSettings(saturdays.map((s) => s.date)),
  };
}

function isEarlyTime(time) { return time === "8:00"; }
function maxSameTimeSlot(gamesByTime) { const values = Object.values(gamesByTime); return values.length ? Math.max(...values) : 0; }
function isMorningTime(time) { return ["8:00", "9:05", "10:10", "11:15"].includes(time); }
function isAfternoonTime(time) { return ["12:20", "1:25", "2:30", "3:35", "4:40", "5:45"].includes(time); }
function getIdealMorningGames(team) { return Math.floor((team.targetGames || 0) / 2); }
function getIdealAfternoonGames(team) { return Math.ceil((team.targetGames || 0) / 2); }
function getProjectedTimeCount(team, time) { return (team.gamesByTime?.[time] || 0) + 1; }
function getTimeSpreadPenalty(team, slotTime) {
  const counts = DEFAULT_TIMES.filter((time) => team.gamesByTime?.[time] != null || time === slotTime).map((time) => (team.gamesByTime?.[time] || 0) + (time === slotTime ? 1 : 0));
  if (counts.length === 0) return 0;
  return (Math.max(...counts) - Math.min(...counts)) * 10;
}
function fairnessScore(team) {
  const morningGames = team.morningGames || 0;
  const afternoonGames = team.afternoonGames || 0;
  const dayPartImbalance = Math.abs(morningGames - afternoonGames);
  const idealMorning = getIdealMorningGames(team);
  const idealAfternoon = getIdealAfternoonGames(team);
  return (team.earlyGames || 0) * 2 + (team.maxSameTimeSlot || 0) * 10 + Math.abs((team.home || 0) - (team.away || 0)) * 1.5 + (team.doubleHeaders || 0) * 2 + dayPartImbalance * 12 + Math.abs(morningGames - idealMorning) * 8 + Math.abs(afternoonGames - idealAfternoon) * 8;
}

function buildTeams(config) {
  const teams = [];
  for (const division of DIVISIONS) {
    const count = Number(config.divisions[division] || 0);
    const targetGames = Number(config.divisionGames[division] || 8);
const isOddDivision = count % 2 === 1;

let maxDoubleheadersPerTeam = 0;

if (config.globalAllowDoubleheaders) {
  maxDoubleheadersPerTeam = 99;
} else if (division === "5th Boys") {
  maxDoubleheadersPerTeam = isOddDivision ? 2 : 1;
} else {
  maxDoubleheadersPerTeam = isOddDivision ? 1 : 0;
}

for (let i = 1; i <= count; i += 1) {
  teams.push({
    id: `${division}::${i}`,
    name: `${division} Team ${i}`,
    division,
    gamesScheduled: 0,
    targetGames,
    earlyGames: 0,
    home: 0,
    away: 0,
    doubleHeaders: 0,
    maxSameTimeSlot: 0,
    maxDoubleheadersPerTeam,
    gamesByDate: {},
    gamesByTime: {},
    opponents: {},
    scheduledGames: [],
    morningGames: 0,
    afternoonGames: 0,
  });
}

  }
  return teams;
}

function getEnabledCourtsForDate(config, date) { const courts = config.dateCourtSettings[date] || []; return courts.filter((c) => c.enabled && String(c.name || "").trim() !== ""); }
function getSlotsRemainingForCourt(config, court) { const enabledTimes = config.timeSlots.filter((t) => t.enabled).map((t) => t.time); const startIndex = enabledTimes.indexOf(court.startTime || "8:00"); if (!court.enabled || String(court.name || "").trim() === "") return 0; if (startIndex < 0) return enabledTimes.length; return enabledTimes.length - startIndex; }
function getTotalSlotsForDate(config, date) { const courts = config.dateCourtSettings[date] || []; return courts.reduce((sum, court) => sum + getSlotsRemainingForCourt(config, court), 0); }
function buildOpenSlots(config) {
  const enabledDates = config.saturdays.filter((d) => d.enabled).map((d) => d.date);
  const enabledTimes = config.timeSlots.filter((t) => t.enabled).map((t) => t.time);
  const slots = [];
  for (const date of enabledDates) {
    const courts = getEnabledCourtsForDate(config, date);
    for (const time of enabledTimes) {
      for (const court of courts) {
        const startIndex = enabledTimes.indexOf(court.startTime || "8:00");
        const timeIndex = enabledTimes.indexOf(time);
        if (timeIndex < startIndex) continue;
        slots.push({ key: `${date}|${time}|${court.name}`, date, time, court: court.name, used: false });
      }
    }
  }
  return slots;
}
function chooseHomeTeam(teamA, teamB) { const diffA = (teamA.home || 0) - (teamA.away || 0); const diffB = (teamB.home || 0) - (teamB.away || 0); if (diffA < diffB) return teamA; if (diffB < diffA) return teamB; return teamA.name < teamB.name ? teamA : teamB; }
function applyGame(team, slot, opponentName, isHome) {
  team.gamesScheduled += 1; team.gamesByDate[slot.date] = (team.gamesByDate[slot.date] || 0) + 1; team.gamesByTime[slot.time] = (team.gamesByTime[slot.time] || 0) + 1; team.opponents[opponentName] = (team.opponents[opponentName] || 0) + 1; team.scheduledGames.push({ date: slot.date, time: slot.time, court: slot.court, opponentName, isHome }); if (isHome) team.home += 1; else team.away += 1; if (isEarlyTime(slot.time)) team.earlyGames += 1; if (isMorningTime(slot.time)) team.morningGames += 1; if (isAfternoonTime(slot.time)) team.afternoonGames += 1; if ((team.gamesByDate[slot.date] || 0) > 1) team.doubleHeaders += 1; team.maxSameTimeSlot = maxSameTimeSlot(team.gamesByTime);
}
function getTimeIndex(time) { return DEFAULT_TIMES.indexOf(time); }
function areBackToBackTimes(timeA, timeB) { const a = getTimeIndex(timeA); const b = getTimeIndex(timeB); return a >= 0 && b >= 0 && Math.abs(a - b) === 1; }
function getScheduledGamesOnDate(team, date) { return (team.scheduledGames || []).filter((game) => game.date === date); }
function canPairInSlot(teamA, teamB, slot, config) {
  if (teamA.id === teamB.id || teamA.division !== teamB.division || slot.used) return false;
  const aOnDate = teamA.gamesByDate[slot.date] || 0; const bOnDate = teamB.gamesByDate[slot.date] || 0;
 if (aOnDate >= 2 || bOnDate >= 2) return false;

if (aOnDate >= 1 && (teamA.doubleHeaders || 0) >= (teamA.maxDoubleheadersPerTeam || 0)) return false;
if (bOnDate >= 1 && (teamB.doubleHeaders || 0) >= (teamB.maxDoubleheadersPerTeam || 0)) return false;
  if (aOnDate === 1) { const existingA = getScheduledGamesOnDate(teamA, slot.date)[0]; if (!existingA || !areBackToBackTimes(existingA.time, slot.time) || existingA.court !== slot.court) return false; }
  if (bOnDate === 1) { const existingB = getScheduledGamesOnDate(teamB, slot.date)[0]; if (!existingB || !areBackToBackTimes(existingB.time, slot.time) || existingB.court !== slot.court) return false; }
  if (config.fifthBoysDoubleheaderDate) {
  if (teamA.division === "5th Boys" && slot.date !== config.fifthBoysDoubleheaderDate) {
    const aDhCount = teamA.gamesByDate[config.fifthBoysDoubleheaderDate] || 0; const bDhCount = teamB.gamesByDate[config.fifthBoysDoubleheaderDate] || 0; if (aDhCount < 2 || bDhCount < 2) return false;
  }
  if (teamA.division !== "5th Boys" && slot.date === config.fifthBoysDoubleheaderDate) return false;
}
  if (isEarlyTime(slot.time)) { if ((teamA.earlyGames || 0) >= Number(config.maxEarlyGames)) return false; if ((teamB.earlyGames || 0) >= Number(config.maxEarlyGames)) return false; }
  return true;
}
function getProjectedDayPartPenalty(team, slotTime) {
  const projectedMorning = (team.morningGames || 0) + (isMorningTime(slotTime) ? 1 : 0);
  const projectedAfternoon = (team.afternoonGames || 0) + (isAfternoonTime(slotTime) ? 1 : 0);
  const idealMorning = getIdealMorningGames(team); const idealAfternoon = getIdealAfternoonGames(team);
  return Math.abs(projectedMorning - projectedAfternoon) * 14 + Math.abs(projectedMorning - idealMorning) * 12 + Math.abs(projectedAfternoon - idealAfternoon) * 12;
}
function slotPenalty(teamA, teamB, slot) {
  let penalty = 0; const timeIndex = getTimeIndex(slot.time); penalty += Math.max(0, timeIndex) * 10; penalty += getProjectedTimeCount(teamA, slot.time) * 18; penalty += getProjectedTimeCount(teamB, slot.time) * 18; penalty += getTimeSpreadPenalty(teamA, slot.time); penalty += getTimeSpreadPenalty(teamB, slot.time); penalty += getProjectedDayPartPenalty(teamA, slot.time); penalty += getProjectedDayPartPenalty(teamB, slot.time); penalty += (teamA.gamesByDate[slot.date] || 0) * 10; penalty += (teamB.gamesByDate[slot.date] || 0) * 10; const existingA = getScheduledGamesOnDate(teamA, slot.date)[0]; const existingB = getScheduledGamesOnDate(teamB, slot.date)[0]; if (existingA && areBackToBackTimes(existingA.time, slot.time) && existingA.court === slot.court) penalty -= 30; if (existingB && areBackToBackTimes(existingB.time, slot.time) && existingB.court === slot.court) penalty -= 30; if ((teamA.gamesByDate[slot.date] || 0) >= 1) penalty += 8; if ((teamB.gamesByDate[slot.date] || 0) >= 1) penalty += 8; return penalty;
}
function scheduleGame(schedule, slot, teamA, teamB) { const homeTeam = chooseHomeTeam(teamA, teamB); const awayTeam = homeTeam.id === teamA.id ? teamB : teamA; slot.used = true; applyGame(homeTeam, slot, awayTeam.name, true); applyGame(awayTeam, slot, homeTeam.name, false); schedule.push({ division: homeTeam.division, date: slot.date, time: slot.time, court: slot.court, home: homeTeam.name, away: awayTeam.name }); }
function buildRoundRobinRounds(teamList) {
  const teams = [...teamList]; if (teams.length % 2 === 1) teams.push(null); const rounds = []; let arr = [...teams]; const totalRounds = arr.length - 1;
  for (let round = 0; round < totalRounds; round += 1) { const pairings = []; for (let i = 0; i < arr.length / 2; i += 1) { const a = arr[i]; const b = arr[arr.length - 1 - i]; if (a && b) pairings.push([a, b]); } rounds.push(pairings); arr = [arr[0], arr[arr.length - 1], ...arr.slice(1, arr.length - 1)]; }
  return rounds;
}
function scheduleFifthBoysDoubleheaderDay(teams, openSlots, schedule, unscheduled, config) {
  if (!config.fifthBoysDoubleheaderDate) return; const teamList = teams.filter((t) => t.division === "5th Boys"); if (teamList.length === 0) return; if (teamList.length % 2 === 1) { unscheduled.push({ matchup: "5th Boys doubleheader day", reason: "5th Boys team count is odd", suggestion: "Use an even number of 5th Boys teams for an everyone-plays doubleheader day" }); return; }
  const slots = openSlots.filter((s) => !s.used && s.date === config.fifthBoysDoubleheaderDate); const rounds = buildRoundRobinRounds(teamList); const neededGames = teamList.length;
  if (slots.length < neededGames) { unscheduled.push({ matchup: "5th Boys doubleheader day", reason: "Not enough slots on selected date", suggestion: "Enable more courts or times on that Saturday" }); return; }
  const selectedPairings = [...(rounds[0] || []), ...(rounds[1] || [])]; if (selectedPairings.length < neededGames) { unscheduled.push({ matchup: "5th Boys doubleheader day", reason: "Could not build two full rounds of pairings", suggestion: "Adjust 5th Boys team count" }); return; }
  const slotOrder = [...slots].sort((a, b) => { const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time); if (timeDiff !== 0) return timeDiff; return a.court.localeCompare(b.court); });
  for (let i = 0; i < neededGames; i += 1) { const pairing = selectedPairings[i]; const slot = slotOrder[i]; if (!pairing || !slot) break; scheduleGame(schedule, slot, pairing[0], pairing[1]); }
}
function chooseBestCandidate(team, allTeams, openSlots, config) {
  const divisionTeams = allTeams.filter((t) => t.division === team.division && t.id !== team.id && t.gamesScheduled < t.targetGames); let best = null; let bestScore = Infinity;
  for (const opponent of divisionTeams) { const repeatPenalty = (team.opponents[opponent.name] || 0) * 3; for (const slot of openSlots) { if (!canPairInSlot(team, opponent, slot, config)) continue; const score = fairnessScore(team) + fairnessScore(opponent) + slotPenalty(team, opponent, slot) + repeatPenalty; if (score < bestScore) { bestScore = score; best = { teamA: team, teamB: opponent, slot }; } } }
  return best;
}
function generateScheduleEngine(config) {
  const teams = buildTeams(config); const openSlots = buildOpenSlots(config); const schedule = []; const unscheduled = [];
  scheduleFifthBoysDoubleheaderDay(teams, openSlots, schedule, unscheduled, config);
  for (const division of DIVISIONS) {
    const divisionTeams = teams.filter((t) => t.division === division); let safety = 0;
    while (divisionTeams.some((t) => t.gamesScheduled < t.targetGames) && safety < 8000) {
      safety += 1; const needyTeams = divisionTeams.filter((t) => t.gamesScheduled < t.targetGames).sort((a, b) => (b.targetGames - b.gamesScheduled) - (a.targetGames - a.gamesScheduled)); let scheduledOne = false;
      for (const team of needyTeams) { const freeSlots = openSlots.filter((slot) => !slot.used); const best = chooseBestCandidate(team, teams, freeSlots, config); if (!best) continue; scheduleGame(schedule, best.slot, best.teamA, best.teamB); scheduledOne = true; break; }
      if (!scheduledOne) { unscheduled.push({ matchup: needyTeams.map((t) => t.name).join(", "), reason: "No valid matchup or slot found during main pass", suggestion: "Add Saturdays, add courts on specific dates, or relax constraints" }); break; }
    }
  }
  const remainingTeams = teams.filter((t) => t.gamesScheduled < t.targetGames).sort((a, b) => (b.targetGames - b.gamesScheduled) - (a.targetGames - a.gamesScheduled));
  for (const team of remainingTeams) {
    let safety = 0;
    while (team.gamesScheduled < team.targetGames && safety < 500) {
      safety += 1; const slot = openSlots.find((s) => !s.used);
      if (!slot) { unscheduled.push({ matchup: team.name, reason: "No slots left", suggestion: "Add more Saturdays or enable more courts on active dates" }); break; }
      const opponent = teams.find((t) => t.id !== team.id && t.division === team.division && t.gamesScheduled < t.targetGames && canPairInSlot(team, t, slot, config));
      if (!opponent) { unscheduled.push({ matchup: team.name, reason: "No opponent found", suggestion: "Allow more doubleheaders or create more slot capacity" }); break; }
      scheduleGame(schedule, slot, team, opponent);
    }
  }
  const parseDate = (d) => { const [m, day, y] = String(d).split("/"); return new Date(`20${y}`, Number(m) - 1, Number(day)).getTime(); };
  schedule.sort((a, b) => { const dateDiff = parseDate(a.date) - parseDate(b.date); if (dateDiff !== 0) return dateDiff; const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time); if (timeDiff !== 0) return timeDiff; return a.court.localeCompare(b.court); });
  const auditRows = teams.map((team) => ({ team: team.name, division: team.division, games: team.gamesScheduled, target: team.targetGames, early: team.earlyGames, home: team.home, away: team.away, dh: team.doubleHeaders, maxSameTime: team.maxSameTimeSlot, morning: team.morningGames || 0, afternoon: team.afternoonGames || 0, issues: [
  team.gamesScheduled !== team.targetGames ? "Missing games" : null,
  team.earlyGames > Number(config.maxEarlyGames) ? "Too many early games" : null,
  Math.abs(team.home - team.away) > 2 ? "Home/away imbalance" : null,
  team.doubleHeaders > (team.maxDoubleheadersPerTeam || 0) ? "Too many doubleheaders" : null,
].filter(Boolean) }));
  const fifthBoysDhTeamsMet = teams.filter((t) => t.division === "5th Boys").every((t) => { if (!config.fifthBoysDoubleheaderDate) return true; return (t.gamesByDate[config.fifthBoysDoubleheaderDate] || 0) === 2; });
  const auditSummary = { totalGames: schedule.length, totalTeams: teams.length, allTeamsScheduled: auditRows.every((r) => r.games === r.target), earlyViolations: auditRows.filter((r) => r.early > Number(config.maxEarlyGames)).length, homeAwayIssues: auditRows.filter((r) => Math.abs(r.home - r.away) > 2).length, missingTeams: auditRows.filter((r) => r.games !== r.target).length, enabledDates: config.saturdays.filter((d) => d.enabled).length, enabledCourts: Object.values(config.dateCourtSettings).reduce((sum, courts) => sum + courts.filter((c) => c.enabled && String(c.name || "").trim() !== "").length, 0), fifthBoysDhTeamsMet };
  return { schedule, auditRows, auditSummary, unscheduled };
}

function exportCsv(filename, rows) {
 const csv = rows
  .map((row) =>
    row
      .map((cell) => {
        const value = cell == null ? "" : String(cell);
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",")
  )
  .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

async function savePublishedPayload(payload) {
  try {
    const res = await fetch("/api/published-schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadPublishedPayload() {
  try {
    const res = await fetch("/api/published-schedule");
    if (!res.ok) return null;
    const data = await res.json();
    return data.payload || null;
  } catch {
    return null;
  }
}

async function clearPublishedPayload() {
  try {
    const res = await fetch("/api/published-schedule", {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

function runSelfChecks() {
  const initial = createInitialState(); const firstDate = initial.saturdays[0]?.date || "";
  return [
    { name: "Season Saturday generation returns dates", pass: getSeasonSaturdays(2026).length > 0 },
    { name: "5th Boys default to 10 games", pass: initial.divisionGames["5th Boys"] === 10 },
    { name: "Combined girls divisions default to 8 games", pass: initial.divisionGames["5th/6th Girls"] === 8 && initial.divisionGames["7th/8th Girls"] === 8 },
    { name: "Team count selector reaches 24", pass: TEAM_COUNT_OPTIONS.includes("24") },
    { name: "Extra courts start disabled", pass: initial.dateCourtSettings[firstDate]?.some((c) => c.name === "OMS" && c.enabled === false) ?? true },
    { name: "Courts default to 8:00 start", pass: initial.dateCourtSettings[firstDate]?.every((c) => c.startTime === "8:00") ?? true },
    { name: "Selected court date initializes safely", pass: initial.selectedDateForCourts === firstDate },
    { name: "Total slots for date is non-negative", pass: getTotalSlotsForDate(initial, firstDate) >= 0 },
  ];
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const isPublicMode = (params.get("view") || "").toLowerCase() === "public";
  const initialDivisionParam = params.get("division") || "all";
  const initialTeamParam = params.get("team") || "all";

  const [config, setConfig] = useState(createInitialState());
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState(isPublicMode ? "schedule" : "setup");
  const [scheduleDivisionFilter, setScheduleDivisionFilter] = useState(initialDivisionParam);
  const [scheduleTeamFilter, setScheduleTeamFilter] = useState(initialTeamParam);
  const [publishedMeta, setPublishedMeta] = useState(loadPublishedPayload()?.meta || null);
  const [publishNotice, setPublishNotice] = useState("");

 useEffect(() => {
  async function loadPublicSchedule() {
    if (!isPublicMode) return;

    const published = await loadPublishedPayload();

    if (published?.result) {
      setResult(published.result);
      setPublishedMeta(published.meta || null);
    } else {
      setResult(null);
      setPublishedMeta(null);
    }
  }

  loadPublicSchedule();
}, [isPublicMode]);

  const selectedCourtDate = config.selectedDateForCourts || config.saturdays[0]?.date || "";

  const capacity = useMemo(() => {
    const enabledDates = config.saturdays.filter((d) => d.enabled).length;
    const totalSlots = buildOpenSlots(config).length;
    const totalTeams = DIVISIONS.reduce((sum, division) => sum + Number(config.divisions[division] || 0), 0);
    const totalNeededGames = DIVISIONS.reduce((sum, division) => sum + (Number(config.divisions[division] || 0) * Number(config.divisionGames[division] || 0)) / 2, 0);
    return { enabledDates, totalSlots, totalTeams, totalNeededGames };
  }, [config]);

  const selectedDateSlotTotal = useMemo(() => getTotalSlotsForDate(config, selectedCourtDate), [config, selectedCourtDate]);
  const decemberSaturdayOptions = useMemo(() => config.saturdays.filter((entry) => String(entry.date).split("/")[0] === "12"), [config.saturdays]);
  const selfChecks = useMemo(() => runSelfChecks(), []);
  const highlightedIssues = result?.auditRows.filter((row) => row.issues.length > 0) ?? [];

  const availableScheduleTeams = useMemo(() => {
    if (!result) return [];
    const divisionFilteredGames = scheduleDivisionFilter === "all" ? result.schedule : result.schedule.filter((game) => game.division === scheduleDivisionFilter);
    return Array.from(new Set(divisionFilteredGames.flatMap((game) => [game.home, game.away]))).sort((a, b) => a.localeCompare(b));
  }, [result, scheduleDivisionFilter]);

  const filteredSchedule = useMemo(() => {
    if (!result) return [];
    const filtered = result.schedule.filter((game) => {
      const divisionOk = scheduleDivisionFilter === "all" || game.division === scheduleDivisionFilter;
      const teamOk = scheduleTeamFilter === "all" || game.home === scheduleTeamFilter || game.away === scheduleTeamFilter;
      return divisionOk && teamOk;
    });
    const parseDate = (d) => { const [m, day, y] = d.split("/"); return new Date(`20${y}`, Number(m) - 1, Number(day)).getTime(); };
    return filtered.sort((a, b) => { const dateDiff = parseDate(a.date) - parseDate(b.date); if (dateDiff !== 0) return dateDiff; return getTimeIndex(a.time) - getTimeIndex(b.time); });
  }, [result, scheduleDivisionFilter, scheduleTeamFilter]);

  const shareableTeamUrl = useMemo(() => {
    if (scheduleTeamFilter === "all") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("view", "public");
    if (scheduleDivisionFilter !== "all") url.searchParams.set("division", scheduleDivisionFilter); else url.searchParams.delete("division");
    url.searchParams.set("team", scheduleTeamFilter);
    return url.toString();
  }, [scheduleDivisionFilter, scheduleTeamFilter]);

  function setDivisionCount(division, value) { setConfig((prev) => ({ ...prev, divisions: { ...prev.divisions, [division]: Number(value) } })); }
  function setDivisionGames(division, value) { setConfig((prev) => ({ ...prev, divisionGames: { ...prev.divisionGames, [division]: Number(value) } })); }
  function toggleSaturday(index, enabled) { setConfig((prev) => ({ ...prev, saturdays: prev.saturdays.map((entry, i) => i === index ? { ...entry, enabled: Boolean(enabled) } : entry) })); }
  function updateSaturdayDate(index, date) {
    setConfig((prev) => {
      const nextSaturdays = prev.saturdays.map((entry, i) => i === index ? { ...entry, date } : entry);
      const dates = nextSaturdays.map((s) => s.date);
      const nextDateCourtSettings = buildDateCourtSettings(dates, prev.dateCourtSettings);
      return { ...prev, saturdays: nextSaturdays, dateCourtSettings: nextDateCourtSettings, selectedDateForCourts: dates.includes(prev.selectedDateForCourts) ? prev.selectedDateForCourts : dates[0] || "", fifthBoysDoubleheaderDate: dates.includes(prev.fifthBoysDoubleheaderDate) ? prev.fifthBoysDoubleheaderDate : "" };
    });
  }
  function toggleTime(index, enabled) { setConfig((prev) => ({ ...prev, timeSlots: prev.timeSlots.map((entry, i) => i === index ? { ...entry, enabled: Boolean(enabled) } : entry) })); }
  function changeSeasonYear(value) {
    const seasonYear = Number(value);
    setConfig((prev) => {
      const saturdays = getSeasonSaturdays(seasonYear).map((date) => ({ date, enabled: false }));
      return { ...prev, seasonYear, saturdays, selectedDateForCourts: saturdays[0]?.date || "", fifthBoysDoubleheaderDate: "", dateCourtSettings: buildDateCourtSettings(saturdays.map((s) => s.date), prev.dateCourtSettings) };
    });
  }
  function updateCourtForDate(date, courtIndex, patch) {
    setConfig((prev) => ({ ...prev, dateCourtSettings: { ...prev.dateCourtSettings, [date]: (prev.dateCourtSettings[date] || []).map((court, i) => i === courtIndex ? { ...court, ...patch } : court) } }));
  }
  function resetAll() {
    setConfig(createInitialState()); setResult(isPublicMode ? loadPublishedPayload()?.result || null : null); setScheduleDivisionFilter("all"); setScheduleTeamFilter("all"); setActiveTab(isPublicMode ? "schedule" : "setup"); setPublishNotice("");
  }
  function runScheduler() { setResult(generateScheduleEngine(config)); setScheduleDivisionFilter("all"); setScheduleTeamFilter("all"); setActiveTab("schedule"); setPublishNotice(""); }
  
async function publishSchedule() {
  if (!result) return;

  const meta = {
    publishedAt: new Date().toLocaleString(),
    totalGames: result.schedule.length,
  };

  const ok = await savePublishedPayload({ result, meta });

  if (ok) {
    setPublishedMeta(meta);
    setPublishNotice("Schedule published for public view.");
  } else {
    setPublishNotice("Publish failed.");
  }
}
  
async function loadPublishedSchedule() {
  const published = await loadPublishedPayload();

  if (published?.result) {
    setResult(published.result);
    setPublishedMeta(published.meta || null);
    setActiveTab("schedule");
    setPublishNotice("Published schedule loaded.");
  } else {
    setPublishNotice("No published schedule found yet.");
  }
}
  
async function clearPublishedSchedule() {
  const ok = await clearPublishedPayload();

  if (ok) {
    setPublishedMeta(null);
    if (isPublicMode) setResult(null);
    setPublishNotice("Published schedule cleared.");
  } else {
    setPublishNotice("Could not clear published schedule.");
  }
}

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Youth Sports Scheduler</h1>
            <div style={styles.subtitle}>Editable setup, date-specific court selection, fairness-based scheduling, audit checks, and CSV export.</div>
          </div>
          <div style={styles.row}>
            {!isPublicMode ? (
              <>
                <button style={styles.button} onClick={resetAll}>Reset</button>
                <button style={styles.primaryButton} onClick={runScheduler}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Wand2 size={16} /> Generate Schedule</span></button>
                <button style={styles.successButton} onClick={publishSchedule} disabled={!result}>Publish Schedule</button>
                <button style={styles.button} onClick={loadPublishedSchedule}>Load Published</button>
                <button style={styles.dangerButton} onClick={clearPublishedSchedule}>Clear Published</button>
              </>
            ) : null}
          </div>
        </div>

        {publishNotice ? <div style={styles.publishBanner}>{publishNotice}</div> : null}
        {publishedMeta ? <div style={styles.publishBanner}>Published schedule: {publishedMeta.totalGames} games. Last published {publishedMeta.publishedAt}.</div> : null}

        {capacity.totalNeededGames > capacity.totalSlots && !isPublicMode ? (
          <div style={styles.alert}><AlertTriangle size={18} /><div><div style={{ fontWeight: 700, marginBottom: 4 }}>Capacity warning</div><div>You need about <strong>{capacity.totalNeededGames}</strong> games but only have <strong>{capacity.totalSlots}</strong> available slots with the current Saturdays, date-specific courts, and times.</div></div></div>
        ) : null}

        {isPublicMode ? <div style={styles.publicBanner}>Public view: schedule-only mode. Use filters below to browse by division or go straight to a specific team schedule.</div> : null}

        <div style={styles.tabBar}>
          {(isPublicMode ? [["schedule", "Schedule"]] : [["setup", "Setup"], ["schedule", "Schedule Views"], ["audit", "Audit"], ["issues", "Issues"]]).map(([key, label]) => (
            <button key={key} style={activeTab === key ? styles.tabButtonActive : styles.tabButton} onClick={() => setActiveTab(key)}>{label}</button>
          ))}
        </div>

        {activeTab === "setup" && !isPublicMode ? (
          <div style={styles.grid2}>
            <div style={{ display: "grid", gap: 24 }}>
              <Card>
                <SectionTitle icon={Settings}>Core Rules</SectionTitle>
                <div style={{ display: "grid", gap: 16 }}>
                  <div><label style={styles.smallLabel}>Season year</label><select style={styles.select} value={String(config.seasonYear)} onChange={(e) => changeSeasonYear(e.target.value)}>{SEASON_YEAR_OPTIONS.map((year) => <option key={year} value={String(year)}>{year}-{String(year + 1).slice(-2)}</option>)}</select></div>
                  <div><label style={styles.smallLabel}>5th Boys doubleheader Saturday</label><select style={styles.select} value={config.fifthBoysDoubleheaderDate || "none"} onChange={(e) => setConfig((prev) => ({ ...prev, fifthBoysDoubleheaderDate: e.target.value === "none" ? "" : e.target.value }))}><option value="none">None</option>{decemberSaturdayOptions.map((entry) => <option key={entry.date} value={entry.date}>{entry.date}</option>)}</select></div>
                  <div><label style={styles.smallLabel}>Max 8:00 games per team</label><select style={styles.select} value={String(config.maxEarlyGames)} onChange={(e) => setConfig((prev) => ({ ...prev, maxEarlyGames: Number(e.target.value) }))}>{MAX_EARLY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
                  <label style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid #e2e8f0", padding: 12, borderRadius: 12 }}><input type="checkbox" checked={config.globalAllowDoubleheaders} onChange={(e) => setConfig((prev) => ({ ...prev, globalAllowDoubleheaders: e.target.checked }))} /><span style={{ fontWeight: 600, fontSize: 14 }}>Allow doubleheaders for all divisions</span></label>
                </div>
              </Card>

              <Card>
                <SectionTitle>Divisions, Teams, and Game Targets</SectionTitle>
                <div style={{ display: "grid", gap: 12 }}>
                  {DIVISIONS.map((division) => {
                    const count = Number(config.divisions[division]); const targetGames = Number(config.divisionGames[division]); const odd = count % 2 === 1;
                    return <div key={division} style={{ display: "grid", gridTemplateColumns: "1fr 110px 120px auto", gap: 12, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}><div><div style={{ fontWeight: 700 }}>{division}</div><div style={{ fontSize: 12, color: "#64748b" }}>{odd ? "Odd team count: DH allowed automatically" : "Even team count"}</div></div><select style={styles.select} value={String(count)} onChange={(e) => setDivisionCount(division, e.target.value)}>{TEAM_COUNT_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}</select><select style={styles.select} value={String(targetGames)} onChange={(e) => setDivisionGames(division, e.target.value)}>{GAME_COUNT_OPTIONS.map((value) => <option key={value} value={value}>{value} games</option>)}</select><Badge>{odd ? "Odd" : "Even"}</Badge></div>;
                  })}
                </div>
              </Card>
            </div>

            <div style={{ display: "grid", gap: 24 }}>
              <Card>
                <SectionTitle icon={CalendarDays}>Saturdays With Games</SectionTitle>
                <div style={{ border: "1px solid #e2e8f0", background: "#f8fafc", padding: 12, borderRadius: 12, fontSize: 14, color: "#475569", marginBottom: 12 }}>Choose the season year, then select the Saturdays to use from November through February.</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>{config.saturdays.map((entry, index) => <div key={`${entry.date}-${index}`} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}><input type="checkbox" checked={entry.enabled} onChange={(e) => toggleSaturday(index, e.target.checked)} /><input style={styles.input} value={entry.date} onChange={(e) => updateSaturdayDate(index, e.target.value)} /></div>)}</div>
              </Card>

              <Card>
                <SectionTitle icon={Building2}>Court Availability by Date</SectionTitle>
                <div style={{ maxWidth: 280, marginBottom: 12 }}><label style={styles.smallLabel}>Select date to edit courts</label><select style={styles.select} value={selectedCourtDate} onChange={(e) => setConfig((prev) => ({ ...prev, selectedDateForCourts: e.target.value }))}>{config.saturdays.map((entry) => <option key={entry.date} value={entry.date}>{entry.date}</option>)}</select></div>
                <div style={{ border: "1px solid #e2e8f0", background: "#f8fafc", padding: 12, borderRadius: 12, fontSize: 14, color: "#475569", marginBottom: 12 }}>Choose which courts are active on the selected date, choose the first game start time for each court, and review how many slots remain on that court for the day. Courts default to an 8:00 AM first game.</div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 110px", gap: 12, padding: "0 12px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}><div>Use</div><div>Court</div><div>First game</div><div>Slots left</div></div>
                  {(config.dateCourtSettings[selectedCourtDate] || []).map((court, index) => <div key={`${selectedCourtDate}-${court.name || "custom"}-${index}`} style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 110px", gap: 12, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}><div><input type="checkbox" checked={court.enabled} onChange={(e) => updateCourtForDate(selectedCourtDate, index, { enabled: e.target.checked })} /></div><input style={styles.input} value={court.name} placeholder={index === (config.dateCourtSettings[selectedCourtDate] || []).length - 1 ? "Custom court name" : "Court name"} onChange={(e) => updateCourtForDate(selectedCourtDate, index, { name: e.target.value })} /><select style={styles.select} value={court.startTime || "8:00"} onChange={(e) => updateCourtForDate(selectedCourtDate, index, { startTime: e.target.value })}>{DEFAULT_TIMES.map((time) => <option key={time} value={time}>{time} start</option>)}</select><div style={{ fontWeight: 700 }}>{getSlotsRemainingForCourt(config, court)}</div></div>)}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc", fontWeight: 700 }}><span>Total slots for {selectedCourtDate || "selected date"}</span><span>{selectedDateSlotTotal}</span></div>
                </div>
              </Card>

              <Card>
                <SectionTitle>Time Slots</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>{config.timeSlots.map((slot, index) => <label key={slot.time} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, fontSize: 14 }}><input type="checkbox" checked={slot.enabled} onChange={(e) => toggleTime(index, e.target.checked)} />{slot.time}</label>)}</div>
              </Card>

              <div style={styles.statsGrid}>
                <StatCard label="Teams" value={capacity.totalTeams} subvalue={`Season ${config.seasonYear}-${String(config.seasonYear + 1).slice(-2)}`} />
                <StatCard label="Needed games" value={capacity.totalNeededGames} />
                <StatCard label="Available slots" value={capacity.totalSlots} />
                <StatCard label="5th Boys DH" value={config.fifthBoysDoubleheaderDate || "Not set"} />
              </div>

              <Card>
                <SectionTitle>Built-in checks</SectionTitle>
                <div style={{ display: "grid", gap: 8 }}>{selfChecks.map((check) => <div key={check.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, fontSize: 14 }}><span>{check.name}</span><Badge danger={!check.pass}>{check.pass ? "Pass" : "Fail"}</Badge></div>)}</div>
              </Card>
            </div>
          </div>
        ) : null}

        {activeTab === "schedule" ? (
          <Card>
            <div style={{ ...styles.headerRow, marginBottom: 16 }}>
              <SectionTitle icon={Trophy}>{isPublicMode ? "Published Schedule" : "Schedule Views"}</SectionTitle>
              <div style={styles.row}>
                {shareableTeamUrl ? <button style={styles.button} onClick={() => navigator.clipboard.writeText(shareableTeamUrl)}>Copy Team Link</button> : null}
                {result && !isPublicMode ? <button style={styles.button} onClick={() => exportCsv("filtered_schedule.csv", [["Division", "Date", "Time", "Court", "Home", "Away"], ...filteredSchedule.map((g) => [g.division, g.date, g.time, g.court, g.home, g.away])])}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Download size={16} /> Export View</span></button> : null}
              </div>
            </div>
            {!result ? (
              <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>{isPublicMode ? "No published schedule found yet. Admin needs to generate and publish one first on this same browser/device." : "Generate a schedule to see schedule views here."}</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "220px 280px 1fr", gap: 16, marginBottom: 16 }}>
                  <div><label style={styles.smallLabel}>Filter by division</label><select style={styles.select} value={scheduleDivisionFilter} onChange={(e) => { setScheduleDivisionFilter(e.target.value); setScheduleTeamFilter("all"); }}><option value="all">All divisions</option>{DIVISIONS.map((division) => <option key={division} value={division}>{division}</option>)}</select></div>
                  <div><label style={styles.smallLabel}>Filter by team</label><select style={styles.select} value={scheduleTeamFilter} onChange={(e) => setScheduleTeamFilter(e.target.value)}><option value="all">All teams</option>{availableScheduleTeams.map((team) => <option key={team} value={team}>{team}</option>)}</select></div>
                  <div style={{ display: "flex", alignItems: "end", gap: 12, flexWrap: "wrap" }}><div style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#f8fafc", padding: "12px 16px", fontSize: 14, color: "#475569" }}>Showing <strong style={{ color: "#0f172a" }}>{filteredSchedule.length}</strong> games</div>{scheduleTeamFilter !== "all" ? <div style={{ border: "1px solid #dbeafe", borderRadius: 12, background: "#eff6ff", padding: "12px 16px", fontSize: 13, color: "#1d4ed8" }}>Direct team view active for <strong>{scheduleTeamFilter}</strong></div> : null}</div>
                </div>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Division</th><th style={styles.th}>Date</th><th style={styles.th}>Time</th><th style={styles.th}>Court</th><th style={styles.th}>Home</th><th style={styles.th}>Away</th></tr></thead>
                    <tbody>{filteredSchedule.map((game, idx) => <tr key={`${game.date}-${game.time}-${game.court}-${idx}`}><td style={styles.td}>{game.division}</td><td style={styles.td}>{game.date}</td><td style={styles.td}>{game.time}</td><td style={styles.td}>{game.court}</td><td style={styles.td}>{game.home}</td><td style={styles.td}>{game.away}</td></tr>)}</tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        ) : null}

        {activeTab === "audit" && !isPublicMode ? (
          <div style={{ display: "grid", gap: 24 }}>
            <div style={styles.statsGrid5}><StatCard label="All teams scheduled" value={result ? (result.auditSummary.allTeamsScheduled ? "Yes" : "No") : "—"} /><StatCard label="Missing teams" value={result ? result.auditSummary.missingTeams : "—"} /><StatCard label="Early violations" value={result ? result.auditSummary.earlyViolations : "—"} /><StatCard label="Home/away issues" value={result ? result.auditSummary.homeAwayIssues : "—"} /><StatCard label="5th Boys DH day" value={result ? (result.auditSummary.fifthBoysDhTeamsMet ? "OK" : "Issue") : "—"} /></div>
            <Card>
              <SectionTitle>Team Audit</SectionTitle>
              {!result ? <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>Generate a schedule to audit the teams.</div> : <div style={{ ...styles.tableWrap, maxHeight: 620 }}><table style={styles.table}><thead><tr><th style={styles.th}>Team</th><th style={styles.th}>Division</th><th style={styles.th}>Games</th><th style={styles.th}>Target</th><th style={styles.th}>Early</th><th style={styles.th}>Home</th><th style={styles.th}>Away</th><th style={styles.th}>DH</th><th style={styles.th}>Morning</th><th style={styles.th}>Afternoon</th><th style={styles.th}>Max Same Time</th><th style={styles.th}>Issues</th></tr></thead><tbody>{result.auditRows.map((row) => <tr key={row.team}><td style={styles.td}>{row.team}</td><td style={styles.td}>{row.division}</td><td style={styles.td}>{row.games}</td><td style={styles.td}>{row.target}</td><td style={styles.td}>{row.early}</td><td style={styles.td}>{row.home}</td><td style={styles.td}>{row.away}</td><td style={styles.td}>{row.dh}</td><td style={styles.td}>{row.morning}</td><td style={styles.td}>{row.afternoon}</td><td style={styles.td}>{row.maxSameTime}</td><td style={styles.td}><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{row.issues.length ? row.issues.map((issue) => <Badge key={issue} danger>{issue}</Badge>) : <Badge>OK</Badge>}</div></td></tr>)}</tbody></table></div>}
            </Card>
          </div>
        ) : null}

        {activeTab === "issues" && !isPublicMode ? (
          <Card>
            <SectionTitle icon={AlertTriangle}>Scheduling Issues</SectionTitle>
            {!result ? <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>Generate a schedule to see unresolved issues.</div> : highlightedIssues.length === 0 && result.unscheduled.length === 0 ? <div style={{ border: "1px solid #bbf7d0", color: "#166534", borderRadius: 14, padding: 40, textAlign: "center" }}>No major scheduling issues found.</div> : <div style={{ display: "grid", gap: 16 }}>{result.unscheduled.map((issue, idx) => <div key={`${issue.matchup}-${idx}`} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}><div style={{ fontWeight: 700 }}>{issue.matchup}</div><div style={{ fontSize: 14, color: "#475569", marginTop: 6 }}>Reason: {issue.reason}</div><div style={{ fontSize: 14, color: "#475569", marginTop: 4 }}>Suggestion: {issue.suggestion}</div></div>)}{highlightedIssues.map((row) => <div key={row.team} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}><div style={{ fontWeight: 700 }}>{row.team}</div><div style={{ fontSize: 14, color: "#475569", marginTop: 6 }}>{row.issues.join(" • ")}</div></div>)}</div>}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
