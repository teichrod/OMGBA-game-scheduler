import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Download,
  Settings,
  Trophy,
  Wand2,
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
const MIN_GAMES_PER_WEEK_OPTIONS = Array.from({ length: 21 }, (_, i) => String(25 + i));

const ASSOCIATION_OPTIONS = ["OM", "BP", "CD", "RA"];

function getDivisionGenderCode(division) {
  return division.includes("Girls") ? "G" : "B";
}

function getDivisionGradeCode(division) {
  if (division.startsWith("5th/6th")) return "56";
  if (division.startsWith("7th/8th")) return "78";
  if (division.startsWith("5th")) return "5";
  if (division.startsWith("6th")) return "6";
  if (division.startsWith("7th")) return "7";
  if (division.startsWith("8th")) return "8";
  return "";
}

function sanitizeCoachLastName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^A-Za-z'\-]/g, "");
}

function getAssociationCode(entry) {
  if (!entry) return "";
  return String(entry.association || "").trim().toUpperCase();
}

function buildFormattedTeamName(division, entry, fallbackIndex) {
  const associationCode = getAssociationCode(entry);
  const assoc = associationCode || "TM";
  const gender = getDivisionGenderCode(division);
  const grade = getDivisionGradeCode(division);
  const teamNumber = associationCode
    ? (
        entry?.associationTeamNumber && String(entry.associationTeamNumber).trim()
          ? String(entry.associationTeamNumber).padStart(2, "0")
          : String(fallbackIndex).padStart(2, "0")
      )
    : String(fallbackIndex).padStart(2, "0");
  const coach = sanitizeCoachLastName(entry?.coachLastName);

  return coach
    ? `${assoc}${gender}${grade}${teamNumber}-${coach}`
    : `${assoc}${gender}${grade}${teamNumber}`;
}

function buildDivisionTeamDetails(count) {
  return Array.from({ length: Number(count) || 0 }, (_, i) => ({
    association: "",
    associationTeamNumber: "1",
    coachLastName: "",
  }));
}

function syncDivisionTeamDetails(existingDetails, count) {
  const next = Array.isArray(existingDetails) ? [...existingDetails] : [];
  const target = Number(count) || 0;

  while (next.length < target) {
    next.push({
      association: "",
      associationTeamNumber: "1",
      coachLastName: "",
    });
  }

  return next.slice(0, target);
}

function getUsedAssociationTeamNumbers(teamDetails, division, association, skipIndex = -1) {
  const details = teamDetails?.[division] || [];
  return details
    .map((entry, idx) => {
      if (idx === skipIndex) return null;
      const code = getAssociationCode(entry);
      if (code !== association) return null;
      return String(entry.associationTeamNumber || "");
    })
    .filter(Boolean);
}

function getNextAvailableAssociationTeamNumber(teamDetails, division, association, maxCount, skipIndex = -1) {
  const used = new Set(getUsedAssociationTeamNumbers(teamDetails, division, association, skipIndex));
  for (let i = 1; i <= Number(maxCount || 0); i += 1) {
    const value = String(i);
    if (!used.has(value)) return value;
  }
  return "1";
}


const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 24,
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: 1450,
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
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    alignItems: "start",
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
    zIndex: 1,
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

function parseShortDate(value) {
  const [m, d, y] = String(value).split("/");
  return new Date(2000 + Number(y), Number(m) - 1, Number(d)).getTime();
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
      const byName = prior.find((entry) => entry.name === court.name);
      return {
        name: priorCourt?.name ?? byName?.name ?? court.name,
        enabled: priorCourt?.enabled ?? byName?.enabled ?? court.enabled,
        startTime: priorCourt?.startTime ?? byName?.startTime ?? "8:00",
      };
    });
  }
  return next;
}

function createInitialState() {
  const seasonYear = 2026;
  const saturdays = getSeasonSaturdays(seasonYear).map((date) => ({ date, enabled: false }));
  const divisions = {
    "5th Boys": 8,
    "6th Boys": 8,
    "7th Boys": 8,
    "8th Boys": 8,
    "5th/6th Girls": 8,
    "7th/8th Girls": 8,
  };

  return {
    seasonYear,
    maxEarlyGames: 2,
    minGamesPerWeek: 25,
    globalAllowDoubleheaders: false,
    selectedDateForCourts: saturdays[0]?.date || "",
    fifthBoysDoubleheaderDate: "",
    timeSlots: DEFAULT_TIMES.map((time) => ({ time, enabled: true })),
    divisions,
    divisionGames: {
      "5th Boys": 10,
      "6th Boys": 8,
      "7th Boys": 8,
      "8th Boys": 8,
      "5th/6th Girls": 8,
      "7th/8th Girls": 8,
    },
    divisionTeamDetails: Object.fromEntries(
      DIVISIONS.map((division) => [division, buildDivisionTeamDetails(divisions[division])])
    ),
    coachConflicts: [],
    saturdays,
    dateCourtSettings: buildDateCourtSettings(saturdays.map((entry) => entry.date)),
  };
}

function createRowId(prefix = "row") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildTeamNamesFromConfig(config) {
  const names = [];
  for (const division of DIVISIONS) {
    const count = Number(config?.divisions?.[division] || 0);
    const details = syncDivisionTeamDetails(config?.divisionTeamDetails?.[division], count);
    for (let i = 0; i < count; i += 1) {
      names.push(buildFormattedTeamName(division, details[i], i + 1));
    }
  }
  return names;
}

function normalizeConfig(config) {
  const initial = createInitialState();
  const next = {
    ...initial,
    ...(config || {}),
    divisions: { ...initial.divisions, ...(config?.divisions || {}) },
    divisionGames: { ...initial.divisionGames, ...(config?.divisionGames || {}) },
    timeSlots: Array.isArray(config?.timeSlots) && config.timeSlots.length ? config.timeSlots : initial.timeSlots,
    saturdays: Array.isArray(config?.saturdays) && config.saturdays.length ? config.saturdays : initial.saturdays,
  };

  next.divisionTeamDetails = Object.fromEntries(
    DIVISIONS.map((division) => [
      division,
      syncDivisionTeamDetails(
        config?.divisionTeamDetails?.[division] || initial.divisionTeamDetails[division],
        next.divisions[division]
      ),
    ])
  );

  next.dateCourtSettings = buildDateCourtSettings(next.saturdays.map((entry) => entry.date), config?.dateCourtSettings || initial.dateCourtSettings);
  next.coachConflicts = Array.isArray(config?.coachConflicts)
    ? config.coachConflicts.map((entry) => ({ id: entry?.id || createRowId('conflict'), teamA: entry?.teamA || '', teamB: entry?.teamB || '' }))
    : [];
  if (!next.saturdays.some((entry) => entry.date === next.selectedDateForCourts)) {
    next.selectedDateForCourts = next.saturdays[0]?.date || '';
  }
  if (next.fifthBoysDoubleheaderDate && !next.saturdays.some((entry) => entry.date === next.fifthBoysDoubleheaderDate)) {
    next.fifthBoysDoubleheaderDate = '';
  }
  return next;
}

function getConflictNamesForTeam(config, teamName) {
  const pairs = Array.isArray(config?.coachConflicts) ? config.coachConflicts : [];
  const conflicts = new Set();
  for (const entry of pairs) {
    const a = entry?.teamA || '';
    const b = entry?.teamB || '';
    if (!a || !b) continue;
    if (a === teamName) conflicts.add(b);
    if (b === teamName) conflicts.add(a);
  }
  return Array.from(conflicts);
}

function hasSimultaneousConflict(teamName, slot, allTeams, config, opponentNames = []) {
  const conflictNames = getConflictNamesForTeam(config, teamName);
  if (!conflictNames.length) return false;
  const ignore = new Set(opponentNames.filter(Boolean));
  return allTeams.some((team) => {
    if (!conflictNames.includes(team.name)) return false;
    if (ignore.has(team.name)) return false;
    return (team.scheduledGames || []).some((game) => game.date === slot.date && game.time === slot.time);
  });
}

function isEarlyTime(time) {
  return time === "8:00";
}

function isMorningTime(time) {
  return ["8:00", "9:05", "10:10", "11:15"].includes(time);
}

function isAfternoonTime(time) {
  return ["12:20", "1:25", "2:30", "3:35", "4:40", "5:45"].includes(time);
}

function getTimeIndex(time) {
  return DEFAULT_TIMES.indexOf(time);
}

function areBackToBackTimes(timeA, timeB) {
  const a = getTimeIndex(timeA);
  const b = getTimeIndex(timeB);
  return a >= 0 && b >= 0 && Math.abs(a - b) === 1;
}

function getIdealMorningGames(team) {
  return Math.floor((team.targetGames || 0) / 2);
}

function getIdealAfternoonGames(team) {
  return Math.ceil((team.targetGames || 0) / 2);
}

function maxSameTimeSlot(gamesByTime) {
  const values = Object.values(gamesByTime || {});
  return values.length ? Math.max(...values) : 0;
}

function getProjectedTimeCount(team, slotTime) {
  return (team.gamesByTime?.[slotTime] || 0) + 1;
}

function getProjectedTimeSpreadPenalty(team, slotTime) {
  const projectedCounts = DEFAULT_TIMES.map((time) => (team.gamesByTime?.[time] || 0) + (time === slotTime ? 1 : 0));
  const usedCounts = projectedCounts.filter((count) => count > 0);
  if (usedCounts.length === 0) return 0;
  const maxCount = Math.max(...usedCounts);
  const minCount = Math.min(...usedCounts);
  const spreadPenalty = (maxCount - minCount) * 28;
  const projectedAtSlot = (team.gamesByTime?.[slotTime] || 0) + 1;
  const concentrationPenalty = projectedAtSlot * projectedAtSlot * 18;
  return spreadPenalty + concentrationPenalty;
}

function getProjectedDayPartPenalty(team, slotTime) {
  const projectedMorning = (team.morningGames || 0) + (isMorningTime(slotTime) ? 1 : 0);
  const projectedAfternoon = (team.afternoonGames || 0) + (isAfternoonTime(slotTime) ? 1 : 0);
  const targetGames = team.targetGames || 0;
  const idealMorning = Math.floor(targetGames / 2);
  const idealAfternoon = Math.ceil(targetGames / 2);
  return (
    Math.abs(projectedMorning - projectedAfternoon) * 24 +
    Math.abs(projectedMorning - idealMorning) * 20 +
    Math.abs(projectedAfternoon - idealAfternoon) * 20
  );
}

function fairnessScore(team) {
  const morningGames = team.morningGames || 0;
  const afternoonGames = team.afternoonGames || 0;
  return (
    (team.earlyGames || 0) * 3 +
    (team.maxSameTimeSlot || 0) * 12 +
    Math.abs((team.home || 0) - (team.away || 0)) * 2 +
    (team.doubleHeaders || 0) * 4 +
    Math.abs(morningGames - getIdealMorningGames(team)) * 10 +
    Math.abs(afternoonGames - getIdealAfternoonGames(team)) * 10
  );
}

function buildTeams(config) {
  const teams = [];
  for (const division of DIVISIONS) {
    const count = Number(config.divisions[division] || 0);
    const targetGames = Number(config.divisionGames[division] || 8);
    const isOddDivision = count % 2 === 1;
    const details = syncDivisionTeamDetails(config.divisionTeamDetails?.[division], count);

    let maxDoubleheadersPerTeam = 0;
    if (config.globalAllowDoubleheaders) {
      maxDoubleheadersPerTeam = 99;
    } else if (division === "5th Boys") {
      maxDoubleheadersPerTeam = isOddDivision ? 2 : 1;
    } else {
      maxDoubleheadersPerTeam = isOddDivision ? 1 : 0;
    }

    for (let i = 0; i < count; i += 1) {
      const detail = details[i];
      teams.push({
        id: `${division}::${i + 1}`,
        name: buildFormattedTeamName(division, detail, i + 1),
        division,
        teamIndex: i + 1,
        association: getAssociationCode(detail),
        associationTeamNumber: String(detail?.associationTeamNumber || i + 1),
        coachLastName: sanitizeCoachLastName(detail?.coachLastName),
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

function getEnabledCourtsForDate(config, date) {
  const courts = config.dateCourtSettings[date] || [];
  return courts.filter((court) => court.enabled && String(court.name || "").trim() !== "");
}

function getSlotsRemainingForCourt(config, court) {
  const enabledTimes = config.timeSlots.filter((entry) => entry.enabled).map((entry) => entry.time);
  const startIndex = enabledTimes.indexOf(court.startTime || "8:00");
  if (!court.enabled || String(court.name || "").trim() === "") return 0;
  if (startIndex < 0) return enabledTimes.length;
  return enabledTimes.length - startIndex;
}

function getTotalSlotsForDate(config, date) {
  const courts = config.dateCourtSettings[date] || [];
  return courts.reduce((sum, court) => sum + getSlotsRemainingForCourt(config, court), 0);
}

function buildOpenSlots(config) {
  const enabledDates = config.saturdays.filter((entry) => entry.enabled).map((entry) => entry.date);
  const enabledTimes = config.timeSlots.filter((entry) => entry.enabled).map((entry) => entry.time);
  const slots = [];

  for (const date of enabledDates) {
    const courts = getEnabledCourtsForDate(config, date);
    for (const time of enabledTimes) {
      for (const court of courts) {
        const startIndex = enabledTimes.indexOf(court.startTime || "8:00");
        const timeIndex = enabledTimes.indexOf(time);
        if (timeIndex < startIndex) continue;
        slots.push({
          key: `${date}|${time}|${court.name}`,
          date,
          time,
          court: court.name,
          used: false,
        });
      }
    }
  }

  return slots;
}

function chooseHomeTeam(teamA, teamB) {
  const diffA = (teamA.home || 0) - (teamA.away || 0);
  const diffB = (teamB.home || 0) - (teamB.away || 0);
  if (diffA < diffB) return teamA;
  if (diffB < diffA) return teamB;
  return teamA.name < teamB.name ? teamA : teamB;
}

function getScheduledGamesOnDate(team, date) {
  return (team.scheduledGames || []).filter((game) => game.date === date);
}

function applyGame(team, slot, opponentName, isHome) {
  team.gamesScheduled += 1;
  team.gamesByDate[slot.date] = (team.gamesByDate[slot.date] || 0) + 1;
  team.gamesByTime[slot.time] = (team.gamesByTime[slot.time] || 0) + 1;
  team.opponents[opponentName] = (team.opponents[opponentName] || 0) + 1;
  team.scheduledGames.push({
    date: slot.date,
    time: slot.time,
    court: slot.court,
    opponentName,
    isHome,
  });
  if (isHome) team.home += 1;
  else team.away += 1;
  if (isEarlyTime(slot.time)) team.earlyGames += 1;
  if (isMorningTime(slot.time)) team.morningGames += 1;
  if (isAfternoonTime(slot.time)) team.afternoonGames += 1;
  if ((team.gamesByDate[slot.date] || 0) > 1) team.doubleHeaders += 1;
  team.maxSameTimeSlot = maxSameTimeSlot(team.gamesByTime);
}

function getAllowedRepeatLimit(config, division) {
  const count = Number(config.divisions[division] || 0);
  const targetGames = Number(config.divisionGames[division] || 0);
  const opponentsPerTeam = Math.max(0, count - 1);
  if (opponentsPerTeam === 0) return 0;
  return Math.ceil(targetGames / opponentsPerTeam);
}

function violatesTimeVariety(team, slotTime) {
  const targetGames = team.targetGames || 0;
  const projectedCountAtTime = (team.gamesByTime?.[slotTime] || 0) + 1;
  const maxPerExactTime = targetGames <= 8 ? 2 : targetGames <= 10 ? 3 : 3;
  if (projectedCountAtTime > maxPerExactTime) return true;

  const projectedMorning = (team.morningGames || 0) + (isMorningTime(slotTime) ? 1 : 0);
  const projectedAfternoon = (team.afternoonGames || 0) + (isAfternoonTime(slotTime) ? 1 : 0);
  const maxMorning = Math.ceil(targetGames * 0.65);
  const maxAfternoon = Math.ceil(targetGames * 0.65);

  if (projectedMorning > maxMorning) return true;
  if (projectedAfternoon > maxAfternoon) return true;
  return false;
}

function canPairInSlot(teamA, teamB, slot, config, options = {}) {
  const { ignoreTimeVariety = false, ignoreRepeatLimit = false, allTeams = [] } = options;

  if (teamA.id === teamB.id || teamA.division !== teamB.division || slot.used) return false;
  if ((teamA.gamesScheduled || 0) >= (teamA.targetGames || 0)) return false;
  if ((teamB.gamesScheduled || 0) >= (teamB.targetGames || 0)) return false;

  if (hasSimultaneousConflict(teamA.name, slot, allTeams, config, [teamB.name])) return false;
  if (hasSimultaneousConflict(teamB.name, slot, allTeams, config, [teamA.name])) return false;

  const repeatLimit = getAllowedRepeatLimit(config, teamA.division);
  if (!ignoreRepeatLimit) {
    if ((teamA.opponents[teamB.name] || 0) >= repeatLimit) return false;
    if ((teamB.opponents[teamA.name] || 0) >= repeatLimit) return false;
  }

  const aOnDate = teamA.gamesByDate[slot.date] || 0;
  const bOnDate = teamB.gamesByDate[slot.date] || 0;
  if (aOnDate >= 2 || bOnDate >= 2) return false;

  if (aOnDate >= 1 && (teamA.doubleHeaders || 0) >= (teamA.maxDoubleheadersPerTeam || 0)) return false;
  if (bOnDate >= 1 && (teamB.doubleHeaders || 0) >= (teamB.maxDoubleheadersPerTeam || 0)) return false;

  if (aOnDate === 1) {
    const existingA = getScheduledGamesOnDate(teamA, slot.date)[0];
    if (!existingA || !areBackToBackTimes(existingA.time, slot.time) || existingA.court !== slot.court) return false;
  }

  if (bOnDate === 1) {
    const existingB = getScheduledGamesOnDate(teamB, slot.date)[0];
    if (!existingB || !areBackToBackTimes(existingB.time, slot.time) || existingB.court !== slot.court) return false;
  }

  if (config.fifthBoysDoubleheaderDate) {
    if (teamA.division === "5th Boys") {
      const aHasDecemberDh = (teamA.gamesByDate[config.fifthBoysDoubleheaderDate] || 0) >= 2;
      const bHasDecemberDh = (teamB.gamesByDate[config.fifthBoysDoubleheaderDate] || 0) >= 2;
      const aWouldBeDh = aOnDate >= 1;
      const bWouldBeDh = bOnDate >= 1;

      if (slot.date !== config.fifthBoysDoubleheaderDate) {
        if (aWouldBeDh && !aHasDecemberDh && (teamA.maxDoubleheadersPerTeam || 0) <= 1) return false;
        if (bWouldBeDh && !bHasDecemberDh && (teamB.maxDoubleheadersPerTeam || 0) <= 1) return false;
      }
    }

    if (teamA.division !== "5th Boys" && slot.date === config.fifthBoysDoubleheaderDate) return false;
  }

  if (isEarlyTime(slot.time)) {
    if ((teamA.earlyGames || 0) >= Number(config.maxEarlyGames)) return false;
    if ((teamB.earlyGames || 0) >= Number(config.maxEarlyGames)) return false;
  }

  if (!ignoreTimeVariety) {
    if (violatesTimeVariety(teamA, slot.time)) return false;
    if (violatesTimeVariety(teamB, slot.time)) return false;
  }

  return true;
}

function getSeasonSpreadPenalty(team, date, config) {
  const enabledDates = (config?.saturdays || []).filter((entry) => entry.enabled).map((entry) => entry.date);
  if (!enabledDates.length) return 0;

  const dateIndex = enabledDates.indexOf(date);
  if (dateIndex < 0) return 0;

  const totalDates = enabledDates.length;
  const targetGames = team.targetGames || 0;
  const projectedScheduled = (team.gamesScheduled || 0) + 1;
  const idealThroughDate = ((dateIndex + 1) / totalDates) * targetGames;

  let penalty = 0;

  const overIdeal = Math.max(0, projectedScheduled - Math.ceil(idealThroughDate + 0.75));
  penalty += overIdeal * 140;

  if (dateIndex < totalDates - 1 && projectedScheduled >= targetGames) penalty += 320;
  if (dateIndex < totalDates - 2 && projectedScheduled >= targetGames - 1) penalty += 110;
  if (dateIndex < totalDates - 3 && projectedScheduled >= targetGames - 2) penalty += 50;

  const remainingDatesAfter = totalDates - (dateIndex + 1);
  const gamesRemainingAfter = Math.max(0, targetGames - projectedScheduled);
  const forcedByesAfter = Math.max(0, remainingDatesAfter - gamesRemainingAfter);
  penalty += forcedByesAfter * 24;

  return penalty;
}

function slotPenalty(teamA, teamB, slot, config = null) {
  let penalty = 0;
  penalty += getProjectedTimeCount(teamA, slot.time) * 45;
  penalty += getProjectedTimeCount(teamB, slot.time) * 45;
  penalty += getProjectedTimeSpreadPenalty(teamA, slot.time);
  penalty += getProjectedTimeSpreadPenalty(teamB, slot.time);
  penalty += getProjectedDayPartPenalty(teamA, slot.time);
  penalty += getProjectedDayPartPenalty(teamB, slot.time);
  penalty += (teamA.gamesByDate[slot.date] || 0) * 12;
  penalty += (teamB.gamesByDate[slot.date] || 0) * 12;

  if (config) {
    penalty += getSeasonSpreadPenalty(teamA, slot.date, config);
    penalty += getSeasonSpreadPenalty(teamB, slot.date, config);
  }

  const existingA = getScheduledGamesOnDate(teamA, slot.date)[0];
  const existingB = getScheduledGamesOnDate(teamB, slot.date)[0];
  if (existingA && areBackToBackTimes(existingA.time, slot.time) && existingA.court === slot.court) penalty -= 25;
  if (existingB && areBackToBackTimes(existingB.time, slot.time) && existingB.court === slot.court) penalty -= 25;
  if ((teamA.gamesByDate[slot.date] || 0) >= 1) penalty += 10;
  if ((teamB.gamesByDate[slot.date] || 0) >= 1) penalty += 10;

  return penalty;
}

function scheduleGame(schedule, slot, teamA, teamB) {
  const homeTeam = chooseHomeTeam(teamA, teamB);
  const awayTeam = homeTeam.id === teamA.id ? teamB : teamA;
  slot.used = true;
  applyGame(homeTeam, slot, awayTeam.name, true);
  applyGame(awayTeam, slot, homeTeam.name, false);
  schedule.push({
    division: homeTeam.division,
    date: slot.date,
    time: slot.time,
    court: slot.court,
    home: homeTeam.name,
    away: awayTeam.name,
  });
}


function buildRoundRobinRounds(teamList) {
  const teams = [...teamList];
  if (teams.length % 2 === 1) teams.push(null);
  const rounds = [];
  let arr = [...teams];
  const totalRounds = arr.length - 1;

  for (let round = 0; round < totalRounds; round += 1) {
    const pairings = [];
    for (let i = 0; i < arr.length / 2; i += 1) {
      const a = arr[i];
      const b = arr[arr.length - 1 - i];
      if (a && b) pairings.push([a, b]);
    }
    rounds.push(pairings);
    arr = [arr[0], arr[arr.length - 1], ...arr.slice(1, arr.length - 1)];
  }

  return rounds;
}

function buildDivisionMatchPlan(divisionTeams, targetGames, config, division) {
  const rounds = buildRoundRobinRounds(divisionTeams);
  if (!rounds.length) return [];

  const plan = [];
  const neededPerTeam = Object.fromEntries(divisionTeams.map((team) => [team.id, targetGames]));
  const pairCounts = {};
  const pushPair = (a, b, roundIndex) => {
    if (!a || !b) return;
    if ((neededPerTeam[a.id] || 0) <= 0) return;
    if ((neededPerTeam[b.id] || 0) <= 0) return;
    const key = [a.id, b.id].sort().join('|');
    pairCounts[key] = (pairCounts[key] || 0) + 1;
    plan.push({ teamAId: a.id, teamBId: b.id, division, roundIndex, repeatIndex: pairCounts[key] });
    neededPerTeam[a.id] -= 1;
    neededPerTeam[b.id] -= 1;
  };

  if (division === '5th Boys' && config.fifthBoysDoubleheaderDate) {
    const dhRounds = Math.min(2, rounds.length);
    for (let r = 0; r < dhRounds; r += 1) {
      for (const [a, b] of rounds[r]) pushPair(a, b, r);
    }
  }

  let cycle = 0;
  let safety = 0;
  while (Object.values(neededPerTeam).some((v) => v > 0) && safety < 200) {
    safety += 1;
    for (let r = 0; r < rounds.length; r += 1) {
      if (division === '5th Boys' && config.fifthBoysDoubleheaderDate && cycle === 0 && r < 2) continue;
      for (const [a, b] of rounds[r]) {
        pushPair(a, b, r + cycle * rounds.length);
      }
    }
    cycle += 1;
  }

  return plan;
}

function getRotatedDivisionOrder(dateIndex, step = 2) {
  const shift = (dateIndex * step) % DIVISIONS.length;
  return [...DIVISIONS.slice(shift), ...DIVISIONS.slice(0, shift)];
}

function getFreeSlotsForDate(openSlots, date) {
  return openSlots
    .filter((slot) => !slot.used && slot.date === date)
    .sort((a, b) => {
      const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
      if (timeDiff !== 0) return timeDiff;
      return a.court.localeCompare(b.court);
    });
}

function getAmPmCorrectionScore(teamA, teamB, slot) {
  let score = 0;
  const aMorning = teamA.morningGames || 0;
  const aAfternoon = teamA.afternoonGames || 0;
  const bMorning = teamB.morningGames || 0;
  const bAfternoon = teamB.afternoonGames || 0;

  if (isMorningTime(slot.time)) {
    score += Math.max(0, aAfternoon - aMorning) * 140;
    score += Math.max(0, bAfternoon - bMorning) * 140;
  }

  if (isAfternoonTime(slot.time)) {
    score -= Math.max(0, aAfternoon - aMorning - 1) * 100;
    score -= Math.max(0, bAfternoon - bMorning - 1) * 100;
  }

  if (teamA.division.includes('Girls')) {
    score += isMorningTime(slot.time) ? 40 : -30;
  }
  if (teamB.division.includes('Girls')) {
    score += isMorningTime(slot.time) ? 40 : -30;
  }

  return score;
}

function choosePlannedMatchupForSlot(divisionTeams, pendingPlan, slot, config, allTeams, options = {}) {
  const { ignoreTimeVariety = false, currentSchedule = [] } = options;
  const byId = Object.fromEntries(divisionTeams.map((team) => [team.id, team]));
  let bestIndex = -1;
  let bestScore = -Infinity;
  const slotDateDeficit = getDateMinimumDeficit(currentSchedule, slot.date, config);

  for (let i = 0; i < pendingPlan.length; i += 1) {
    const item = pendingPlan[i];
    const teamA = byId[item.teamAId];
    const teamB = byId[item.teamBId];
    if (!teamA || !teamB) continue;
    if (teamA.gamesScheduled >= teamA.targetGames || teamB.gamesScheduled >= teamB.targetGames) continue;
    if (!canPairInSlot(teamA, teamB, slot, config, { ignoreTimeVariety, allTeams })) continue;

    const needScore = (getNeed(teamA) * 1200) + (getNeed(teamB) * 1200);
    const repeatPenalty = ((teamA.opponents[teamB.name] || 0) + (teamB.opponents[teamA.name] || 0)) * 180;
    const dayPenalty = ((teamA.gamesByDate[slot.date] || 0) + (teamB.gamesByDate[slot.date] || 0)) * 80;
    const slotCost = slotPenalty(teamA, teamB, slot, config) * (ignoreTimeVariety ? 0.1 : 0.2);
    const ampmScore = getAmPmCorrectionScore(teamA, teamB, slot);
    const roundPenalty = item.roundIndex * 3 + (item.repeatIndex || 1) * 5;
    const weeklyMinimumBonus = slotDateDeficit > 0 ? (slotDateDeficit * 3200) : 0;
    const lateDateBonus = slotDateDeficit > 0 ? (parseShortDate(slot.date) * 0.001) : 0;

    let score = needScore + ampmScore + weeklyMinimumBonus + lateDateBonus - repeatPenalty - dayPenalty - slotCost - roundPenalty;

    if (teamA.division === '5th Boys' && config.fifthBoysDoubleheaderDate && slot.date === config.fifthBoysDoubleheaderDate) {
      const aOnDhDate = teamA.gamesByDate[config.fifthBoysDoubleheaderDate] || 0;
      const bOnDhDate = teamB.gamesByDate[config.fifthBoysDoubleheaderDate] || 0;
      if (aOnDhDate === 0) score += 150;
      if (bOnDhDate === 0) score += 150;
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (bestIndex < 0) return null;
  const item = pendingPlan[bestIndex];
  return { item, teamA: byId[item.teamAId], teamB: byId[item.teamBId], index: bestIndex };
}

function placePlannedGamesByDate(teams, divisionPlans, openSlots, schedule, unscheduled, config) {
  const enabledDates = getEnabledGameDates(config);
  const divisionTeamMap = Object.fromEntries(
    DIVISIONS.map((division) => [division, teams.filter((team) => team.division === division)])
  );
  const minimumPerWeek = Number(config.minGamesPerWeek || 0);

  while (true) {
    const freeSlots = openSlots
      .filter((slot) => !slot.used)
      .sort((a, b) => {
        if (minimumPerWeek > 0) {
          const aCount = countGamesOnDate(schedule, a.date);
          const bCount = countGamesOnDate(schedule, b.date);
          const aDef = Math.max(0, minimumPerWeek - aCount);
          const bDef = Math.max(0, minimumPerWeek - bCount);
          if (bDef !== aDef) return bDef - aDef;
          if ((aDef > 0 || bDef > 0) && a.date !== b.date) {
            return parseShortDate(b.date) - parseShortDate(a.date);
          }
          if (aCount !== bCount) return aCount - bCount;
        }
        return compareSlotLike(a, b);
      });

    if (!freeSlots.length) break;

    let placedAny = false;

    for (const slot of freeSlots) {
      const dateIndex = Math.max(0, enabledDates.indexOf(slot.date));
      const rotatedOrder = getRotatedDivisionOrder(dateIndex, 2);
      const divisionOrder = [...rotatedOrder, ...DIVISIONS.filter((d) => !rotatedOrder.includes(d))];

      for (const division of divisionOrder) {
        const pendingPlan = divisionPlans[division] || [];
        if (!pendingPlan.length) continue;

        let chosen = choosePlannedMatchupForSlot(divisionTeamMap[division], pendingPlan, slot, config, teams, { ignoreTimeVariety: false, currentSchedule: schedule });
        if (!chosen) {
          chosen = choosePlannedMatchupForSlot(divisionTeamMap[division], pendingPlan, slot, config, teams, { ignoreTimeVariety: true, currentSchedule: schedule });
        }
        if (!chosen) continue;

        scheduleGame(schedule, slot, chosen.teamA, chosen.teamB);
        pendingPlan.splice(chosen.index, 1);
        placedAny = true;
        break;
      }
    }

    if (!placedAny) break;
  }

  for (const division of DIVISIONS) {
    const leftovers = divisionPlans[division] || [];
    const byId = Object.fromEntries((divisionTeamMap[division] || []).map((team) => [team.id, team]));
    for (const item of leftovers) {
      const teamA = byId[item.teamAId];
      const teamB = byId[item.teamBId];
      if (!teamA || !teamB) continue;
      if (teamA.gamesScheduled >= teamA.targetGames || teamB.gamesScheduled >= teamB.targetGames) continue;
      unscheduled.push({
        matchup: `${teamA.name} vs ${teamB.name}`,
        reason: 'Planned matchup not placed during per-day rotation pass',
        suggestion: `Division ${teamA.division} will be handled by completion fallback.`,
      });
    }
  }
}

function chooseBestSlotForPlannedMatchup(teamA, teamB, openSlots, config, allTeams, allowIgnoreTimeVariety = false, currentSchedule = []) {
  const slotGroups = buildOrderedSlotGroups(openSlots);
  let best = null;
  let bestScore = Infinity;

  for (const group of slotGroups) {
    for (const slot of group.slots) {
      if (!canPairInSlot(teamA, teamB, slot, config, { ignoreTimeVariety: allowIgnoreTimeVariety, allTeams })) continue;

      let penalty = 0;
      penalty += slotPenalty(teamA, teamB, slot, config) * (allowIgnoreTimeVariety ? 0.15 : 0.35);
      penalty += (teamA.gamesByDate[slot.date] || 0) * 20;
      penalty += (teamB.gamesByDate[slot.date] || 0) * 20;
      penalty += group.groupIndex * 3;
      const slotDateDeficit = getDateMinimumDeficit(currentSchedule, slot.date, config);
      if (slotDateDeficit > 0) penalty -= slotDateDeficit * 2600;
      if (isEarlyTime(slot.time)) {
        penalty += (teamA.earlyGames || 0) * 40;
        penalty += (teamB.earlyGames || 0) * 40;
      }
      if (teamA.division === '5th Boys' && config.fifthBoysDoubleheaderDate) {
        const aOnDhDate = teamA.gamesByDate[config.fifthBoysDoubleheaderDate] || 0;
        const bOnDhDate = teamB.gamesByDate[config.fifthBoysDoubleheaderDate] || 0;
        if (slot.date === config.fifthBoysDoubleheaderDate) {
          if (aOnDhDate === 0) penalty -= 35;
          if (bOnDhDate === 0) penalty -= 35;
        }
      }

      if (penalty < bestScore) {
        bestScore = penalty;
        best = slot;
      }
    }
    if (best) return best;
  }

  return best;
}

function placePlannedDivisionGames(allTeams, divisionTeams, plan, openSlots, schedule, unscheduled, config) {
  const byId = Object.fromEntries(divisionTeams.map((team) => [team.id, team]));

  const orderedPlan = [...plan].sort((a, b) => {
    const needA = getNeed(byId[a.teamAId]) + getNeed(byId[a.teamBId]);
    const needB = getNeed(byId[b.teamAId]) + getNeed(byId[b.teamBId]);
    if (needB !== needA) return needB - needA;
    return a.roundIndex - b.roundIndex;
  });

  for (const item of orderedPlan) {
    const teamA = byId[item.teamAId];
    const teamB = byId[item.teamBId];
    if (!teamA || !teamB) continue;
    if (teamA.gamesScheduled >= teamA.targetGames || teamB.gamesScheduled >= teamB.targetGames) continue;

    let slot = chooseBestSlotForPlannedMatchup(teamA, teamB, openSlots, config, allTeams, false, schedule);
    if (!slot) slot = chooseBestSlotForPlannedMatchup(teamA, teamB, openSlots, config, allTeams, true, schedule);

    if (!slot) {
      unscheduled.push({
        matchup: `${teamA.name} vs ${teamB.name}`,
        reason: 'No legal slot found for planned matchup',
        suggestion: `Division ${teamA.division} still needs completion-first placement.`,
      });
      continue;
    }

    scheduleGame(schedule, slot, teamA, teamB);
  }
}

function scheduleFifthBoysDoubleheaderDay(teams, openSlots, schedule, unscheduled, config) {
  if (!config.fifthBoysDoubleheaderDate) return;

  const teamList = teams.filter((team) => team.division === "5th Boys");
  if (teamList.length === 0) return;

  if (teamList.length % 2 === 1) {
    unscheduled.push({
      matchup: "5th Boys doubleheader day",
      reason: "5th Boys team count is odd",
      suggestion: "Use an even number of 5th Boys teams for the guaranteed December doubleheader day, or rely on odd-team DH logic only.",
    });
    return;
  }

  const slots = openSlots
    .filter((slot) => !slot.used && slot.date === config.fifthBoysDoubleheaderDate)
    .sort((a, b) => {
      const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
      if (timeDiff !== 0) return timeDiff;
      return a.court.localeCompare(b.court);
    });

  const rounds = buildRoundRobinRounds(teamList);
  const neededGames = teamList.length;

  if (slots.length < neededGames) {
    unscheduled.push({
      matchup: "5th Boys doubleheader day",
      reason: "Not enough slots on selected date",
      suggestion: "Enable more courts or time slots on that December Saturday.",
    });
    return;
  }

  const selectedPairings = [...(rounds[0] || []), ...(rounds[1] || [])];
  if (selectedPairings.length < neededGames) {
    unscheduled.push({
      matchup: "5th Boys doubleheader day",
      reason: "Could not build two full rounds",
      suggestion: "Adjust 5th Boys team count.",
    });
    return;
  }

  for (let i = 0; i < neededGames; i += 1) {
    const pairing = selectedPairings[i];
    const slot = slots[i];
    if (!pairing || !slot) break;
    scheduleGame(schedule, slot, pairing[0], pairing[1]);
  }
}

function chooseBestCandidate(team, allTeams, slotGroups, config) {
  const divisionTeams = allTeams.filter(
    (candidate) =>
      candidate.division === team.division &&
      candidate.id !== team.id &&
      candidate.gamesScheduled < candidate.targetGames
  );

  let best = null;
  let bestScore = -Infinity;

  for (const group of slotGroups) {
    for (const opponent of divisionTeams) {
      const remainingOptionsA = divisionTeams.filter(
        (other) =>
          other.id !== opponent.id &&
          (team.opponents[other.name] || 0) < getAllowedRepeatLimit(config, team.division)
      ).length;

      const remainingOptionsB = divisionTeams.filter(
        (other) =>
          other.id !== team.id &&
          (opponent.opponents[other.name] || 0) < getAllowedRepeatLimit(config, opponent.division)
      ).length;

      const constraintScore = (Math.min(10, remainingOptionsA) * 20) + (Math.min(10, remainingOptionsB) * 20);

      for (const slot of group.slots) {
        if (!canPairInSlot(team, opponent, slot, config, { allTeams })) continue;

        const teamNeed = getNeed(team);
        const oppNeed = getNeed(opponent);
        const repeatCount = team.opponents?.[opponent.name] || 0;

        let score = 0;
        score += teamNeed * 1200;
        score += oppNeed * 900;
        score += constraintScore;
        score -= repeatCount * 160;
        score -= slotPenalty(team, opponent, slot, config) * 0.35;
        score -= group.groupIndex * 4;

        if (score > bestScore) {
          bestScore = score;
          best = { teamA: team, teamB: opponent, slot };
        }
      }
    }

    if (best) return best;
  }

  return best;
}

function buildOrderedSlotGroups(openSlots) {
  const freeSlots = openSlots
    .filter((slot) => !slot.used)
    .sort((a, b) => {
      const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
      if (dateDiff !== 0) return dateDiff;
      const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
      if (timeDiff !== 0) return timeDiff;
      return a.court.localeCompare(b.court);
    });

  const groups = [];
  for (const slot of freeSlots) {
    const last = groups[groups.length - 1];
    if (!last || last.date !== slot.date || last.time !== slot.time) {
      groups.push({
        date: slot.date,
        time: slot.time,
        groupIndex: groups.length,
        slots: [slot],
      });
    } else {
      last.slots.push(slot);
    }
  }
  return groups;
}

function getNeed(team) {
  return Math.max(0, (team.targetGames || 0) - (team.gamesScheduled || 0));
}

function getDivisionTeamsNeedingGames(allTeams, division) {
  return allTeams
    .filter((team) => team.division === division && team.gamesScheduled < team.targetGames)
    .sort((a, b) => {
      const needDiff = getNeed(b) - getNeed(a);
      if (needDiff !== 0) return needDiff;
      return fairnessScore(b) - fairnessScore(a);
    });
}

function canStillUseTeamOnDate(team, slot, config) {
  const onDate = team.gamesByDate?.[slot.date] || 0;
  if (onDate >= 2) return false;

  if (onDate >= 1) {
    if ((team.doubleHeaders || 0) >= (team.maxDoubleheadersPerTeam || 0)) return false;
    const existing = getScheduledGamesOnDate(team, slot.date)[0];
    if (!existing) return false;
    if (!areBackToBackTimes(existing.time, slot.time)) return false;
    if (existing.court !== slot.court) return false;
  }

  if (isEarlyTime(slot.time) && (team.earlyGames || 0) >= Number(config.maxEarlyGames)) {
    return false;
  }

  return true;
}

function chooseCompletionFirstCandidate(team, allTeams, slotGroups, config, options = {}) {
  const { emergencyMode = false, currentSchedule = [] } = options;

  const divisionTeams = allTeams.filter(
    (candidate) => candidate.division === team.division && candidate.id !== team.id
  );

  let best = null;
  let bestScore = -Infinity;

  for (const group of slotGroups) {
    for (const slot of group.slots) {
      if (slot.used) continue;
      if (!canStillUseTeamOnDate(team, slot, config)) continue;

      for (const opponent of divisionTeams) {
        if (!canStillUseTeamOnDate(opponent, slot, config)) continue;
        if (!canPairInSlot(team, opponent, slot, config, { ignoreTimeVariety: true, ignoreRepeatLimit: emergencyMode, allTeams })) continue;

        const teamNeed = getNeed(team);
        const oppNeed = getNeed(opponent);
        const repeatCount = team.opponents?.[opponent.name] || 0;
        const slotDateDeficit = getDateMinimumDeficit(currentSchedule, slot.date, config);

        let score = 0;
        score += teamNeed * 1400;
        score += oppNeed * (emergencyMode ? 250 : 700);
        score += slotDateDeficit * 3600;

        if (oppNeed > 0) score += 450;
        else score += emergencyMode ? 150 : -120;

        score -= repeatCount * (emergencyMode ? 25 : 140);
        score -= (team.gamesByDate?.[slot.date] || 0) * 60;
        score -= (opponent.gamesByDate?.[slot.date] || 0) * 60;

        if (isEarlyTime(slot.time)) {
          score -= (team.earlyGames || 0) * 80;
          score -= (opponent.earlyGames || 0) * 80;
        }

        if (emergencyMode && isMorningTime(slot.time)) {
          score += Math.max(0, (team.afternoonGames || 0) - (team.morningGames || 0)) * 20;
          score += Math.max(0, (opponent.afternoonGames || 0) - (opponent.morningGames || 0)) * 20;
        }

        score -= group.groupIndex * 3;

        if (score > bestScore) {
          bestScore = score;
          best = { teamA: team, teamB: opponent, slot };
        }
      }
    }
  }

  return best;
}

function forceScheduleRemainingGames(teams, openSlots, schedule, unscheduled, config) {
  const divisions = [...DIVISIONS];

  for (const division of divisions) {
    let divisionSafety = 0;

    while (
      teams.some((team) => team.division === division && team.gamesScheduled < team.targetGames) &&
      divisionSafety < 9000
    ) {
      divisionSafety += 1;

      const needyTeams = getDivisionTeamsNeedingGames(teams, division);
      if (needyTeams.length === 0) break;

      const slotGroups = buildOrderedSlotGroups(openSlots);
      let placed = false;

      for (const team of needyTeams) {
        let candidate = chooseCompletionFirstCandidate(team, teams, slotGroups, config, { emergencyMode: false, currentSchedule: schedule });
        if (!candidate) {
          candidate = chooseCompletionFirstCandidate(team, teams, slotGroups, config, { emergencyMode: true, currentSchedule: schedule });
        }
        if (!candidate) continue;

        scheduleGame(schedule, candidate.slot, candidate.teamA, candidate.teamB);
        placed = true;
        break;
      }

      if (!placed) {
        const stuckTeams = needyTeams
          .filter((team) => team.gamesScheduled < team.targetGames)
          .map((team) => `${team.name} (${team.gamesScheduled}/${team.targetGames})`);

        unscheduled.push({
          matchup: `${division} forced completion`,
          reason: "No legal slot/opponent found even after emergency rematch mode",
          suggestion: stuckTeams.join("; "),
        });
        break;
      }
    }
  }
}

function cloneTeamState(team) {
  return {
    ...team,
    gamesByDate: { ...(team.gamesByDate || {}) },
    gamesByTime: { ...(team.gamesByTime || {}) },
    opponents: { ...(team.opponents || {}) },
    scheduledGames: (team.scheduledGames || []).map((game) => ({ ...game })),
  };
}

function removeGameFromTeam(team, game, opponentName, wasHome) {
  team.gamesScheduled -= 1;
  team.gamesByDate[game.date] = Math.max(0, (team.gamesByDate[game.date] || 0) - 1);
  if (team.gamesByDate[game.date] === 0) delete team.gamesByDate[game.date];
  team.gamesByTime[game.time] = Math.max(0, (team.gamesByTime[game.time] || 0) - 1);
  if (team.gamesByTime[game.time] === 0) delete team.gamesByTime[game.time];
  team.opponents[opponentName] = Math.max(0, (team.opponents[opponentName] || 0) - 1);
  if (team.opponents[opponentName] === 0) delete team.opponents[opponentName];
  team.scheduledGames = (team.scheduledGames || []).filter(
    (entry) => !(entry.date === game.date && entry.time === game.time && entry.court === game.court && entry.opponentName === opponentName)
  );
  if (wasHome) team.home -= 1;
  else team.away -= 1;
  if (isEarlyTime(game.time)) team.earlyGames -= 1;
  if (isMorningTime(game.time)) team.morningGames -= 1;
  if (isAfternoonTime(game.time)) team.afternoonGames -= 1;
  team.doubleHeaders = Object.values(team.gamesByDate).filter((count) => count > 1).length;
  team.maxSameTimeSlot = maxSameTimeSlot(team.gamesByTime);
}

function addGameToTeam(team, game, opponentName, wasHome) {
  team.gamesScheduled += 1;
  team.gamesByDate[game.date] = (team.gamesByDate[game.date] || 0) + 1;
  team.gamesByTime[game.time] = (team.gamesByTime[game.time] || 0) + 1;
  team.opponents[opponentName] = (team.opponents[opponentName] || 0) + 1;
  team.scheduledGames.push({
    date: game.date,
    time: game.time,
    court: game.court,
    opponentName,
    isHome: wasHome,
  });
  if (wasHome) team.home += 1;
  else team.away += 1;
  if (isEarlyTime(game.time)) team.earlyGames += 1;
  if (isMorningTime(game.time)) team.morningGames += 1;
  if (isAfternoonTime(game.time)) team.afternoonGames += 1;
  team.doubleHeaders = Object.values(team.gamesByDate).filter((count) => count > 1).length;
  team.maxSameTimeSlot = maxSameTimeSlot(team.gamesByTime);
}

function makeTeamMapFromSchedule(schedule, config) {
  const teams = buildTeams(config).map(cloneTeamState);
  const teamMap = Object.fromEntries(teams.map((team) => [team.name, team]));

  for (const game of schedule) {
    const home = teamMap[game.home];
    const away = teamMap[game.away];
    if (!home || !away) continue;
    addGameToTeam(home, game, away.name, true);
    addGameToTeam(away, game, home.name, false);
  }

  return teamMap;
}

function hardViolationsForTeam(team, config) {
  let violations = 0;
  if ((team.earlyGames || 0) > Number(config.maxEarlyGames)) violations += 10;
  if ((team.doubleHeaders || 0) > (team.maxDoubleheadersPerTeam || 0)) violations += 10;
  if ((team.maxSameTimeSlot || 0) > Math.ceil((team.targetGames || 0) / 2)) violations += 5;
  return violations;
}

function timeVarietyScore(team) {
  const counts = Object.values(team.gamesByTime || {});
  if (counts.length === 0) return 0;
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);
  const morningImbalance = Math.abs((team.morningGames || 0) - getIdealMorningGames(team));
  const afternoonImbalance = Math.abs((team.afternoonGames || 0) - getIdealAfternoonGames(team));
  const exactTimePenalty = counts.reduce((sum, count) => sum + Math.max(0, count - 1) * Math.max(0, count - 1) * 14, 0);
  return maxCount * 44 + (maxCount - minCount) * 28 + morningImbalance * 14 + afternoonImbalance * 14 + exactTimePenalty;
}

function teamIssueSeverity(team, config) {
  const maxAllowedAtTime = team.targetGames <= 8 ? 2 : 3;
  const counts = Object.entries(team.gamesByTime || {}).sort((a, b) => b[1] - a[1]);
  const worstCount = counts[0]?.[1] || 0;
  const morningTarget = getIdealMorningGames(team);
  const afternoonTarget = getIdealAfternoonGames(team);
  const morningImbalance = Math.abs((team.morningGames || 0) - morningTarget);
  const afternoonImbalance = Math.abs((team.afternoonGames || 0) - afternoonTarget);
  return (
    Math.max(0, worstCount - maxAllowedAtTime) * 120 +
    Math.max(0, (team.maxSameTimeSlot || 0) - maxAllowedAtTime) * 120 +
    morningImbalance * 20 +
    afternoonImbalance * 20 +
    hardViolationsForTeam(team, config) * 2000
  );
}

function schedulePenaltyScore(result, config) {
  const teams = result.auditRows || [];
  const teamMap = makeTeamMapFromSchedule(result.schedule || [], config);
  const severity = Object.values(teamMap).reduce((sum, team) => sum + teamIssueSeverity(team, config), 0);
  return (
    (result.auditSummary?.missingTeams || 0) * 1000000 +
    (result.auditSummary?.earlyViolations || 0) * 150000 +
    (result.auditSummary?.weeklyMinimumDeficit || 0) * 120000 +
    (result.auditSummary?.weeklyMinimumIssues || 0) * 30000 +
    (result.auditSummary?.middleGapCount || 0) * 8000 +
    (result.auditSummary?.homeAwayIssues || 0) * 30000 +
    (result.auditSummary?.timeVarietyIssues || 0) * 12000 +
    severity +
    teams.reduce((sum, row) => sum + (row.issues?.length || 0) * 400, 0)
  );
}

function validateManualSwap(schedule, gameA, gameB, config) {
  if (!gameA || !gameB) return 'Missing game.';
  if (gameA === gameB) return 'Same game.';
  if (gameA.date === gameB.date && gameA.time === gameB.time && gameA.court === gameB.court) return 'Same slot.';

  const remainder = schedule.filter((game) => game !== gameA && game !== gameB).map((game) => ({ ...game }));
  const movedA = { ...gameA, date: gameB.date, time: gameB.time, court: gameB.court };
  const movedB = { ...gameB, date: gameA.date, time: gameA.time, court: gameA.court };

  const messageA = validateManualMove(remainder, movedA, { date: movedA.date, time: movedA.time, court: movedA.court }, config);
  if (messageA) return messageA;
  const withA = [...remainder, movedA];
  const messageB = validateManualMove(withA, movedB, { date: movedB.date, time: movedB.time, court: movedB.court }, config);
  if (messageB) return messageB;

  return '';
}

function shouldPrioritizeMorning(team) {
  return (team.afternoonGames || 0) > getIdealAfternoonGames(team);
}

function getTargetedGamesForRebalance(schedule, team) {
  const timeCounts = Object.entries(team.gamesByTime || {}).sort((a, b) => b[1] - a[1]);
  const mostUsedTime = timeCounts[0]?.[0] || '';
  const prioritizeMorning = shouldPrioritizeMorning(team);
  return schedule
    .filter((game) => game.home === team.name || game.away === team.name)
    .sort((a, b) => {
      const aScore = (a.time === mostUsedTime ? 50 : 0) + (prioritizeMorning && isAfternoonTime(a.time) ? 25 : 0);
      const bScore = (b.time === mostUsedTime ? 50 : 0) + (prioritizeMorning && isAfternoonTime(b.time) ? 25 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return parseShortDate(a.date) - parseShortDate(b.date);
    });
}

function rebalanceScheduleTimes(schedule, config) {
  let nextSchedule = schedule.map((game) => ({ ...game }));
  let currentResult = buildResultFromSchedule(nextSchedule, config, []);
  let currentScore = schedulePenaltyScore(currentResult, config);
  const allOpenSlots = buildOpenSlots(config);
  const maxIterations = 80;
  const startedAt = Date.now();
  const maxMillis = 2500;

  for (let iter = 0; iter < maxIterations; iter += 1) {
    if (Date.now() - startedAt > maxMillis) break;

    const teamMap = makeTeamMapFromSchedule(nextSchedule, config);
    const problemTeams = Object.values(teamMap)
      .filter((team) => teamIssueSeverity(team, config) > 0)
      .sort((a, b) => teamIssueSeverity(b, config) - teamIssueSeverity(a, config));

    if (!problemTeams.length) break;

    let bestCandidateSchedule = null;
    let bestCandidateScore = currentScore;

    for (const team of problemTeams.slice(0, 4)) {
      if (Date.now() - startedAt > maxMillis) break;
      const targetedGames = getTargetedGamesForRebalance(nextSchedule, team).slice(0, 4);
      for (const gameA of targetedGames) {
        if (Date.now() - startedAt > maxMillis) break;

        const occupiedKeys = new Set(nextSchedule.map((game) => `${game.date}|${game.time}|${game.court}`));
        const emptyTargets = allOpenSlots
          .filter((slot) => !occupiedKeys.has(`${slot.date}|${slot.time}|${slot.court}`))
          .sort((a, b) => {
            const aBias = (shouldPrioritizeMorning(team) && isMorningTime(a.time) ? -30 : 0) + (a.time === gameA.time ? 20 : 0);
            const bBias = (shouldPrioritizeMorning(team) && isMorningTime(b.time) ? -30 : 0) + (b.time === gameA.time ? 20 : 0);
            if (aBias !== bBias) return aBias - bBias;
            const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
            if (dateDiff !== 0) return dateDiff;
            const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
            if (timeDiff !== 0) return timeDiff;
            return a.court.localeCompare(b.court);
          })
          .slice(0, 10);

        for (const target of emptyTargets) {
          const message = validateManualMove(nextSchedule.filter((g) => g !== gameA), { ...gameA }, target, config);
          if (message) continue;
          const candidateSchedule = nextSchedule.map((game) =>
            game === gameA ? { ...game, date: target.date, time: target.time, court: target.court } : game
          );
          const candidateResult = buildResultFromSchedule(candidateSchedule, config, []);
          const candidateScore = schedulePenaltyScore(candidateResult, config);
          if (candidateResult.auditSummary.missingTeams === 0 && candidateScore < bestCandidateScore) {
            bestCandidateScore = candidateScore;
            bestCandidateSchedule = candidateSchedule.map((game) => ({ ...game }));
          }
        }

        const swapPool = nextSchedule
          .filter((gameB) => gameB !== gameA)
          .sort((a, b) => {
            const aMorning = shouldPrioritizeMorning(team) && isMorningTime(a.time) ? -20 : 0;
            const bMorning = shouldPrioritizeMorning(team) && isMorningTime(b.time) ? -20 : 0;
            if (aMorning !== bMorning) return aMorning - bMorning;
            return 0;
          })
          .slice(0, 30);

        for (const gameB of swapPool) {
          const swapMessage = validateManualSwap(nextSchedule, gameA, gameB, config);
          if (swapMessage) continue;
          const candidateSchedule = nextSchedule.map((game) => {
            if (game === gameA) return { ...game, date: gameB.date, time: gameB.time, court: gameB.court };
            if (game === gameB) return { ...game, date: gameA.date, time: gameA.time, court: gameA.court };
            return game;
          });
          const candidateResult = buildResultFromSchedule(candidateSchedule, config, []);
          const candidateScore = schedulePenaltyScore(candidateResult, config);
          if (candidateResult.auditSummary.missingTeams === 0 && candidateScore < bestCandidateScore) {
            bestCandidateScore = candidateScore;
            bestCandidateSchedule = candidateSchedule.map((game) => ({ ...game }));
          }
        }
      }
    }

    if (!bestCandidateSchedule) break;
    nextSchedule = bestCandidateSchedule;
    currentResult = buildResultFromSchedule(nextSchedule, config, []);
    currentScore = bestCandidateScore;
  }

  return nextSchedule.sort((a, b) => {
    const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
    if (dateDiff !== 0) return dateDiff;
    const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
    if (timeDiff !== 0) return timeDiff;
    return a.court.localeCompare(b.court);
  });
}


function repairMissingTeamGamesInSchedule(schedule, config) {
  const nextSchedule = schedule.map((game) => ({ ...game }));
  const teamMap = makeTeamMapFromSchedule(nextSchedule, config);
  const teams = Object.values(teamMap).map((team) => cloneTeamState(team));
  const openSlots = buildOpenSlots(config);

  for (const slot of openSlots) {
    if (nextSchedule.some((game) => game.date === slot.date && game.time === slot.time && game.court === slot.court)) {
      slot.used = true;
    }
  }

  const unscheduled = [];
  forceScheduleRemainingGames(teams, openSlots, nextSchedule, unscheduled, config);

  return nextSchedule.sort(compareSlotLike);
}

function generateScheduleEngine(config) {
  const teams = buildTeams(config);
  const openSlots = buildOpenSlots(config);
  const schedule = [];
  const unscheduled = [];

  scheduleFifthBoysDoubleheaderDay(teams, openSlots, schedule, unscheduled, config);

  const divisionPlans = {};
  for (const division of DIVISIONS) {
    const divisionTeams = teams.filter((team) => team.division === division);
    const targetGames = Number(config.divisionGames[division] || 0);
    divisionPlans[division] = buildDivisionMatchPlan(divisionTeams, targetGames, config, division);
  }

  placePlannedGamesByDate(teams, divisionPlans, openSlots, schedule, unscheduled, config);

  for (const division of DIVISIONS) {
    const leftovers = divisionPlans[division] || [];
    if (!leftovers.length) continue;
    const divisionTeams = teams.filter((team) => team.division === division);
    placePlannedDivisionGames(teams, divisionTeams, leftovers, openSlots, schedule, unscheduled, config);
    divisionPlans[division] = [];
  }

  forceScheduleRemainingGames(teams, openSlots, schedule, unscheduled, config);

  let improvedSchedule = schedule.map((game) => ({ ...game }));
  improvedSchedule = repairMissingTeamGamesInSchedule(improvedSchedule, config);

  let previewTeamMap = makeTeamMapFromSchedule(improvedSchedule, config);
  let previewRows = Object.values(previewTeamMap);
  let allTeamsScheduled = previewRows.every((team) => team.gamesScheduled === team.targetGames);

  if (allTeamsScheduled) {
    improvedSchedule = rebalanceScheduleTimes(improvedSchedule, config);
    improvedSchedule = repairMissingTeamGamesInSchedule(improvedSchedule, config);

    if (Number(config.minGamesPerWeek || 0) > 0) {
      improvedSchedule = rebalanceToMinimumWeeklyGames(improvedSchedule, config);
      improvedSchedule = repairMissingTeamGamesInSchedule(improvedSchedule, config);
      improvedSchedule = compactScheduleEarlier(improvedSchedule, config);
      improvedSchedule = rebalanceToMinimumWeeklyGames(improvedSchedule, config);
      improvedSchedule = repairMissingTeamGamesInSchedule(improvedSchedule, config);
      improvedSchedule = compactScheduleEarlier(improvedSchedule, config);
      improvedSchedule = rebalanceToMinimumWeeklyGames(improvedSchedule, config);
      improvedSchedule = repairMissingTeamGamesInSchedule(improvedSchedule, config);
    } else {
      improvedSchedule = compactScheduleEarlier(improvedSchedule, config);
      improvedSchedule = rebalanceTowardFinalSaturday(improvedSchedule, config);
      improvedSchedule = compactScheduleEarlier(improvedSchedule, config);
    }

    previewTeamMap = makeTeamMapFromSchedule(improvedSchedule, config);
    previewRows = Object.values(previewTeamMap);
    allTeamsScheduled = previewRows.every((team) => team.gamesScheduled === team.targetGames);
  }

  improvedSchedule.sort((a, b) => {
    const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
    if (dateDiff !== 0) return dateDiff;
    const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
    if (timeDiff !== 0) return timeDiff;
    return a.court.localeCompare(b.court);
  });

  const finalTeamMap = makeTeamMapFromSchedule(improvedSchedule, config);
  const finalTeams = Object.values(finalTeamMap);

  const auditRows = finalTeams.map((team) => ({
    team: team.name,
    division: team.division,
    games: team.gamesScheduled,
    target: team.targetGames,
    early: team.earlyGames,
    home: team.home,
    away: team.away,
    dh: team.doubleHeaders,
    morning: team.morningGames || 0,
    afternoon: team.afternoonGames || 0,
    maxSameTime: team.maxSameTimeSlot,
    issues: [
      team.gamesScheduled < team.targetGames
        ? 'Missing games'
        : team.gamesScheduled > team.targetGames
          ? 'Too many games'
          : null,
      team.earlyGames > Number(config.maxEarlyGames) ? 'Too many early games' : null,
      Math.abs(team.home - team.away) > 2 ? 'Home/away imbalance' : null,
      team.doubleHeaders > (team.maxDoubleheadersPerTeam || 0) ? 'Too many doubleheaders' : null,
      team.maxSameTimeSlot > (team.targetGames <= 8 ? 2 : 3) ? 'Time slot concentration' : null,
      Math.max(team.morningGames || 0, team.afternoonGames || 0) > Math.ceil(team.targetGames * 0.65)
        ? 'Poor AM/PM balance'
        : null,
    ].filter(Boolean),
  }));

  const weeklyMinimumViolations = getWeeklyMinimumViolations(improvedSchedule, config);
  const weeklyMinimumDeficit = weeklyMinimumViolations.reduce((sum, entry) => sum + (entry.deficit || 0), 0);

  const auditSummary = {
    totalGames: improvedSchedule.length,
    totalTeams: teams.length,
    allTeamsScheduled: auditRows.every((row) => row.games === row.target),
    earlyViolations: auditRows.filter((row) => row.early > Number(config.maxEarlyGames)).length,
    homeAwayIssues: auditRows.filter((row) => Math.abs(row.home - row.away) > 2).length,
    missingTeams: auditRows.filter((row) => row.games !== row.target).length,
    timeVarietyIssues: auditRows.filter((row) => row.maxSameTime > (row.target <= 8 ? 2 : 3)).length,
    weeklyMinimumIssues: weeklyMinimumViolations.length,
    weeklyMinimumDeficit,
    middleGapCount: getMiddleGapCount(improvedSchedule, config),
    enabledDates: config.saturdays.filter((entry) => entry.enabled).length,
    enabledCourts: Object.values(config.dateCourtSettings).reduce(
      (sum, courts) => sum + courts.filter((court) => court.enabled && String(court.name || '').trim() !== '').length,
      0
    ),
  };

  if (!auditSummary.allTeamsScheduled) {
    const missing = auditRows
      .filter((row) => row.games !== row.target)
      .map((row) => `${row.team} (${row.games}/${row.target})`);

    if (missing.length) {
      unscheduled.push({
        matchup: 'Final completion check',
        reason: 'Some teams are still short after per-day rotation and completion fallback',
        suggestion: missing.join('; '),
      });
    }
  }

  if (weeklyMinimumViolations.length) {
    unscheduled.push({
      matchup: 'Minimum games per week',
      reason: `One or more enabled Saturdays fell below the required minimum of ${Number(config.minGamesPerWeek || 0)} games, excluding the 5th Boys doubleheader date.`,
      suggestion: weeklyMinimumViolations
        .map((entry) => `${entry.date} (${entry.games}/${entry.minimum})`)
        .join('; '),
    });
  }

  return { schedule: improvedSchedule, auditRows, auditSummary, unscheduled };
}


function buildResultFromSchedule(schedule, config, priorUnscheduled = []) {
  const improvedSchedule = schedule
    .map((game) => ({ ...game }))
    .sort((a, b) => {
      const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
      if (dateDiff !== 0) return dateDiff;
      const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
      if (timeDiff !== 0) return timeDiff;
      return a.court.localeCompare(b.court);
    });

  const finalTeamMap = makeTeamMapFromSchedule(improvedSchedule, config);
  const finalTeams = Object.values(finalTeamMap);
  const builtTeams = buildTeams(config);

  const auditRows = finalTeams.map((team) => ({
    team: team.name,
    division: team.division,
    games: team.gamesScheduled,
    target: team.targetGames,
    early: team.earlyGames,
    home: team.home,
    away: team.away,
    dh: team.doubleHeaders,
    morning: team.morningGames || 0,
    afternoon: team.afternoonGames || 0,
    maxSameTime: team.maxSameTimeSlot,
    issues: [
      team.gamesScheduled < team.targetGames
        ? 'Missing games'
        : team.gamesScheduled > team.targetGames
          ? 'Too many games'
          : null,
      team.earlyGames > Number(config.maxEarlyGames) ? 'Too many early games' : null,
      Math.abs(team.home - team.away) > 2 ? 'Home/away imbalance' : null,
      team.doubleHeaders > (team.maxDoubleheadersPerTeam || 0) ? 'Too many doubleheaders' : null,
      team.maxSameTimeSlot > (team.targetGames <= 8 ? 2 : 3) ? 'Time slot concentration' : null,
      Math.max(team.morningGames || 0, team.afternoonGames || 0) > Math.ceil(team.targetGames * 0.65)
        ? 'Poor AM/PM balance'
        : null,
    ].filter(Boolean),
  }));

  const weeklyMinimumViolations = getWeeklyMinimumViolations(improvedSchedule, config);
  const weeklyMinimumDeficit = weeklyMinimumViolations.reduce((sum, entry) => sum + (entry.deficit || 0), 0);

  const auditSummary = {
    totalGames: improvedSchedule.length,
    totalTeams: builtTeams.length,
    allTeamsScheduled: auditRows.every((row) => row.games === row.target),
    earlyViolations: auditRows.filter((row) => row.early > Number(config.maxEarlyGames)).length,
    homeAwayIssues: auditRows.filter((row) => Math.abs(row.home - row.away) > 2).length,
    missingTeams: auditRows.filter((row) => row.games !== row.target).length,
    timeVarietyIssues: auditRows.filter((row) => row.maxSameTime > (row.target <= 8 ? 2 : 3)).length,
    weeklyMinimumIssues: weeklyMinimumViolations.length,
    weeklyMinimumDeficit,
    middleGapCount: getMiddleGapCount(improvedSchedule, config),
    enabledDates: config.saturdays.filter((entry) => entry.enabled).length,
    enabledCourts: Object.values(config.dateCourtSettings).reduce(
      (sum, courts) => sum + courts.filter((court) => court.enabled && String(court.name || '').trim() !== '').length,
      0
    ),
  };

  return {
    schedule: improvedSchedule,
    auditRows,
    auditSummary,
    unscheduled: Array.isArray(priorUnscheduled) ? [...priorUnscheduled] : [],
  };
}

function getGameAtCell(result, date, time, court) {
  return result?.schedule?.find((entry) => entry.date === date && entry.time === time && entry.court === court) || null;
}


function compareSlotLike(a, b) {
  const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
  if (dateDiff !== 0) return dateDiff;
  const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
  if (timeDiff !== 0) return timeDiff;
  return a.court.localeCompare(b.court);
}


function getEnabledGameDates(config) {
  return config.saturdays
    .filter((entry) => entry.enabled)
    .map((entry) => entry.date)
    .sort((a, b) => parseShortDate(a) - parseShortDate(b));
}

function getFinalEnabledDate(config) {
  const dates = getEnabledGameDates(config);
  return dates[dates.length - 1] || '';
}

function countGamesOnDate(schedule, date) {
  return schedule.filter((game) => game.date === date).length;
}

function getDatesSubjectToWeeklyMinimum(config) {
  const minGames = Number(config?.minGamesPerWeek || 0);
  if (minGames <= 0) return [];
  return getEnabledGameDates(config).filter((date) => date !== config.fifthBoysDoubleheaderDate);
}

function getDateMinimumTarget(config, date) {
  if (!date) return 0;
  if (date === config?.fifthBoysDoubleheaderDate) return 0;
  const minimum = Number(config?.minGamesPerWeek || 0);
  if (minimum <= 0) return 0;
  return getDatesSubjectToWeeklyMinimum(config).includes(date) ? minimum : 0;
}

function getDateMinimumDeficit(schedule, date, config) {
  const target = getDateMinimumTarget(config, date);
  if (target <= 0) return 0;
  return Math.max(0, target - countGamesOnDate(schedule, date));
}

function getDateMinimumSlack(schedule, date, config) {
  const target = getDateMinimumTarget(config, date);
  if (target <= 0) return 0;
  return countGamesOnDate(schedule, date) - target;
}

function getWeeklyMinimumViolations(schedule, config) {
  const minimum = Number(config?.minGamesPerWeek || 0);
  if (minimum <= 0) return [];

  return getDatesSubjectToWeeklyMinimum(config)
    .map((date) => ({
      date,
      games: countGamesOnDate(schedule, date),
      minimum,
      deficit: Math.max(0, minimum - countGamesOnDate(schedule, date)),
    }))
    .filter((entry) => entry.games < entry.minimum);
}

function getWeeklyMinimumDeficit(schedule, config) {
  return getWeeklyMinimumViolations(schedule, config).reduce((sum, entry) => sum + (entry.deficit || 0), 0);
}

function getMiddleGapCount(schedule, config) {
  const dates = getEnabledGameDates(config);
  const allSlots = buildOpenSlots(config);
  let gaps = 0;

  for (const date of dates) {
    const dateSlots = allSlots.filter((slot) => slot.date === date).sort(compareSlotLike);
    if (!dateSlots.length) continue;
    const occupied = new Set(
      schedule
        .filter((game) => game.date === date)
        .map((game) => `${game.date}|${game.time}|${game.court}`)
    );
    let seenOccupied = false;
    let lastOccupiedIndex = -1;
    for (let i = 0; i < dateSlots.length; i += 1) {
      if (occupied.has(`${dateSlots[i].date}|${dateSlots[i].time}|${dateSlots[i].court}`)) {
        seenOccupied = true;
        lastOccupiedIndex = i;
      }
    }
    if (!seenOccupied) continue;
    for (let i = 0; i < lastOccupiedIndex; i += 1) {
      if (!occupied.has(`${dateSlots[i].date}|${dateSlots[i].time}|${dateSlots[i].court}`)) gaps += 1;
    }
  }

  return gaps;
}

function countTeamGamesOnDate(schedule, teamName, date) {
  return schedule.filter((game) => game.date === date && (game.home === teamName || game.away === teamName)).length;
}


function getDateOccupancySignature(schedule, date, config) {
  const dateSlots = buildOpenSlots(config)
    .filter((slot) => slot.date === date)
    .sort(compareSlotLike);
  const occupied = new Set(
    schedule
      .filter((game) => game.date === date)
      .map((game) => `${game.date}|${game.time}|${game.court}`)
  );
  return dateSlots
    .map((slot, idx) => (occupied.has(`${slot.date}|${slot.time}|${slot.court}`) ? String(idx).padStart(3, "0") : null))
    .filter(Boolean)
    .join("|");
}

function getDateMiddleGapCount(schedule, date, config) {
  const dateSlots = buildOpenSlots(config)
    .filter((slot) => slot.date === date)
    .sort(compareSlotLike);
  if (!dateSlots.length) return 0;

  const occupied = new Set(
    schedule
      .filter((game) => game.date === date)
      .map((game) => `${game.date}|${game.time}|${game.court}`)
  );

  let lastOccupiedIndex = -1;
  for (let i = 0; i < dateSlots.length; i += 1) {
    if (occupied.has(`${dateSlots[i].date}|${dateSlots[i].time}|${dateSlots[i].court}`)) {
      lastOccupiedIndex = i;
    }
  }
  if (lastOccupiedIndex < 0) return 0;

  let gaps = 0;
  for (let i = 0; i < lastOccupiedIndex; i += 1) {
    if (!occupied.has(`${dateSlots[i].date}|${dateSlots[i].time}|${dateSlots[i].court}`)) gaps += 1;
  }
  return gaps;
}

function fillDateGapsBySearch(schedule, date, config, maxDepth = 6) {
  const baseDeficit = getWeeklyMinimumDeficit(schedule, config);
  const otherGames = schedule.filter((game) => game.date !== date).map((game) => ({ ...game }));
  const dateSlots = buildOpenSlots(config)
    .filter((slot) => slot.date === date)
    .sort(compareSlotLike);
  const slotIndexMap = new Map(dateSlots.map((slot, idx) => [`${slot.date}|${slot.time}|${slot.court}`, idx]));

  function serializeDateGames(dateGames) {
    return dateGames
      .map((game) => `${game.home}|${game.away}|${game.time}|${game.court}`)
      .sort()
      .join('~');
  }

  const seen = new Set();

  function helper(dateGames, depth) {
    const workingSchedule = [...otherGames, ...dateGames.map((game) => ({ ...game }))].sort(compareSlotLike);
    const currentGapCount = getDateMiddleGapCount(workingSchedule, date, config);
    if (currentGapCount === 0) return workingSchedule;
    if (depth <= 0) return null;

    const stateKey = `${depth}|${serializeDateGames(dateGames)}`;
    if (seen.has(stateKey)) return null;
    seen.add(stateKey);

    const occupiedKeys = new Set(dateGames.map((game) => `${game.date}|${game.time}|${game.court}`));
    let gapSlot = null;
    let lastOccupiedIndex = -1;
    for (let i = 0; i < dateSlots.length; i += 1) {
      if (occupiedKeys.has(`${dateSlots[i].date}|${dateSlots[i].time}|${dateSlots[i].court}`)) lastOccupiedIndex = i;
    }
    for (let i = 0; i < lastOccupiedIndex; i += 1) {
      const key = `${dateSlots[i].date}|${dateSlots[i].time}|${dateSlots[i].court}`;
      if (!occupiedKeys.has(key)) {
        gapSlot = dateSlots[i];
        break;
      }
    }
    if (!gapSlot) return workingSchedule;

    const gapIndex = slotIndexMap.get(`${gapSlot.date}|${gapSlot.time}|${gapSlot.court}`) ?? -1;
    const candidates = dateGames
      .map((game, idx) => ({ game, idx, slotIndex: slotIndexMap.get(`${game.date}|${game.time}|${game.court}`) ?? 9999 }))
      .filter((entry) => entry.slotIndex > gapIndex)
      .sort((a, b) => {
        const aGapDistance = a.slotIndex - gapIndex;
        const bGapDistance = b.slotIndex - gapIndex;
        if (aGapDistance !== bGapDistance) return aGapDistance - bGapDistance;
        const aTeamLoad = countTeamGamesOnDate(workingSchedule, a.game.home, date) + countTeamGamesOnDate(workingSchedule, a.game.away, date);
        const bTeamLoad = countTeamGamesOnDate(workingSchedule, b.game.home, date) + countTeamGamesOnDate(workingSchedule, b.game.away, date);
        if (aTeamLoad !== bTeamLoad) return aTeamLoad - bTeamLoad;
        return compareSlotLike(a.game, b.game);
      });

    for (const candidate of candidates) {
      const remainingSchedule = workingSchedule.filter((_, i) => i !== -1);
      const scheduleWithoutCandidate = [...otherGames, ...dateGames.filter((_, idx) => idx !== candidate.idx).map((game) => ({ ...game }))].sort(compareSlotLike);
      const movedGame = { ...candidate.game, date: gapSlot.date, time: gapSlot.time, court: gapSlot.court };
      const message = validateManualMove(scheduleWithoutCandidate, movedGame, gapSlot, config);
      if (message) continue;

      const nextDateGames = dateGames.map((game, idx) =>
        idx === candidate.idx ? movedGame : { ...game }
      );
      const nextSchedule = [...otherGames, ...nextDateGames].sort(compareSlotLike);
      if (getWeeklyMinimumDeficit(nextSchedule, config) > baseDeficit) continue;
      const result = buildResultFromSchedule(nextSchedule, config, []);
      if (result.auditSummary.missingTeams !== 0) continue;
      if (result.auditSummary.earlyViolations > 0) continue;

      const recursive = helper(nextDateGames, depth - 1);
      if (recursive) return recursive;
    }

    return null;
  }

  const dateGames = schedule.filter((game) => game.date === date).map((game) => ({ ...game }));
  const searched = helper(dateGames, maxDepth);
  return searched ? searched.sort(compareSlotLike) : schedule.map((game) => ({ ...game }));
}

function repackSingleDateEarlier(schedule, date, config) {
  const allSlots = buildOpenSlots(config)
    .filter((slot) => slot.date === date)
    .sort(compareSlotLike);

  const dateGames = schedule
    .filter((game) => game.date === date)
    .map((game) => ({ ...game }));

  if (!allSlots.length || dateGames.length <= 1) {
    return schedule.map((game) => ({ ...game }));
  }

  const otherGames = schedule
    .filter((game) => game.date !== date)
    .map((game) => ({ ...game }));

  const originalSignature = getDateOccupancySignature(schedule, date, config);
  const originalGapCount = getMiddleGapCount(schedule, config);

  const buildAttempt = (orderedGames) => {
    let workingSchedule = [...otherGames];
    const remainingGames = orderedGames.map((game) => ({ ...game }));

    for (const slot of allSlots) {
      let placedIndex = -1;

      for (let i = 0; i < remainingGames.length; i += 1) {
        const game = remainingGames[i];
        const movedGame = { ...game, date: slot.date, time: slot.time, court: slot.court };
        const message = validateManualMove(workingSchedule, movedGame, slot, config);
        if (!message) {
          placedIndex = i;
          workingSchedule.push(movedGame);
          break;
        }
      }

      if (placedIndex >= 0) {
        remainingGames.splice(placedIndex, 1);
      }

      if (!remainingGames.length) break;
    }

    if (remainingGames.length) return null;

    const candidateSchedule = workingSchedule.sort(compareSlotLike);
    const candidateResult = buildResultFromSchedule(candidateSchedule, config, []);
    if (candidateResult.auditSummary.missingTeams !== 0) return null;
    if (candidateResult.auditSummary.earlyViolations > 0) return null;
    if (getWeeklyMinimumDeficit(candidateSchedule, config) > getWeeklyMinimumDeficit(schedule, config)) {
      return null;
    }

    const candidateGapCount = getMiddleGapCount(candidateSchedule, config);
    const candidateSignature = getDateOccupancySignature(candidateSchedule, date, config);

    return {
      schedule: candidateSchedule,
      candidateGapCount,
      candidateSignature,
      penalty: schedulePenaltyScore(candidateResult, config),
    };
  };

  const difficultyScore = (game) => {
    const homeOnDate = countTeamGamesOnDate(schedule, game.home, date);
    const awayOnDate = countTeamGamesOnDate(schedule, game.away, date);
    const sameDayPressure = (homeOnDate > 1 ? 4 : 0) + (awayOnDate > 1 ? 4 : 0);
    const earlyPressure =
      (isEarlyTime(game.time) ? 2 : 0) +
      (game.home && countTeamGamesOnDate(schedule, game.home, date) > 0 ? 1 : 0) +
      (game.away && countTeamGamesOnDate(schedule, game.away, date) > 0 ? 1 : 0);
    return sameDayPressure + earlyPressure;
  };

  const attemptOrders = [
    [...dateGames].sort((a, b) => {
      const diff = difficultyScore(b) - difficultyScore(a);
      if (diff !== 0) return diff;
      return compareSlotLike(a, b);
    }),
    [...dateGames].sort((a, b) => compareSlotLike(b, a)),
    [...dateGames].sort((a, b) => {
      const aLoad =
        countTeamGamesOnDate(schedule, a.home, date) +
        countTeamGamesOnDate(schedule, a.away, date);
      const bLoad =
        countTeamGamesOnDate(schedule, b.home, date) +
        countTeamGamesOnDate(schedule, b.away, date);
      if (bLoad !== aLoad) return bLoad - aLoad;
      return compareSlotLike(a, b);
    }),
  ];

  let best = null;
  for (const orderedGames of attemptOrders) {
    const attempt = buildAttempt(orderedGames);
    if (!attempt) continue;

    const improvesSignature = attempt.candidateSignature < originalSignature;
    const improvesGapCount = attempt.candidateGapCount < originalGapCount;
    if (!improvesSignature && !improvesGapCount) continue;

    if (
      !best ||
      attempt.candidateGapCount < best.candidateGapCount ||
      (attempt.candidateGapCount === best.candidateGapCount && attempt.candidateSignature < best.candidateSignature) ||
      (attempt.candidateGapCount === best.candidateGapCount &&
        attempt.candidateSignature === best.candidateSignature &&
        attempt.penalty < best.penalty)
    ) {
      best = attempt;
    }
  }

  return best ? best.schedule : schedule.map((game) => ({ ...game }));
}

function compactSingleCourtEarlier(schedule, date, courtName, config) {
  let working = schedule.map((game) => ({ ...game }));
  const courtSlots = buildOpenSlots(config)
    .filter((slot) => slot.date === date && slot.court === courtName)
    .sort(compareSlotLike);

  if (courtSlots.length <= 1) return working;

  let changed = true;
  let safety = 0;
  while (changed && safety < 20) {
    changed = false;
    safety += 1;

    const occupied = new Set(
      working
        .filter((game) => game.date === date)
        .map((game) => `${game.date}|${game.time}|${game.court}`)
    );

    let lastOccupiedIndex = -1;
    for (let i = 0; i < courtSlots.length; i += 1) {
      if (occupied.has(`${courtSlots[i].date}|${courtSlots[i].time}|${courtSlots[i].court}`)) {
        lastOccupiedIndex = i;
      }
    }
    if (lastOccupiedIndex < 0) break;

    for (let gapIndex = 0; gapIndex < lastOccupiedIndex; gapIndex += 1) {
      const gapSlot = courtSlots[gapIndex];
      const gapKey = `${gapSlot.date}|${gapSlot.time}|${gapSlot.court}`;
      if (occupied.has(gapKey)) continue;

      const laterGames = working
        .filter((game) => game.date === date && game.court === courtName)
        .map((game) => ({ ...game, slotIndex: courtSlots.findIndex((slot) => slot.time === game.time) }))
        .filter((game) => game.slotIndex > gapIndex)
        .sort((a, b) => a.slotIndex - b.slotIndex);

      let moved = false;
      for (const candidate of laterGames) {
        const baseSchedule = working.filter(
          (game) => !(game.date === candidate.date && game.time === candidate.time && game.court === candidate.court && game.home === candidate.home && game.away === candidate.away)
        );
        const movedGame = { ...candidate, date: gapSlot.date, time: gapSlot.time, court: gapSlot.court };
        const message = validateManualMove(baseSchedule, movedGame, gapSlot, config);
        if (message) continue;

        const candidateSchedule = [...baseSchedule, movedGame].sort(compareSlotLike);
        if (getWeeklyMinimumDeficit(candidateSchedule, config) > getWeeklyMinimumDeficit(working, config)) continue;
        const result = buildResultFromSchedule(candidateSchedule, config, []);
        if (result.auditSummary.missingTeams !== 0) continue;
        if (result.auditSummary.earlyViolations > 0) continue;

        working = candidateSchedule;
        changed = true;
        moved = true;
        break;
      }

      if (moved) break;
    }
  }

  return working;
}

function compactDateCourtsEarlier(schedule, date, config) {
  let working = schedule.map((game) => ({ ...game }));
  const courts = getEnabledCourtsForDate(config, date)
    .map((court) => court.name)
    .filter(Boolean)
    .sort();

  for (const courtName of courts) {
    working = compactSingleCourtEarlier(working, date, courtName, config);
  }

  return working.sort(compareSlotLike);
}

function rebalanceToMinimumWeeklyGames(schedule, config) {
  const minimum = Number(config?.minGamesPerWeek || 0);
  const targetDates = getDatesSubjectToWeeklyMinimum(config);
  if (minimum <= 0 || targetDates.length === 0) return schedule.map((game) => ({ ...game }));

  let nextSchedule = schedule.map((game) => ({ ...game }));
  let currentDeficit = getWeeklyMinimumDeficit(nextSchedule, config);
  const allSlots = buildOpenSlots(config);
  let safety = 0;

  while (safety < 240) {
    safety += 1;

    const deficits = targetDates
      .map((date) => ({
        date,
        games: countGamesOnDate(nextSchedule, date),
        deficit: Math.max(0, minimum - countGamesOnDate(nextSchedule, date)),
      }))
      .filter((entry) => entry.deficit > 0)
      .sort((a, b) => {
        if (b.deficit !== a.deficit) return b.deficit - a.deficit;
        return parseShortDate(b.date) - parseShortDate(a.date);
      });

    if (!deficits.length) break;

    let bestCandidate = null;

    for (const deficitEntry of deficits) {
      const targetDate = deficitEntry.date;
      const occupied = new Set(nextSchedule.map((game) => `${game.date}|${game.time}|${game.court}`));
      const emptyTargetSlots = allSlots
        .filter((slot) => slot.date === targetDate && !occupied.has(`${slot.date}|${slot.time}|${slot.court}`))
        .sort(compareSlotLike);

      if (!emptyTargetSlots.length) continue;

      const donorDates = getEnabledGameDates(config)
        .map((date) => ({
          date,
          games: countGamesOnDate(nextSchedule, date),
          surplus: countGamesOnDate(nextSchedule, date) - minimum,
        }))
        .filter((entry) => {
          if (entry.date === targetDate) return false;
          if (entry.date === config.fifthBoysDoubleheaderDate) return false;
          return entry.surplus > 0;
        })
        .sort((a, b) => {
          if (b.surplus !== a.surplus) return b.surplus - a.surplus;
          if (b.games !== a.games) return b.games - a.games;
          return parseShortDate(a.date) - parseShortDate(b.date);
        });

      for (const donor of donorDates) {
        const donorGames = nextSchedule
          .filter((game) => game.date === donor.date)
          .sort((a, b) => {
            const aTargetCount = countTeamGamesOnDate(nextSchedule, a.home, targetDate) + countTeamGamesOnDate(nextSchedule, a.away, targetDate);
            const bTargetCount = countTeamGamesOnDate(nextSchedule, b.home, targetDate) + countTeamGamesOnDate(nextSchedule, b.away, targetDate);
            if (aTargetCount !== bTargetCount) return aTargetCount - bTargetCount;
            const aDonorCount = countTeamGamesOnDate(nextSchedule, a.home, donor.date) + countTeamGamesOnDate(nextSchedule, a.away, donor.date);
            const bDonorCount = countTeamGamesOnDate(nextSchedule, b.home, donor.date) + countTeamGamesOnDate(nextSchedule, b.away, donor.date);
            if (bDonorCount !== aDonorCount) return bDonorCount - aDonorCount;
            return compareSlotLike(a, b);
          });

        for (const target of emptyTargetSlots) {
          for (const game of donorGames) {
            const baseSchedule = nextSchedule.filter((g) => g !== game);
            const message = validateManualMove(baseSchedule, { ...game }, target, config);
            if (message) continue;

            const candidateSchedule = nextSchedule.map((g) =>
              g === game ? { ...g, date: target.date, time: target.time, court: target.court } : g
            );
            const candidateResult = buildResultFromSchedule(candidateSchedule, config, []);
            if (candidateResult.auditSummary.missingTeams !== 0) continue;
            if (candidateResult.auditSummary.earlyViolations > 0) continue;

            const candidateDeficit = getWeeklyMinimumDeficit(candidateSchedule, config);
            const deficitImprovement = currentDeficit - candidateDeficit;
            if (deficitImprovement <= 0) continue;

            const candidateScore = schedulePenaltyScore(candidateResult, config);
            const donorRemaining = countGamesOnDate(candidateSchedule, donor.date);
            const targetRemainingDeficit = Math.max(0, minimum - countGamesOnDate(candidateSchedule, targetDate));
            const targetExposure =
              (countTeamGamesOnDate(nextSchedule, game.home, targetDate) === 0 ? 1 : 0) +
              (countTeamGamesOnDate(nextSchedule, game.away, targetDate) === 0 ? 1 : 0);

            const priorityTuple = [
              deficitImprovement,
              deficitEntry.deficit,
              donor.surplus,
              targetExposure,
              -targetRemainingDeficit,
              donorRemaining,
              -candidateScore,
            ];

            if (!bestCandidate) {
              bestCandidate = {
                schedule: candidateSchedule.map((g) => ({ ...g })),
                score: candidateScore,
                deficit: candidateDeficit,
                priorityTuple,
              };
            } else {
              const cur = bestCandidate.priorityTuple;
              let better = false;
              for (let i = 0; i < priorityTuple.length; i += 1) {
                if (priorityTuple[i] === cur[i]) continue;
                better = priorityTuple[i] > cur[i];
                break;
              }
              if (better) {
                bestCandidate = {
                  schedule: candidateSchedule.map((g) => ({ ...g })),
                  score: candidateScore,
                  deficit: candidateDeficit,
                  priorityTuple,
                };
              }
            }
          }
        }
      }

      if (bestCandidate && bestCandidate.deficit < currentDeficit) break;
    }

    if (!bestCandidate) break;

    nextSchedule = bestCandidate.schedule;
    currentDeficit = bestCandidate.deficit;
  }

  return nextSchedule.sort(compareSlotLike);
}

function rebalanceTowardFinalSaturday(schedule, config) {
  const finalDate = getFinalEnabledDate(config);
  if (!finalDate) return schedule.map((game) => ({ ...game }));

  const enabledDates = getEnabledGameDates(config);
  if (enabledDates.length < 2) return schedule.map((game) => ({ ...game }));

  const allSlots = buildOpenSlots(config);
  const finalSlots = allSlots
    .filter((slot) => slot.date === finalDate)
    .sort(compareSlotLike);
  if (!finalSlots.length) return schedule.map((game) => ({ ...game }));

  let nextSchedule = schedule.map((game) => ({ ...game }));
  let currentPenalty = schedulePenaltyScore(buildResultFromSchedule(nextSchedule, config, []), config);

  const dateCounts = enabledDates.map((date) => countGamesOnDate(nextSchedule, date));
  const averageGames = Math.round((nextSchedule.length || 0) / enabledDates.length);
  const sortedCounts = [...dateCounts].sort((a, b) => a - b);
  const medianGames = sortedCounts[Math.floor(sortedCounts.length / 2)] || 0;
  const finalCapacity = finalSlots.length;
  const desiredFinalGames = Math.min(
    finalCapacity,
    Math.max(countGamesOnDate(nextSchedule, finalDate), averageGames, medianGames)
  );

  let safety = 0;
  while (countGamesOnDate(nextSchedule, finalDate) < desiredFinalGames && safety < 50) {
    safety += 1;
    const occupied = new Set(nextSchedule.map((game) => `${game.date}|${game.time}|${game.court}`));
    const emptyFinalSlots = finalSlots.filter((slot) => !occupied.has(`${slot.date}|${slot.time}|${slot.court}`));
    if (!emptyFinalSlots.length) break;

    let bestCandidate = null;

    for (const target of emptyFinalSlots.slice(0, 6)) {
      const donorGames = nextSchedule
        .filter((game) => game.date !== finalDate)
        .sort((a, b) => {
          const aTeamsOnFinal = countTeamGamesOnDate(nextSchedule, a.home, finalDate) + countTeamGamesOnDate(nextSchedule, a.away, finalDate);
          const bTeamsOnFinal = countTeamGamesOnDate(nextSchedule, b.home, finalDate) + countTeamGamesOnDate(nextSchedule, b.away, finalDate);
          if (aTeamsOnFinal !== bTeamsOnFinal) return aTeamsOnFinal - bTeamsOnFinal;
          const dateLoadDiff = countGamesOnDate(nextSchedule, b.date) - countGamesOnDate(nextSchedule, a.date);
          if (dateLoadDiff !== 0) return dateLoadDiff;
          return parseShortDate(a.date) - parseShortDate(b.date);
        });

      for (const game of donorGames.slice(0, 40)) {
        const message = validateManualMove(nextSchedule.filter((g) => g !== game), { ...game }, target, config);
        if (message) continue;

        const candidateSchedule = nextSchedule.map((g) =>
          g === game ? { ...g, date: target.date, time: target.time, court: target.court } : g
        );
        const candidateResult = buildResultFromSchedule(candidateSchedule, config, []);
        if (candidateResult.auditSummary.missingTeams !== 0) continue;
        if (candidateResult.auditSummary.earlyViolations > 0) continue;

        const candidatePenalty = schedulePenaltyScore(candidateResult, config);
        const donorDateCount = countGamesOnDate(nextSchedule, game.date);
        const finalDateCount = countGamesOnDate(nextSchedule, finalDate);
        const finalLoadBonus =
          (countTeamGamesOnDate(nextSchedule, game.home, finalDate) === 0 ? 1600 : 0) +
          (countTeamGamesOnDate(nextSchedule, game.away, finalDate) === 0 ? 1600 : 0) +
          Math.max(0, donorDateCount - averageGames) * 220 +
          Math.max(0, averageGames - finalDateCount) * 320;
        const netScore = candidatePenalty - finalLoadBonus;

        if (!bestCandidate || netScore < bestCandidate.netScore) {
          bestCandidate = {
            schedule: candidateSchedule.map((g) => ({ ...g })),
            penalty: candidatePenalty,
            netScore,
          };
        }
      }
    }

    if (!bestCandidate) break;
    if (bestCandidate.penalty > currentPenalty + 2500) break;

    nextSchedule = bestCandidate.schedule;
    currentPenalty = bestCandidate.penalty;
  }

  return nextSchedule.sort(compareSlotLike);
}

function compactScheduleEarlier(schedule, config) {
  let nextSchedule = schedule.map((game) => ({ ...game }));
  const enabledDates = getEnabledGameDates(config);
  let changed = true;
  let safety = 0;

  while (changed && safety < 40) {
    changed = false;
    safety += 1;

    for (const date of enabledDates) {
      const beforeSignature = getDateOccupancySignature(nextSchedule, date, config);
      const beforeDateGaps = getDateMiddleGapCount(nextSchedule, date, config);

      let candidate = compactDateCourtsEarlier(nextSchedule, date, config);
      candidate = repackSingleDateEarlier(candidate, date, config);
      candidate = compactDateCourtsEarlier(candidate, date, config);
      candidate = fillDateGapsBySearch(candidate, date, config, 6);
      candidate = compactDateCourtsEarlier(candidate, date, config);

      const afterSignature = getDateOccupancySignature(candidate, date, config);
      const afterDateGaps = getDateMiddleGapCount(candidate, date, config);

      const beforeDeficit = getWeeklyMinimumDeficit(nextSchedule, config);
      const afterDeficit = getWeeklyMinimumDeficit(candidate, config);
      const improved =
        afterDeficit <= beforeDeficit && (
          afterDateGaps < beforeDateGaps ||
          (afterDateGaps === beforeDateGaps && afterSignature < beforeSignature)
        );

      if (improved) {
        nextSchedule = candidate.map((game) => ({ ...game }));
        changed = true;
      }
    }
  }

  return nextSchedule.sort(compareSlotLike);
}


function validateManualMove(schedule, gameToMove, target, config) {
  if (config.fifthBoysDoubleheaderDate && target.date === config.fifthBoysDoubleheaderDate && gameToMove.division !== '5th Boys') {
    return 'Only 5th Boys can be scheduled on the selected 5th Boys doubleheader date.';
  }

  const targetOccupied = schedule.some(
    (game) => game !== gameToMove && game.date === target.date && game.time === target.time && game.court === target.court
  );
  if (targetOccupied) return 'That slot is already occupied.';

  const enabledCourts = getEnabledCourtsForDate(config, target.date).map((court) => court.name);
  if (!enabledCourts.includes(target.court)) return 'That court is not enabled for the selected date.';

  const enabledTimes = config.timeSlots.filter((entry) => entry.enabled).map((entry) => entry.time);
  if (!enabledTimes.includes(target.time)) return 'That time is not enabled.';

  const startSetting = (config.dateCourtSettings[target.date] || []).find((court) => court.name === target.court);
  if (startSetting) {
    const startIndex = enabledTimes.indexOf(startSetting.startTime || '8:00');
    const timeIndex = enabledTimes.indexOf(target.time);
    if (timeIndex >= 0 && startIndex >= 0 && timeIndex < startIndex) {
      return 'That slot is before the selected start time for the court.';
    }
  }

  const affectedTeams = [gameToMove.home, gameToMove.away];

  for (const teamName of affectedTeams) {
  }
  for (const teamName of affectedTeams) {
    const teamGames = schedule.filter(
      (game) =>
        game !== gameToMove &&
        (game.home === teamName || game.away === teamName)
    );

    const targetDateGames = teamGames.filter((game) => game.date === target.date);
    if (targetDateGames.some((game) => game.time === target.time)) {
      return `${teamName} already has a game at ${target.time}.`;
    }

    const conflictNames = getConflictNamesForTeam(config, teamName);
    if (conflictNames.some((conflictName) => schedule.some((game) => game !== gameToMove && (game.home === conflictName || game.away === conflictName) && game.date === target.date && game.time === target.time))) {
      return `${teamName} has a coaching conflict at ${target.date} ${target.time}.`;
    }

    if (targetDateGames.length >= 2) {
      return `${teamName} would exceed two games on ${target.date}.`;
    }

    if (targetDateGames.length === 1) {
      const existing = targetDateGames[0];
      if (!areBackToBackTimes(existing.time, target.time) || existing.court !== target.court) {
        return `${teamName} doubleheaders must stay back-to-back on the same court.`;
      }
    }

    const earlyCountExcludingThis = teamGames.filter((game) => isEarlyTime(game.time)).length;
    const projectedEarly = earlyCountExcludingThis + (isEarlyTime(target.time) ? 1 : 0);
    if (projectedEarly > Number(config.maxEarlyGames)) {
      return `${teamName} would exceed the 8:00 game limit.`;
    }
  }

  return '';
}

function exportCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? "" : String(cell);
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const SETUP_STORAGE_KEY = "youth-sports-scheduler-setups-v1";

function loadSavedSetupsFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SETUP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => entry && entry.name && entry.config)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  } catch {
    return [];
  }
}

function saveSavedSetupsToStorage(setups) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setups));
}

async function savePublishedPayload(payload) {
  try {
    const res = await fetch(`/api/published-schedule?t=${Date.now()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      body: JSON.stringify({ payload }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadPublishedPayload() {
  try {
    const res = await fetch(`/api/published-schedule?t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.payload || null;
  } catch {
    return null;
  }
}

async function clearPublishedPayload() {
  try {
    const res = await fetch(`/api/published-schedule?t=${Date.now()}`, {
      method: "DELETE",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

function runSelfChecks() {
  const initial = createInitialState();
  const firstDate = initial.saturdays[0]?.date || "";
  return [
    { name: "Season Saturday generation returns dates", pass: getSeasonSaturdays(2026).length > 0 },
    { name: "5th Boys default to 10 games", pass: initial.divisionGames["5th Boys"] === 10 },
    {
      name: "Combined girls divisions default to 8 games",
      pass:
        initial.divisionGames["5th/6th Girls"] === 8 &&
        initial.divisionGames["7th/8th Girls"] === 8,
    },
    { name: "Team count selector reaches 24", pass: TEAM_COUNT_OPTIONS.includes("24") },
    {
      name: "Extra courts start disabled",
      pass: initial.dateCourtSettings[firstDate]?.some((court) => court.name === "OMS" && court.enabled === false) ?? true,
    },
    {
      name: "Courts default to 8:00 start",
      pass: initial.dateCourtSettings[firstDate]?.every((court) => court.startTime === "8:00") ?? true,
    },
    { name: "Selected court date initializes safely", pass: initial.selectedDateForCourts === firstDate },
    { name: "Total slots for date is non-negative", pass: getTotalSlotsForDate(initial, firstDate) >= 0 },
  ];
}

function getScheduleGridForDate(config, result, date) {
  const enabledTimes = config.timeSlots.filter((entry) => entry.enabled).map((entry) => entry.time);
  const courts = getEnabledCourtsForDate(config, date);

  return enabledTimes.map((time) => {
    const row = { time };
    for (const court of courts) {
      const game = result?.schedule?.find(
        (entry) => entry.date === date && entry.time === time && entry.court === court.name
      );
      row[court.name] = game ? `${game.away} @ ${game.home}` : "";
    }
    return row;
  });
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const isPublicMode = (params.get("view") || "").toLowerCase() === "public";
  const initialDivisionParam = params.get("division") || "all";
  const initialTeamParam = params.get("team") || "all";

  const [config, setConfig] = useState(() => normalizeConfig(createInitialState()));
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState(isPublicMode ? "schedule" : "setup");
  const [scheduleDivisionFilter, setScheduleDivisionFilter] = useState(initialDivisionParam);
  const [scheduleTeamFilter, setScheduleTeamFilter] = useState(initialTeamParam);
  const [publishedMeta, setPublishedMeta] = useState(null);
  const [publishNotice, setPublishNotice] = useState("");
  const [adminScheduleDate, setAdminScheduleDate] = useState("");
  const [dragState, setDragState] = useState(null);
  const [gridNotice, setGridNotice] = useState("");
  const [savedSetupName, setSavedSetupName] = useState("");
  const [savedSetups, setSavedSetups] = useState([]);
  const [selectedSavedSetup, setSelectedSavedSetup] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPublicSchedule() {
      if (!isPublicMode) return;
      const published = await loadPublishedPayload();
      if (cancelled) return;
      if (published?.result) {
        setResult(published.result);
        setPublishedMeta(published.meta || null);
      } else {
        setResult(null);
        setPublishedMeta(null);
      }
    }

    loadPublicSchedule();
    const retryTimer = window.setTimeout(loadPublicSchedule, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, [isPublicMode]);

  useEffect(() => {
    if (!isPublicMode) {
      const setups = loadSavedSetupsFromStorage();
      setSavedSetups(setups);
      if (!selectedSavedSetup && setups.length > 0) {
        setSelectedSavedSetup(setups[0].name);
      }
    }
  }, [isPublicMode]);

  useEffect(() => {
    if (!adminScheduleDate && config.saturdays.length > 0) {
      const firstEnabled = config.saturdays.find((entry) => entry.enabled);
      setAdminScheduleDate(firstEnabled?.date || config.saturdays[0]?.date || "");
    }
  }, [adminScheduleDate, config.saturdays]);

  const selectedCourtDate = config.selectedDateForCourts || config.saturdays[0]?.date || "";

  const capacity = useMemo(() => {
    const enabledDates = config.saturdays.filter((entry) => entry.enabled).length;
    const totalSlots = buildOpenSlots(config).length;
    const totalTeams = DIVISIONS.reduce((sum, division) => sum + Number(config.divisions[division] || 0), 0);
    const totalNeededGames = DIVISIONS.reduce(
      (sum, division) => sum + (Number(config.divisions[division] || 0) * Number(config.divisionGames[division] || 0)) / 2,
      0
    );
    const eligibleWeeklyMinimumDates = getDatesSubjectToWeeklyMinimum(config).length;
    const minimumGamesRequiredByWeek = eligibleWeeklyMinimumDates * Number(config.minGamesPerWeek || 0);
    return { enabledDates, totalSlots, totalTeams, totalNeededGames, eligibleWeeklyMinimumDates, minimumGamesRequiredByWeek };
  }, [config]);

  const selectedDateSlotTotal = useMemo(() => getTotalSlotsForDate(config, selectedCourtDate), [config, selectedCourtDate]);
  const decemberSaturdayOptions = useMemo(
    () => config.saturdays.filter((entry) => String(entry.date).split("/")[0] === "12"),
    [config.saturdays]
  );
  const selfChecks = useMemo(() => runSelfChecks(), []);
  const highlightedIssues = result?.auditRows.filter((row) => row.issues.length > 0) ?? [];
  const teamOptions = useMemo(() => buildTeamNamesFromConfig(config), [config]);

  const availableScheduleTeams = useMemo(() => {
    if (!result) return [];
    const divisionFilteredGames =
      scheduleDivisionFilter === "all"
        ? result.schedule
        : result.schedule.filter((game) => game.division === scheduleDivisionFilter);
    return Array.from(new Set(divisionFilteredGames.flatMap((game) => [game.home, game.away]))).sort((a, b) => a.localeCompare(b));
  }, [result, scheduleDivisionFilter]);

  const filteredSchedule = useMemo(() => {
    if (!result) return [];
    const filtered = result.schedule.filter((game) => {
      const divisionOk = scheduleDivisionFilter === "all" || game.division === scheduleDivisionFilter;
      const teamOk = scheduleTeamFilter === "all" || game.home === scheduleTeamFilter || game.away === scheduleTeamFilter;
      return divisionOk && teamOk;
    });

    return [...filtered].sort((a, b) => {
      const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
      if (dateDiff !== 0) return dateDiff;
      const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
      if (timeDiff !== 0) return timeDiff;
      return a.court.localeCompare(b.court);
    });
  }, [result, scheduleDivisionFilter, scheduleTeamFilter]);

  const shareableTeamUrl = useMemo(() => {
    if (scheduleTeamFilter === "all") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("view", "public");
    if (scheduleDivisionFilter !== "all") url.searchParams.set("division", scheduleDivisionFilter);
    else url.searchParams.delete("division");
    url.searchParams.set("team", scheduleTeamFilter);
    return url.toString();
  }, [scheduleDivisionFilter, scheduleTeamFilter]);

  const adminScheduleCourts = useMemo(() => getEnabledCourtsForDate(config, adminScheduleDate), [config, adminScheduleDate]);

  const adminScheduleGrid = useMemo(() => {
    if (!adminScheduleDate) return [];
    return getScheduleGridForDate(config, result, adminScheduleDate);
  }, [config, result, adminScheduleDate]);

  const adminScheduleGameCount = useMemo(() => {
    if (!result || !adminScheduleDate) return 0;
    return result.schedule.filter((game) => game.date === adminScheduleDate).length;
  }, [result, adminScheduleDate]);

  function setDivisionCount(division, value) {
    const nextCount = Number(value);
    setConfig((prev) => ({
      ...prev,
      divisions: { ...prev.divisions, [division]: nextCount },
      divisionTeamDetails: {
        ...(prev.divisionTeamDetails || {}),
        [division]: syncDivisionTeamDetails(prev.divisionTeamDetails?.[division], nextCount),
      },
    }));
  }

  function setDivisionGames(division, value) {
    setConfig((prev) => ({ ...prev, divisionGames: { ...prev.divisionGames, [division]: Number(value) } }));
  }

  function updateDivisionTeamDetail(division, teamIndex, patch) {
    setConfig((prev) => ({
      ...prev,
      divisionTeamDetails: {
        ...(prev.divisionTeamDetails || {}),
        [division]: syncDivisionTeamDetails(prev.divisionTeamDetails?.[division], prev.divisions?.[division]).map((entry, idx) =>
          idx === teamIndex ? { ...entry, ...patch } : entry
        ),
      },
    }));
  }

  function addCoachConflict() {
    setConfig((prev) => ({
      ...prev,
      coachConflicts: [...(prev.coachConflicts || []), { id: createRowId('conflict'), teamA: '', teamB: '' }],
    }));
  }

  function updateCoachConflict(conflictId, patch) {
    setConfig((prev) => ({
      ...prev,
      coachConflicts: (prev.coachConflicts || []).map((entry) => (entry.id === conflictId ? { ...entry, ...patch } : entry)),
    }));
  }

  function removeCoachConflict(conflictId) {
    setConfig((prev) => ({
      ...prev,
      coachConflicts: (prev.coachConflicts || []).filter((entry) => entry.id !== conflictId),
    }));
  }

  function toggleSaturday(index, enabled) {
    setConfig((prev) => ({
      ...prev,
      saturdays: prev.saturdays.map((entry, i) => (i === index ? { ...entry, enabled: Boolean(enabled) } : entry)),
    }));
  }

  function updateSaturdayDate(index, date) {
    setConfig((prev) => {
      const nextSaturdays = prev.saturdays.map((entry, i) => (i === index ? { ...entry, date } : entry));
      const dates = nextSaturdays.map((entry) => entry.date);
      const nextDateCourtSettings = buildDateCourtSettings(dates, prev.dateCourtSettings);
      return {
        ...prev,
        saturdays: nextSaturdays,
        dateCourtSettings: nextDateCourtSettings,
        selectedDateForCourts: dates.includes(prev.selectedDateForCourts) ? prev.selectedDateForCourts : dates[0] || "",
        fifthBoysDoubleheaderDate: dates.includes(prev.fifthBoysDoubleheaderDate) ? prev.fifthBoysDoubleheaderDate : "",
      };
    });
  }

  function toggleTime(index, enabled) {
    setConfig((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.map((entry, i) => (i === index ? { ...entry, enabled: Boolean(enabled) } : entry)),
    }));
  }

  function changeSeasonYear(value) {
    const seasonYear = Number(value);
    setConfig((prev) => {
      const saturdays = getSeasonSaturdays(seasonYear).map((date) => ({ date, enabled: false }));
      const validDates = saturdays.map((entry) => entry.date);
      return {
        ...prev,
        seasonYear,
        saturdays,
        selectedDateForCourts: saturdays[0]?.date || "",
        fifthBoysDoubleheaderDate: "",
        dateCourtSettings: buildDateCourtSettings(validDates, prev.dateCourtSettings),
      };
    });
  }

  function updateCourtForDate(date, courtIndex, patch) {
    setConfig((prev) => ({
      ...prev,
      dateCourtSettings: {
        ...prev.dateCourtSettings,
        [date]: (prev.dateCourtSettings[date] || []).map((court, i) => (i === courtIndex ? { ...court, ...patch } : court)),
      },
    }));
  }

  function startGridDrag(date, time, court) {
    if (isPublicMode || !result) return;
    const game = getGameAtCell(result, date, time, court);
    if (!game) return;
    setDragState({ date, time, court, label: `${game.away} @ ${game.home}`, game });
    setGridNotice(`Dragging ${game.away} @ ${game.home}`);
  }

  function clearGridDrag() {
    setDragState(null);
  }

  function handleGridDrop(date, time, court) {
    if (!dragState || !result) return;
    const source = dragState;
    if (source.date === date && source.time === time && source.court === court) {
      setGridNotice('Game stayed in the same slot.');
      setDragState(null);
      return;
    }

    const sourceGame = result.schedule.find(
      (game) => game.date === source.date && game.time === source.time && game.court === source.court && game.home === source.game.home && game.away === source.game.away
    );
    if (!sourceGame) {
      setGridNotice('Could not find the dragged game anymore.');
      setDragState(null);
      return;
    }

    const validationMessage = validateManualMove(result.schedule, sourceGame, { date, time, court }, config);
    if (validationMessage) {
      setGridNotice(validationMessage);
      setDragState(null);
      return;
    }

    const nextSchedule = result.schedule.map((game) =>
      game === sourceGame ? { ...game, date, time, court } : { ...game }
    );
    const nextResult = buildResultFromSchedule(nextSchedule, config, result.unscheduled);
    setResult(nextResult);
    setGridNotice(`Moved ${sourceGame.away} @ ${sourceGame.home} to ${date} ${time} ${court}.`);
    setDragState(null);
  }

  function saveCurrentSetup() {
    if (isPublicMode) return;
    const trimmed = String(savedSetupName || "").trim();
    if (!trimmed) {
      setPublishNotice("Enter a setup name first.");
      return;
    }

    const nextEntry = {
      name: trimmed,
      config: normalizeConfig(config),
      updatedAt: new Date().toLocaleString(),
    };

    const nextSetups = [
      ...savedSetups.filter((entry) => entry.name !== trimmed),
      nextEntry,
    ].sort((a, b) => String(a.name).localeCompare(String(b.name)));

    saveSavedSetupsToStorage(nextSetups);
    setSavedSetups(nextSetups);
    setSelectedSavedSetup(trimmed);
    setPublishNotice(`Setup saved: ${trimmed}`);
  }

  function loadSelectedSetup() {
    if (isPublicMode) return;
    const target = savedSetups.find((entry) => entry.name === selectedSavedSetup);
    if (!target) {
      setPublishNotice("Choose a saved setup first.");
      return;
    }

    setConfig(normalizeConfig(target.config));
    setResult(null);
    setAdminScheduleDate(
      target.config?.saturdays?.find((entry) => entry.enabled)?.date ||
      target.config?.saturdays?.[0]?.date ||
      ""
    );
    setDragState(null);
    setGridNotice("");
    setSavedSetupName(target.name);
    setPublishNotice(`Setup loaded: ${target.name}`);
    setActiveTab("setup");
  }

  function deleteSelectedSetup() {
    if (isPublicMode) return;
    if (!selectedSavedSetup) {
      setPublishNotice("Choose a saved setup first.");
      return;
    }

    const nextSetups = savedSetups.filter((entry) => entry.name !== selectedSavedSetup);
    saveSavedSetupsToStorage(nextSetups);
    setSavedSetups(nextSetups);
    const nextName = nextSetups[0]?.name || "";
    setSelectedSavedSetup(nextName);
    if (savedSetupName === selectedSavedSetup) setSavedSetupName("");
    setPublishNotice(`Setup deleted: ${selectedSavedSetup}`);
  }

  function resetAll() {
    setConfig(normalizeConfig(createInitialState()));
    setResult(null);
    setScheduleDivisionFilter("all");
    setScheduleTeamFilter("all");
    setActiveTab(isPublicMode ? "schedule" : "setup");
    setPublishNotice("");
    setPublishedMeta(null);
    setAdminScheduleDate("");
    setDragState(null);
    setGridNotice("");
    setSavedSetupName("");
  }

  function runScheduler() {
    const next = generateScheduleEngine(config);
    setResult(next);
    setScheduleDivisionFilter("all");
    setScheduleTeamFilter("all");
    setActiveTab("schedule");
    setPublishNotice("");
    setDragState(null);
    setGridNotice("");
  }

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
            <div style={styles.subtitle}>
              Editable setup, date-specific court selection, fairness-based scheduling, admin date grid, public publishing, and CSV export.
            </div>
          </div>
          <div style={styles.row}>
            {!isPublicMode ? (
              <>
                <button style={styles.button} onClick={resetAll}>Reset</button>
                <button style={styles.primaryButton} onClick={runScheduler}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Wand2 size={16} /> Generate Schedule
                  </span>
                </button>
                <button style={styles.successButton} onClick={publishSchedule} disabled={!result}>Publish Schedule</button>
                <button style={styles.button} onClick={loadPublishedSchedule}>Load Published</button>
                <button style={styles.dangerButton} onClick={clearPublishedSchedule}>Clear Published</button>
              </>
            ) : null}
          </div>
        </div>

        {publishNotice ? <div style={styles.publishBanner}>{publishNotice}</div> : null}
        {publishedMeta ? (
          <div style={styles.publishBanner}>Published schedule: {publishedMeta.totalGames} games. Last published {publishedMeta.publishedAt}.</div>
        ) : null}

        {capacity.totalNeededGames > capacity.totalSlots && !isPublicMode ? (
          <div style={styles.alert}>
            <AlertTriangle size={18} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Capacity warning</div>
              <div>
                You need about <strong>{capacity.totalNeededGames}</strong> games but only have <strong>{capacity.totalSlots}</strong> available slots with the current Saturdays, date-specific courts, and times.
              </div>
            </div>
          </div>
        ) : null}

        {!isPublicMode && Number(config.minGamesPerWeek || 0) > 0 && capacity.minimumGamesRequiredByWeek > capacity.totalNeededGames ? (
          <div style={styles.alert}>
            <AlertTriangle size={18} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Minimum-per-week warning</div>
              <div>
                You set a minimum of <strong>{Number(config.minGamesPerWeek || 0)}</strong> games across <strong>{capacity.eligibleWeeklyMinimumDates}</strong> counted Saturdays, which requires at least <strong>{capacity.minimumGamesRequiredByWeek}</strong> total games. The season currently only contains <strong>{capacity.totalNeededGames}</strong> games. The 5th Boys doubleheader date is excluded.
              </div>
            </div>
          </div>
        ) : null}

        {isPublicMode ? (
          <div style={styles.publicBanner}>Public view: schedule-only mode. Use filters below to browse by division or jump straight to one team.</div>
        ) : null}

        <div style={styles.tabBar}>
          {(isPublicMode
            ? [["schedule", "Schedule"]]
            : [["setup", "Setup"], ["schedule", "Schedule Views"], ["audit", "Audit"], ["issues", "Issues"]]
          ).map(([key, label]) => (
            <button key={key} style={activeTab === key ? styles.tabButtonActive : styles.tabButton} onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "setup" && !isPublicMode ? (
          <div style={styles.grid2}>
            <div style={{ display: "grid", gap: 24, alignContent: "start", alignSelf: "start" }}>
              <Card>
                <SectionTitle icon={Settings}>Core Rules</SectionTitle>
                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <label style={styles.smallLabel}>Season year</label>
                    <select style={styles.select} value={String(config.seasonYear)} onChange={(e) => changeSeasonYear(e.target.value)}>
                      {SEASON_YEAR_OPTIONS.map((year) => (
                        <option key={year} value={String(year)}>
                          {year}-{String(year + 1).slice(-2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.smallLabel}>5th Boys doubleheader Saturday</label>
                    <select
                      style={styles.select}
                      value={config.fifthBoysDoubleheaderDate || "none"}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fifthBoysDoubleheaderDate: e.target.value === "none" ? "" : e.target.value,
                        }))
                      }
                    >
                      <option value="none">None</option>
                      {decemberSaturdayOptions.map((entry) => (
                        <option key={entry.date} value={entry.date}>{entry.date}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.smallLabel}>Max 8:00 games per team</label>
                    <select
                      style={styles.select}
                      value={String(config.maxEarlyGames)}
                      onChange={(e) => setConfig((prev) => ({ ...prev, maxEarlyGames: Number(e.target.value) }))}
                    >
                      {MAX_EARLY_OPTIONS.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.smallLabel}>Minimum games per week (excluding 5th Boys DH date)</label>
                    <select
                      style={styles.select}
                      value={String(config.minGamesPerWeek || 0)}
                      onChange={(e) => setConfig((prev) => ({ ...prev, minGamesPerWeek: Number(e.target.value) }))}
                    >
                      {MIN_GAMES_PER_WEEK_OPTIONS.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <label style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid #e2e8f0", padding: 12, borderRadius: 12 }}>
                    <input
                      type="checkbox"
                      checked={config.globalAllowDoubleheaders}
                      onChange={(e) => setConfig((prev) => ({ ...prev, globalAllowDoubleheaders: e.target.checked }))}
                    />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Allow doubleheaders for all divisions</span>
                  </label>
                </div>
              </Card>

              <Card>
                <SectionTitle>Save / Load Setup</SectionTitle>
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={styles.smallLabel}>Setup name</label>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10 }}>
                      <input
                        style={styles.input}
                        value={savedSetupName}
                        onChange={(e) => setSavedSetupName(e.target.value)}
                        placeholder="Example: 2026 default gyms"
                      />
                      <button style={styles.button} onClick={saveCurrentSetup}>Save Setup</button>
                    </div>
                  </div>
                  <div>
                    <label style={styles.smallLabel}>Saved setups</label>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 10 }}>
                      <select
                        style={styles.select}
                        value={selectedSavedSetup || ""}
                        onChange={(e) => {
                          setSelectedSavedSetup(e.target.value);
                          if (e.target.value) setSavedSetupName(e.target.value);
                        }}
                      >
                        <option value="">Select a saved setup</option>
                        {savedSetups.map((entry) => (
                          <option key={entry.name} value={entry.name}>
                            {entry.name}
                          </option>
                        ))}
                      </select>
                      <button style={styles.button} onClick={loadSelectedSetup}>Load Setup</button>
                      <button style={styles.dangerButton} onClick={deleteSelectedSetup}>Delete</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    Saves your admin configuration in this browser: season year, Saturdays, courts, start times, division team counts, game counts, rule settings, coaching conflicts.
                  </div>
                </div>
              </Card>

              <Card>
                <SectionTitle>Coaching Conflicts</SectionTitle>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    Pick teams that cannot play at the same time because they share a coach or another admin conflict.
                  </div>
                  {(config.coachConflicts || []).map((entry) => (
                    <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto", gap: 10, alignItems: "end", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                      <div>
                        <label style={styles.smallLabel}>Team A</label>
                        <select style={styles.select} value={entry.teamA || ""} onChange={(e) => updateCoachConflict(entry.id, { teamA: e.target.value })}>
                          <option value="">Select team</option>
                          {teamOptions.map((teamName) => <option key={teamName} value={teamName}>{teamName}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={styles.smallLabel}>Team B</label>
                        <select style={styles.select} value={entry.teamB || ""} onChange={(e) => updateCoachConflict(entry.id, { teamB: e.target.value })}>
                          <option value="">Select team</option>
                          {teamOptions.map((teamName) => <option key={teamName} value={teamName}>{teamName}</option>)}
                        </select>
                      </div>
                      <button style={styles.dangerButton} onClick={() => removeCoachConflict(entry.id)}>Delete</button>
                    </div>
                  ))}
                  <div>
                    <button style={styles.button} onClick={addCoachConflict}>Add Coaching Conflict</button>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionTitle>Divisions, Teams, and Team Naming</SectionTitle>
                <div style={{ display: "grid", gap: 16 }}>
                  {DIVISIONS.map((division) => {
                    const count = Number(config.divisions[division]);
                    const targetGames = Number(config.divisionGames[division]);
                    const odd = count % 2 === 1;
                    const teamDetails = syncDivisionTeamDetails(config.divisionTeamDetails?.[division], count);
                    const genderCode = getDivisionGenderCode(division);
                    const gradeCode = getDivisionGradeCode(division);

                    return (
                      <div
                        key={division}
                        style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, display: "grid", gap: 12 }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 1fr) 90px 110px auto",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700 }}>{division}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              Code format: ASSOC + {genderCode} + {gradeCode} + team number + coach
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {odd ? "Odd team count: one DH per team allowed (except special 5th Boys rule)" : "Even team count"}
                            </div>
                          </div>

                          <select style={styles.select} value={String(count)} onChange={(e) => setDivisionCount(division, e.target.value)}>
                            {TEAM_COUNT_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                          </select>

                          <select style={styles.select} value={String(targetGames)} onChange={(e) => setDivisionGames(division, e.target.value)}>
                            {GAME_COUNT_OPTIONS.map((value) => <option key={value} value={value}>{value} games</option>)}
                          </select>

                          <Badge>{odd ? "Odd" : "Even"}</Badge>
                        </div>

                        <div style={{ display: "grid", gap: 8 }}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "36px 76px 56px 110px 1fr",
                              gap: 6,
                              padding: "0 4px",
                              fontSize: 12,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              color: "#64748b",
                            }}
                          >
                            <div>Team</div>
                            <div>Assoc.</div>
                            <div>No.</div>
                            <div>Coach</div>
                            <div>Preview</div>
                          </div>

                          {teamDetails.map((entry, idx) => {
                            const associationCode = getAssociationCode(entry);
                            const usedNumbers = getUsedAssociationTeamNumbers(
                              { ...(config.divisionTeamDetails || {}), [division]: teamDetails },
                              division,
                              associationCode,
                              idx
                            );

                            const previewName = buildFormattedTeamName(division, entry, idx + 1);

                            return (
                              <div
                                key={`${division}-${idx}`}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "36px 76px 56px 110px 1fr",
                                  gap: 6,
                                  alignItems: "center",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 10,
                                  padding: "6px 8px",
                                }}
                              >
                                <div style={{ fontWeight: 700, textAlign: "center" }}>{idx + 1}</div>

                                <select
                                  style={styles.select}
                                  value={entry.association || ""}
                                  onChange={(e) => {
                                    const association = e.target.value;
                                    const nextNumber = association
                                      ? getNextAvailableAssociationTeamNumber(
                                          { ...(config.divisionTeamDetails || {}), [division]: teamDetails },
                                          division,
                                          association,
                                          count,
                                          idx
                                        )
                                      : "1";

                                    updateDivisionTeamDetail(division, idx, {
                                      association,
                                      associationTeamNumber: nextNumber,
                                    });
                                  }}
                                >
                                  <option value="">Select</option>
                                  {ASSOCIATION_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  style={{ ...styles.select, textAlign: "center" }}
                                  value={String(entry.associationTeamNumber || "1")}
                                  onChange={(e) =>
                                    updateDivisionTeamDetail(division, idx, {
                                      associationTeamNumber: e.target.value,
                                    })
                                  }
                                >
                                  {Array.from({ length: count }, (_, n) => String(n + 1)).map((num) => (
                                    <option
                                      key={num}
                                      value={num}
                                      disabled={associationCode && usedNumbers.includes(num)}
                                    >
                                      {num}
                                    </option>
                                  ))}
                                </select>

                                <input
                                  style={styles.input}
                                  value={entry.coachLastName || ""}
                                  placeholder=""
                                  onChange={(e) =>
                                    updateDivisionTeamDetail(division, idx, {
                                      coachLastName: e.target.value,
                                    })
                                  }
                                />

                                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{previewName}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <div style={{ display: "grid", gap: 24 }}>
              <Card>
                <SectionTitle icon={CalendarDays}>Saturdays With Games</SectionTitle>
                <div style={{ border: "1px solid #e2e8f0", background: "#f8fafc", padding: 12, borderRadius: 12, fontSize: 14, color: "#475569", marginBottom: 12 }}>
                  Choose the season year, then select the Saturdays to use from November through February.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
                  {config.saturdays.map((entry, index) => (
                    <div key={`${entry.date}-${index}`} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                      <input type="checkbox" checked={entry.enabled} onChange={(e) => toggleSaturday(index, e.target.checked)} />
                      <input style={styles.input} value={entry.date} onChange={(e) => updateSaturdayDate(index, e.target.value)} />
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionTitle icon={Building2}>Court Availability by Date</SectionTitle>
                <div style={{ maxWidth: 280, marginBottom: 12 }}>
                  <label style={styles.smallLabel}>Select date to edit courts</label>
                  <select style={styles.select} value={selectedCourtDate} onChange={(e) => setConfig((prev) => ({ ...prev, selectedDateForCourts: e.target.value }))}>
                    {config.saturdays.map((entry) => <option key={entry.date} value={entry.date}>{entry.date}</option>)}
                  </select>
                </div>
                <div style={{ border: "1px solid #e2e8f0", background: "#f8fafc", padding: 12, borderRadius: 12, fontSize: 14, color: "#475569", marginBottom: 12 }}>
                  Choose which courts are active on the selected date, choose the first game start time for each court, and review how many slots remain on that court for the day.
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 110px", gap: 12, padding: "0 12px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
                    <div>Use</div>
                    <div>Court</div>
                    <div>First game</div>
                    <div>Slots left</div>
                  </div>
                  {(config.dateCourtSettings[selectedCourtDate] || []).map((court, index) => (
                    <div key={`${selectedCourtDate}-${court.name || "custom"}-${index}`} style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 110px", gap: 12, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                      <div><input type="checkbox" checked={court.enabled} onChange={(e) => updateCourtForDate(selectedCourtDate, index, { enabled: e.target.checked })} /></div>
                      <input style={styles.input} value={court.name} placeholder={index === (config.dateCourtSettings[selectedCourtDate] || []).length - 1 ? "Custom court name" : "Court name"} onChange={(e) => updateCourtForDate(selectedCourtDate, index, { name: e.target.value })} />
                      <select style={styles.select} value={court.startTime || "8:00"} onChange={(e) => updateCourtForDate(selectedCourtDate, index, { startTime: e.target.value })}>
                        {DEFAULT_TIMES.map((time) => <option key={time} value={time}>{time} start</option>)}
                      </select>
                      <div style={{ fontWeight: 700 }}>{getSlotsRemainingForCourt(config, court)}</div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc", fontWeight: 700 }}>
                    <span>Total slots for {selectedCourtDate || "selected date"}</span>
                    <span>{selectedDateSlotTotal}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionTitle>Time Slots</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
                  {config.timeSlots.map((slot, index) => (
                    <label key={slot.time} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, fontSize: 14 }}>
                      <input type="checkbox" checked={slot.enabled} onChange={(e) => toggleTime(index, e.target.checked)} />
                      {slot.time}
                    </label>
                  ))}
                </div>
              </Card>

              <div style={styles.statsGrid5}>
                <StatCard label="Teams" value={capacity.totalTeams} subvalue={`Season ${config.seasonYear}-${String(config.seasonYear + 1).slice(-2)}`} />
                <StatCard label="Needed games" value={capacity.totalNeededGames} />
                <StatCard label="Available slots" value={capacity.totalSlots} />
                <StatCard label="Min/week" value={Number(config.minGamesPerWeek || 0)} subvalue="DH date excluded" />
                <StatCard label="5th Boys DH" value={config.fifthBoysDoubleheaderDate || "Not set"} />
              </div>

              <Card>
                <SectionTitle>Built-in checks</SectionTitle>
                <div style={{ display: "grid", gap: 8 }}>
                  {selfChecks.map((check) => (
                    <div key={check.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, fontSize: 14 }}>
                      <span>{check.name}</span>
                      <Badge danger={!check.pass}>{check.pass ? "Pass" : "Fail"}</Badge>
                    </div>
                  ))}
                </div>
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
                {result && !isPublicMode ? (
                  <button
                    style={styles.button}
                    onClick={() => exportCsv("filtered_schedule.csv", [["Division", "Date", "Time", "Court", "Home", "Away"], ...filteredSchedule.map((g) => [g.division, g.date, g.time, g.court, g.home, g.away])])}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Download size={16} /> Export View
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
            {!result ? (
              <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>
                {isPublicMode ? "No published schedule found yet." : "Generate a schedule to see schedule views here."}
              </div>
            ) : (
              <>
                {!isPublicMode ? (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "end", marginBottom: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <label style={{ ...styles.smallLabel, marginBottom: 0 }}>View one date in grid form</label>
                          <span style={styles.badge}>{adminScheduleGameCount} games</span>
                        </div>
                        <select style={styles.select} value={adminScheduleDate} onChange={(e) => setAdminScheduleDate(e.target.value)}>
                          {config.saturdays.filter((entry) => entry.enabled).map((entry) => <option key={entry.date} value={entry.date}>{entry.date}</option>)}
                        </select>
                      </div>
                      <div style={{ fontSize: 14, color: "#475569" }}>
                        Drag a scheduled game to another open slot on this date to manually adjust the grid. The drop is blocked if it would break daily limits, 8:00 caps, or same-court back-to-back doubleheader rules.
                      </div>
                    </div>
                    {gridNotice ? (
                      <div style={{ marginBottom: 12, border: "1px solid #dbeafe", background: dragState ? "#eff6ff" : "#f8fafc", color: "#1e3a8a", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600 }}>
                        {gridNotice}
                      </div>
                    ) : null}
                    <div style={{ ...styles.tableWrap, marginBottom: 20, maxHeight: 'none', overflow: 'visible' }}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Time</th>
                            {adminScheduleCourts.map((court) => <th key={court.name} style={styles.th}>{court.name}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {adminScheduleGrid.map((row) => (
                            <tr key={row.time}>
                              <td style={styles.td}><strong>{row.time}</strong></td>
                              {adminScheduleCourts.map((court) => {
                                const cellGame = getGameAtCell(result, adminScheduleDate, row.time, court.name);
                                const isDropTarget = dragState && dragState.date === adminScheduleDate && dragState.time === row.time && dragState.court === court.name;
                                return (
                                  <td
                                    key={`${row.time}-${court.name}`}
                                    style={{
                                      ...styles.td,
                                      background: isDropTarget ? '#dbeafe' : 'transparent',
                                      cursor: !isPublicMode ? 'pointer' : 'default',
                                    }}
                                    onDragOver={(e) => {
                                      if (!isPublicMode) e.preventDefault();
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      handleGridDrop(adminScheduleDate, row.time, court.name);
                                    }}
                                  >
                                    {cellGame ? (
                                      <div
                                        draggable={!isPublicMode}
                                        onDragStart={() => startGridDrag(adminScheduleDate, row.time, court.name)}
                                        onDragEnd={clearGridDrag}
                                        style={{
                                          border: '1px solid #bfdbfe',
                                          background: '#eff6ff',
                                          borderRadius: 10,
                                          padding: 10,
                                          fontWeight: 600,
                                        }}
                                        title="Drag to another open slot"
                                      >
                                        <div>{cellGame.away} @ {cellGame.home}</div>
                                      </div>
                                    ) : (
                                      <span style={{ color: '#94a3b8' }}>Open</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                <div style={{ display: "grid", gridTemplateColumns: "220px 280px 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={styles.smallLabel}>Filter by division</label>
                    <select style={styles.select} value={scheduleDivisionFilter} onChange={(e) => { setScheduleDivisionFilter(e.target.value); setScheduleTeamFilter("all"); }}>
                      <option value="all">All divisions</option>
                      {DIVISIONS.map((division) => <option key={division} value={division}>{division}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.smallLabel}>Filter by team</label>
                    <select style={styles.select} value={scheduleTeamFilter} onChange={(e) => setScheduleTeamFilter(e.target.value)}>
                      <option value="all">All teams</option>
                      {availableScheduleTeams.map((team) => <option key={team} value={team}>{team}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "end", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#f8fafc", padding: "12px 16px", fontSize: 14, color: "#475569" }}>
                      Showing <strong style={{ color: "#0f172a" }}>{filteredSchedule.length}</strong> games
                    </div>
                    {scheduleTeamFilter !== "all" ? (
                      <div style={{ border: "1px solid #dbeafe", borderRadius: 12, background: "#eff6ff", padding: "12px 16px", fontSize: 13, color: "#1d4ed8" }}>
                        Direct team view active for <strong>{scheduleTeamFilter}</strong>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Division</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Time</th>
                        <th style={styles.th}>Court</th>
                        <th style={styles.th}>Home</th>
                        <th style={styles.th}>Away</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchedule.map((game, idx) => (
                        <tr key={`${game.date}-${game.time}-${game.court}-${idx}`}>
                          <td style={styles.td}>{game.division}</td>
                          <td style={styles.td}>{game.date}</td>
                          <td style={styles.td}>{game.time}</td>
                          <td style={styles.td}>{game.court}</td>
                          <td style={styles.td}>{game.home}</td>
                          <td style={styles.td}>{game.away}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        ) : null}

        {activeTab === "audit" && !isPublicMode ? (
          <div style={{ display: "grid", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 16 }}>
              <StatCard label="All teams scheduled" value={result ? (result.auditSummary.allTeamsScheduled ? "Yes" : "No") : "—"} />
              <StatCard label="Missing teams" value={result ? result.auditSummary.missingTeams : "—"} />
              <StatCard label="Early violations" value={result ? result.auditSummary.earlyViolations : "—"} />
              <StatCard label="Min/week issues" value={result ? result.auditSummary.weeklyMinimumIssues : "—"} />
              <StatCard label="Home/away issues" value={result ? result.auditSummary.homeAwayIssues : "—"} />
              <StatCard label="Time variety issues" value={result ? result.auditSummary.timeVarietyIssues : "—"} />
            </div>
            <Card>
              <SectionTitle>Team Audit</SectionTitle>
              {!result ? (
                <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>Generate a schedule to audit the teams.</div>
              ) : (
                <div style={{ ...styles.tableWrap, maxHeight: 620 }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Team</th>
                        <th style={styles.th}>Division</th>
                        <th style={styles.th}>Games</th>
                        <th style={styles.th}>Target</th>
                        <th style={styles.th}>Early</th>
                        <th style={styles.th}>Home</th>
                        <th style={styles.th}>Away</th>
                        <th style={styles.th}>DH</th>
                        <th style={styles.th}>Morning</th>
                        <th style={styles.th}>Afternoon</th>
                        <th style={styles.th}>Max Same Time</th>
                        <th style={styles.th}>Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.auditRows.map((row) => (
                        <tr key={row.team}>
                          <td style={styles.td}>{row.team}</td>
                          <td style={styles.td}>{row.division}</td>
                          <td style={styles.td}>{row.games}</td>
                          <td style={styles.td}>{row.target}</td>
                          <td style={styles.td}>{row.early}</td>
                          <td style={styles.td}>{row.home}</td>
                          <td style={styles.td}>{row.away}</td>
                          <td style={styles.td}>{row.dh}</td>
                          <td style={styles.td}>{row.morning}</td>
                          <td style={styles.td}>{row.afternoon}</td>
                          <td style={styles.td}>{row.maxSameTime}</td>
                          <td style={styles.td}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {row.issues.length ? row.issues.map((issue) => <Badge key={issue} danger>{issue}</Badge>) : <Badge>OK</Badge>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        ) : null}

        {activeTab === "issues" && !isPublicMode ? (
          <Card>
            <SectionTitle icon={AlertTriangle}>Scheduling Issues</SectionTitle>
            {!result ? (
              <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>Generate a schedule to see unresolved issues.</div>
            ) : highlightedIssues.length === 0 && result.unscheduled.length === 0 ? (
              <div style={{ border: "1px solid #bbf7d0", color: "#166534", borderRadius: 14, padding: 40, textAlign: "center" }}>No major scheduling issues found.</div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {result.unscheduled.map((issue, idx) => (
                  <div key={`${issue.matchup}-${idx}`} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
                    <div style={{ fontWeight: 700 }}>{issue.matchup}</div>
                    <div style={{ fontSize: 14, color: "#475569", marginTop: 6 }}>Reason: {issue.reason}</div>
                    <div style={{ fontSize: 14, color: "#475569", marginTop: 4 }}>Suggestion: {issue.suggestion}</div>
                  </div>
                ))}
                {highlightedIssues.map((row) => (
                  <div key={row.team} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
                    <div style={{ fontWeight: 700 }}>{row.team}</div>
                    <div style={{ fontSize: 14, color: "#475569", marginTop: 6 }}>{row.issues.join(" • ")}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
