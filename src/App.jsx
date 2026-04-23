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

const APP_HEADER = "/courtrax-header.png";
const PUBLIC_BTN_SCHEDULE = "/courtrax_btn_schedule.png";
const PUBLIC_BTN_STANDINGS = "/courtrax_btn_standings.png";
const PUBLIC_BTN_SCORE_REPORTING = "/courtrax_btn_score_reporting.png";
const PUBLIC_BTN_TECHNICALS = "/courtrax_btn_technicals.png";
const PUBLIC_BTN_TOURNAMENTS = "/courtrax_btn_tournaments.png";

const TOURNAMENT_COURTS = ["MGMS-AB", "MGMS-DE", "MGCG-FG", "MGCG-HI", "MGCG-JK"];
const TOURNAMENT_WEEKEND_OPTIONS = [
  { value: "third", label: "3rd weekend in January", saturdayOrdinal: 3 },
  { value: "fourth", label: "4th weekend in January", saturdayOrdinal: 4 },
];


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

function formatTeamNumber(num, division) {
  const n = Number(num || 1);
  const safeNum = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;

  if (!String(division || "").includes("Girls")) {
    return String(safeNum).padStart(2, "0");
  }

  return String(safeNum);
}

function buildFormattedTeamName(division, entry, fallbackIndex, totalTeamsInDivision = 0) {
  const associationCode = getAssociationCode(entry);
  const assoc = associationCode || "TM";
  const gender = getDivisionGenderCode(division);
  const grade = getDivisionGradeCode(division);
  const rawTeamNumber = associationCode
    ? (
        entry?.associationTeamNumber && String(entry.associationTeamNumber).trim()
          ? String(entry.associationTeamNumber)
          : String(fallbackIndex)
      )
    : String(fallbackIndex);
  const teamNumber = formatTeamNumber(rawTeamNumber, division);
  const coach = sanitizeCoachLastName(entry?.coachLastName);

  return coach
    ? `${assoc}${gender}${grade}${teamNumber}-${coach}`
    : `${assoc}${gender}${grade}${teamNumber}`;
}

function buildDivisionTeamDetails(count) {
  return Array.from({ length: Number(count) || 0 }, () => ({
    association: "",
    associationTeamNumber: "1",
    coachLastName: "",
    coachEmail: "",
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
  coachEmail: "",
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
    backgroundImage: `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url("https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1600&q=80")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
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
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    backdropFilter: "blur(4px)",
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
    fontWeight: 500,
    letterSpacing: "0.2px",
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
    border: "1px solid #dbeafe",
    background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
    color: "#1e3a8a",
    borderRadius: 18,
    padding: 18,
    fontSize: 14,
    fontWeight: 500,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
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
  headerHeroWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  headerHeroImage: {
    width: "100%",
    maxWidth: 1120,
    height: "auto",
    maxHeight: "300px",
    objectFit: "cover",
    borderRadius: 18,
    boxShadow: "0 14px 36px rgba(15,23,42,0.22)",
  },
 publicGraphicTabs: {
  display: "grid",
  gap: 10,
  alignItems: "center",
  width: "100%",
  maxWidth: 1100,
  margin: "0 auto 8px",
},

publicGraphicTabButton: {
  appearance: "none",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "transparent",
  padding: 0,
  margin: 0,
  width: "100%",
  cursor: "pointer",
  borderRadius: 20,
  lineHeight: 0,
  transition: "transform 0.16s ease, box-shadow 0.16s ease, filter 0.16s ease",
  boxShadow: "0 8px 16px rgba(15,23,42,0.18)",
  overflow: "hidden",
  justifySelf: "center",
},

publicGraphicTabButtonActive: {
  boxShadow: "0 12px 22px rgba(234,88,12,0.38)",
  filter: "drop-shadow(0 0 10px rgba(234,88,12,0.18))",
},

publicGraphicTabImage: {
  display: "block",
  width: "100%",
  height: "auto",
  margin: "0 auto",
},
  tabBarAdmin: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
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
  publicStatCard: {
    border: "1px solid #dbeafe",
    background: "rgba(255,255,255,0.8)",
    borderRadius: 14,
    padding: 14,
  },
  publicFilterCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    background: "#ffffff",
  },
  publicNextGameCard: {
    border: "1px solid #bfdbfe",
    borderRadius: 16,
    padding: 16,
    background: "#eff6ff",
  },
  publicGameCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    background: "#ffffff",
    display: "grid",
    gap: 10,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 3fr) minmax(360px, 2fr)",
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

function formatTimeDisplay(time) {
  if (!time) return "";
  const [rawHour, rawMinute] = String(time).split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return String(time);
  const morningTimes = new Set(["8:00", "9:05", "10:10", "11:15"]);
  const suffix = morningTimes.has(String(time)) ? "AM" : "PM";
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
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

function getConfiguredPreseasonEndDate(config) {
  const fallback = config?.seasonYear ? `12/31/${String(config.seasonYear).slice(-2)}` : '12/31/26';
  return String(config?.preseasonEndDate || fallback);
}

function isPreseasonDate(date, config) {
  if (!date) return false;
  return parseShortDate(date) <= parseShortDate(getConfiguredPreseasonEndDate(config));
}

function isRegularSeasonDate(date, config) {
  if (!date) return false;
  return parseShortDate(date) > parseShortDate(getConfiguredPreseasonEndDate(config));
}

function buildDateFilteredConfig(config, predicate) {
  const normalized = normalizeConfig(config);
  const nextSaturdays = normalized.saturdays.map((entry) => ({
    ...entry,
    enabled: Boolean(entry.enabled && predicate(entry.date)),
  }));
  const enabledDates = nextSaturdays.filter((entry) => entry.enabled).map((entry) => entry.date);
  const nextSelectedDate = enabledDates.includes(normalized.selectedDateForCourts)
    ? normalized.selectedDateForCourts
    : (enabledDates[0] || '');
  const nextDhDate = predicate(normalized.fifthBoysDoubleheaderDate) ? normalized.fifthBoysDoubleheaderDate : '';
  return normalizeConfig({
    ...normalized,
    saturdays: nextSaturdays,
    selectedDateForCourts: nextSelectedDate,
    fifthBoysDoubleheaderDate: nextDhDate,
  });
}

function buildPreseasonConfig(config) {
  const normalized = normalizeConfig(config);
  const preseasonConfig = buildDateFilteredConfig(normalized, (date) => isPreseasonDate(date, normalized));
  const totalEnabledDates = normalized.saturdays.filter((entry) => entry.enabled).length;
  const preseasonEnabledDates = preseasonConfig.saturdays.filter((entry) => entry.enabled).length;
  const postEnabledDates = Math.max(0, totalEnabledDates - preseasonEnabledDates);

  const nextDivisionGames = Object.fromEntries(
    DIVISIONS.map((division) => {
      const totalTarget = Number(normalized.divisionGames?.[division] || 0);
      if (totalTarget <= 0 || preseasonEnabledDates <= 0) return [division, 0];
      if (postEnabledDates <= 0 || totalEnabledDates <= 0) return [division, totalTarget];
      let preseasonTarget = Math.round((totalTarget * preseasonEnabledDates) / totalEnabledDates);
      const isFifthBoys = division === "5th Boys";
      const hasFifthBoysPreseasonDoubleheader = Boolean(
        isFifthBoys &&
        normalized.fifthBoysDoubleheaderDate &&
        isPreseasonDate(normalized.fifthBoysDoubleheaderDate, normalized)
      );
      const maxNoExtraRegularDoubleheaderGames = postEnabledDates;
      if (isFifthBoys && hasFifthBoysPreseasonDoubleheader) {
        preseasonTarget = Math.max(preseasonTarget, totalTarget - maxNoExtraRegularDoubleheaderGames);
      }
      preseasonTarget = Math.max(1, Math.min(totalTarget - 1, preseasonTarget));
      return [division, preseasonTarget];
    })
  );

  return normalizeConfig({
    ...preseasonConfig,
    divisionGames: nextDivisionGames,
    minGamesPerWeek: 0,
  });
}

function getTierStandingScore(row) {
  if (!row) return 0;
  return (Number(row.wins || 0) * 100000)
    + (Number(row.ties || 0) * 1000)
    - (Number(row.losses || 0) * 100)
    + Math.round(Number(row.performanceRating || 0) * 10)
    + Number(row.pointDiff || 0);
}

function buildRegularSeasonTierAssignments(teams, standingsRows, config = DEFAULT_CONFIG) {
  const count = teams.length;
  if (count < 12) {
    return {
      groups: [{ key: teams[0]?.baseDivision || teams[0]?.division || '', label: '', teams: [...teams] }],
      summary: [],
    };
  }

  const standingsMap = Object.fromEntries((Array.isArray(standingsRows) ? standingsRows : []).map((row, index) => [row.team, { ...row, rank: index + 1 }]));
  const orderedTeams = [...teams].sort((a, b) => {
    const aRow = standingsMap[a.name];
    const bRow = standingsMap[b.name];
    const scoreDiff = getTierStandingScore(bRow) - getTierStandingScore(aRow);
    if (scoreDiff !== 0) return scoreDiff;
    const aGames = Number(aRow?.gamesPlayed || 0);
    const bGames = Number(bRow?.gamesPlayed || 0);
    if (bGames !== aGames) return bGames - aGames;
    return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
  });

  const splitIndex = Math.floor(count / 2);
  const divisionOne = orderedTeams.slice(0, splitIndex);
  const divisionTwo = orderedTeams.slice(splitIndex);
  const baseDivision = teams[0]?.baseDivision || teams[0]?.division || '';
  const remainingParity = (group) => group.reduce((sum, team) => sum + Math.max(0, Number(team.targetGames || 0) - Number(team.gamesScheduled || 0)), 0) % 2;
  const rankIndex = new Map(orderedTeams.map((team, index) => [team.id, index]));
  const remainingNeed = (team) => Math.max(0, Number(team.targetGames || 0) - Number(team.gamesScheduled || 0));
  const remainingRepeatCapacity = (team, opponent) => {
    let cap = 0;
    while (canAddPairUnderRepeatPolicy(team, opponent, config, cap, { date: getRegularSeasonDates(config)[0] || '' })) {
      cap += 1;
    }
    return cap;
  };
  const repeatCapacityWithinGroup = (team, group) =>
    group
      .filter((opponent) => opponent.id !== team.id)
      .reduce((sum, opponent) => sum + remainingRepeatCapacity(team, opponent), 0);
  const groupFeasibilityPenalty = (group) => {
    const totalNeed = group.reduce((sum, team) => sum + remainingNeed(team), 0);
    const teamDeficit = group.reduce((sum, team) => {
      const need = remainingNeed(team);
      if (!need) return sum;
      return sum + Math.max(0, need - repeatCapacityWithinGroup(team, group));
    }, 0);
    const pairCapacity = group.reduce((sum, team, index) => {
      for (let i = index + 1; i < group.length; i += 1) {
        const opponent = group[i];
        sum += remainingRepeatCapacity(team, opponent);
      }
      return sum;
    }, 0);

    return (teamDeficit * 10000) + ((totalNeed % 2) * 2500) + (Math.max(0, Math.ceil(totalNeed / 2) - pairCapacity) * 5000);
  };
  const combinedFeasibilityPenalty = () => groupFeasibilityPenalty(divisionOne) + groupFeasibilityPenalty(divisionTwo);

  if (remainingParity(divisionOne) !== 0 && remainingParity(divisionTwo) !== 0) {
    let bestSwap = null;
    for (let i = 0; i < divisionOne.length; i += 1) {
      for (let j = 0; j < divisionTwo.length; j += 1) {
        const teamA = divisionOne[i];
        const teamB = divisionTwo[j];
        const needA = Math.max(0, Number(teamA.targetGames || 0) - Number(teamA.gamesScheduled || 0));
        const needB = Math.max(0, Number(teamB.targetGames || 0) - Number(teamB.gamesScheduled || 0));
        if (Math.abs(needA - needB) % 2 === 0) continue;
        const rankA = orderedTeams.findIndex((team) => team.id === teamA.id);
        const rankB = orderedTeams.findIndex((team) => team.id === teamB.id);
        const boundaryDistance = Math.abs(rankA - (splitIndex - 1)) + Math.abs(rankB - splitIndex);
        if (!bestSwap || boundaryDistance < bestSwap.boundaryDistance) {
          bestSwap = { i, j, boundaryDistance };
        }
      }
    }

    if (bestSwap) {
      const hold = divisionOne[bestSwap.i];
      divisionOne[bestSwap.i] = divisionTwo[bestSwap.j];
      divisionTwo[bestSwap.j] = hold;
    }
  }

  let currentPenalty = combinedFeasibilityPenalty();
  let repairGuard = 0;
  while (currentPenalty > 0 && repairGuard < 30) {
    repairGuard += 1;
    let bestSwap = null;

    for (let i = 0; i < divisionOne.length; i += 1) {
      for (let j = 0; j < divisionTwo.length; j += 1) {
        const teamA = divisionOne[i];
        const teamB = divisionTwo[j];
        const rankA = rankIndex.get(teamA.id) ?? i;
        const rankB = rankIndex.get(teamB.id) ?? (splitIndex + j);
        const boundaryDistance = Math.abs(rankA - (splitIndex - 1)) + Math.abs(rankB - splitIndex);

        divisionOne[i] = teamB;
        divisionTwo[j] = teamA;
        const penalty = combinedFeasibilityPenalty();
        divisionOne[i] = teamA;
        divisionTwo[j] = teamB;

        if (penalty >= currentPenalty) continue;
        if (!bestSwap || penalty < bestSwap.penalty || (penalty === bestSwap.penalty && boundaryDistance < bestSwap.boundaryDistance)) {
          bestSwap = { i, j, penalty, boundaryDistance };
        }
      }
    }

    if (!bestSwap) break;
    const hold = divisionOne[bestSwap.i];
    divisionOne[bestSwap.i] = divisionTwo[bestSwap.j];
    divisionTwo[bestSwap.j] = hold;
    currentPenalty = bestSwap.penalty;
  }
  const divisionOneIds = new Set(divisionOne.map((team) => team.id));

  return {
    groups: [
      { key: `${baseDivision}::Division 1`, label: 'Division 1', teams: divisionOne },
      { key: `${baseDivision}::Division 2`, label: 'Division 2', teams: divisionTwo },
    ],
    summary: orderedTeams.map((team, index) => ({
      team: team.name,
      baseDivision,
      tier: divisionOneIds.has(team.id) ? 'Division 1' : 'Division 2',
      preseasonRank: index + 1,
    })),
  };
}

function findBestTierContinuationCandidate(teams, slotGroups, config, currentSchedule = []) {
  const nonRepeatAvailabilityCache = {};
  const needyTeams = teams
    .filter((team) => getNeed(team) > 0)
    .sort((a, b) => {
      const needDiff = getNeed(b) - getNeed(a);
      if (needDiff !== 0) return needDiff;
      return fairnessScore(b) - fairnessScore(a);
    });

  let bestNonRepeat = null;
  let bestNonRepeatScore = -Infinity;
  let bestEmergency = null;
  let bestEmergencyScore = -Infinity;
  let bestDesperation = null;
  let bestDesperationScore = -Infinity;

  for (const team of needyTeams) {
    const candidate = chooseCompletionFirstCandidate(team, teams, slotGroups, config, { emergencyMode: false, currentSchedule, nonRepeatAvailabilityCache });
    if (candidate && typeof candidate.score === 'number' && candidate.score > bestNonRepeatScore) {
      bestNonRepeatScore = candidate.score;
      bestNonRepeat = candidate;
    }
  }

  if (bestNonRepeat) return bestNonRepeat;

  for (const team of needyTeams) {
    const candidate = chooseCompletionFirstCandidate(team, teams, slotGroups, config, { emergencyMode: true, currentSchedule, nonRepeatAvailabilityCache });
    if (candidate && typeof candidate.score === 'number' && candidate.score > bestEmergencyScore) {
      bestEmergencyScore = candidate.score;
      bestEmergency = candidate;
    }
  }

  if (bestEmergency) return bestEmergency;

  for (const team of needyTeams) {
    const candidate = chooseCompletionFirstCandidate(team, teams, slotGroups, config, {
      emergencyMode: true,
      ignoreEarlyCap: true,
      currentSchedule,
      nonRepeatAvailabilityCache,
    });
    if (candidate && typeof candidate.score === 'number' && candidate.score > bestDesperationScore) {
      bestDesperationScore = candidate.score;
      bestDesperation = candidate;
    }
  }

  return bestDesperation;
}

function chooseBestRegularSeasonSlotForPair(teamA, teamB, openSlots, config, allTeams, schedule, options = {}) {
  const { ignoreRepeatLimit = false, ignoreEarlyCap = false } = options;
  let best = null;
  let bestScore = Infinity;

  for (const slot of openSlots) {
    if (slot.used || !isRegularSeasonDate(slot.date, config)) continue;
    if (!canPairInSlot(teamA, teamB, slot, config, {
      ignoreTimeVariety: true,
      ignoreRepeatLimit,
      ignoreEarlyCap,
      allTeams,
    })) continue;

    const aOnDate = teamA.gamesByDate?.[slot.date] || 0;
    const bOnDate = teamB.gamesByDate?.[slot.date] || 0;
    const repeatCount = teamA.opponents?.[teamB.name] || 0;
    const dateDeficit = getDateMinimumDeficit(schedule, slot.date, config);
    const score =
      slotPenalty(teamA, teamB, slot, config) +
      aOnDate * 900 +
      bOnDate * 900 +
      repeatCount * 450 +
      (isEarlyTime(slot.time) ? (teamA.earlyGames + teamB.earlyGames) * 80 : 0) -
      dateDeficit * 1200;

    if (score < bestScore) {
      bestScore = score;
      best = slot;
    }
  }

  return best;
}

function completeRegularSeasonWithinTiers(teams, openSlots, schedule, config) {
  const teamsByTier = teams.reduce((acc, team) => {
    const key = team.division;
    if (!acc[key]) acc[key] = [];
    acc[key].push(team);
    return acc;
  }, {});

  const tiers = Object.values(teamsByTier)
    .filter((tierTeams) => tierTeams.some((team) => getNeed(team) > 0))
    .sort((a, b) => {
      const needA = a.reduce((sum, team) => sum + getNeed(team), 0);
      const needB = b.reduce((sum, team) => sum + getNeed(team), 0);
      return needB - needA;
    });

  for (const tierTeams of tiers) {
    const plannedPairs = buildRemainingPairPlanForGroup(tierTeams, config);
    for (const plan of plannedPairs) {
      const teamA = tierTeams.find((team) => team.id === plan.teamAId);
      const teamB = tierTeams.find((team) => team.id === plan.teamBId);
      if (!teamA || !teamB || getNeed(teamA) <= 0 || getNeed(teamB) <= 0) continue;

      let slot = chooseBestRegularSeasonSlotForPair(teamA, teamB, openSlots, config, teams, schedule);
      if (!slot) {
        slot = chooseBestRegularSeasonSlotForPair(teamA, teamB, openSlots, config, teams, schedule, { ignoreEarlyCap: true });
      }
      if (!slot) continue;
      scheduleGame(schedule, slot, teamA, teamB, { tier: teamA.tierLabel || teamB.tierLabel || '' });
    }

    let progress = true;
    let safety = 0;

    while (progress && safety < 5000 && tierTeams.some((team) => getNeed(team) > 0)) {
      safety += 1;
      progress = false;

      const pairs = [];
      for (let i = 0; i < tierTeams.length; i += 1) {
        for (let j = i + 1; j < tierTeams.length; j += 1) {
          const teamA = tierTeams[i];
          const teamB = tierTeams[j];
          if (getNeed(teamA) <= 0 || getNeed(teamB) <= 0) continue;
          pairs.push({ teamA, teamB, repeatCount: teamA.opponents?.[teamB.name] || 0 });
        }
      }

      pairs.sort((a, b) => {
        const needDiff = (getNeed(b.teamA) + getNeed(b.teamB)) - (getNeed(a.teamA) + getNeed(a.teamB));
        if (needDiff !== 0) return needDiff;
        if (a.repeatCount !== b.repeatCount) return a.repeatCount - b.repeatCount;
        return `${a.teamA.name}-${a.teamB.name}`.localeCompare(`${b.teamA.name}-${b.teamB.name}`, undefined, { numeric: true });
      });

      for (const pair of pairs) {
        let slot = chooseBestRegularSeasonSlotForPair(pair.teamA, pair.teamB, openSlots, config, teams, schedule);
        if (!slot) {
          slot = chooseBestRegularSeasonSlotForPair(pair.teamA, pair.teamB, openSlots, config, teams, schedule, {
            ignoreEarlyCap: true,
          });
        }
        if (!slot) continue;

        scheduleGame(schedule, slot, pair.teamA, pair.teamB, { tier: pair.teamA.tierLabel || pair.teamB.tierLabel || '' });
        progress = true;
        break;
      }
    }
  }
}

function buildRemainingPairPlanForGroup(groupTeams, config) {
  const working = groupTeams
    .map((team) => ({
      id: team.id,
      name: team.name,
      division: team.division,
      need: getNeed(team),
      opponents: { ...(team.opponents || {}) },
      scheduledGames: [...(team.scheduledGames || [])],
    }))
    .filter((team) => team.need > 0);
  if (working.length < 2) return [];

  const initialNeeds = working.map((team) => team.need);
  const initialCaps = working.map((teamA, i) =>
    working.map((teamB, j) => {
      if (i === j) return 0;
      let cap = 0;
      while (canAddPairUnderRepeatPolicy(teamA, teamB, config, cap, { date: getRegularSeasonDates(config)[0] || '' })) {
        cap += 1;
      }
      return cap;
    })
  );
  const memo = new Set();

  const capacityForTeam = (needs, caps, index) =>
    caps[index].reduce((sum, cap, opponentIndex) => (
      opponentIndex === index || needs[opponentIndex] <= 0 ? sum : sum + Math.min(cap, needs[opponentIndex])
    ), 0);

  const isFeasible = (needs, caps) => {
    const remaining = needs.reduce((sum, need) => sum + need, 0);
    if (remaining === 0) return true;
    if (remaining % 2 !== 0) return false;
    for (let i = 0; i < needs.length; i += 1) {
      if (needs[i] > capacityForTeam(needs, caps, i)) return false;
    }
    return true;
  };

  const stateKey = (needs, caps) => {
    const capBits = [];
    for (let i = 0; i < caps.length; i += 1) {
      for (let j = i + 1; j < caps.length; j += 1) {
        capBits.push(caps[i][j]);
      }
    }
    return `${needs.join(',')}|${capBits.join(',')}`;
  };

  const search = (needs, caps) => {
    if (!isFeasible(needs, caps)) return null;
    if (needs.every((need) => need === 0)) return [];

    const key = stateKey(needs, caps);
    if (memo.has(key)) return null;
    memo.add(key);

    const teamIndex = needs
      .map((need, index) => ({ index, need, capacity: capacityForTeam(needs, caps, index) }))
      .filter((entry) => entry.need > 0)
      .sort((a, b) => {
        if (a.capacity !== b.capacity) return a.capacity - b.capacity;
        if (b.need !== a.need) return b.need - a.need;
        return String(working[a.index].name || '').localeCompare(String(working[b.index].name || ''), undefined, { numeric: true });
      })[0]?.index;

    if (teamIndex == null) return [];

    const opponents = needs
      .map((need, index) => ({
        index,
        need,
        cap: caps[teamIndex][index],
        capacity: capacityForTeam(needs, caps, index),
      }))
      .filter((entry) => entry.index !== teamIndex && entry.need > 0 && entry.cap > 0)
      .sort((a, b) => {
        if (b.need !== a.need) return b.need - a.need;
        if (a.capacity !== b.capacity) return a.capacity - b.capacity;
        if (b.cap !== a.cap) return b.cap - a.cap;
        return String(working[a.index].name || '').localeCompare(String(working[b.index].name || ''), undefined, { numeric: true });
      });

    for (const opponent of opponents) {
      const nextNeeds = [...needs];
      const nextCaps = caps.map((row) => [...row]);
      nextNeeds[teamIndex] -= 1;
      nextNeeds[opponent.index] -= 1;
      nextCaps[teamIndex][opponent.index] -= 1;
      nextCaps[opponent.index][teamIndex] -= 1;

      const rest = search(nextNeeds, nextCaps);
      if (rest) {
        return [
          { teamAId: working[teamIndex].id, teamBId: working[opponent.index].id },
          ...rest,
        ];
      }
    }

    return null;
  };

  return search(initialNeeds, initialCaps) || [];
}

function canUseLastChanceSlot(team, slot, config) {
  const onDate = team.gamesByDate?.[slot.date] || 0;
  if (onDate >= 2) return false;
  if (onDate === 0) return true;
  if ((team.doubleHeaders || 0) >= (team.maxDoubleheadersPerTeam || 0)) return false;
  if (team.division === "5th Boys" && config?.fifthBoysDoubleheaderDate && slot.date !== config.fifthBoysDoubleheaderDate && (team.maxDoubleheadersPerTeam || 0) <= 1) {
    return false;
  }
  const existing = getScheduledGamesOnDate(team, slot.date)[0];
  return Boolean(existing && areBackToBackTimes(existing.time, slot.time) && existing.court === slot.court);
}

function chooseLastChancePairForSlot(groupTeams, slot, config, allTeams) {
  let best = null;
  let bestScore = -Infinity;

  const needy = groupTeams
    .filter((team) => getNeed(team) > 0 && canUseLastChanceSlot(team, slot, config))
    .sort((a, b) => {
      const needDiff = getNeed(b) - getNeed(a);
      if (needDiff !== 0) return needDiff;
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
    });

  for (let i = 0; i < needy.length; i += 1) {
    for (let j = i + 1; j < needy.length; j += 1) {
      const teamA = needy[i];
      const teamB = needy[j];
      if (!canAddPairUnderRepeatPolicy(teamA, teamB, config, 0, slot)) continue;
      if (!canPairInSlot(teamA, teamB, slot, config, {
        ignoreTimeVariety: true,
        ignoreRepeatLimit: false,
        ignoreEarlyCap: true,
        allTeams,
      })) continue;

      const repeatCount = teamA.opponents?.[teamB.name] || 0;
      const aOnDate = teamA.gamesByDate?.[slot.date] || 0;
      const bOnDate = teamB.gamesByDate?.[slot.date] || 0;
      const score =
        getNeed(teamA) * 5000 +
        getNeed(teamB) * 5000 -
        repeatCount * 700 -
        aOnDate * 1200 -
        bOnDate * 1200 -
        (isEarlyTime(slot.time) ? (teamA.earlyGames + teamB.earlyGames) * 50 : 0);

      if (score > bestScore) {
        bestScore = score;
        best = { teamA, teamB, slot, score };
      }
    }
  }

  return best;
}

function lastChanceCompleteShortTeamsWithinGroups(teams, openSlots, schedule, config, options = {}) {
  const { regularSeasonOnly = false } = options;
  let progress = true;
  let safety = 0;

  while (progress && safety < 12000 && teams.some((team) => getNeed(team) > 0)) {
    safety += 1;
    progress = false;

    const groupKeys = Array.from(new Set(teams.filter((team) => getNeed(team) > 0).map((team) => team.division)))
      .sort((a, b) => {
        const aNeed = teams.filter((team) => team.division === a).reduce((sum, team) => sum + getNeed(team), 0);
        const bNeed = teams.filter((team) => team.division === b).reduce((sum, team) => sum + getNeed(team), 0);
        return bNeed - aNeed;
      });

    for (const groupKey of groupKeys) {
      const groupTeams = teams.filter((team) => team.division === groupKey);
      if (!groupTeams.some((team) => getNeed(team) > 0)) continue;

      const freeSlots = openSlots
        .filter((slot) => !slot.used && (!regularSeasonOnly || isRegularSeasonDate(slot.date, config)))
        .sort((a, b) => {
          const aDateLoad = countGamesOnDate(schedule, a.date);
          const bDateLoad = countGamesOnDate(schedule, b.date);
          if (aDateLoad !== bDateLoad) return aDateLoad - bDateLoad;
          return compareSlotLike(a, b);
        });

      let placedForGroup = false;
      for (const slot of freeSlots) {
        const pair = chooseLastChancePairForSlot(groupTeams, slot, config, teams);
        if (!pair) continue;
        scheduleGame(schedule, pair.slot, pair.teamA, pair.teamB, { tier: pair.teamA.tierLabel || pair.teamB.tierLabel || '' });
        progress = true;
        placedForGroup = true;
        break;
      }

      if (placedForGroup) break;
    }
  }
}

function completeShortFifthBoysByTier(teams, openSlots, schedule, config) {
  const fifthGroups = Object.values(
    teams
      .filter((team) => team.baseDivision === "5th Boys" || team.division === "5th Boys")
      .reduce((acc, team) => {
        const key = team.division;
        if (!acc[key]) acc[key] = [];
        acc[key].push(team);
        return acc;
      }, {})
  );

  for (const groupTeams of fifthGroups) {
    let safety = 0;
    while (groupTeams.some((team) => getNeed(team) > 0) && safety < 500) {
      safety += 1;
      const shortTeams = groupTeams
        .filter((team) => getNeed(team) > 0)
        .sort((a, b) => {
          const needDiff = getNeed(b) - getNeed(a);
          if (needDiff !== 0) return needDiff;
          return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
        });

      let placed = false;
      for (const team of shortTeams) {
        const opponents = groupTeams
          .filter((opponent) =>
            opponent.id !== team.id &&
            getNeed(opponent) > 0 &&
            canAddPairUnderRepeatPolicy(team, opponent, config, 0, { date: getRegularSeasonDates(config)[0] || '' })
          )
          .sort((a, b) => {
            const needDiff = getNeed(b) - getNeed(a);
            if (needDiff !== 0) return needDiff;
            return (team.opponents?.[a.name] || 0) - (team.opponents?.[b.name] || 0);
          });

        for (const opponent of opponents) {
          let slot = chooseBestRegularSeasonSlotForPair(team, opponent, openSlots, config, teams, schedule, { ignoreEarlyCap: true });
          if (!slot) {
            const freeSlots = openSlots
              .filter((entry) => !entry.used && isRegularSeasonDate(entry.date, config))
              .sort(compareSlotLike);
            slot = freeSlots.find((entry) =>
              canPairInSlot(team, opponent, entry, config, {
                ignoreTimeVariety: true,
                ignoreRepeatLimit: false,
                ignoreEarlyCap: true,
                allTeams: teams,
              })
            ) || null;
          }
          if (!slot) continue;
          scheduleGame(schedule, slot, team, opponent, { tier: team.tierLabel || opponent.tierLabel || '' });
          placed = true;
          break;
        }

        if (placed) break;
      }

      if (!placed) break;
    }
  }
}

function buildShortTeamDiagnostics(team, groupTeams, openSlots, config, allTeams, options = {}) {
  const { regularSeasonOnly = false } = options;
  const usableSlots = openSlots.filter((slot) =>
    !slot.used &&
    (!regularSeasonOnly || isRegularSeasonDate(slot.date, config)) &&
    canUseLastChanceSlot(team, slot, config)
  );
  const opponentsUnderRepeatLimit = groupTeams.filter((opponent) =>
    opponent.id !== team.id &&
    getNeed(opponent) > 0 &&
    canAddPairUnderRepeatPolicy(team, opponent, config, 0, { date: getRegularSeasonDates(config)[0] || '' })
  );

  let legalPairSlots = 0;
  for (const slot of usableSlots.slice(0, 80)) {
    for (const opponent of opponentsUnderRepeatLimit) {
      if (!canUseLastChanceSlot(opponent, slot, config)) continue;
      if (canPairInSlot(team, opponent, slot, config, {
        ignoreTimeVariety: true,
        ignoreRepeatLimit: false,
        ignoreEarlyCap: true,
        allTeams,
      })) {
        legalPairSlots += 1;
        break;
      }
    }
  }

  return `${team.name} (${team.gamesScheduled}/${team.targetGames}; need ${getNeed(team)}; usable slots ${usableSlots.length}; needy opponents under repeat cap ${opponentsUnderRepeatLimit.length}; legal slot/opponent matches ${legalPairSlots})`;
}

function findBestTierForceFillCandidate(teams, slotGroups, config) {
  const needyTeams = teams
    .filter((team) => getNeed(team) > 0)
    .sort((a, b) => {
      const needDiff = getNeed(b) - getNeed(a);
      if (needDiff !== 0) return needDiff;
      return fairnessScore(b) - fairnessScore(a);
    });

  let best = null;
  let bestScore = -Infinity;

  for (const team of needyTeams) {
    const divisionTeams = teams.filter((candidate) => candidate.division === team.division && candidate.id !== team.id && getNeed(candidate) > 0);
    for (const group of slotGroups) {
      for (const slot of group.slots) {
        if (slot.used) continue;
        if (!canStillUseTeamOnDate(team, slot, config, { ignoreEarlyCap: true })) continue;

        for (const opponent of divisionTeams) {
          if (!canStillUseTeamOnDate(opponent, slot, config, { ignoreEarlyCap: true })) continue;
          if (!canPairInSlot(team, opponent, slot, config, {
            ignoreTimeVariety: true,
            ignoreRepeatLimit: false,
            ignoreEarlyCap: true,
            allTeams: teams,
          })) continue;

          const repeatCount = team.opponents?.[opponent.name] || 0;
          const teamNeed = getNeed(team);
          const oppNeed = getNeed(opponent);
          const teamHomeAway = getHomeAwayShortfall(team);
          const opponentHomeAway = getHomeAwayShortfall(opponent);
          const slotDateDeficit = getDateMinimumDeficit([], slot.date, config);

          let score = 0;
          score += teamNeed * 5000;
          score += oppNeed * 4200;
          score += (teamHomeAway.needHome + teamHomeAway.needAway + opponentHomeAway.needHome + opponentHomeAway.needAway) * 450;
          score += slotDateDeficit * 100;
          score -= repeatCount * 120;
          score -= (team.gamesByDate?.[slot.date] || 0) * 250;
          score -= (opponent.gamesByDate?.[slot.date] || 0) * 250;
          score -= group.groupIndex * 4;

          if (isEarlyTime(slot.time)) {
            score -= (team.earlyGames || 0) * 25;
            score -= (opponent.earlyGames || 0) * 25;
          }

          if (score > bestScore) {
            bestScore = score;
            best = { teamA: team, teamB: opponent, slot, score, repeatCount };
          }
        }
      }
    }
  }

  return best;
}


function canStillUseTeamOnDateTrueForceFill(team, slot, config) {
  const onDate = team.gamesByDate?.[slot.date] || 0;
  if (onDate >= 2) return false;

  if (onDate >= 1) {
    if ((team.doubleHeaders || 0) >= (team.maxDoubleheadersPerTeam || 0)) return false;
    if (team.division === "5th Boys" && config?.fifthBoysDoubleheaderDate && slot.date !== config.fifthBoysDoubleheaderDate && (team.maxDoubleheadersPerTeam || 0) <= 1) {
      return false;
    }
    const existing = getScheduledGamesOnDate(team, slot.date)[0];
    if (!existing) return false;
    if (!areBackToBackTimes(existing.time, slot.time)) return false;
    if (existing.court !== slot.court) return false;
  }

  return true;
}

function canStillUseTeamOnDateUltraLateRescue(team, slot, config) {
  const onDate = team.gamesByDate?.[slot.date] || 0;
  if (onDate >= 2) return false;

  if (onDate >= 1) {
    if ((team.doubleHeaders || 0) >= (team.maxDoubleheadersPerTeam || 0)) return false;
    if (team.division === "5th Boys" && config?.fifthBoysDoubleheaderDate && slot.date !== config.fifthBoysDoubleheaderDate && (team.maxDoubleheadersPerTeam || 0) <= 1) {
      return false;
    }
    const existingGames = getScheduledGamesOnDate(team, slot.date);
    if ((existingGames || []).some((game) => game.time === slot.time)) return false;
  }

  return true;
}

function canPairInSlotTrueForceFill(teamA, teamB, slot, config, allTeams = [], options = {}) {
  if (!teamA || !teamB) return false;
  if (teamA.id === teamB.id || teamA.division !== teamB.division || slot.used) return false;
  if ((teamA.gamesScheduled || 0) >= (teamA.targetGames || 0)) return false;
  if ((teamB.gamesScheduled || 0) >= (teamB.targetGames || 0)) return false;
  if (!canAddPairUnderRepeatPolicy(teamA, teamB, config, 0, slot)) return false;

  if (hasSimultaneousConflict(teamA.name, slot, allTeams, config, [teamB.name])) return false;
  if (hasSimultaneousConflict(teamB.name, slot, allTeams, config, [teamA.name])) return false;

  if (!canStillUseTeamOnDateTrueForceFill(teamA, slot, config)) return false;
  if (!canStillUseTeamOnDateTrueForceFill(teamB, slot, config)) return false;

  return true;
}

function tryPlaceTrueForceFillGameForTeam(team, opponentPool, openSlots, schedule, config, allTeams, options = {}) {
  const regularSlots = openSlots
    .filter((slot) => !slot.used && isRegularSeasonDate(slot.date, config))
    .sort((a, b) => {
      const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
      if (dateDiff !== 0) return dateDiff;
      const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
      if (timeDiff !== 0) return timeDiff;
      return String(a.court || '').localeCompare(String(b.court || ''));
    });

  for (const opponent of opponentPool) {
    for (const slot of regularSlots) {
      if (!canPairInSlotTrueForceFill(team, opponent, slot, config, allTeams, options)) continue;
      if ((team.gamesScheduled || 0) >= (team.targetGames || 0)) continue;
      if ((opponent.gamesScheduled || 0) >= (opponent.targetGames || 0)) continue;
      scheduleGame(schedule, slot, team, opponent, { tier: team.tierLabel || '' });
      return true;
    }
  }

  return false;
}

function trueForceFillShortTeamsWithinTier(teams, openSlots, schedule, config) {
  let progress = true;
  let safety = 0;

  while (progress && safety < 12000) {
    safety += 1;
    progress = false;

    const tiers = teams.reduce((acc, team) => {
      const key = team.division;
      if (!acc[key]) acc[key] = [];
      acc[key].push(team);
      return acc;
    }, {});

    for (const tierTeams of Object.values(tiers)) {
      const shortTeams = tierTeams
        .filter((team) => getNeed(team) > 0)
        .sort((a, b) => {
          const needDiff = getNeed(b) - getNeed(a);
          if (needDiff !== 0) return needDiff;
          return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
        });

      if (!shortTeams.length) continue;

      for (const team of shortTeams) {
        if (getNeed(team) <= 0) continue;

        const shortOpponents = tierTeams
          .filter((opponent) => opponent.id !== team.id && getNeed(opponent) > 0)
          .sort((a, b) => {
            const needDiff = getNeed(b) - getNeed(a);
            if (needDiff !== 0) return needDiff;
            const repeatDiff = (team.opponents?.[a.name] || 0) - (team.opponents?.[b.name] || 0);
            if (repeatDiff !== 0) return repeatDiff;
            return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
          });

        if (tryPlaceTrueForceFillGameForTeam(team, shortOpponents, openSlots, schedule, config, teams)) {
          progress = true;
          continue;
        }

        const anyOpponents = tierTeams
          .filter((opponent) => opponent.id !== team.id)
          .sort((a, b) => {
            const aOver = Math.max(0, (a.gamesScheduled || 0) - (a.targetGames || 0));
            const bOver = Math.max(0, (b.gamesScheduled || 0) - (b.targetGames || 0));
            if (aOver !== bOver) return aOver - bOver;
            const aGap = Math.abs(getNeed(a));
            const bGap = Math.abs(getNeed(b));
            if (aGap !== bGap) return aGap - bGap;
            const repeatDiff = (team.opponents?.[a.name] || 0) - (team.opponents?.[b.name] || 0);
            if (repeatDiff !== 0) return repeatDiff;
            return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
          });

        if (tryPlaceTrueForceFillGameForTeam(team, anyOpponents, openSlots, schedule, config, teams)) {
          progress = true;
        }
      }
    }
  }
}

function canPairInSlotUltraLateRescue(teamA, teamB, slot, config, allTeams = [], options = {}) {
  const { allowCrossTier = false } = options;

  if (!teamA || !teamB || !slot || slot.used) return false;
  if (teamA.id === teamB.id) return false;
  if (teamA.baseDivision !== teamB.baseDivision) return false;
  if (!allowCrossTier && teamA.division !== teamB.division) return false;
  if ((teamA.gamesScheduled || 0) >= (teamA.targetGames || 0)) return false;
  if ((teamB.gamesScheduled || 0) >= (teamB.targetGames || 0)) return false;
  if (!canAddPairUnderRepeatPolicy(teamA, teamB, config, 0, slot)) return false;

  if (hasSimultaneousConflict(teamA.name, slot, allTeams, config, [teamB.name])) return false;
  if (hasSimultaneousConflict(teamB.name, slot, allTeams, config, [teamA.name])) return false;

  if (!canStillUseTeamOnDateUltraLateRescue(teamA, slot, config)) return false;
  if (!canStillUseTeamOnDateUltraLateRescue(teamB, slot, config)) return false;

  return true;
}

function tryPlaceUltraLateRescueGameForTeam(team, opponentPool, openSlots, schedule, config, allTeams, options = {}) {
  const regularSlots = openSlots
    .filter((slot) => !slot.used && isRegularSeasonDate(slot.date, config))
    .sort((a, b) => {
      const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
      if (dateDiff !== 0) return dateDiff;
      const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
      if (timeDiff !== 0) return timeDiff;
      return String(a.court || '').localeCompare(String(b.court || ''));
    });

  for (const opponent of opponentPool) {
    for (const slot of regularSlots) {
      if (!canPairInSlotUltraLateRescue(team, opponent, slot, config, allTeams, options)) continue;
      if ((team.gamesScheduled || 0) >= (team.targetGames || 0)) continue;
      if ((opponent.gamesScheduled || 0) >= (opponent.targetGames || 0)) continue;
      const tierLabel = team.division === opponent.division
        ? (team.tierLabel || opponent.tierLabel || '')
        : `${team.tierLabel || 'Division 1'} vs ${opponent.tierLabel || 'Division 2'}`;
      scheduleGame(schedule, slot, team, opponent, { tier: tierLabel });
      return true;
    }
  }

  return false;
}

function ultraLateRescueFillShortTeams(teams, openSlots, schedule, config) {
  let progress = true;
  let safety = 0;

  const baseDivisionCounts = teams.reduce((acc, team) => {
    acc[team.baseDivision] = (acc[team.baseDivision] || 0) + 1;
    return acc;
  }, {});

  while (progress && safety < 16000) {
    safety += 1;
    progress = false;

    const shortTeams = teams
      .filter((team) => getNeed(team) > 0)
      .sort((a, b) => {
        const needDiff = getNeed(b) - getNeed(a);
        if (needDiff !== 0) return needDiff;
        const aDivisionSize = baseDivisionCounts[a.baseDivision] || 0;
        const bDivisionSize = baseDivisionCounts[b.baseDivision] || 0;
        if (aDivisionSize !== bDivisionSize) return bDivisionSize - aDivisionSize;
        return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
      });

    if (!shortTeams.length) break;

    for (const team of shortTeams) {
      if (getNeed(team) <= 0) continue;

      const sameTierShortOpponents = teams
        .filter((opponent) => opponent.id !== team.id && opponent.division === team.division && getNeed(opponent) > 0)
        .sort((a, b) => {
          const needDiff = getNeed(b) - getNeed(a);
          if (needDiff !== 0) return needDiff;
          return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
        });
      if (tryPlaceUltraLateRescueGameForTeam(team, sameTierShortOpponents, openSlots, schedule, config, teams)) {
        progress = true;
        continue;
      }

      const sameTierAnyOpponents = teams
        .filter((opponent) => opponent.id !== team.id && opponent.division === team.division && getNeed(opponent) > 0)
        .sort((a, b) => {
          const aOver = Math.max(0, (a.gamesScheduled || 0) - (a.targetGames || 0));
          const bOver = Math.max(0, (b.gamesScheduled || 0) - (b.targetGames || 0));
          if (aOver !== bOver) return aOver - bOver;
          return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
        });
      if (tryPlaceUltraLateRescueGameForTeam(team, sameTierAnyOpponents, openSlots, schedule, config, teams)) {
        progress = true;
        continue;
      }
    }
  }
}

function forceFillShortTeamsWithinTier(teams, openSlots, schedule, config) {
  let safety = 0;
  while (teams.some((team) => getNeed(team) > 0) && safety < 8000) {
    safety += 1;
    const slotGroups = buildOrderedSlotGroups(openSlots.filter((slot) => !slot.used && isRegularSeasonDate(slot.date, config)));
    if (!slotGroups.length) break;
    const candidate = findBestTierForceFillCandidate(teams, slotGroups, config);
    if (!candidate) break;
    scheduleGame(schedule, candidate.slot, candidate.teamA, candidate.teamB, { tier: candidate.teamA.tierLabel || '' });
  }
}

function finalUnderTargetCompletionPass(teams, openSlots, schedule, config) {
  let progress = true;
  let safety = 0;

  while (progress && safety < 12000) {
    safety += 1;
    progress = false;

    const shortTeams = teams
      .filter((team) => getNeed(team) > 0)
      .sort((a, b) => {
        const needDiff = getNeed(b) - getNeed(a);
        if (needDiff !== 0) return needDiff;
        const aDatesWithGames = Object.keys(a.gamesByDate || {}).length;
        const bDatesWithGames = Object.keys(b.gamesByDate || {}).length;
        if (aDatesWithGames !== bDatesWithGames) return aDatesWithGames - bDatesWithGames;
        return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
      });

    for (const team of shortTeams) {
      if (getNeed(team) <= 0) continue;
      const regularSlots = openSlots
        .filter((slot) => !slot.used && isRegularSeasonDate(slot.date, config))
        .sort((a, b) => {
          const aHasGame = (team.gamesByDate?.[a.date] || 0) > 0 ? 1 : 0;
          const bHasGame = (team.gamesByDate?.[b.date] || 0) > 0 ? 1 : 0;
          if (aHasGame !== bHasGame) return aHasGame - bHasGame;
          const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
          if (dateDiff !== 0) return dateDiff;
          const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
          if (timeDiff !== 0) return timeDiff;
          return String(a.court || '').localeCompare(String(b.court || ''));
        });

      let placed = false;
      for (const slot of regularSlots) {
        if (!canStillUseTeamOnDateUltraLateRescue(team, slot, config)) continue;
        const opponentPool = teams
          .filter((opponent) => opponent.id !== team.id && getNeed(opponent) > 0 && opponent.division === team.division)
          .sort((a, b) => {
            const sameTierA = a.division === team.division ? 0 : 1;
            const sameTierB = b.division === team.division ? 0 : 1;
            if (sameTierA !== sameTierB) return sameTierA - sameTierB;
            const aRepeat = team.opponents?.[a.name] || 0;
            const bRepeat = team.opponents?.[b.name] || 0;
            if (aRepeat !== bRepeat) return aRepeat - bRepeat;
            const needDiff = getNeed(b) - getNeed(a);
            if (needDiff !== 0) return needDiff;
            return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
          });

        for (const opponent of opponentPool) {
          if (!canPairInSlotUltraLateRescue(team, opponent, slot, config, teams)) continue;
          scheduleGame(schedule, slot, team, opponent, {
            tier: team.tierLabel || opponent.tierLabel || '',
          });
          placed = true;
          progress = true;
          break;
        }
        if (placed) break;
      }
    }
  }
}

function completeShortFifthBoysPreseasonGames(teams, openSlots, schedule, config) {
  const fifthBoys = teams.filter((team) => team.division === "5th Boys");
  if (!fifthBoys.length) return;

  let progress = true;
  let guard = 0;
  while (progress && guard < 200) {
    guard += 1;
    progress = false;
    const shortTeams = fifthBoys
      .filter((team) => getNeed(team) > 0)
      .sort((a, b) => getNeed(b) - getNeed(a) || fairnessScore(b) - fairnessScore(a));

    if (!shortTeams.length) break;

    for (const teamA of shortTeams) {
      if (getNeed(teamA) <= 0) continue;
      const opponents = fifthBoys
        .filter((teamB) => teamB.id !== teamA.id && getNeed(teamB) > 0)
        .sort((a, b) => {
          const repeatDiff = (teamA.opponents?.[a.name] || 0) - (teamA.opponents?.[b.name] || 0);
          if (repeatDiff !== 0) return repeatDiff;
          return getNeed(b) - getNeed(a);
        });

      for (const teamB of opponents) {
        const slots = openSlots
          .filter((slot) => !slot.used && isPreseasonDate(slot.date, config))
          .sort((a, b) => {
            const aDateLoad = (teamA.gamesByDate?.[a.date] || 0) + (teamB.gamesByDate?.[a.date] || 0);
            const bDateLoad = (teamA.gamesByDate?.[b.date] || 0) + (teamB.gamesByDate?.[b.date] || 0);
            if (aDateLoad !== bDateLoad) return aDateLoad - bDateLoad;
            return compareSlotLike(a, b);
          });
        let placed = false;
        for (const slot of slots) {
          if (!canPairInSlot(teamA, teamB, slot, config, {
            ignoreTimeVariety: true,
            ignoreEarlyCap: true,
            allTeams: teams,
          })) {
            continue;
          }
          scheduleGame(schedule, slot, teamA, teamB);
          progress = true;
          placed = true;
          break;
        }
        if (placed) break;
      }
    }
  }
}

function completeShortPreseasonGamesByDivision(teams, openSlots, schedule, config) {
  let progress = true;
  let guard = 0;

  while (progress && guard < 800) {
    guard += 1;
    progress = false;
    const shortTeams = teams
      .filter((team) => getNeed(team) > 0)
      .sort((a, b) => {
        const needDiff = getNeed(b) - getNeed(a);
        if (needDiff !== 0) return needDiff;
        return (b.targetGames - b.gamesScheduled) - (a.targetGames - a.gamesScheduled);
      });

    for (const teamA of shortTeams) {
      if (getNeed(teamA) <= 0) continue;
      const shortOpponents = teams
        .filter((teamB) =>
          teamB.id !== teamA.id &&
          teamB.division === teamA.division &&
          getNeed(teamB) > 0
        )
        .sort((a, b) => {
          const repeatDiff = (teamA.opponents?.[a.name] || 0) - (teamA.opponents?.[b.name] || 0);
          if (repeatDiff !== 0) return repeatDiff;
          return getNeed(b) - getNeed(a);
        });
      const overTargetBridgeOpponents = teams
        .filter((teamB) =>
          teamB.id !== teamA.id &&
          teamB.division === teamA.division &&
          getNeed(teamB) <= 0 &&
          Number(teamB.gamesScheduled || 0) <= Number(teamB.targetGames || 0)
        )
        .sort((a, b) => {
          const repeatDiff = (teamA.opponents?.[a.name] || 0) - (teamA.opponents?.[b.name] || 0);
          if (repeatDiff !== 0) return repeatDiff;
          return Number(a.gamesScheduled || 0) - Number(b.gamesScheduled || 0);
        });
      const opponents = [...shortOpponents, ...overTargetBridgeOpponents];

      let placed = false;
      for (const teamB of opponents) {
        const slots = openSlots
          .filter((slot) => !slot.used && isPreseasonDate(slot.date, config))
          .sort((a, b) => {
            const aDateLoad = (teamA.gamesByDate?.[a.date] || 0) + (teamB.gamesByDate?.[a.date] || 0);
            const bDateLoad = (teamA.gamesByDate?.[b.date] || 0) + (teamB.gamesByDate?.[b.date] || 0);
            if (aDateLoad !== bDateLoad) return aDateLoad - bDateLoad;
            return compareSlotsAvoidingEarlyForTeams(teamA, teamB, config)(a, b);
          });

        for (const slot of slots) {
          const originalTarget = teamB.targetGames;
          if (getNeed(teamB) <= 0 && teamB.gamesScheduled >= teamB.targetGames) {
            teamB.targetGames = teamB.gamesScheduled + 1;
          }
          const canPlace = canPairInSlot(teamA, teamB, slot, config, {
            ignoreTimeVariety: true,
            ignoreEarlyCap: false,
            allTeams: teams,
          });
          teamB.targetGames = originalTarget;
          if (!canPlace) {
            continue;
          }
          scheduleGame(schedule, slot, teamA, teamB);
          progress = true;
          placed = true;
          break;
        }
        if (placed) break;
      }
    }
  }
}

function rebalanceShortPreseasonTeamsByReplacingGames(teams, schedule, config) {
  let progress = true;
  let guard = 0;
  const teamMap = Object.fromEntries(teams.map((team) => [team.name, team]));

  while (progress && guard < 300) {
    guard += 1;
    progress = false;
    const shortTeams = teams
      .filter((team) => getNeed(team) > 0)
      .sort((a, b) => getNeed(b) - getNeed(a) || (a.gamesScheduled || 0) - (b.gamesScheduled || 0));

    for (const shortTeam of shortTeams) {
      if (getNeed(shortTeam) <= 0) continue;
      let placedForThisTeam = false;
      const candidates = schedule
        .map((game, index) => ({ game, index }))
        .filter(({ game }) =>
          !game.locked &&
          game.division === shortTeam.division &&
          isPreseasonDate(game.date, config) &&
          game.date !== config.fifthBoysDoubleheaderDate &&
          game.home !== shortTeam.name &&
          game.away !== shortTeam.name
        )
        .sort((a, b) => compareSlotLike(a.game, b.game));

      for (const { game, index } of candidates) {
        const homeTeam = teamMap[game.home];
        const awayTeam = teamMap[game.away];
        if (!homeTeam || !awayTeam) continue;

        const replacements = [
          { donor: homeTeam, opponent: awayTeam, shortIsHome: true },
          { donor: awayTeam, opponent: homeTeam, shortIsHome: false },
        ].sort((a, b) => {
          const aDonorGames = a.donor.gamesScheduled || 0;
          const bDonorGames = b.donor.gamesScheduled || 0;
          if (bDonorGames !== aDonorGames) return bDonorGames - aDonorGames;
          return (a.opponent.opponents?.[shortTeam.name] || 0) - (b.opponent.opponents?.[shortTeam.name] || 0);
        });

        for (const replacement of replacements) {
          const { donor, opponent, shortIsHome } = replacement;
          if ((donor.gamesScheduled || 0) <= (shortTeam.gamesScheduled || 0)) continue;

          removeGameFromTeam(homeTeam, game, awayTeam.name, true);
          removeGameFromTeam(awayTeam, game, homeTeam.name, false);

          const slot = { date: game.date, time: game.time, court: game.court, used: false };
          const canReplace = canPairInSlot(shortTeam, opponent, slot, config, {
            ignoreTimeVariety: true,
            ignoreEarlyCap: false,
            allTeams: teams,
          });

          if (canReplace) {
            const nextGame = {
              ...game,
              home: shortIsHome ? shortTeam.name : opponent.name,
              away: shortIsHome ? opponent.name : shortTeam.name,
            };
            schedule[index] = nextGame;
            addGameToTeam(shortIsHome ? shortTeam : opponent, nextGame, shortIsHome ? opponent.name : shortTeam.name, true);
            addGameToTeam(shortIsHome ? opponent : shortTeam, nextGame, shortIsHome ? shortTeam.name : opponent.name, false);
            progress = true;
            placedForThisTeam = true;
            break;
          }

          addGameToTeam(homeTeam, game, awayTeam.name, true);
          addGameToTeam(awayTeam, game, homeTeam.name, false);
        }

        if (placedForThisTeam || getNeed(shortTeam) <= 0) break;
      }
    }
  }
}

function getRegularSeasonDates(config) {
  return getEnabledGameDates(config).filter((date) => isRegularSeasonDate(date, config));
}

function getPairCountBetween(teamA, teamB) {
  return Math.max(
    Number(teamA?.opponents?.[teamB?.name] || 0),
    Number(teamB?.opponents?.[teamA?.name] || 0)
  );
}

function hadPreseasonMeetingBetween(teamA, teamB, config) {
  if (!teamA || !teamB) return false;
  return (teamA.scheduledGames || []).some(
    (game) => game.opponentName === teamB.name && isPreseasonDate(game.date, config)
  ) || (teamB.scheduledGames || []).some(
    (game) => game.opponentName === teamA.name && isPreseasonDate(game.date, config)
  );
}

function canAddPairUnderRepeatPolicy(teamA, teamB, config, plannedCount = 0, slot = null) {
  const currentCount = getPairCountBetween(teamA, teamB) + Number(plannedCount || 0);
  const repeatLimit = getAllowedRepeatLimit(config, teamA?.division || '');
  if (currentCount >= repeatLimit) return false;
  if (!slot || !isRegularSeasonDate(slot.date, config)) return true;
  if (currentCount <= 0) return true;
  return hadPreseasonMeetingBetween(teamA, teamB, config);
}

function canPlanRegularSeasonPair(teamA, teamB, pairCounts, config) {
  if (!teamA || !teamB || teamA.id === teamB.id || teamA.division !== teamB.division) return false;
  const key = [teamA.id, teamB.id].sort().join("||");
  const plannedCount = Number(pairCounts[key] || 0);
  return canAddPairUnderRepeatPolicy(teamA, teamB, config, plannedCount, { date: getRegularSeasonDates(config)[0] || '' });
}

function buildDateMatchingCandidates(groupTeams, needs, pairCounts, config, capacity) {
  const teams = groupTeams
    .filter((team) => Number(needs[team.id] || 0) > 0)
    .sort((a, b) => {
      const needDiff = Number(needs[b.id] || 0) - Number(needs[a.id] || 0);
      if (needDiff !== 0) return needDiff;
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true });
    });
  const candidates = [];

  function signatureFor(candidate) {
    return candidate
      .map((game) => [game.teamA.id, game.teamB.id].sort().join("~"))
      .sort()
      .join("|");
  }

  function walk(index, used, games) {
    if (games.length >= capacity) {
      candidates.push(games.map((game) => ({ ...game })));
      return;
    }

    let firstIndex = -1;
    for (let i = index; i < teams.length; i += 1) {
      if (!used.has(teams[i].id) && Number(needs[teams[i].id] || 0) > 0) {
        firstIndex = i;
        break;
      }
    }

    if (firstIndex < 0) {
      candidates.push(games.map((game) => ({ ...game })));
      return;
    }

    const teamA = teams[firstIndex];

    for (let i = firstIndex + 1; i < teams.length; i += 1) {
      const teamB = teams[i];
      if (used.has(teamB.id) || Number(needs[teamB.id] || 0) <= 0) continue;
      if (!canPlanRegularSeasonPair(teamA, teamB, pairCounts, config)) continue;
      used.add(teamA.id);
      used.add(teamB.id);
      games.push({ teamA, teamB });
      walk(firstIndex + 1, used, games);
      games.pop();
      used.delete(teamA.id);
      used.delete(teamB.id);
    }

    used.add(teamA.id);
    walk(firstIndex + 1, used, games);
    used.delete(teamA.id);
  }

  walk(0, new Set(), []);

  const seen = new Set();
  return candidates
    .filter((candidate) => {
      const signature = signatureFor(candidate);
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      const aNeed = a.reduce((sum, game) => sum + Number(needs[game.teamA.id] || 0) + Number(needs[game.teamB.id] || 0), 0);
      const bNeed = b.reduce((sum, game) => sum + Number(needs[game.teamA.id] || 0) + Number(needs[game.teamB.id] || 0), 0);
      if (bNeed !== aNeed) return bNeed - aNeed;
      const aRepeats = a.reduce((sum, game) => sum + getPairCountBetween(game.teamA, game.teamB), 0);
      const bRepeats = b.reduce((sum, game) => sum + getPairCountBetween(game.teamA, game.teamB), 0);
      return aRepeats - bRepeats;
    })
    .slice(0, 160);
}

function buildRegularSeasonDatePlanForGroup(groupTeams, dates, slotCapacityByDate, config) {
  const needs = Object.fromEntries(groupTeams.map((team) => [team.id, getNeed(team)]));
  const totalNeed = Object.values(needs).reduce((sum, value) => sum + Number(value || 0), 0);
  if (totalNeed === 0) return [];
  if (totalNeed % 2 !== 0) return null;

  const pairCounts = {};
  const orderedDates = [...dates].sort((a, b) => parseShortDate(a) - parseShortDate(b));

  function hasEnoughFutureDates(dateIndex) {
    const remainingDates = Math.max(0, orderedDates.length - dateIndex);
    return groupTeams.every((team) => Number(needs[team.id] || 0) <= remainingDates);
  }

  function remainingSlotCapacity(dateIndex) {
    return orderedDates
      .slice(dateIndex)
      .reduce((sum, date) => sum + Math.max(0, Number(slotCapacityByDate[date] || 0)), 0);
  }

  function search(dateIndex) {
    const remainingNeed = Object.values(needs).reduce((sum, value) => sum + Number(value || 0), 0);
    if (remainingNeed === 0) return [];
    if (dateIndex >= orderedDates.length) return null;
    if (remainingNeed > remainingSlotCapacity(dateIndex) * 2) return null;
    if (!hasEnoughFutureDates(dateIndex)) return null;

    const date = orderedDates[dateIndex];
    const capacity = Math.min(
      Math.floor(remainingNeed / 2),
      Math.max(0, Number(slotCapacityByDate[date] || 0)),
      Math.floor(groupTeams.length / 2)
    );
    const candidates = buildDateMatchingCandidates(groupTeams, needs, pairCounts, config, capacity);

    for (const candidate of candidates) {
      for (const game of candidate) {
        const key = [game.teamA.id, game.teamB.id].sort().join("||");
        pairCounts[key] = Number(pairCounts[key] || 0) + 1;
        needs[game.teamA.id] -= 1;
        needs[game.teamB.id] -= 1;
      }

      const next = search(dateIndex + 1);
      if (next) {
        return [
          ...candidate.map((game) => ({ date, teamA: game.teamA, teamB: game.teamB })),
          ...next,
        ];
      }

      for (const game of candidate) {
        const key = [game.teamA.id, game.teamB.id].sort().join("||");
        pairCounts[key] -= 1;
        needs[game.teamA.id] += 1;
        needs[game.teamB.id] += 1;
      }
    }

    return null;
  }

  return search(0);
}

function chooseSlotForPlannedRegularSeasonGame(teamA, teamB, date, openSlots, config, allTeams) {
  const dateSlots = openSlots
    .filter((slot) => !slot.used && slot.date === date && isRegularSeasonDate(slot.date, config))
    .sort((a, b) => {
      const penaltyDiff = slotPenalty(teamA, teamB, a, config) - slotPenalty(teamA, teamB, b, config);
      if (penaltyDiff !== 0) return penaltyDiff;
      return compareSlotLike(a, b);
    });
  const optionSets = [
    { ignoreTimeVariety: false, ignoreEarlyCap: false },
    { ignoreTimeVariety: true, ignoreEarlyCap: false },
    { ignoreTimeVariety: true, ignoreEarlyCap: true },
  ];

  for (const options of optionSets) {
    for (const slot of dateSlots) {
      if (canPairInSlot(teamA, teamB, slot, config, { ...options, allTeams })) {
        return slot;
      }
    }
  }

  return null;
}

function completeRegularSeasonWithDatePlans(teams, openSlots, schedule, config, unscheduled) {
  const regularDates = getRegularSeasonDates(config);
  const slotCapacityByDate = Object.fromEntries(
    regularDates.map((date) => [
      date,
      openSlots.filter((slot) => !slot.used && slot.date === date).length,
    ])
  );
  const teamsByTier = teams.reduce((acc, team) => {
    const key = team.division;
    if (!acc[key]) acc[key] = [];
    acc[key].push(team);
    return acc;
  }, {});

  const groups = Object.entries(teamsByTier)
    .map(([key, groupTeams]) => ({ key, groupTeams }))
    .sort((a, b) => {
      const aNeed = a.groupTeams.reduce((sum, team) => sum + getNeed(team), 0);
      const bNeed = b.groupTeams.reduce((sum, team) => sum + getNeed(team), 0);
      return bNeed - aNeed;
    });

  for (const group of groups) {
    if (!group.groupTeams.some((team) => getNeed(team) > 0)) continue;
    const groupNeed = group.groupTeams.reduce((sum, team) => sum + getNeed(team), 0);
    const maxNeed = Math.max(...group.groupTeams.map((team) => getNeed(team)));
    if (groupNeed % 2 !== 0 || maxNeed > regularDates.length || group.groupTeams.length > 8) {
      continue;
    }
    const plan = buildRegularSeasonDatePlanForGroup(group.groupTeams, regularDates, slotCapacityByDate, config);
    if (!plan) {
      unscheduled.push({
        matchup: group.key.replace(/::/g, ' - '),
        reason: 'Could not build an exact regular-season matchup plan for this tier.',
        suggestion: group.groupTeams
          .filter((team) => getNeed(team) > 0)
          .map((team) => `${team.name} needs ${getNeed(team)}`)
          .join('; '),
      });
      continue;
    }

    for (const item of plan) {
      const slot = chooseSlotForPlannedRegularSeasonGame(item.teamA, item.teamB, item.date, openSlots, config, teams);
      if (!slot) {
        unscheduled.push({
          matchup: `${item.teamA.name} vs ${item.teamB.name}`,
          reason: `No open slot could hold this planned game on ${item.date}.`,
          suggestion: 'Enable another court or time on that date, or move a locked game.',
        });
        continue;
      }
      scheduleGame(schedule, slot, item.teamA, item.teamB, { tier: item.teamA.tierLabel || item.teamB.tierLabel || '' });
      slotCapacityByDate[item.date] = Math.max(0, Number(slotCapacityByDate[item.date] || 0) - 1);
    }
  }
}

function generateTieredRegularSeasonEngine(config, existingSchedule = [], scoreReports = []) {
  const normalized = normalizeConfig(config);
  const teams = buildTeams(normalized).map((team) => ({ ...team, baseDivision: team.division, tierLabel: '' }));
  const openSlots = buildOpenSlots(normalized);
  const schedule = [];
  const unscheduled = [];

  const carryForwardGames = (Array.isArray(existingSchedule) ? existingSchedule : [])
    .filter((game) => isPreseasonDate(game.date, normalized) || game.locked)
    .map((game) => ({ ...game, locked: true }));

  applyLockedGames(schedule, teams, openSlots, normalized, carryForwardGames, unscheduled, { skipValidation: true });

  const preseasonSchedule = schedule.filter((game) => isPreseasonDate(game.date, normalized));
  const standingsByDivision = buildDivisionStandings(preseasonSchedule, scoreReports);
  const tierSummary = [];

  for (const division of DIVISIONS) {
    const divisionTeams = teams.filter((team) => team.baseDivision === division);
    const tierAssignments = buildRegularSeasonTierAssignments(divisionTeams, standingsByDivision[division] || [], normalized);
    for (const group of tierAssignments.groups) {
      for (const team of group.teams) {
        team.division = group.key;
        team.tierLabel = group.label || '';
      }
    }
    tierSummary.push(...tierAssignments.summary);
  }

  completeRegularSeasonWithDatePlans(teams, openSlots, schedule, normalized, unscheduled);
  completeRegularSeasonWithinTiers(teams, openSlots, schedule, normalized);

  let safety = 0;
  while (teams.some((team) => getNeed(team) > 0) && safety < 12000) {
    safety += 1;
    const slotGroups = buildOrderedSlotGroups(openSlots.filter((slot) => !slot.used && isRegularSeasonDate(slot.date, normalized)));
    if (!slotGroups.length) break;
    const candidate = findBestTierContinuationCandidate(teams, slotGroups, normalized, schedule);
    if (!candidate) break;
    scheduleGame(schedule, candidate.slot, candidate.teamA, candidate.teamB, { tier: candidate.teamA.tierLabel });
  }

  if (teams.some((team) => getNeed(team) > 0)) {
    forceFillShortTeamsWithinTier(teams, openSlots, schedule, normalized);
  }

  if (teams.some((team) => getNeed(team) > 0)) {
    trueForceFillShortTeamsWithinTier(teams, openSlots, schedule, normalized);
  }

  if (teams.some((team) => getNeed(team) > 0)) {
    finalUnderTargetCompletionPass(teams, openSlots, schedule, normalized);
  }

  if (teams.some((team) => getNeed(team) > 0)) {
    ultraLateRescueFillShortTeams(teams, openSlots, schedule, normalized);
  }

  if (teams.some((team) => getNeed(team) > 0)) {
    completeRegularSeasonWithinTiers(teams, openSlots, schedule, normalized);
  }

  if (teams.some((team) => getNeed(team) > 0)) {
    lastChanceCompleteShortTeamsWithinGroups(teams, openSlots, schedule, normalized, { regularSeasonOnly: true });
  }

  if (teams.some((team) => getNeed(team) > 0 && (team.baseDivision === "5th Boys" || team.division === "5th Boys"))) {
    completeShortFifthBoysByTier(teams, openSlots, schedule, normalized);
  }

  const teamsByTier = teams.reduce((acc, team) => {
    const key = team.division;
    if (!acc[key]) acc[key] = [];
    acc[key].push(team);
    return acc;
  }, {});

  for (const [tierKey, tierTeams] of Object.entries(teamsByTier)) {
    const needy = tierTeams.filter((team) => getNeed(team) > 0);
    if (!needy.length) continue;
    unscheduled.push({
      matchup: tierKey.replace(/::/g, ' - '),
      reason: 'Could not finish every remaining game within the available regular-season slots while staying inside the tier.',
      suggestion: needy
        .map((team) => buildShortTeamDiagnostics(team, tierTeams, openSlots, normalized, teams, { regularSeasonOnly: true }))
        .join('; '),
    });
  }

  if (safety >= 12000 && teams.some((team) => getNeed(team) > 0)) {
    unscheduled.push({
      matchup: 'Regular season continuation',
      reason: 'Stopped the January-and-later scheduler after too many pairing attempts to avoid the app freezing.',
      suggestion: 'Try fewer enabled courts/dates, fewer target games, or use the sandbox to test a smaller continuation set first.',
    });
  }

  const unresolvedUnscheduled = teams.some((team) => getNeed(team) > 0) ? unscheduled : [];
  const result = buildResultFromSchedule(schedule, normalized, unresolvedUnscheduled);
  return {
    ...result,
    seasonPhase: 'regular',
    tierSummary,
    preseasonGameCount: preseasonSchedule.length,
  };
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
    preseasonEndDate: `12/31/${String(seasonYear).slice(-2)}`,
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
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildTeamNamesFromConfig(config) {
  const names = [];
  for (const division of DIVISIONS) {
    const count = Number(config?.divisions?.[division] || 0);
    const details = syncDivisionTeamDetails(config?.divisionTeamDetails?.[division], count);
    for (let i = 0; i < count; i += 1) {
      names.push(buildFormattedTeamName(division, details[i], i + 1, count));
    }
  }
  return names;
}

function normalizeConfig(config) {
  const initial = createInitialState();
  const next = {
    ...initial,
    ...(config || {}),
    preseasonEndDate: String(config?.preseasonEndDate || initial.preseasonEndDate || `12/31/${String(initial.seasonYear).slice(-2)}`),
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

function normalizeTeamName(value) {
  return String(value || "").trim().toLowerCase();
}

function getTeamBaseName(value) {
  return normalizeTeamName(value).split("-")[0];
}

function getTeamDetailByFormattedName(config, teamName, divisionHint = "") {
  const normalizedTarget = normalizeTeamName(teamName);
  const targetBase = getTeamBaseName(teamName);
  const normalizedDivision = String(divisionHint || "").trim();

  let baseMatch = null;

  const divisionsToSearch = normalizedDivision ? [normalizedDivision] : DIVISIONS;

  for (const division of divisionsToSearch) {
    const count = Number(config?.divisions?.[division] || 0);
    const details = syncDivisionTeamDetails(config?.divisionTeamDetails?.[division], count);

    for (let i = 0; i < count; i += 1) {
      const formatted = buildFormattedTeamName(division, details[i], i + 1, count);
      const normalizedFormatted = normalizeTeamName(formatted);
      const formattedBase = getTeamBaseName(formatted);

      if (normalizedFormatted === normalizedTarget) {
        return {
          division,
          index: i,
          entry: details[i],
          formattedName: formatted,
        };
      }

      if (!baseMatch && formattedBase === targetBase) {
        baseMatch = {
          division,
          index: i,
          entry: details[i],
          formattedName: formatted,
        };
      }
    }
  }

  return baseMatch;
}

function getCoachEmailForTeam(config, teamName, divisionHint = "") {
  const detail = getTeamDetailByFormattedName(config, teamName, divisionHint);
  return String(detail?.entry?.coachEmail || "").trim().toLowerCase();
}

function normalizeCoachInfoEntry(value) {
  if (value && typeof value === "object") {
    return {
      coachEmail: String(value.coachEmail || value.email || "").trim().toLowerCase(),
      coachLastName: sanitizeCoachLastName(value.coachLastName || value.lastName || ""),
    };
  }
  return {
    coachEmail: String(value || "").trim().toLowerCase(),
    coachLastName: "",
  };
}

function buildCoachDirectoryFromConfig(sourceConfig, keyConfig = sourceConfig) {
  const sourceNormalized = normalizeConfig(sourceConfig);
  const keyNormalized = normalizeConfig(keyConfig || sourceConfig);
  const directory = {};
  for (const division of DIVISIONS) {
    const sourceCount = Number(sourceNormalized?.divisions?.[division] || 0);
    const keyCount = Number(keyNormalized?.divisions?.[division] || 0);
    const count = Math.min(sourceCount, keyCount);
    const sourceDetails = syncDivisionTeamDetails(sourceNormalized?.divisionTeamDetails?.[division], sourceCount);
    const keyDetails = syncDivisionTeamDetails(keyNormalized?.divisionTeamDetails?.[division], keyCount);
    for (let i = 0; i < count; i += 1) {
      const teamName = buildFormattedTeamName(division, keyDetails[i], i + 1, keyCount);
      if (!teamName) continue;
      const coachEmail = String(sourceDetails[i]?.coachEmail || "").trim().toLowerCase();
      const coachLastName = sanitizeCoachLastName(sourceDetails[i]?.coachLastName || "");
      if (coachEmail || coachLastName) {
        directory[teamName] = {
          coachEmail,
          coachLastName,
        };
      }
    }
  }
  return directory;
}

function buildPublishedTeamRenameMap(sourceConfig, publishedConfig) {
  const nextConfig = normalizeConfig(sourceConfig);
  const priorConfig = normalizeConfig(publishedConfig || sourceConfig);
  const renameMap = {};

  for (const division of DIVISIONS) {
    const nextCount = Number(nextConfig?.divisions?.[division] || 0);
    const priorCount = Number(priorConfig?.divisions?.[division] || 0);
    const count = Math.min(nextCount, priorCount);
    const nextDetails = syncDivisionTeamDetails(nextConfig?.divisionTeamDetails?.[division], nextCount);
    const priorDetails = syncDivisionTeamDetails(priorConfig?.divisionTeamDetails?.[division], priorCount);

    for (let i = 0; i < count; i += 1) {
      const oldName = buildFormattedTeamName(division, priorDetails[i], i + 1, priorCount);
      const newName = buildFormattedTeamName(division, nextDetails[i], i + 1, nextCount);
      if (oldName && newName && oldName !== newName) {
        renameMap[oldName] = newName;
      }
    }
  }

  return renameMap;
}

function remapPublishedScheduleTeams(schedule, renameMap) {
  return (Array.isArray(schedule) ? schedule : []).map((game) => ({
    ...game,
    home: renameMap?.[game.home] || game.home,
    away: renameMap?.[game.away] || game.away,
  }));
}

function remapPublishedScoreReports(scoreReports, renameMap) {
  const updatedReports = (Array.isArray(scoreReports) ? scoreReports : []).map((report) => {
    const nextHome = renameMap?.[report.home] || report.home;
    const nextAway = renameMap?.[report.away] || report.away;
    const nextReportingTeam = renameMap?.[report.reportingTeam] || report.reportingTeam;
    const nextApprovalOfReportId = report.approvalOfReportId || "";
    return normalizeScoreReportEntry({
      ...report,
      gameId: [report.date, report.time, report.court, nextHome, nextAway].join("|"),
      home: nextHome,
      away: nextAway,
      reportingTeam: nextReportingTeam,
      approvalOfReportId: nextApprovalOfReportId,
      technicalFouls: (Array.isArray(report?.technicalFouls) ? report.technicalFouls : []).map((entry) => ({
        ...entry,
        team: renameMap?.[entry?.team] || entry?.team || "",
      })),
    });
  });

  const officialByGame = new Map();
  for (const report of updatedReports) {
    if (report?.verifiedFinal && report?.gameId) {
      officialByGame.set(report.gameId, {
        verifiedAt: report.verifiedAt,
        officialHomeScore: report.officialHomeScore,
        officialAwayScore: report.officialAwayScore,
        verificationReason: report.verificationReason,
      });
    }
  }

  return updatedReports.map((report) => {
    const official = officialByGame.get(report.gameId);
    if (!official) return report;
    return {
      ...report,
      verifiedFinal: true,
      verifiedAt: official.verifiedAt,
      officialHomeScore: official.officialHomeScore,
      officialAwayScore: official.officialAwayScore,
      verificationReason: official.verificationReason,
    };
  });
}

function remapCoachConflicts(conflicts, renameMap) {
  return (Array.isArray(conflicts) ? conflicts : []).map((entry) => ({
    ...entry,
    teamA: renameMap?.[entry?.teamA] || entry?.teamA || "",
    teamB: renameMap?.[entry?.teamB] || entry?.teamB || "",
  }));
}

function applyCoachDirectoryToConfig(config, coachDirectory) {
  const normalizedConfig = normalizeConfig(config);
  const directory = coachDirectory && typeof coachDirectory === "object" ? coachDirectory : {};
  return {
    ...normalizedConfig,
    divisionTeamDetails: Object.fromEntries(
      DIVISIONS.map((division) => {
        const count = Number(normalizedConfig?.divisions?.[division] || 0);
        const details = syncDivisionTeamDetails(normalizedConfig?.divisionTeamDetails?.[division], count).map((entry, idx) => {
          const teamName = buildFormattedTeamName(division, entry, idx + 1, count);
          const info = normalizeCoachInfoEntry(directory?.[teamName]);
          return {
            ...entry,
            coachEmail: info.coachEmail || String(entry?.coachEmail || "").trim().toLowerCase(),
            coachLastName: info.coachLastName || sanitizeCoachLastName(entry?.coachLastName || ""),
          };
        });
        return [division, details];
      })
    ),
  };
}

function getCoachInfoForTeamFromDirectory(coachDirectory, config, teamName, divisionHint = "") {
  const direct = normalizeCoachInfoEntry(coachDirectory?.[teamName]);
  if (direct.coachEmail || direct.coachLastName) return direct;

  const detail = getTeamDetailByFormattedName(config, teamName, divisionHint);
  const formattedName = detail?.formattedName || "";
  const byFormattedName = normalizeCoachInfoEntry(coachDirectory?.[formattedName]);
  if (byFormattedName.coachEmail || byFormattedName.coachLastName) return byFormattedName;

  return {
    coachEmail: getCoachEmailForTeam(config, teamName, divisionHint),
    coachLastName: sanitizeCoachLastName(detail?.entry?.coachLastName || ""),
  };
}

function getCoachEmailForTeamFromDirectory(coachDirectory, config, teamName, divisionHint = "") {
  return getCoachInfoForTeamFromDirectory(coachDirectory, config, teamName, divisionHint).coachEmail;
}

function getPublishedCoachDirectory(published, fallbackConfig) {
  const fromPublished = published?.coachDirectory && typeof published.coachDirectory === "object"
    ? published.coachDirectory
    : null;
  if (fromPublished && Object.keys(fromPublished).length) {
    return fromPublished;
  }
  return buildCoachDirectoryFromConfig(normalizeConfig(published?.config || fallbackConfig));
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
  const imbalance = Math.abs(projectedMorning - projectedAfternoon);
  const maxAllowedBias = Math.ceil(targetGames * 0.62);
  const hardBiasPenalty = Math.max(0, Math.max(projectedMorning, projectedAfternoon) - maxAllowedBias) * 140;
  return (
    imbalance * 40 +
    Math.abs(projectedMorning - idealMorning) * 34 +
    Math.abs(projectedAfternoon - idealAfternoon) * 34 +
    hardBiasPenalty
  );
}

function fairnessScore(team) {
  const morningGames = team.morningGames || 0;
  const afternoonGames = team.afternoonGames || 0;
  return (
    (team.earlyGames || 0) * 3 +
    (team.maxSameTimeSlot || 0) * 12 +
    (hasHomeAwayIssue(team) ? 8 : 0) +
    Math.max(0, Math.abs((team.home || 0) - (team.away || 0)) - 3) * 1 +
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
      maxDoubleheadersPerTeam = (config.fifthBoysDoubleheaderDate ? 1 : 0) + (isOddDivision ? Math.max(1, Math.ceil(targetGames / 4)) : 0);
    } else {
      maxDoubleheadersPerTeam = isOddDivision ? Math.max(1, Math.ceil(targetGames / 4)) : 0;
    }

    for (let i = 0; i < count; i += 1) {
      const detail = details[i];
      teams.push({
        id: `${division}::${i + 1}`,
        name: buildFormattedTeamName(division, detail, i + 1, count),
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

function getMinimumHomeAwayGames(targetGames) {
  return Math.max(0, Math.min(3, Math.floor(Number(targetGames || 0) / 2)));
}

function getHomeAwayShortfall(team) {
  const minRequired = getMinimumHomeAwayGames(team?.targetGames || 0);
  return {
    minRequired,
    needHome: Math.max(0, minRequired - Number(team?.home || 0)),
    needAway: Math.max(0, minRequired - Number(team?.away || 0)),
  };
}

function hasHomeAwayIssue(team) {
  const { needHome, needAway } = getHomeAwayShortfall(team);
  return needHome > 0 || needAway > 0;
}

function getHomeAwayIssueLabel(team) {
  const { minRequired, needHome, needAway } = getHomeAwayShortfall(team);
  if (!needHome && !needAway) return null;
  return `Needs at least ${minRequired} home and ${minRequired} away`;
}

function chooseHomeTeam(teamA, teamB) {
  const aNeeds = getHomeAwayShortfall(teamA);
  const bNeeds = getHomeAwayShortfall(teamB);

  const scoreAHome = (aNeeds.needHome * 100) + (bNeeds.needAway * 100) - (aNeeds.needAway * 30) - (bNeeds.needHome * 30);
  const scoreBHome = (bNeeds.needHome * 100) + (aNeeds.needAway * 100) - (bNeeds.needAway * 30) - (aNeeds.needHome * 30);

  if (scoreAHome > scoreBHome) return teamA;
  if (scoreBHome > scoreAHome) return teamB;

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
  const baseDivision = String(division || '').split('::')[0];
  const count = Number(config.divisions[baseDivision] || config.divisions[division] || 0);
  const opponentsPerTeam = Math.max(0, count - 1);
  if (opponentsPerTeam === 0) return 0;
  return 2;
}

function violatesTimeVariety(team, slotTime) {
  const targetGames = team.targetGames || 0;
  const projectedCountAtTime = (team.gamesByTime?.[slotTime] || 0) + 1;
  const maxPerExactTime = targetGames <= 8 ? 2 : targetGames <= 10 ? 3 : 3;
  if (projectedCountAtTime > maxPerExactTime) return true;

  const projectedMorning = (team.morningGames || 0) + (isMorningTime(slotTime) ? 1 : 0);
  const projectedAfternoon = (team.afternoonGames || 0) + (isAfternoonTime(slotTime) ? 1 : 0);
  const maxMorning = Math.ceil(targetGames * 0.62);
  const maxAfternoon = Math.ceil(targetGames * 0.62);

  if (projectedMorning > maxMorning) return true;
  if (projectedAfternoon > maxAfternoon) return true;
  return false;
}

function canPairInSlot(teamA, teamB, slot, config, options = {}) {
  const { ignoreTimeVariety = false, ignoreRepeatLimit = false, ignoreEarlyCap = false, allTeams = [] } = options;

  if (teamA.id === teamB.id || teamA.division !== teamB.division || slot.used) return false;
  if ((teamA.gamesScheduled || 0) >= (teamA.targetGames || 0)) return false;
  if ((teamB.gamesScheduled || 0) >= (teamB.targetGames || 0)) return false;

  if (hasSimultaneousConflict(teamA.name, slot, allTeams, config, [teamB.name])) return false;
  if (hasSimultaneousConflict(teamB.name, slot, allTeams, config, [teamA.name])) return false;

  if (!ignoreRepeatLimit && !canAddPairUnderRepeatPolicy(teamA, teamB, config, 0, slot)) return false;

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
    const baseDivisionA = String(teamA.baseDivision || teamA.division || '').split('::')[0];
    const baseDivisionB = String(teamB.baseDivision || teamB.division || '').split('::')[0];
    if (baseDivisionA === "5th Boys") {
      const aHasDecemberDh = (teamA.gamesByDate[config.fifthBoysDoubleheaderDate] || 0) >= 2;
      const bHasDecemberDh = (teamB.gamesByDate[config.fifthBoysDoubleheaderDate] || 0) >= 2;
      const aWouldBeDh = aOnDate >= 1;
      const bWouldBeDh = bOnDate >= 1;

      if (slot.date !== config.fifthBoysDoubleheaderDate) {
        if (aWouldBeDh && !aHasDecemberDh && (teamA.maxDoubleheadersPerTeam || 0) <= 1) return false;
        if (bWouldBeDh && !bHasDecemberDh && (teamB.maxDoubleheadersPerTeam || 0) <= 1) return false;
      }
    }

    if (slot.date === config.fifthBoysDoubleheaderDate && baseDivisionA !== "5th Boys") {
      return false;
    }
  }

  if (!ignoreEarlyCap && isEarlyTime(slot.time)) {
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

function scheduleGame(schedule, slot, teamA, teamB, options = {}) {
  const preserveHomeAway = Boolean(options.preserveHomeAway);
  const locked = Boolean(options.locked);
  const tier = String(options.tier || teamA?.tierLabel || teamB?.tierLabel || '');
  const homeTeam = preserveHomeAway ? teamA : chooseHomeTeam(teamA, teamB);
  const awayTeam = homeTeam.id === teamA.id ? teamB : teamA;
  slot.used = true;
  applyGame(homeTeam, slot, awayTeam.name, true);
  applyGame(awayTeam, slot, homeTeam.name, false);
  schedule.push({
    division: homeTeam.baseDivision || homeTeam.division,
    tier,
    date: slot.date,
    time: slot.time,
    court: slot.court,
    home: homeTeam.name,
    away: awayTeam.name,
    locked,
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
  const reservedDhGamesPerTeam = division === '5th Boys' && config.fifthBoysDoubleheaderDate ? Math.min(2, Number(targetGames || 0)) : 0;
  const neededPerTeam = Object.fromEntries(
    divisionTeams.map((team) => [team.id, Math.max(0, Number(targetGames || 0) - reservedDhGamesPerTeam)])
  );
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

function compareSlotsAvoidingEarlyForTeams(teamA, teamB, config) {
  return (a, b) => {
    const earlyLimit = Number(config?.maxEarlyGames || 0);
    const aEarlyRisk = isEarlyTime(a.time)
      ? Math.max(0, (teamA?.earlyGames || 0) + 1 - earlyLimit) + Math.max(0, (teamB?.earlyGames || 0) + 1 - earlyLimit) + 1
      : 0;
    const bEarlyRisk = isEarlyTime(b.time)
      ? Math.max(0, (teamA?.earlyGames || 0) + 1 - earlyLimit) + Math.max(0, (teamB?.earlyGames || 0) + 1 - earlyLimit) + 1
      : 0;
    if (aEarlyRisk !== bEarlyRisk) return aEarlyRisk - bEarlyRisk;
    const aEarlyCount = (isEarlyTime(a.time) ? (teamA?.earlyGames || 0) + (teamB?.earlyGames || 0) : 0);
    const bEarlyCount = (isEarlyTime(b.time) ? (teamA?.earlyGames || 0) + (teamB?.earlyGames || 0) : 0);
    if (aEarlyCount !== bEarlyCount) return aEarlyCount - bEarlyCount;
    return compareSlotLike(a, b);
  };
}

function countDivisionGamesOnDate(schedule, division, date) {
  return (Array.isArray(schedule) ? schedule : []).filter((game) => game.division === division && game.date === date).length;
}
function countDivisionGamesOnPreseasonDate(schedule, division, date, config) {
  return (Array.isArray(schedule) ? schedule : []).filter((game) => game.division === division && game.date === date && isPreseasonDate(game.date, config)).length;
}


function getAmPmCorrectionScore(teamA, teamB, slot) {
  let score = 0;
  const aMorning = teamA.morningGames || 0;
  const aAfternoon = teamA.afternoonGames || 0;
  const bMorning = teamB.morningGames || 0;
  const bAfternoon = teamB.afternoonGames || 0;

  if (isMorningTime(slot.time)) {
    score += Math.max(0, aAfternoon - aMorning) * 220;
    score += Math.max(0, bAfternoon - bMorning) * 220;
    score -= Math.max(0, aMorning - aAfternoon) * 90;
    score -= Math.max(0, bMorning - bAfternoon) * 90;
  }

  if (isAfternoonTime(slot.time)) {
    score += Math.max(0, aMorning - aAfternoon) * 220;
    score += Math.max(0, bMorning - bAfternoon) * 220;
    score -= Math.max(0, aAfternoon - aMorning) * 90;
    score -= Math.max(0, bAfternoon - bMorning) * 90;
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

function seedEarlyPreseasonDatesFor5thBoys(teams, divisionPlans, openSlots, schedule, config) {
  const division = '5th Boys';
  const pendingPlan = divisionPlans[division] || [];
  if (!pendingPlan.length) return;

  const preseasonDates = getEnabledGameDates(config)
    .filter((date) => isPreseasonDate(date, config) && date !== config.fifthBoysDoubleheaderDate)
    .filter(Boolean);
  if (!preseasonDates.length) return;

  const divisionTeams = teams.filter((team) => team.division === division);
  if (!divisionTeams.length) return;

  const fullRoundGamesPerDate = Math.floor(divisionTeams.length / 2);
  const totalGamesRemaining = Math.floor(pendingPlan.length);
  const datesRemaining = preseasonDates.length;

  for (let dateIndex = 0; dateIndex < preseasonDates.length; dateIndex += 1) {
    const date = preseasonDates[dateIndex];
    const freeSlots = getFreeSlotsForDate(openSlots, date);
    if (!freeSlots.length) continue;

    const gamesLeftIncludingToday = Math.max(0, pendingPlan.length);
    const datesLeftIncludingToday = Math.max(1, preseasonDates.length - dateIndex);
    const minimumNeededToday = Math.ceil(gamesLeftIncludingToday / datesLeftIncludingToday);
    const desiredGamesToday = Math.min(fullRoundGamesPerDate, minimumNeededToday);

    let placedOnDate = countDivisionGamesOnDate(schedule, division, date);
    for (const slot of freeSlots) {
      if (placedOnDate >= desiredGamesToday) break;
      const chosen = choosePlannedMatchupForSlot(divisionTeams, pendingPlan, slot, config, teams, {
        ignoreTimeVariety: true,
        ignoreEarlyCap: true,
        currentSchedule: schedule,
      });
      if (!chosen) continue;
      scheduleGame(schedule, slot, chosen.teamA, chosen.teamB);
      pendingPlan.splice(chosen.index, 1);
      placedOnDate += 1;
    }
  }
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
        } else if (isPreseasonDate(slot.date, config)) {
          const preseasonDates = getEnabledGameDates(config).filter((date) => isPreseasonDate(date, config) && date !== config.fifthBoysDoubleheaderDate);
          const gamesAlreadyOnThisDate = countDivisionGamesOnPreseasonDate(currentSchedule, '5th Boys', slot.date, config);
          const preseasonCounts = preseasonDates.map((date) => countDivisionGamesOnPreseasonDate(currentSchedule, '5th Boys', date, config));
          const minPreseasonCount = preseasonCounts.length ? Math.min(...preseasonCounts) : 0;
          penalty += gamesAlreadyOnThisDate * 700;
          if (gamesAlreadyOnThisDate === minPreseasonCount) penalty -= 1400;
          if (gamesAlreadyOnThisDate > minPreseasonCount) penalty += (gamesAlreadyOnThisDate - minPreseasonCount) * 900;
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
  if (schedule.some((game) => game.date === config.fifthBoysDoubleheaderDate)) return;

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
    const slot = slots
      .filter((candidate) => !candidate.used)
      .sort(compareSlotsAvoidingEarlyForTeams(pairing?.[0], pairing?.[1], config))
      .find((candidate) => canPairInSlot(pairing?.[0], pairing?.[1], candidate, config, {
        ignoreTimeVariety: true,
        ignoreEarlyCap: false,
        allTeams: teams,
      })) || slots.find((candidate) => !candidate.used);
    if (!pairing || !slot) break;
    scheduleGame(schedule, slot, pairing[0], pairing[1], { locked: true });
  }
}

function scheduleFifthBoysPreseasonRoundRobinDates(teams, openSlots, schedule, unscheduled, config) {
  if (!config.fifthBoysDoubleheaderDate) return;
  const teamList = teams.filter((team) => team.division === "5th Boys");
  if (teamList.length < 2 || teamList.length % 2 === 1) return;

  const targetGames = Number(config.divisionGames?.["5th Boys"] || 0);
  const maxCurrentGames = Math.max(...teamList.map((team) => team.gamesScheduled || 0));
  const roundsNeeded = Math.max(0, targetGames - maxCurrentGames);
  if (!roundsNeeded) return;

  const dates = getEnabledGameDates(config)
    .filter((date) => isPreseasonDate(date, config) && date !== config.fifthBoysDoubleheaderDate)
    .sort((a, b) => parseShortDate(a) - parseShortDate(b));
  const rounds = buildRoundRobinRounds(teamList);
  const firstUnusedRoundIndex = 2;

  for (let i = 0; i < roundsNeeded; i += 1) {
    const date = dates[i];
    const pairings = rounds[firstUnusedRoundIndex + i] || [];
    if (!date || pairings.length < teamList.length / 2) {
      unscheduled.push({
        matchup: "5th Boys preseason",
        reason: "Not enough preseason Saturdays to give 5th Boys their required pre-split games.",
        suggestion: "Enable another November/December Saturday or reduce the 5th Boys game target.",
      });
      return;
    }

    const slots = getFreeSlotsForDate(openSlots, date);
    if (slots.length < pairings.length) {
      unscheduled.push({
        matchup: `5th Boys preseason ${date}`,
        reason: "Not enough open slots for a full 5th Boys round.",
        suggestion: "Enable more courts or time slots on this preseason date.",
      });
      return;
    }

    for (const pairing of pairings) {
      const [teamA, teamB] = pairing;
      const slot = slots
        .filter((candidate) => !candidate.used)
        .sort(compareSlotsAvoidingEarlyForTeams(teamA, teamB, config))
        .find((candidate) =>
        !candidate.used &&
        canPairInSlot(teamA, teamB, candidate, config, {
          ignoreTimeVariety: true,
          ignoreEarlyCap: false,
          allTeams: teams,
        })
      );
      if (!slot) {
        unscheduled.push({
          matchup: `${teamA?.name || "5th Boys"} vs ${teamB?.name || "5th Boys"}`,
          reason: `Could not place the planned 5th Boys preseason round on ${date}.`,
          suggestion: "Check locked games and court availability on that date.",
        });
        return;
      }
      scheduleGame(schedule, slot, teamA, teamB);
    }
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
          canAddPairUnderRepeatPolicy(team, other, config, 0, group.slots[0] || null)
      ).length;

      const remainingOptionsB = divisionTeams.filter(
        (other) =>
          other.id !== team.id &&
          canAddPairUnderRepeatPolicy(opponent, other, config, 0, group.slots[0] || null)
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
          best = { teamA: team, teamB: opponent, slot, score, emergencyMode, repeatCount };
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

function countUnusedOpponentsForTeam(team, divisionTeams) {
  return divisionTeams.filter((other) => other.id !== team.id && (team.opponents?.[other.name] || 0) === 0).length;
}

function hasAnyLegalNonRepeatCandidate(team, allTeams, slotGroups, config, cache = null, options = {}) {
  const { ignoreEarlyCap = false } = options;
  const cacheKey = `${team.id}__${slotGroups.length}__${ignoreEarlyCap ? 'relaxed' : 'strict'}`;
  if (cache && Object.prototype.hasOwnProperty.call(cache, cacheKey)) return cache[cacheKey];

  const divisionTeams = allTeams.filter((candidate) => candidate.division === team.division && candidate.id !== team.id);
  let found = false;

  for (const group of slotGroups) {
    for (const slot of group.slots) {
      if (slot.used) continue;
      if (!canStillUseTeamOnDate(team, slot, config, { ignoreEarlyCap })) continue;
      for (const opponent of divisionTeams) {
        if ((team.opponents?.[opponent.name] || 0) > 0) continue;
        if (!canStillUseTeamOnDate(opponent, slot, config, { ignoreEarlyCap })) continue;
        if (!canPairInSlot(team, opponent, slot, config, { ignoreTimeVariety: true, ignoreRepeatLimit: false, ignoreEarlyCap, allTeams })) continue;
        found = true;
        break;
      }
      if (found) break;
    }
    if (found) break;
  }

  if (cache) cache[cacheKey] = found;
  return found;
}

function findBestDivisionCompletionCandidate(division, teams, slotGroups, config, currentSchedule = []) {
  const needyTeams = getDivisionTeamsNeedingGames(teams, division);
  let bestNonRepeat = null;
  let bestNonRepeatScore = -Infinity;
  let bestEmergency = null;
  let bestEmergencyScore = -Infinity;
  let bestDesperation = null;
  let bestDesperationScore = -Infinity;

  for (const team of needyTeams) {
    const nonRepeatCandidate = chooseCompletionFirstCandidate(team, teams, slotGroups, config, { emergencyMode: false, currentSchedule });
    if (nonRepeatCandidate && typeof nonRepeatCandidate.score === 'number' && nonRepeatCandidate.score > bestNonRepeatScore) {
      bestNonRepeatScore = nonRepeatCandidate.score;
      bestNonRepeat = nonRepeatCandidate;
    }
  }

  if (bestNonRepeat) return bestNonRepeat;

  for (const team of needyTeams) {
    const emergencyCandidate = chooseCompletionFirstCandidate(team, teams, slotGroups, config, { emergencyMode: true, currentSchedule });
    if (emergencyCandidate && typeof emergencyCandidate.score === 'number' && emergencyCandidate.score > bestEmergencyScore) {
      bestEmergencyScore = emergencyCandidate.score;
      bestEmergency = emergencyCandidate;
    }
  }

  if (bestEmergency) return bestEmergency;

  for (const team of needyTeams) {
    const desperationCandidate = chooseCompletionFirstCandidate(team, teams, slotGroups, config, {
      emergencyMode: true,
      ignoreEarlyCap: true,
      currentSchedule,
    });
    if (desperationCandidate && typeof desperationCandidate.score === 'number' && desperationCandidate.score > bestDesperationScore) {
      bestDesperationScore = desperationCandidate.score;
      bestDesperation = desperationCandidate;
    }
  }

  return bestDesperation;
}

function canStillUseTeamOnDate(team, slot, config, options = {}) {
  const { ignoreEarlyCap = false } = options;
  const onDate = team.gamesByDate?.[slot.date] || 0;
  if (onDate >= 2) return false;

  if (onDate >= 1) {
    if ((team.doubleHeaders || 0) >= (team.maxDoubleheadersPerTeam || 0)) return false;
    const existing = getScheduledGamesOnDate(team, slot.date)[0];
    if (!existing) return false;
    if (!areBackToBackTimes(existing.time, slot.time)) return false;
    if (existing.court !== slot.court) return false;
  }

  if (!ignoreEarlyCap && isEarlyTime(slot.time) && (team.earlyGames || 0) >= Number(config.maxEarlyGames)) {
    return false;
  }

  return true;
}

function countRepeatedOpponentPartners(team) {
  return Object.values(team?.opponents || {}).filter((count) => count > 1).length;
}

function chooseCompletionFirstCandidate(team, allTeams, slotGroups, config, options = {}) {
  const { emergencyMode = false, ignoreEarlyCap = false, currentSchedule = [], nonRepeatAvailabilityCache = null } = options;

  const divisionTeams = allTeams.filter(
    (candidate) => candidate.division === team.division && candidate.id !== team.id
  );
  const teamUnusedOpponentsBase = countUnusedOpponentsForTeam(team, [team, ...divisionTeams]);
  const teamHasAnyNonRepeatBase = hasAnyLegalNonRepeatCandidate(team, allTeams, slotGroups, config, nonRepeatAvailabilityCache, { ignoreEarlyCap });

  let best = null;
  let bestScore = -Infinity;

  for (const group of slotGroups) {
    for (const slot of group.slots) {
      if (slot.used) continue;
      if (!canStillUseTeamOnDate(team, slot, config, { ignoreEarlyCap })) continue;

      for (const opponent of divisionTeams) {
        if (!canStillUseTeamOnDate(opponent, slot, config, { ignoreEarlyCap })) continue;
        if (!canPairInSlot(team, opponent, slot, config, { ignoreTimeVariety: true, ignoreRepeatLimit: false, ignoreEarlyCap, allTeams })) continue;

        const teamNeed = getNeed(team);
        const oppNeed = getNeed(opponent);
        const repeatCount = team.opponents?.[opponent.name] || 0;
        const slotDateDeficit = getDateMinimumDeficit(currentSchedule, slot.date, config);
        const teamRepeatedPartners = countRepeatedOpponentPartners(team);
        const opponentRepeatedPartners = countRepeatedOpponentPartners(opponent);
        const createsNewRepeatPair = repeatCount > 0 && !hadPreseasonMeetingBetween(team, opponent, config);
        const divisionPool = [team, ...divisionTeams];
        const teamUnusedOpponents = teamUnusedOpponentsBase;
        const opponentUnusedOpponents = countUnusedOpponentsForTeam(opponent, divisionPool);
        const teamHasAnyNonRepeat = teamHasAnyNonRepeatBase;
        const opponentHasAnyNonRepeat = hasAnyLegalNonRepeatCandidate(opponent, allTeams, slotGroups, config, nonRepeatAvailabilityCache, { ignoreEarlyCap });

        let score = 0;
        score += teamNeed * 1400;
        score += oppNeed * (emergencyMode ? 250 : 700);
        score += slotDateDeficit * 3600;

        if (oppNeed > 0) score += 450;
        else score += emergencyMode ? 150 : -120;

        if (repeatCount === 0) {
          score += emergencyMode ? 2200 : 700;
        } else {
          score -= repeatCount * (emergencyMode ? 900 : 1400);
        }

        if (createsNewRepeatPair) {
          score -= emergencyMode ? 9000 : 18000;
        }

        if (repeatCount > 0) {
          score -= teamUnusedOpponents * (emergencyMode ? 2200 : 4000);
          score -= opponentUnusedOpponents * (emergencyMode ? 2200 : 4000);
          if (teamHasAnyNonRepeat) score -= emergencyMode ? 12000 : 22000;
          if (opponentHasAnyNonRepeat) score -= emergencyMode ? 12000 : 22000;
        }

        score -= teamRepeatedPartners * (emergencyMode ? 1200 : 1800);
        score -= opponentRepeatedPartners * (emergencyMode ? 1200 : 1800);

        const teamHomeAway = getHomeAwayShortfall(team);
        const opponentHomeAway = getHomeAwayShortfall(opponent);
        score += (teamHomeAway.needHome + teamHomeAway.needAway + opponentHomeAway.needHome + opponentHomeAway.needAway) * 260;
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
          best = { teamA: team, teamB: opponent, slot, score, emergencyMode, repeatCount };
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
      const candidate = findBestDivisionCompletionCandidate(division, teams, slotGroups, config, schedule);

      if (candidate) {
        scheduleGame(schedule, candidate.slot, candidate.teamA, candidate.teamB);
        continue;
      }

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
    (result.auditSummary?.repeatedOpponentIssues || 0) * 70000 +
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
  if (gameA.locked || gameB.locked) return 'Locked games cannot be moved.';

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
    .filter((game) => !game.locked && (game.home === team.name || game.away === team.name))
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
          .filter((gameB) => gameB !== gameA && !gameB.locked)
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


function getLockedGamesFromSchedule(schedule) {
  return (schedule || []).filter((game) => game && game.locked);
}

function applyLockedGames(schedule, teams, openSlots, config, lockedGames, unscheduled, options = {}) {
  if (!Array.isArray(lockedGames) || lockedGames.length === 0) return;
  const { skipValidation = false } = options || {};
  const teamMap = Object.fromEntries(teams.map((team) => [team.name, team]));

  for (const lockedGame of lockedGames) {
    const homeTeam = teamMap[lockedGame.home];
    const awayTeam = teamMap[lockedGame.away];
    const slot = openSlots.find(
      (entry) => !entry.used && entry.date === lockedGame.date && entry.time === lockedGame.time && entry.court === lockedGame.court
    );

    if (!homeTeam || !awayTeam || !slot) {
      unscheduled.push({
        matchup: `${lockedGame.away} @ ${lockedGame.home}`,
        reason: 'Locked game could not be preserved in its saved slot.',
        suggestion: 'Unlock or move this game, then regenerate.',
      });
      continue;
    }

    if (!skipValidation && !canPairInSlot(homeTeam, awayTeam, slot, config, { ignoreTimeVariety: true, ignoreRepeatLimit: true, allTeams: teams })) {
      unscheduled.push({
        matchup: `${lockedGame.away} @ ${lockedGame.home}`,
        reason: 'Locked game conflicts with the current setup or other locked games.',
        suggestion: 'Unlock or move this game, then regenerate.',
      });
      continue;
    }

    scheduleGame(schedule, slot, homeTeam, awayTeam, {
      locked: true,
      preserveHomeAway: true,
      tier: lockedGame.tier || '',
      id: lockedGame.id,
    });
  }
}

function sortScheduleGames(schedule) {
  return [...schedule].sort((a, b) => {
    const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
    if (dateDiff !== 0) return dateDiff;
    const timeDiff = getTimeIndex(a.time) - getTimeIndex(b.time);
    if (timeDiff !== 0) return timeDiff;
    return a.court.localeCompare(b.court);
  });
}

function generateScheduleEngine(config, lockedGames = []) {
  const teams = buildTeams(config);
  const openSlots = buildOpenSlots(config);
  const schedule = [];
  const unscheduled = [];
  const repeatTrace = [];
  const pushRepeatTrace = (label, sourceSchedule = schedule) => {
    repeatTrace.push(buildRepeatTraceEntry(label, sourceSchedule, config));
  };

  pushRepeatTrace('Start');
  applyLockedGames(schedule, teams, openSlots, config, lockedGames, unscheduled);
  pushRepeatTrace('After locked games');
  scheduleFifthBoysDoubleheaderDay(teams, openSlots, schedule, unscheduled, config);
  scheduleFifthBoysPreseasonRoundRobinDates(teams, openSlots, schedule, unscheduled, config);
  pushRepeatTrace('After 5th Boys doubleheader day');

  const divisionPlans = {};
  for (const division of DIVISIONS) {
    const divisionTeams = teams.filter((team) => team.division === division);
    const targetGames = Number(config.divisionGames[division] || 0);
    divisionPlans[division] = divisionTeams.every((team) => getNeed(team) <= 0)
      ? []
      : buildDivisionMatchPlan(divisionTeams, targetGames, config, division);
  }

  seedEarlyPreseasonDatesFor5thBoys(teams, divisionPlans, openSlots, schedule, config);
  placePlannedGamesByDate(teams, divisionPlans, openSlots, schedule, unscheduled, config);
  pushRepeatTrace('After planned games by date');

  for (const division of DIVISIONS) {
    const leftovers = divisionPlans[division] || [];
    if (!leftovers.length) continue;
    const divisionTeams = teams.filter((team) => team.division === division);
    placePlannedDivisionGames(teams, divisionTeams, leftovers, openSlots, schedule, unscheduled, config);
    divisionPlans[division] = [];
  }

  pushRepeatTrace('After planned division leftovers');
  forceScheduleRemainingGames(teams, openSlots, schedule, unscheduled, config);
  completeShortPreseasonGamesByDivision(teams, openSlots, schedule, config);
  completeShortFifthBoysPreseasonGames(teams, openSlots, schedule, config);
  rebalanceShortPreseasonTeamsByReplacingGames(teams, schedule, config);
  pushRepeatTrace('After completion fallback');

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

  pushRepeatTrace('Before repeat repair', improvedSchedule);
  improvedSchedule = rebuildAvoidableRepeatDivisions(improvedSchedule, config);
  pushRepeatTrace('After avoidable-repeat rebuild', improvedSchedule);
  improvedSchedule = tryReduceRepeatedOpponents(improvedSchedule, config);
  pushRepeatTrace('After repeat-opponent repair', improvedSchedule);
  improvedSchedule = sortScheduleGames(improvedSchedule);
  pushRepeatTrace('Final schedule', improvedSchedule);

  const finalTeamMap = makeTeamMapFromSchedule(improvedSchedule, config);
  const finalTeams = Object.values(finalTeamMap);
  const repeatedOpponentData = getRepeatedOpponentViolations(improvedSchedule, config);

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
      getHomeAwayIssueLabel(team),
      team.doubleHeaders > (team.maxDoubleheadersPerTeam || 0) ? 'Too many doubleheaders' : null,
      team.maxSameTimeSlot > (team.targetGames <= 8 ? 2 : 3) ? 'Time slot concentration' : null,
      Math.max(team.morningGames || 0, team.afternoonGames || 0) > Math.ceil(team.targetGames * 0.62)
        ? 'Poor AM/PM balance'
        : null,
      repeatedOpponentData.teamViolationCounts[team.name] ? 'Repeated opponent' : null,
    ].filter(Boolean),
  }));

  const weeklyMinimumViolations = getWeeklyMinimumViolations(improvedSchedule, config);
  const weeklyMinimumDeficit = weeklyMinimumViolations.reduce((sum, entry) => sum + (entry.deficit || 0), 0);

  const auditSummary = {
    totalGames: improvedSchedule.length,
    totalTeams: teams.length,
    allTeamsScheduled: auditRows.every((row) => row.games === row.target),
    earlyViolations: auditRows.filter((row) => row.early > Number(config.maxEarlyGames)).length,
    homeAwayIssues: finalTeams.filter((team) => hasHomeAwayIssue(team)).length,
    missingTeams: auditRows.filter((row) => row.games !== row.target).length,
    timeVarietyIssues: auditRows.filter((row) => row.maxSameTime > (row.target <= 8 ? 2 : 3)).length,
    weeklyMinimumIssues: weeklyMinimumViolations.length,
    weeklyMinimumDeficit,
    repeatedOpponentIssues: repeatedOpponentData.pairViolations.length,
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

  return { schedule: improvedSchedule, auditRows, auditSummary, unscheduled, repeatTrace: annotateRepeatTrace(repeatTrace), divisionRepeatMath: buildDivisionRepeatMath(config) };
}




function buildDivisionUniqueMatchPlan(divisionTeams, targetGames, config, division) {
  const rounds = buildRoundRobinRounds(divisionTeams);
  if (!rounds.length) return [];

  const maxUniqueRounds = Math.min(rounds.length, Number(targetGames || 0));
  const plan = [];

  const pushRound = (roundIndex) => {
    for (const [a, b] of rounds[roundIndex] || []) {
      if (!a || !b) continue;
      plan.push({
        teamAId: a.id,
        teamBId: b.id,
        division,
        roundIndex,
        repeatIndex: 1,
      });
    }
  };

  if (division === "5th Boys" && config.fifthBoysDoubleheaderDate) {
    let usedRounds = 0;
    for (let r = 0; r < Math.min(2, maxUniqueRounds); r += 1) {
      pushRound(r);
      usedRounds += 1;
    }
    for (let r = 2; usedRounds < maxUniqueRounds && r < rounds.length; r += 1) {
      pushRound(r);
      usedRounds += 1;
    }
  } else {
    for (let r = 0; r < maxUniqueRounds; r += 1) {
      pushRound(r);
    }
  }

  return plan;
}


function rebuildAvoidableRepeatDivisions(schedule, config) {
  let working = sortScheduleGames((Array.isArray(schedule) ? schedule : []).map((game) => ({ ...game })));
  const baseTeams = buildTeams(config);
  const targetByDivision = Object.fromEntries(DIVISIONS.map((division) => [division, Number(config.divisionGames[division] || 0)]));
  const countByDivision = Object.fromEntries(DIVISIONS.map((division) => [division, Number(config.divisions[division] || 0)]));

  const getDivisionExtra = (games, division) => {
    return getRepeatedOpponentViolations(games, config).pairViolations
      .filter((row) => row.division === division)
      .reduce((sum, row) => sum + row.extraGames, 0);
  };

  const tryExactUniqueRoundRebuild = (games, division) => {
    const teamCount = countByDivision[division] || 0;
    const targetGames = targetByDivision[division] || 0;
    if (!teamCount || !targetGames) return null;
    if (teamCount % 2 !== 0) return null;
    if (targetGames > Math.max(0, teamCount - 1)) return null;

    const roundSize = teamCount / 2;
    const dhDate = division === "5th Boys" ? config.fifthBoysDoubleheaderDate : "";
    const divisionGames = games.filter((game) => game.division === division);
    if (!divisionGames.length) return null;
    if (divisionGames.some((game) => game.locked)) return null;

    const preservedDhGames = dhDate
      ? divisionGames.filter((game) => game.date === dhDate).map((game) => ({ ...game }))
      : [];

    const rebuildGames = dhDate
      ? divisionGames.filter((game) => game.date !== dhDate)
      : divisionGames.slice();

    if (!rebuildGames.length) return null;

    const gamesByDate = {};
    for (const game of rebuildGames) {
      if (!gamesByDate[game.date]) gamesByDate[game.date] = [];
      gamesByDate[game.date].push(game);
    }

    const orderedDates = Object.keys(gamesByDate).sort((a, b) => parseShortDate(a) - parseShortDate(b));
    const expectedRounds = targetGames - (dhDate ? 2 : 0);
    if (orderedDates.length !== expectedRounds) return null;
    if (!orderedDates.every((date) => gamesByDate[date].length === roundSize)) return null;
    if (dhDate && preservedDhGames.length !== roundSize * 2) return null;

    const candidateBaseSchedule = games
      .filter((game) => game.division !== division)
      .map((game) => ({ ...game }))
      .concat(preservedDhGames.map((game) => ({ ...game })));

    const candidateTeamMap = makeTeamMapFromSchedule(candidateBaseSchedule, config);
    const freshDivisionTeams = baseTeams
      .filter((team) => team.division === division)
      .map((team) => cloneTeamState(candidateTeamMap[team.name] || {
        ...team,
        gamesScheduled: 0,
        earlyGames: 0,
        home: 0,
        away: 0,
        doubleHeaders: 0,
        maxSameTimeSlot: 0,
        gamesByDate: {},
        gamesByTime: {},
        opponents: {},
        scheduledGames: [],
        morningGames: 0,
        afternoonGames: 0,
      }));

    const allTeams = Object.values(candidateTeamMap)
      .filter((team) => team.division !== division)
      .map((team) => cloneTeamState(team))
      .concat(freshDivisionTeams);

    const rounds = buildRoundRobinRounds(freshDivisionTeams);
    if (!rounds.length) return null;

    const startRound = dhDate ? 2 : 0;
    if (startRound + expectedRounds > rounds.length) return null;

    let candidateSchedule = candidateBaseSchedule.map((game) => ({ ...game }));

    for (let i = 0; i < orderedDates.length; i += 1) {
      const date = orderedDates[i];
      const slots = gamesByDate[date]
        .map((game) => ({
          key: `${game.date}|${game.time}|${game.court}`,
          date: game.date,
          time: game.time,
          court: game.court,
          used: false,
        }))
        .sort((a, b) => compareSlotLike(a, b));

      const pairings = rounds[startRound + i] || [];
      if (pairings.length !== roundSize || slots.length !== roundSize) return null;

      for (let j = 0; j < roundSize; j += 1) {
        const pairing = pairings[j];
        const slot = slots[j];
        if (!pairing || !slot) return null;
        if (!canPairInSlot(pairing[0], pairing[1], slot, config, { ignoreTimeVariety: true, ignoreRepeatLimit: false, allTeams })) {
          return null;
        }
        scheduleGame(candidateSchedule, slot, pairing[0], pairing[1]);
      }
    }

    return sortScheduleGames(candidateSchedule);
  };

  for (const division of DIVISIONS) {
    const teamCount = countByDivision[division] || 0;
    const targetGames = targetByDivision[division] || 0;
    if (!teamCount || !targetGames) continue;
    if (targetGames > Math.max(0, teamCount - 1)) continue;

    const originalExtra = getDivisionExtra(working, division);
    if (!originalExtra) continue;

    const exactRebuild = tryExactUniqueRoundRebuild(working, division);
    if (exactRebuild) {
      const baseResult = buildResultFromSchedule(working, config, []);
      const candidateResult = buildResultFromSchedule(exactRebuild, config, []);
      const candidateExtra = getDivisionExtra(exactRebuild, division);
      if (
        candidateExtra < originalExtra &&
        (candidateResult.auditSummary?.missingTeams || 0) <= (baseResult.auditSummary?.missingTeams || 0) &&
        (candidateResult.auditSummary?.earlyViolations || 0) <= (baseResult.auditSummary?.earlyViolations || 0) &&
        (candidateResult.auditSummary?.weeklyMinimumDeficit || 0) <= (baseResult.auditSummary?.weeklyMinimumDeficit || 0) &&
        (candidateResult.auditSummary?.middleGapCount || 0) <= (baseResult.auditSummary?.middleGapCount || 0)
      ) {
        working = exactRebuild;
        continue;
      }
    }

    const divisionGames = working.filter((game) => game.division === division);
    if (!divisionGames.length) continue;
    if (divisionGames.some((game) => game.locked)) continue;

    const candidateScheduleWithoutDivision = working
      .filter((game) => game.division !== division)
      .map((game) => ({ ...game }));

    const allTeamMap = makeTeamMapFromSchedule(candidateScheduleWithoutDivision, config);
    const freshDivisionTeams = baseTeams
      .filter((team) => team.division === division)
      .map((team) => cloneTeamState({
        ...team,
        gamesScheduled: 0,
        earlyGames: 0,
        home: 0,
        away: 0,
        doubleHeaders: 0,
        maxSameTimeSlot: 0,
        gamesByDate: {},
        gamesByTime: {},
        opponents: {},
        scheduledGames: [],
        morningGames: 0,
        afternoonGames: 0,
      }));

    const otherTeams = Object.values(allTeamMap).map((team) => cloneTeamState(team));
    const allTeams = [...otherTeams, ...freshDivisionTeams];

    let pendingPlan = buildDivisionUniqueMatchPlan(freshDivisionTeams, targetGames, config, division);
    if (!pendingPlan.length) continue;

    const slotObjects = divisionGames
      .map((game) => ({
        key: `${game.date}|${game.time}|${game.court}`,
        date: game.date,
        time: game.time,
        court: game.court,
        used: false,
      }))
      .sort((a, b) => {
        if (division === "5th Boys" && config.fifthBoysDoubleheaderDate) {
          const aDh = a.date === config.fifthBoysDoubleheaderDate ? 0 : 1;
          const bDh = b.date === config.fifthBoysDoubleheaderDate ? 0 : 1;
          if (aDh !== bDh) return aDh - bDh;
        }
        return compareSlotLike(a, b);
      });

    let candidateSchedule = candidateScheduleWithoutDivision.map((game) => ({ ...game }));
    let failed = false;

    for (const slot of slotObjects) {
      let slotPlan = pendingPlan;
      if (division === "5th Boys" && config.fifthBoysDoubleheaderDate) {
        if (slot.date === config.fifthBoysDoubleheaderDate) {
          slotPlan = pendingPlan.filter((item) => item.roundIndex < 2);
        } else {
          slotPlan = pendingPlan.filter((item) => item.roundIndex >= 2);
        }
      }
      if (!slotPlan.length) {
        failed = true;
        break;
      }

      let chosen = choosePlannedMatchupForSlot(freshDivisionTeams, slotPlan, slot, config, allTeams, {
        ignoreTimeVariety: false,
        currentSchedule: candidateSchedule,
      });
      if (!chosen) {
        chosen = choosePlannedMatchupForSlot(freshDivisionTeams, slotPlan, slot, config, allTeams, {
          ignoreTimeVariety: true,
          currentSchedule: candidateSchedule,
        });
      }
      if (!chosen) {
        failed = true;
        break;
      }

      scheduleGame(candidateSchedule, slot, chosen.teamA, chosen.teamB);
      const planIndex = pendingPlan.indexOf(chosen.item);
      if (planIndex >= 0) pendingPlan.splice(planIndex, 1);
    }

    if (failed || pendingPlan.length) continue;

    const baseResult = buildResultFromSchedule(working, config, []);
    const candidateResult = buildResultFromSchedule(candidateSchedule, config, []);
    const candidateExtra = getDivisionExtra(candidateSchedule, division);
    if (candidateExtra >= originalExtra) continue;
    if ((candidateResult.auditSummary?.missingTeams || 0) > (baseResult.auditSummary?.missingTeams || 0)) continue;
    if ((candidateResult.auditSummary?.earlyViolations || 0) > (baseResult.auditSummary?.earlyViolations || 0)) continue;
    if ((candidateResult.auditSummary?.weeklyMinimumDeficit || 0) > (baseResult.auditSummary?.weeklyMinimumDeficit || 0)) continue;
    if ((candidateResult.auditSummary?.middleGapCount || 0) > (baseResult.auditSummary?.middleGapCount || 0)) continue;

    working = candidateSchedule;
  }

  return sortScheduleGames(working);
}
function getRepeatedOpponentViolations(schedule, config) {
  const pairCounts = {};
  const preseasonPairCounts = {};
  for (const game of Array.isArray(schedule) ? schedule : []) {
    if (!game?.division || !game?.home || !game?.away) continue;
    const teams = [game.home, game.away].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const key = `${game.division}||${teams[0]}||${teams[1]}`;
    pairCounts[key] = (pairCounts[key] || 0) + 1;
    if (isPreseasonDate(game.date, config)) {
      preseasonPairCounts[key] = (preseasonPairCounts[key] || 0) + 1;
    }
  }

  const pairViolations = [];
  const teamViolationCounts = {};

  for (const [key, count] of Object.entries(pairCounts)) {
    const [division, teamA, teamB] = key.split("||");
    const allowed = getAllowedRepeatLimit(config, division);
    const preseasonCount = preseasonPairCounts[key] || 0;
    const violatesRepeatCap = count > allowed;
    const violatesPreseasonRepeatRule = count > 1 && preseasonCount <= 0;
    if (!violatesRepeatCap && !violatesPreseasonRepeatRule) continue;
    pairViolations.push({
      division,
      teamA,
      teamB,
      count,
      allowed: violatesPreseasonRepeatRule ? 1 : allowed,
      preseasonCount,
      reason: violatesPreseasonRepeatRule ? 'Repeat opponent did not meet in preseason' : 'Repeat cap exceeded',
      extraGames: violatesPreseasonRepeatRule ? count - 1 : count - allowed,
    });
    teamViolationCounts[teamA] = (teamViolationCounts[teamA] || 0) + 1;
    teamViolationCounts[teamB] = (teamViolationCounts[teamB] || 0) + 1;
  }

  pairViolations.sort((a, b) => {
    if (b.extraGames !== a.extraGames) return b.extraGames - a.extraGames;
    if (a.division !== b.division) return a.division.localeCompare(b.division);
    if (a.teamA !== b.teamA) return a.teamA.localeCompare(b.teamA, undefined, { numeric: true });
    return a.teamB.localeCompare(b.teamB, undefined, { numeric: true });
  });

  return { pairViolations, teamViolationCounts };
}

function tryReduceRepeatedOpponents(schedule, config) {
  let working = sortScheduleGames((Array.isArray(schedule) ? schedule : []).map((game) => ({ ...game })));
  let currentData = getRepeatedOpponentViolations(working, config);
  let currentExtra = currentData.pairViolations.reduce((sum, row) => sum + row.extraGames, 0);
  if (!currentExtra) return working;
  const doubleheaderAllowanceMap = Object.fromEntries(buildTeams(config).map((team) => [team.name, team.maxDoubleheadersPerTeam || 0]));

  const pairKeyForTeams = (division, teamA, teamB) => {
    const teams = [teamA, teamB].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return `${division}||${teams[0]}||${teams[1]}`;
  };

  const pairKeyForGame = (game) => pairKeyForTeams(game.division, game.home, game.away);

  const evaluateCandidate = (candidate) => {
    const result = buildResultFromSchedule(candidate, config, []);
    const data = getRepeatedOpponentViolations(result.schedule, config);
    const doubleheaderIssues = (result.auditRows || []).filter((row) => row.dh > 0 && row.issues?.includes('Too many doubleheaders')).length;
    const doubleheaderExcess = (result.auditRows || []).reduce((sum, row) => {
      const built = buildTeams(config).find((team) => team.name === row.team);
      const allowed = built?.maxDoubleheadersPerTeam || 0;
      return sum + Math.max(0, (row.dh || 0) - allowed);
    }, 0);
    return {
      schedule: sortScheduleGames(result.schedule.map((game) => ({ ...game }))),
      extra: data.pairViolations.reduce((sum, row) => sum + row.extraGames, 0),
      repeatedIssues: data.pairViolations.length,
      missingTeams: result.auditSummary?.missingTeams || 0,
      earlyViolations: result.auditSummary?.earlyViolations || 0,
      weeklyMinimumDeficit: result.auditSummary?.weeklyMinimumDeficit || 0,
      middleGapCount: result.auditSummary?.middleGapCount || 0,
      homeAwayIssues: result.auditSummary?.homeAwayIssues || 0,
      doubleheaderIssues,
      doubleheaderExcess,
    };
  };

  const isBetter = (candidateMetrics, currentMetrics) => {
    if (candidateMetrics.missingTeams > currentMetrics.missingTeams) return false;
    if (candidateMetrics.earlyViolations > currentMetrics.earlyViolations) return false;
    if (candidateMetrics.weeklyMinimumDeficit > currentMetrics.weeklyMinimumDeficit) return false;
    if (candidateMetrics.doubleheaderIssues > currentMetrics.doubleheaderIssues) return false;
    if (candidateMetrics.doubleheaderExcess > currentMetrics.doubleheaderExcess) return false;
    if (candidateMetrics.extra < currentMetrics.extra) return true;
    if (candidateMetrics.extra > currentMetrics.extra) return false;
    if (candidateMetrics.repeatedIssues < currentMetrics.repeatedIssues) return true;
    if (candidateMetrics.repeatedIssues > currentMetrics.repeatedIssues) return false;
    if (candidateMetrics.doubleheaderIssues < currentMetrics.doubleheaderIssues) return true;
    if (candidateMetrics.doubleheaderIssues > currentMetrics.doubleheaderIssues) return false;
    if (candidateMetrics.doubleheaderExcess < currentMetrics.doubleheaderExcess) return true;
    if (candidateMetrics.doubleheaderExcess > currentMetrics.doubleheaderExcess) return false;
    if (candidateMetrics.middleGapCount < currentMetrics.middleGapCount) return true;
    if (candidateMetrics.middleGapCount > currentMetrics.middleGapCount) return false;
    if (candidateMetrics.homeAwayIssues < currentMetrics.homeAwayIssues) return true;
    return false;
  };

  let currentMetrics = evaluateCandidate(working);

  for (let pass = 0; pass < 60; pass += 1) {
    let bestMetrics = currentMetrics;
    let bestSchedule = null;
    const violations = getRepeatedOpponentViolations(working, config).pairViolations;
    if (!violations.length) break;

    for (const violation of violations) {
      const repeatedGames = working
        .map((game, index) => ({ game, index }))
        .filter(({ game }) => pairKeyForGame(game) === `${violation.division}||${violation.teamA}||${violation.teamB}`)
        .sort((a, b) => compareSlotLike(a.game, b.game));

      for (const { index: repeatedIndex, game: repeatedGame } of repeatedGames.slice(violation.allowed)) {
        const candidatePool = working
          .map((game, index) => ({ game, index }))
          .filter(({ game, index }) => {
            if (index === repeatedIndex) return false;
            if (!game || game.division !== repeatedGame.division) return false;
            if (game.locked || repeatedGame.locked) return false;
            if ([repeatedGame.home, repeatedGame.away].includes(game.home) || [repeatedGame.home, repeatedGame.away].includes(game.away)) return false;
            return true;
          })
          .sort((a, b) => {
            const sameTimeA = a.game.date === repeatedGame.date && a.game.time === repeatedGame.time ? 0 : 1;
            const sameTimeB = b.game.date === repeatedGame.date && b.game.time === repeatedGame.time ? 0 : 1;
            if (sameTimeA !== sameTimeB) return sameTimeA - sameTimeB;
            const sameDateA = a.game.date === repeatedGame.date ? 0 : 1;
            const sameDateB = b.game.date === repeatedGame.date ? 0 : 1;
            if (sameDateA !== sameDateB) return sameDateA - sameDateB;
            return compareSlotLike(a.game, b.game);
          });

        for (const { index: otherIndex, game: otherGame } of candidatePool) {
          const combos = [
            [repeatedGame.home, otherGame.home, repeatedGame.away, otherGame.away],
            [repeatedGame.home, otherGame.away, repeatedGame.away, otherGame.home],
          ];

          for (const [g1h, g1a, g2h, g2a] of combos) {
            const newKey1 = pairKeyForTeams(repeatedGame.division, g1h, g1a);
            const newKey2 = pairKeyForTeams(otherGame.division, g2h, g2a);
            if (newKey1 === pairKeyForGame(repeatedGame) && newKey2 === pairKeyForGame(otherGame)) continue;
            const candidate = working.map((game) => ({ ...game }));
            candidate[repeatedIndex] = { ...candidate[repeatedIndex], home: g1h, away: g1a };
            candidate[otherIndex] = { ...candidate[otherIndex], home: g2h, away: g2a };
            const metrics = evaluateCandidate(candidate);
            if (!isBetter(metrics, bestMetrics)) continue;
            bestMetrics = metrics;
            bestSchedule = metrics.schedule;
          }
        }
      }
    }

    if (!bestSchedule) break;
    working = bestSchedule;
    currentMetrics = bestMetrics;
    currentExtra = currentMetrics.extra;
    if (!currentExtra) break;
  }

  return working;
}

function buildResultFromSchedule(schedule, config, priorUnscheduled = []) {
  const improvedSchedule = sortScheduleGames(schedule.map((game) => ({ ...game })));

  const finalTeamMap = makeTeamMapFromSchedule(improvedSchedule, config);
  const finalTeams = Object.values(finalTeamMap);
  const builtTeams = buildTeams(config);
  const repeatedOpponentData = getRepeatedOpponentViolations(improvedSchedule, config);

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
      getHomeAwayIssueLabel(team),
      team.doubleHeaders > (team.maxDoubleheadersPerTeam || 0) ? 'Too many doubleheaders' : null,
      team.maxSameTimeSlot > (team.targetGames <= 8 ? 2 : 3) ? 'Time slot concentration' : null,
      Math.max(team.morningGames || 0, team.afternoonGames || 0) > Math.ceil(team.targetGames * 0.62)
        ? 'Poor AM/PM balance'
        : null,
      repeatedOpponentData.teamViolationCounts[team.name] ? 'Repeated opponent' : null,
    ].filter(Boolean),
  }));

  const weeklyMinimumViolations = getWeeklyMinimumViolations(improvedSchedule, config);
  const weeklyMinimumDeficit = weeklyMinimumViolations.reduce((sum, entry) => sum + (entry.deficit || 0), 0);

  const auditSummary = {
    totalGames: improvedSchedule.length,
    totalTeams: builtTeams.length,
    allTeamsScheduled: auditRows.every((row) => row.games === row.target),
    earlyViolations: auditRows.filter((row) => row.early > Number(config.maxEarlyGames)).length,
    homeAwayIssues: finalTeams.filter((team) => hasHomeAwayIssue(team)).length,
    missingTeams: auditRows.filter((row) => row.games !== row.target).length,
    timeVarietyIssues: auditRows.filter((row) => row.maxSameTime > (row.target <= 8 ? 2 : 3)).length,
    weeklyMinimumIssues: weeklyMinimumViolations.length,
    weeklyMinimumDeficit,
    repeatedOpponentIssues: repeatedOpponentData.pairViolations.length,
    middleGapCount: getMiddleGapCount(improvedSchedule, config),
    enabledDates: config.saturdays.filter((entry) => entry.enabled).length,
    enabledCourts: Object.values(config.dateCourtSettings).reduce(
      (sum, courts) => sum + courts.filter((court) => court.enabled && String(court.name || '').trim() !== '').length,
      0
    ),
  };

  const nextUnscheduled = Array.isArray(priorUnscheduled) ? [...priorUnscheduled] : [];

  if (repeatedOpponentData.pairViolations.length) {
    nextUnscheduled.push({
      matchup: 'Repeated opponents',
      reason: 'One or more team pairings were scheduled more often than allowed for the division target game count.',
      suggestion: repeatedOpponentData.pairViolations
        .map((entry) => `${entry.division}: ${entry.teamA} vs ${entry.teamB} (${entry.count}/${entry.allowed})`)
        .join('; '),
    });
  }

  return {
    schedule: improvedSchedule,
    auditRows,
    auditSummary,
    unscheduled: nextUnscheduled,
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
      .filter((entry) => !entry.game.locked && entry.slotIndex > gapIndex)
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

  if (dateGames.some((game) => game.locked)) {
    return schedule.map((game) => ({ ...game }));
  }

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
        .filter((game) => !game.locked && game.date === date && game.court === courtName)
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
          .filter((game) => !game.locked && game.date === donor.date)
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
        .filter((game) => !game.locked && game.date !== finalDate)
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
  if (gameToMove?.locked) {
    return 'Locked games cannot be moved.';
  }

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
          const safeValue = /^[=+\-@]/.test(value) ? `\t${value}` : value;
          if (safeValue.includes(",") || safeValue.includes('"') || safeValue.includes("\n")) {
            return `"${safeValue.replace(/"/g, '""')}"`;
          }
          return safeValue;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}

const SETUP_STORAGE_KEY = "youth-sports-scheduler-setups-v1";
const ADMIN_SANDBOX_STORAGE_KEY = "youth-sports-scheduler-admin-sandbox-v1";

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


function getDateTargetForSchedule(config, date) {
  return getDatesSubjectToWeeklyMinimum(config).includes(date) ? Number(config.minGamesPerWeek || 0) : 0;
}

function getDateDebugRows(result, config) {
  const enabledDates = config.saturdays.filter((entry) => entry.enabled).map((entry) => entry.date);
  return enabledDates.map((date) => {
    const actual = result?.schedule?.filter((game) => game.date === date).length || 0;
    const target = getDateTargetForSchedule(config, date);
    return {
      date,
      actual,
      target,
      delta: target > 0 ? actual - target : null,
      included: target > 0,
      meetsTarget: target <= 0 || actual >= target,
    };
  });
}

function sameGameKey(a, b) {
  return a && b && a.date === b.date && a.time === b.time && a.court === b.court && a.home === b.home && a.away === b.away;
}

function getGameScoreKey(game) {
  return game ? [game.division, game.date, game.time, game.court, game.home, game.away].join("||") : "";
}

function parseNumericScore(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function createEmptyTechnicalFoul() {
  return {
    id: createRowId("tech"),
    team: "",
    playerNumber: "",
    description: "",
    flagrant: false,
    suspensionReturnGameId: "",
  };
}

function normalizeTechnicalFoulEntry(entry, index = 0) {
  return {
    id: String(entry?.id || createRowId(`tech_${index}`)),
    team: String(entry?.team || ""),
    playerNumber: String(entry?.playerNumber || ""),
    description: String(entry?.description || ""),
    flagrant: Boolean(entry?.flagrant),
    suspensionReturnGameId: String(entry?.suspensionReturnGameId || ""),
  };
}

function normalizeScoreReportEntry(report) {
  return {
    ...report,
    technicalFouls: Array.isArray(report?.technicalFouls)
      ? report.technicalFouls.map((entry, index) => normalizeTechnicalFoulEntry(entry, index))
      : [],
  };
}

function normalizeScoreReportsCollection(scoreReports) {
  return (Array.isArray(scoreReports) ? scoreReports : []).map((report) => normalizeScoreReportEntry(report));
}

function buildSanitizedTechnicalFouls(items) {
  return (Array.isArray(items) ? items : [])
    .map((entry, index) => normalizeTechnicalFoulEntry(entry, index))
    .map((entry) => ({
      ...entry,
      team: String(entry.team || "").trim(),
      playerNumber: String(entry.playerNumber || "").trim(),
      description: String(entry.description || "").trim(),
      flagrant: Boolean(entry.flagrant),
      suspensionReturnGameId: String(entry.suspensionReturnGameId || "").trim(),
    }))
    .filter((entry) => entry.team && entry.playerNumber && entry.description);
}


function getTechnicalSuspensionRuleText() {
  return [
    "Two technical fouls results in a suspension for one additional game.",
    "Three technical fouls results in a suspension for two additional games.",
    "A fourth technical foul could result in suspension for the rest of the season.",
    "Tournament games are included in the technical foul rules.",
  ];
}


function normalizeTimeValue(time) {
  const value = String(time || "").trim();
  if (!value) return "00:00";
  const parts = value.split(":");
  const hour = String(Math.max(0, Number(parts[0]) || 0)).padStart(2, "0");
  const minute = String(Math.max(0, Number(parts[1]) || 0)).padStart(2, "0");
  return `${hour}:${minute}`;
}

function getTechnicalReturnGameLabel(game) {
  if (!game) return "Not selected";
  return `${game.date} • ${formatTimeDisplay(game.time)} • ${game.away} @ ${game.home}`;
}

function compareGamesChronologically(a, b) {
  const leftDate = new Date(a?.date || "").getTime();
  const rightDate = new Date(b?.date || "").getTime();
  const leftTimeIndex = getTimeIndex(a?.time || "") >= 0 ? getTimeIndex(a?.time || "") : 999;
  const rightTimeIndex = getTimeIndex(b?.time || "") >= 0 ? getTimeIndex(b?.time || "") : 999;
  if (Number.isFinite(leftDate) && Number.isFinite(rightDate) && leftDate !== rightDate) {
    return leftDate - rightDate;
  }
  if (leftTimeIndex !== rightTimeIndex) return leftTimeIndex - rightTimeIndex;
  const leftCourt = String(a?.court || "");
  const rightCourt = String(b?.court || "");
  return leftCourt.localeCompare(rightCourt);
}

function getSuspensionGameCount(totalTechs) {
  if (totalTechs >= 4) return "Rest of season review";
  if (totalTechs >= 3) return 2;
  if (totalTechs >= 2) return 1;
  return 0;
}

function buildTechnicalParticipantRows(schedule, scoreReports) {
  const games = Array.isArray(schedule) ? schedule : [];
  const grouped = new Map();

  games.forEach((game) => {
    getTechnicalFoulsForGame(game, scoreReports).forEach((entry) => {
      const team = String(entry.team || "").trim();
      const playerNumber = String(entry.playerNumber || "").trim();
      if (!team || !playerNumber) return;

      const key = `${team}||${playerNumber}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          team,
          playerNumber,
          entries: [],
        });
      }
      grouped.get(key).entries.push({
        ...entry,
        game,
      });
    });
  });

  return [...grouped.values()]
    .map((group) => {
      const entries = [...group.entries].sort((a, b) => compareGamesChronologically(a.game, b.game));
      const scheduledGames = games
        .filter((game) => game.home === group.team || game.away === group.team)
        .sort(compareGamesChronologically);

      const totalTechs = entries.length;
      const flagrantCount = entries.filter((entry) => entry.flagrant).length;
      const gamesToSuspend = getSuspensionGameCount(totalTechs);
      const suspensionTriggered = gamesToSuspend !== 0;
      const suspensionReturnGameId =
        [...entries]
          .reverse()
          .map((entry) => String(entry.suspensionReturnGameId || "").trim())
          .find(Boolean) || "";

      const returnGame = scheduledGames.find((game) => getGameScoreKey(game) === suspensionReturnGameId) || null;
      const nextEligibleLabel = suspensionTriggered
        ? returnGame
          ? getTechnicalReturnGameLabel(returnGame)
          : "Admin has not selected a return game yet"
        : "—";

      return {
        key: group.key,
        team: group.team,
        playerNumber: group.playerNumber,
        totalTechs,
        flagrantCount,
        gamesToSuspend,
        suspensionTriggered,
        suspensionReturnGameId,
        nextEligibleLabel,
        scheduledGames,
        currentlySuspended: suspensionTriggered && !suspensionReturnGameId,
      };
    })
    .sort((a, b) => {
      if (b.totalTechs !== a.totalTechs) return b.totalTechs - a.totalTechs;
      if (a.team !== b.team) return a.team.localeCompare(b.team);
      return a.playerNumber.localeCompare(b.playerNumber, undefined, { numeric: true, sensitivity: "base" });
    });
}

function getTechnicalFoulsForGame(game, scoreReports) {
  return getMatchingReportsForGame(game, scoreReports)
    .flatMap((report) =>
      (Array.isArray(report?.technicalFouls) ? report.technicalFouls : []).map((entry, index) => ({
        ...normalizeTechnicalFoulEntry(entry, index),
        reportId: report.id,
        gameId: report.gameId || getGameScoreKey(game),
        submittedAt: report.submittedAt || "",
        reporterEmail: report.reporterEmail || "",
        reportingTeam: report.reportingTeam || "",
        game,
      }))
    );
}

function normalizeScoreReportForGame(game, report) {
  if (!game || !report) return null;
  const teamScore = parseNumericScore(report.teamScore);
  const opponentScore = parseNumericScore(report.opponentScore);
  if (teamScore === null || opponentScore === null) return null;

  if (report.reportingTeam === game.home) {
    return { homeScore: teamScore, awayScore: opponentScore };
  }
  if (report.reportingTeam === game.away) {
    return { homeScore: opponentScore, awayScore: teamScore };
  }
  return null;
}

function getMatchingReportsForGame(game, scoreReports) {
  const reports = Array.isArray(scoreReports) ? scoreReports : [];
  if (!game) return [];

  const gameKey = getGameScoreKey(game);
  let relevant = reports.filter((report) => report.gameId === gameKey);

  if (!relevant.length) {
    relevant = reports.filter((report) =>
      report &&
      report.division === game.division &&
      report.date === game.date &&
      report.time === game.time &&
      report.court === game.court &&
      report.home === game.home &&
      report.away === game.away
    );
  }

  if (!relevant.length) {
    const gameBaseHome = getTeamBaseName(game.home);
    const gameBaseAway = getTeamBaseName(game.away);
    relevant = reports.filter((report) =>
      report &&
      report.division === game.division &&
      report.date === game.date &&
      report.time === game.time &&
      report.court === game.court &&
      getTeamBaseName(report.home) === gameBaseHome &&
      getTeamBaseName(report.away) === gameBaseAway
    );
  }

  return relevant.sort((a, b) => new Date(b.verifiedAt || b.submittedAt || 0).getTime() - new Date(a.verifiedAt || a.submittedAt || 0).getTime());
}

function getLatestGameReportsByTeam(game, scoreReports) {
  const relevant = getMatchingReportsForGame(game, scoreReports)
    .slice()
    .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());

  const latestByTeam = {};
  for (const report of relevant) {
    const team = report.reportingTeam;
    if (!team || latestByTeam[team]) continue;
    latestByTeam[team] = report;
  }

  return {
    relevant,
    homeReport: latestByTeam[game?.home] || null,
    awayReport: latestByTeam[game?.away] || null,
  };
}

function getOfficialScoreFromReports(game, scoreReports) {
  if (!game) {
    return {
      status: "unreported",
      reportCount: 0,
      verified: false,
      official: null,
      officialLabel: "—",
      reportSummary: "No score reports yet.",
    };
  }

  const relevantReports = getMatchingReportsForGame(game, scoreReports);
  const lockedReport = relevantReports.find((report) => report.verifiedFinal && report.officialHomeScore != null && report.officialAwayScore != null) || null;

  if (lockedReport) {
    return {
      status: "verified",
      reportCount: relevantReports.length,
      verified: true,
      official: { homeScore: Number(lockedReport.officialHomeScore), awayScore: Number(lockedReport.officialAwayScore) },
      officialLabel: `${lockedReport.officialAwayScore}-${lockedReport.officialHomeScore}`,
      reportSummary: lockedReport.verificationReason || "Verified",
      homeReport: null,
      awayReport: null,
      locked: true,
    };
  }

  const { relevant, homeReport, awayReport } = getLatestGameReportsByTeam(game, scoreReports);
  if (!relevant.length) {
    return {
      status: "unreported",
      reportCount: 0,
      verified: false,
      official: null,
      officialLabel: "—",
      reportSummary: "No score reports yet.",
    };
  }

  if (!homeReport || !awayReport) {
    return {
      status: "awaiting_opponent",
      reportCount: relevant.length,
      verified: false,
      official: null,
      officialLabel: "Pending",
      reportSummary: "Waiting for both coaches to report.",
      homeReport,
      awayReport,
    };
  }

  const normalizedHome = normalizeScoreReportForGame(game, homeReport);
  const normalizedAway = normalizeScoreReportForGame(game, awayReport);
  if (!normalizedHome || !normalizedAway) {
    return {
      status: "invalid",
      reportCount: relevant.length,
      verified: false,
      official: null,
      officialLabel: "Review",
      reportSummary: "Could not align one or more reports with the game.",
      homeReport,
      awayReport,
    };
  }

  const exactMatch =
    normalizedHome.homeScore === normalizedAway.homeScore &&
    normalizedHome.awayScore === normalizedAway.awayScore;
  const withinOne =
    Math.abs(normalizedHome.homeScore - normalizedAway.homeScore) <= 1 &&
    Math.abs(normalizedHome.awayScore - normalizedAway.awayScore) <= 1;

  const diffA = normalizedHome.homeScore - normalizedHome.awayScore;
  const diffB = normalizedAway.homeScore - normalizedAway.awayScore;
  const sameDiff = diffA === diffB && Math.sign(diffA) === Math.sign(diffB);

  if (!exactMatch && !withinOne && !sameDiff) {
    return {
      status: "mismatch",
      reportCount: relevant.length,
      verified: false,
      official: null,
      officialLabel: "Review",
      reportSummary: "Coach reports do not agree closely enough yet.",
      homeReport,
      awayReport,
    };
  }

  let officialHome = Math.round((normalizedHome.homeScore + normalizedAway.homeScore) / 2);
  let officialAway = Math.round((normalizedHome.awayScore + normalizedAway.awayScore) / 2);
  let reason = exactMatch ? "Exact match" : withinOne ? "Within one point" : "Matching point differential";

  if (sameDiff && !exactMatch && !withinOne) {
    const targetDiff = diffA;
    const avgTotal = Math.round(
      (normalizedHome.homeScore + normalizedHome.awayScore + normalizedAway.homeScore + normalizedAway.awayScore) / 2
    );
    const maybeHome = (avgTotal + targetDiff) / 2;
    const maybeAway = avgTotal - maybeHome;
    if (Number.isInteger(maybeHome) && Number.isInteger(maybeAway)) {
      officialHome = maybeHome;
      officialAway = maybeAway;
    } else {
      officialHome = normalizedHome.homeScore;
      officialAway = normalizedHome.awayScore;
    }
  }

  return {
    status: "verified",
    reportCount: relevant.length,
    verified: true,
    official: { homeScore: officialHome, awayScore: officialAway },
    officialLabel: `${officialAway}-${officialHome}`,
    reportSummary: reason,
    homeReport,
    awayReport,
  };
}

function getGameScoreDisplay(game, scoreReports) {
  const status = getOfficialScoreFromReports(game, scoreReports);
  if (status.verified && status.official) {
    return `${game.home} ${status.official.homeScore} - ${status.official.awayScore} ${game.away}`;
  }
  if (status.status === "awaiting_opponent") return "1 report";
  if (status.status === "mismatch") return "Needs review";
  return "—";
}

function getPublishedScheduleOutcomeParts(game, scoreReports) {
  const status = getOfficialScoreFromReports(game, scoreReports);
  if (!(status?.verified && status?.official)) {
    return {
      verified: false,
      homeColor: "#0f172a",
      awayColor: "#0f172a",
      homeScoreText: "—",
      awayScoreText: "—",
    };
  }

  const homeScore = Number(status.official.homeScore);
  const awayScore = Number(status.official.awayScore);

  let homeColor = "#0f172a";
  let awayColor = "#0f172a";

  if (homeScore > awayScore) {
    homeColor = "#166534";
    awayColor = "#b91c1c";
  } else if (awayScore > homeScore) {
    awayColor = "#166534";
    homeColor = "#b91c1c";
  }

  return {
    verified: true,
    homeColor,
    awayColor,
    homeScoreText: String(homeScore),
    awayScoreText: String(awayScore),
  };
}

function getMarginCategoryScore(pointDiff) {
  const diff = Number(pointDiff || 0);
  const abs = Math.abs(diff);
  if (abs >= 30) return diff > 0 ? 4 : -4;
  if (abs >= 20) return diff > 0 ? 3 : -3;
  if (abs >= 10) return diff > 0 ? 2 : -2;
  if (abs >= 1) return diff > 0 ? 1 : -1;
  return 0;
}

function clampRating(value, min = 0, max = 100) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

function buildOpponentAdjustedRatings(rowValues, games) {
  const ratings = Object.fromEntries(rowValues.map((row) => [row.team, row.gamesPlayed > 0 ? 50 : 0]));
  const gamesByTeam = Object.fromEntries(rowValues.map((row) => [row.team, []]));

  for (const game of Array.isArray(games) ? games : []) {
    if (gamesByTeam[game.home]) gamesByTeam[game.home].push(game);
    if (gamesByTeam[game.away]) gamesByTeam[game.away].push(game);
  }

  for (let pass = 0; pass < 12; pass += 1) {
    const nextRatings = {};

    for (const row of rowValues) {
      const teamGames = gamesByTeam[row.team] || [];
      if (!teamGames.length) {
        nextRatings[row.team] = 0;
        continue;
      }

      const gameRatings = teamGames.map((game) => {
        const isHome = game.home === row.team;
        const opponent = isHome ? game.away : game.home;
        const teamScore = isHome ? game.homeScore : game.awayScore;
        const opponentScore = isHome ? game.awayScore : game.homeScore;
        const margin = teamScore - opponentScore;
        const resultPoints = margin > 0 ? 18 : margin < 0 ? -18 : 0;
        const marginPoints = clampRating(margin, -25, 25) * 0.8;
        const opponentAdjustment = ((ratings[opponent] ?? 50) - 50) * 0.75;
        return 50 + resultPoints + marginPoints + opponentAdjustment;
      });

      const averageGameRating = gameRatings.reduce((sum, value) => sum + value, 0) / gameRatings.length;
      const recordAnchor = 50 + ((row.winPct || 0) - 0.5) * 55;
      const adjusted = (averageGameRating * 0.82) + (recordAnchor * 0.18);
      nextRatings[row.team] = clampRating(50 + ((adjusted - 50) * 1.35));
    }

    Object.assign(ratings, nextRatings);
  }

  return ratings;
}

function buildDivisionStandings(schedule, scoreReports) {
  const standingsByDivision = {};
  const divisionGames = {};

  for (const game of Array.isArray(schedule) ? schedule : []) {
    if (!standingsByDivision[game.division]) standingsByDivision[game.division] = {};
    if (!divisionGames[game.division]) divisionGames[game.division] = [];
    const divisionMap = standingsByDivision[game.division];

    for (const team of [game.home, game.away]) {
      if (!divisionMap[team]) {
        divisionMap[team] = {
          team,
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pointDiff: 0,
          gamesPlayed: 0,
          marginCategoryTotal: 0,
          opponents: [],
          winPct: 0,
          sos: 0,
          sosStrength: 0,
          avgMarginCategory: 0,
          performanceRating: 0,
        };
      }
    }

    const scoreStatus = getOfficialScoreFromReports(game, scoreReports);
    if (!scoreStatus.verified || !scoreStatus.official) continue;

    const homeRow = divisionMap[game.home];
    const awayRow = divisionMap[game.away];
    const homeScore = scoreStatus.official.homeScore;
    const awayScore = scoreStatus.official.awayScore;
    const rawHomeMargin = homeScore - awayScore;
    const rawAwayMargin = awayScore - homeScore;
    const homeMarginCategory = getMarginCategoryScore(rawHomeMargin);
    const awayMarginCategory = getMarginCategoryScore(rawAwayMargin);

    homeRow.gamesPlayed += 1;
    awayRow.gamesPlayed += 1;
    homeRow.pointsFor += homeScore;
    homeRow.pointsAgainst += awayScore;
    awayRow.pointsFor += awayScore;
    awayRow.pointsAgainst += homeScore;
    homeRow.pointDiff = homeRow.pointsFor - homeRow.pointsAgainst;
    awayRow.pointDiff = awayRow.pointsFor - awayRow.pointsAgainst;
    homeRow.marginCategoryTotal += homeMarginCategory;
    awayRow.marginCategoryTotal += awayMarginCategory;
    homeRow.opponents.push(game.away);
    awayRow.opponents.push(game.home);
    divisionGames[game.division].push({
      home: game.home,
      away: game.away,
      homeScore,
      awayScore,
    });

    if (homeScore > awayScore) {
      homeRow.wins += 1;
      awayRow.losses += 1;
    } else if (awayScore > homeScore) {
      awayRow.wins += 1;
      homeRow.losses += 1;
    } else {
      homeRow.ties += 1;
      awayRow.ties += 1;
    }
  }

  return Object.fromEntries(
    Object.entries(standingsByDivision).map(([division, rows]) => {
      const rowValues = Object.values(rows);

      for (const row of rowValues) {
        const totalResults = row.wins + row.losses + row.ties;
        row.winPct = totalResults > 0 ? (row.wins + row.ties * 0.5) / totalResults : 0;
        row.avgMarginCategory = row.gamesPlayed > 0 ? row.marginCategoryTotal / row.gamesPlayed : 0;
      }

      const adjustedRatings = buildOpponentAdjustedRatings(rowValues, divisionGames[division] || []);

      for (const row of rowValues) {
        const opponentRatings = (row.opponents || [])
          .map((teamName) => adjustedRatings[teamName])
          .filter((value) => Number.isFinite(Number(value)));
        row.sosStrength = opponentRatings.length
          ? (opponentRatings.reduce((sum, value) => sum + value, 0) / opponentRatings.length) / 100
          : 0;
        row.performanceRating = adjustedRatings[row.team] || 0;
      }

      [...rowValues]
        .sort((a, b) => {
          if ((b.sosStrength || 0) !== (a.sosStrength || 0)) return (b.sosStrength || 0) - (a.sosStrength || 0);
          return String(a.team || '').localeCompare(String(b.team || ''), undefined, { numeric: true });
        })
        .forEach((row, index) => {
          row.sos = row.gamesPlayed > 0 ? index + 1 : 0;
        });

      return [
        division,
        rowValues.sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (b.ties !== a.ties) return b.ties - a.ties;
          if (a.losses !== b.losses) return a.losses - b.losses;
          if (b.performanceRating !== a.performanceRating) return b.performanceRating - a.performanceRating;
          if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
          if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
          return a.team.localeCompare(b.team, undefined, { numeric: true });
        }),
      ];
    })
  );
}


function buildTierMapFromResult(result) {
  const map = {};
  if (!result) return map;

  const addTeamTier = (division, teamName, tierLabel) => {
    const baseDivision = String(division || "");
    const team = String(teamName || "");
    const tier = String(tierLabel || "");
    if (!baseDivision || !team || !tier) return;
    if (!map[baseDivision]) map[baseDivision] = {};
    map[baseDivision][team] = tier;
  };

  for (const item of Array.isArray(result?.tierSummary) ? result.tierSummary : []) {
    addTeamTier(item.baseDivision, item.team, item.tier);
  }

  if (!Object.keys(map).length) {
    for (const game of Array.isArray(result?.schedule) ? result.schedule : []) {
      const tier = String(game?.tier || "");
      if (!tier) continue;
      addTeamTier(game.division, game.home, tier);
      addTeamTier(game.division, game.away, tier);
    }
  }

  return map;
}

function buildStandingsDisplayGroups(result, standingsByDivision = {}) {
  const tierMap = buildTierMapFromResult(result);
  const groupsByDivision = {};

  for (const division of Object.keys(standingsByDivision || {})) {
    const rows = Array.isArray(standingsByDivision[division]) ? standingsByDivision[division] : [];
    const divisionTierMap = tierMap[division] || {};
    const hasSplit = rows.length >= 12 && Object.keys(divisionTierMap).length > 0;

    if (!hasSplit) {
      groupsByDivision[division] = [{ key: division, label: division, sublabel: "", rows }];
      continue;
    }

    const divisionOneRows = rows.filter((row) => divisionTierMap[row.team] === "Division 1");
    const divisionTwoRows = rows.filter((row) => divisionTierMap[row.team] === "Division 2");
    const fallbackRows = rows.filter((row) => !divisionTierMap[row.team]);

    groupsByDivision[division] = [
      { key: `${division}::Division 1`, label: division, sublabel: "Division 1", rows: divisionOneRows },
      { key: `${division}::Division 2`, label: division, sublabel: "Division 2", rows: divisionTwoRows },
    ];

    if (fallbackRows.length) {
      groupsByDivision[division].push({
        key: `${division}::Unassigned`,
        label: division,
        sublabel: "Unassigned",
        rows: fallbackRows,
      });
    }
  }

  return groupsByDivision;
}


function getStandingsSortValue(row, key) {
  switch (key) {
    case "team":
      return String(row.team || "");
    case "wins":
      return Number(row.wins || 0);
    case "losses":
      return Number(row.losses || 0);
    case "ties":
      return Number(row.ties || 0);
    case "winPct":
      return Number(row.winPct || 0);
    case "pointsFor":
      return Number(row.pointsFor || 0);
    case "pointsAgainst":
      return Number(row.pointsAgainst || 0);
    case "pointDiff":
      return Number(row.pointDiff || 0);
    case "sos":
      return row.sos ? -Number(row.sos || 0) : -999;
    case "performanceRating":
      return Number(row.performanceRating || 0);
    default:
      return 0;
  }
}

function parseClockMinutes(time) {
  const raw = String(time || "").trim();
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const suffix = String(match[3] || "").toUpperCase();
  if (suffix === "AM" && hour === 12) hour = 0;
  if (suffix === "PM" && hour < 12) hour += 12;
  return hour * 60 + minute;
}

function formatClockMinutes(totalMinutes) {
  const safe = ((Number(totalMinutes || 0) % 1440) + 1440) % 1440;
  let hour = Math.floor(safe / 60);
  const minute = safe % 60;
  if (hour === 0) hour = 12;
  if (hour > 12) hour -= 12;
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

function getJanuaryTournamentWeekendDates(seasonYear, optionValue) {
  const januaryYear = Number(seasonYear || createInitialState().seasonYear) + 1;
  const ordinal = TOURNAMENT_WEEKEND_OPTIONS.find((entry) => entry.value === optionValue)?.saturdayOrdinal || 3;
  const cursor = new Date(januaryYear, 0, 1);
  const saturdays = [];
  while (cursor.getMonth() === 0) {
    if (cursor.getDay() === 6) saturdays.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  const saturday = saturdays[Math.max(0, ordinal - 1)] || saturdays[2] || saturdays[0];
  const friday = new Date(saturday);
  friday.setDate(friday.getDate() - 1);
  const sunday = new Date(saturday);
  sunday.setDate(sunday.getDate() + 1);
  return {
    friday: formatShortDate(friday),
    saturday: formatShortDate(saturday),
    sunday: formatShortDate(sunday),
  };
}

function getTournamentSeedingLockDate(config, setup) {
  const dates = getJanuaryTournamentWeekendDates(config?.seasonYear, setup?.weekend);
  const fridayTime = parseShortDate(dates.friday);
  const lockDate = new Date(fridayTime);
  lockDate.setDate(lockDate.getDate() - 6);
  return formatShortDate(lockDate);
}

function createDefaultTournamentSetup(config) {
  return {
    weekend: "third",
    divisions: Object.fromEntries(DIVISIONS.map((division) => [division, Number(config?.divisions?.[division] || 0) > 1])),
    fridayCourtStarts: Object.fromEntries(TOURNAMENT_COURTS.map((court) => [court, "6:00"])),
    coachRequests: [],
  };
}

function buildTournamentSlots(config, setup) {
  const dates = getJanuaryTournamentWeekendDates(config?.seasonYear, setup?.weekend);
  const fridayStarts = setup?.fridayCourtStarts || {};
  const slots = [];
  const addDaySlots = (date, dayLabel, startForCourt, rounds = 12) => {
    for (const court of TOURNAMENT_COURTS) {
      const start = parseClockMinutes(startForCourt(court));
      for (let i = 0; i < rounds; i += 1) {
        slots.push({
          id: `${date}|${formatClockMinutes(start + i * 65)}|${court}`,
          date,
          dayLabel,
          time: formatClockMinutes(start + i * 65),
          court,
          slotIndex: i,
        });
      }
    }
  };

  addDaySlots(dates.friday, "Friday", (court) => fridayStarts[court] || "6:00", 4);
  addDaySlots(dates.saturday, "Saturday", () => "8:00", 12);
  addDaySlots(dates.sunday, "Sunday", () => "8:00", 12);

  return slots.sort((a, b) => {
    const dateDiff = parseShortDate(a.date) - parseShortDate(b.date);
    if (dateDiff !== 0) return dateDiff;
    const timeDiff = parseClockMinutes(a.time) - parseClockMinutes(b.time);
    if (timeDiff !== 0) return timeDiff;
    return TOURNAMENT_COURTS.indexOf(a.court) - TOURNAMENT_COURTS.indexOf(b.court);
  });
}

function getNextPowerOfTwo(value) {
  let size = 1;
  while (size < Number(value || 0)) size *= 2;
  return size;
}

function createTournamentBracketForDivision(division, teams, slotQueue, options = {}) {
  const { seeded = true } = options;
  const entrants = [...teams];
  const bracketSize = getNextPowerOfTwo(Math.max(2, entrants.length));
  const byes = bracketSize - entrants.length;
  const firstRoundPairs = [];
  let teamIndex = 0;
  for (let i = 0; i < byes; i += 1) {
    firstRoundPairs.push([entrants[teamIndex] || null, null]);
    teamIndex += 1;
  }
  while (teamIndex < entrants.length) {
    firstRoundPairs.push([entrants[teamIndex] || null, entrants[teamIndex + 1] || null]);
    teamIndex += 2;
  }
  const games = [];
  let previousRoundGameIds = [];
  let gameNumber = 1;

  for (let roundSize = bracketSize, round = 1; roundSize >= 2; roundSize /= 2, round += 1) {
    const gamesThisRound = [];
    const gameCount = roundSize / 2;
    for (let i = 0; i < gameCount; i += 1) {
      const gameId = `${division.replace(/[^A-Za-z0-9]/g, "_")}_R${round}_G${i + 1}`;
      let teamA = "TBD";
      let teamB = "TBD";
      let isBye = false;

      if (round === 1) {
        const pair = firstRoundPairs[i] || [null, null];
        teamA = pair[0] || "BYE";
        teamB = pair[1] || "BYE";
        isBye = teamA === "BYE" || teamB === "BYE";
      } else {
        const left = previousRoundGameIds[i * 2] || "";
        const right = previousRoundGameIds[i * 2 + 1] || "";
        teamA = String(left).includes("_R") ? `Winner ${left}` : left;
        teamB = String(right).includes("_R") ? `Winner ${right}` : right;
      }

      if (!isBye) {
        const slot = slotQueue.shift() || {};
        games.push({
          id: gameId,
          division,
          round,
          gameNumber: gameNumber,
          label: roundSize === 2 ? "Championship" : `Round ${round}`,
          teamA: seeded ? teamA : teamA.replace(/^Seed TBD /, "Seed TBD "),
          teamB: seeded ? teamB : teamB.replace(/^Seed TBD /, "Seed TBD "),
          date: slot.date || "",
          dayLabel: slot.dayLabel || "",
          time: slot.time || "",
          court: slot.court || "",
        });
        gameNumber += 1;
        gamesThisRound.push(gameId);
      } else {
        gamesThisRound.push(teamA === "BYE" ? teamB : teamA);
      }
    }
    previousRoundGameIds = gamesThisRound;
  }

  return { division, teams: seeded ? entrants : [], teamCount: entrants.length, seeded, bracketSize, games };
}

function getTournamentDivisionTeams(config, division, standingsRows = [], seeded = false) {
  const count = Number(config?.divisions?.[division] || 0);
  const details = syncDivisionTeamDetails(config?.divisionTeamDetails?.[division], count);
  const configuredTeams = details.map((entry, index) => buildFormattedTeamName(division, entry, index + 1, count));
  if (!seeded) return configuredTeams.map((_, index) => `Seed TBD ${index + 1}`);

  const standingsOrder = (Array.isArray(standingsRows) ? standingsRows : [])
    .map((row) => row.team)
    .filter((teamName) => configuredTeams.includes(teamName));
  const seen = new Set(standingsOrder);
  return [
    ...standingsOrder,
    ...configuredTeams.filter((teamName) => !seen.has(teamName)),
  ];
}

function buildMidseasonTournament(config, setup, options = {}) {
  const { seeded = false, schedule = [], scoreReports = [] } = options;
  const normalized = normalizeConfig(config);
  const tournamentSetup = setup || createDefaultTournamentSetup(normalized);
  const slots = buildTournamentSlots(normalized, tournamentSetup);
  const slotQueue = [...slots];
  const brackets = [];
  const lockDate = getTournamentSeedingLockDate(normalized, tournamentSetup);
  const seedingSchedule = (Array.isArray(schedule) ? schedule : []).filter((game) => parseShortDate(game.date) <= parseShortDate(lockDate));
  const standingsByDivision = seeded ? buildDivisionStandings(seedingSchedule, scoreReports) : {};

  for (const division of DIVISIONS) {
    if (!tournamentSetup.divisions?.[division]) continue;
    const count = Number(normalized.divisions?.[division] || 0);
    if (count < 2) continue;
    const teams = getTournamentDivisionTeams(normalized, division, standingsByDivision[division] || [], seeded);
    brackets.push(createTournamentBracketForDivision(division, teams, slotQueue, { seeded }));
  }

  const scheduledGames = brackets.flatMap((bracket) => bracket.games);
  return {
    name: "Mid-Season Tournament",
    generatedAt: new Date().toLocaleString(),
    weekend: tournamentSetup.weekend,
    seeded,
    seedingLockDate: lockDate,
    dates: getJanuaryTournamentWeekendDates(normalized.seasonYear, tournamentSetup.weekend),
    courts: [...TOURNAMENT_COURTS],
    fridayCourtStarts: { ...(tournamentSetup.fridayCourtStarts || {}) },
    coachRequests: [...(tournamentSetup.coachRequests || [])],
    brackets,
    games: scheduledGames,
    unscheduledCount: scheduledGames.filter((game) => !game.date || !game.time || !game.court).length,
  };
}

function compareStandingsRows(a, b, sortKey = "winPct", sortDirection = "desc") {
  const direction = sortDirection === "asc" ? 1 : -1;
  const aValue = getStandingsSortValue(a, sortKey);
  const bValue = getStandingsSortValue(b, sortKey);

  if (sortKey === "team") {
    const cmp = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
    if (cmp !== 0) return cmp * direction;
  } else if (bValue !== aValue) {
    return (aValue - bValue) * direction;
  }

  if ((b.winPct || 0) !== (a.winPct || 0)) return (b.winPct || 0) - (a.winPct || 0);
  if ((b.performanceRating || 0) !== (a.performanceRating || 0)) return (b.performanceRating || 0) - (a.performanceRating || 0);
  if ((b.pointDiff || 0) !== (a.pointDiff || 0)) return (b.pointDiff || 0) - (a.pointDiff || 0);
  if ((b.pointsFor || 0) !== (a.pointsFor || 0)) return (b.pointsFor || 0) - (a.pointsFor || 0);
  return String(a.team || "").localeCompare(String(b.team || ""), undefined, { numeric: true });
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
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const isPublicMode = (params.get("view") || "").toLowerCase() === "public";
  const initialDivisionParam = params.get("division") || "all";
  const initialTeamParam = params.get("team") || "all";

  const [config, setConfig] = useState(() => normalizeConfig(createInitialState()));
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState(isPublicMode ? "schedule" : "setup");
  const [scheduleDivisionFilter, setScheduleDivisionFilter] = useState(initialDivisionParam);
  const [scheduleTeamFilter, setScheduleTeamFilter] = useState(initialTeamParam);
  const [publishedMeta, setPublishedMeta] = useState(null);
  const [publishedSnapshot, setPublishedSnapshot] = useState(null);
  const [publishNotice, setPublishNotice] = useState("");
  const [tournamentSetup, setTournamentSetup] = useState(() => createDefaultTournamentSetup(normalizeConfig(createInitialState())));
  const [tournamentResult, setTournamentResult] = useState(null);
  const [adminScheduleDate, setAdminScheduleDate] = useState("");
  const [dragState, setDragState] = useState(null);
  const [gridNotice, setGridNotice] = useState("");
  const [savedSetupName, setSavedSetupName] = useState("");
  const [savedSetups, setSavedSetups] = useState([]);
  const [selectedSavedSetup, setSelectedSavedSetup] = useState("");
  const [showCoreRules, setShowCoreRules] = useState(true);
  const [standingsSort, setStandingsSort] = useState({ key: "winPct", direction: "desc" });
  const [adminStandingsSource, setAdminStandingsSource] = useState("sandbox");
  const [adminStandingsDivisionFilter, setAdminStandingsDivisionFilter] = useState("all");
  const [dateDebugExpanded, setDateDebugExpanded] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [scoreReports, setScoreReports] = useState([]);
  const [scoreNotice, setScoreNotice] = useState("");
  const [scoreReporterEmail, setScoreReporterEmail] = useState("");
  const [scoreReporterDivision, setScoreReporterDivision] = useState(initialDivisionParam !== "all" ? initialDivisionParam : "");
  const [scoreReporterTeam, setScoreReporterTeam] = useState(initialTeamParam !== "all" ? initialTeamParam : "");
  const [scoreGameId, setScoreGameId] = useState("");
  const [scoreForInput, setScoreForInput] = useState("");
  const [scoreAgainstInput, setScoreAgainstInput] = useState("");
  const [scoreForfeitTeam, setScoreForfeitTeam] = useState("");
  const [scoreApproveExisting, setScoreApproveExisting] = useState(false);
  const [scoreHasTechnicalFouls, setScoreHasTechnicalFouls] = useState(false);
  const [scoreTechnicalFouls, setScoreTechnicalFouls] = useState([]);
  const [isMobilePublic, setIsMobilePublic] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 820 : false
  );

  async function refreshPublishedSnapshot() {
    try {
      const published = await loadPublishedPayload();
      setPublishedSnapshot(published || null);
      if (!isPublicMode) {
        setPublishedMeta(published?.meta || null);
      }
      return published || null;
    } catch (error) {
      console.error("Could not refresh published snapshot", error);
      setPublishedSnapshot(null);
      return null;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadPublicSchedule() {
      if (!isPublicMode) return;
      const published = await loadPublishedPayload();
      if (cancelled) return;
      setResult(published?.result || null);
      setPublishedMeta(published?.meta || null);
      setScoreReports(normalizeScoreReportsCollection(Array.isArray(published?.scoreReports) ? published.scoreReports : []));
      setTournamentResult(published?.tournament || null);
    }

    loadPublicSchedule();
    const retryTimer = window.setTimeout(loadPublicSchedule, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, [isPublicMode]);

  useEffect(() => {
    if (!isPublicMode) return undefined;

    const updateIsMobile = () => {
      setIsMobilePublic(window.innerWidth <= 820);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, [isPublicMode]);

  useEffect(() => {
    if (isPublicMode) return;
    refreshPublishedSnapshot();
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
  const debugMissingTeams = useMemo(() => {
    if (!result?.auditRows?.length) return [];
    return result.auditRows
      .filter((row) => Number(row.games || 0) < Number(row.target || 0))
      .map((row) => ({
        ...row,
        missing: Math.max(0, Number(row.target || 0) - Number(row.games || 0)),
      }))
      .sort((a, b) => {
        if ((b.missing || 0) !== (a.missing || 0)) return (b.missing || 0) - (a.missing || 0);
        return String(a.team || '').localeCompare(String(b.team || ''), undefined, { numeric: true });
      });
  }, [result]);
  const debugScheduleSnapshot = useMemo(() => {
    if (!result) return null;
    const perDivision = DIVISIONS.map((division) => {
      const auditRows = (result.auditRows || []).filter((row) => row.division === division);
      const scheduled = auditRows.reduce((sum, row) => sum + Number(row.games || 0), 0) / 2;
      const target = auditRows.reduce((sum, row) => sum + Number(row.target || 0), 0) / 2;
      return {
        division,
        teams: Number(config?.divisions?.[division] || 0),
        targetGamesPerTeam: Number(config?.divisionGames?.[division] || 0),
        scheduledGames: scheduled,
        targetGames: target,
        shortTeams: auditRows.filter((row) => Number(row.games || 0) < Number(row.target || 0)).length,
        unscheduledGames: (result.unscheduled || []).filter((game) => game.division === division).length,
      };
    }).filter((row) => row.teams > 0);
    return {
      seasonPhase: result.seasonPhase || 'unknown',
      totalScheduledGames: (result.schedule || []).length,
      totalUnscheduledGames: (result.unscheduled || []).length,
      missingTeams: debugMissingTeams.length,
      perDivision,
    };
  }, [result, config, debugMissingTeams]);
  const teamOptions = useMemo(() => buildTeamNamesFromConfig(config), [config]);

  const availableScheduleTeams = useMemo(() => {
    if (!result) return [];
    const divisionFilteredGames =
      scheduleDivisionFilter === "all"
        ? result.schedule
        : result.schedule.filter((game) => game.division === scheduleDivisionFilter);
    return Array.from(new Set(divisionFilteredGames.flatMap((game) => [game.home, game.away]))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [result, scheduleDivisionFilter]);

  const allScheduleTeams = useMemo(() => {
    if (!result) return [];
    return Array.from(new Set(result.schedule.flatMap((game) => [game.home, game.away]))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [result]);

  const publicDivisionOptions = useMemo(() => {
    if (!result) return [];
    return Array.from(new Set(result.schedule.map((game) => game.division))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [result]);

  const scoreTeamsForDivision = useMemo(() => {
    if (!result || !scoreReporterDivision) return [];
    return Array.from(
      new Set(
        result.schedule
          .filter((game) => game.division === scoreReporterDivision)
          .flatMap((game) => [game.home, game.away])
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [result, scoreReporterDivision]);

  const scoreReportableGames = useMemo(() => {
    if (!result || !scoreReporterTeam) return [];
    return [...result.schedule]
      .filter((game) => game.home === scoreReporterTeam || game.away === scoreReporterTeam)
      .sort((a, b) => compareSlotLike(a, b));
  }, [result, scoreReporterTeam]);

  const selectedScoreGame = useMemo(
    () => scoreReportableGames.find((game) => getGameScoreKey(game) === scoreGameId) || null,
    [scoreReportableGames, scoreGameId]
  );

  const selectedScoreGameStatus = useMemo(
    () => (selectedScoreGame ? getOfficialScoreFromReports(selectedScoreGame, scoreReports) : null),
    [selectedScoreGame, scoreReports]
  );

  const selectedScoreApprovalContext = useMemo(() => {
    if (!selectedScoreGame || !scoreReporterTeam) {
      return { canApprove: false, approvalScores: null, opponentReport: null, ownReport: null, alreadyReported: false };
    }
    const { homeReport, awayReport } = getLatestGameReportsByTeam(selectedScoreGame, scoreReports);
    const ownReport = scoreReporterTeam === selectedScoreGame.home ? homeReport : awayReport;
    const opponentReport = scoreReporterTeam === selectedScoreGame.home ? awayReport : homeReport;
    const alreadyReported = Boolean(ownReport);
    const normalizedOpponent = normalizeScoreReportForGame(selectedScoreGame, opponentReport);
    const approvalScores = normalizedOpponent
      ? (scoreReporterTeam === selectedScoreGame.home
          ? { teamScore: normalizedOpponent.homeScore, opponentScore: normalizedOpponent.awayScore }
          : { teamScore: normalizedOpponent.awayScore, opponentScore: normalizedOpponent.homeScore })
      : null;

    return {
      canApprove: Boolean(opponentReport && approvalScores && !alreadyReported),
      approvalScores,
      opponentReport,
      ownReport,
      alreadyReported,
    };
  }, [selectedScoreGame, scoreReporterTeam, scoreReports]);


  const selectedScoreSubmissionState = useMemo(() => {
    if (!selectedScoreGame) {
      return {
        hasAnyReport: false,
        alreadyReported: false,
        canApproveExisting: false,
        verified: false,
        lockInputs: false,
        lockButton: false,
        buttonLabel: "Submit score",
      };
    }

    const status = selectedScoreGameStatus;
    const approval = selectedScoreApprovalContext;
    const gameReports = (scoreReports || []).filter(
      (report) => report.gameId === getGameScoreKey(selectedScoreGame)
    );
    const hasAnyReport = gameReports.length > 0;
    const alreadyReported = Boolean(approval?.alreadyReported);
    const canApproveExisting = Boolean(approval?.canApprove);
    const verified = Boolean(status?.verified);

    if (verified) {
      return {
        hasAnyReport,
        alreadyReported,
        canApproveExisting,
        verified,
        lockInputs: true,
        lockButton: true,
        buttonLabel: "Score locked",
      };
    }

    if (alreadyReported) {
      return {
        hasAnyReport,
        alreadyReported,
        canApproveExisting,
        verified,
        lockInputs: true,
        lockButton: true,
        buttonLabel: "Score already submitted",
      };
    }

    if (hasAnyReport && canApproveExisting) {
      return {
        hasAnyReport,
        alreadyReported,
        canApproveExisting,
        verified,
        lockInputs: !scoreApproveExisting,
        lockButton: false,
        buttonLabel: "Approve existing score",
      };
    }

    if (hasAnyReport) {
      return {
        hasAnyReport,
        alreadyReported,
        canApproveExisting,
        verified,
        lockInputs: true,
        lockButton: true,
        buttonLabel: "Waiting for approval",
      };
    }

    return {
      hasAnyReport,
      alreadyReported,
      canApproveExisting,
      verified,
      lockInputs: false,
      lockButton: false,
      buttonLabel: "Submit score",
    };
  }, [
    selectedScoreGame,
    selectedScoreGameStatus,
    selectedScoreApprovalContext,
    scoreReports,
    scoreApproveExisting,
  ]);

  const divisionStandings = useMemo(() => (result ? buildDivisionStandings(result.schedule, scoreReports) : {}), [result, scoreReports]);
  const publishedSnapshotReports = useMemo(
    () => normalizeScoreReportsCollection(Array.isArray(publishedSnapshot?.scoreReports) ? publishedSnapshot.scoreReports : []),
    [publishedSnapshot]
  );
  const publishedDivisionStandings = useMemo(
    () => (publishedSnapshot?.result ? buildDivisionStandings(publishedSnapshot.result.schedule, publishedSnapshotReports) : {}),
    [publishedSnapshot, publishedSnapshotReports]
  );
  const publicStandingsGroups = useMemo(
    () => buildStandingsDisplayGroups(result, divisionStandings),
    [result, divisionStandings]
  );
  const publishedStandingsGroups = useMemo(
    () => buildStandingsDisplayGroups(publishedSnapshot?.result || null, publishedDivisionStandings),
    [publishedSnapshot, publishedDivisionStandings]
  );
  const displayedTournament = isPublicMode
    ? tournamentResult
    : tournamentResult || publishedSnapshot?.tournament || null;
  const adminDisplayedStandings = adminStandingsSource === "published" ? publishedDivisionStandings : divisionStandings;
  const adminDisplayedStandingsResult = adminStandingsSource === "published" ? (publishedSnapshot?.result || null) : result;
  const adminDisplayedStandingsGroups = useMemo(
    () => buildStandingsDisplayGroups(adminDisplayedStandingsResult, adminDisplayedStandings),
    [adminDisplayedStandingsResult, adminDisplayedStandings]
  );
  const adminDisplayedStandingsDivisions = useMemo(() => {
    const keys = Object.keys(adminDisplayedStandingsGroups || {});
    return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [adminDisplayedStandingsGroups]);
  const preseasonEndLabel = useMemo(() => getConfiguredPreseasonEndDate(config), [config]);
  const preseasonGamesCompleteCount = useMemo(() => {
    if (!result?.schedule?.length) return 0;
    return result.schedule.filter((game) => isPreseasonDate(game.date, config) && getOfficialScoreFromReports(game, scoreReports).verified).length;
  }, [result, config, scoreReports]);
  const preseasonGamesTotalCount = useMemo(() => {
    if (!result?.schedule?.length) return 0;
    return result.schedule.filter((game) => isPreseasonDate(game.date, config)).length;
  }, [result, config]);
  const tournamentSeedingLockDate = useMemo(
    () => getTournamentSeedingLockDate(config, tournamentSetup),
    [config, tournamentSetup]
  );
  const tournamentSeedingLockGames = useMemo(() => {
    if (!result?.schedule?.length || !tournamentSeedingLockDate) return [];
    return result.schedule.filter((game) => game.date === tournamentSeedingLockDate);
  }, [result, tournamentSeedingLockDate]);
  const tournamentSeedingLockCompleteCount = useMemo(
    () => tournamentSeedingLockGames.filter((game) => getOfficialScoreFromReports(game, scoreReports).verified).length,
    [tournamentSeedingLockGames, scoreReports]
  );
  const tournamentCanGenerateShell = preseasonGamesTotalCount > 0 && preseasonGamesCompleteCount >= preseasonGamesTotalCount;
  const tournamentCanSeedTeams = tournamentCanGenerateShell && tournamentSeedingLockGames.length > 0 && tournamentSeedingLockCompleteCount >= tournamentSeedingLockGames.length;

  const scoreLogRows = useMemo(() => {
    if (!result) return [];
    const gameMap = new Map(result.schedule.map((game) => [getGameScoreKey(game), game]));
    return [...scoreReports]
      .map((report) => {
        const game = gameMap.get(report.gameId);
        const status = game ? getOfficialScoreFromReports(game, scoreReports) : null;
        return { report, game, status };
      })
      .sort((a, b) => new Date(b.report.submittedAt || 0).getTime() - new Date(a.report.submittedAt || 0).getTime());
  }, [result, scoreReports]);

  const publicTechnicalRows = useMemo(() => {
    if (!result) return [];
    try {
      return result.schedule
        .flatMap((game) =>
          getTechnicalFoulsForGame(game, scoreReports).map((entry) => ({
            ...entry,
            division: game.division,
            date: game.date,
            time: game.time,
            court: game.court,
            home: game.home,
            away: game.away,
          }))
        )
        .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
    } catch (error) {
      console.error("Could not build technical foul rows", error);
      return [];
    }
  }, [result, scoreReports]);

  const technicalParticipantRows = useMemo(() => {
    if (!result) return [];
    try {
      return buildTechnicalParticipantRows(result.schedule, scoreReports);
    } catch (error) {
      console.error("Could not build technical participant rows", error);
      return [];
    }
  }, [result, scoreReports]);

  const currentlySuspendedRows = useMemo(
    () => technicalParticipantRows.filter((entry) => entry.currentlySuspended),
    [technicalParticipantRows]
  );

  useEffect(() => {
    if (!isPublicMode || !result) return;
    if (scheduleTeamFilter !== "all" && !scoreReporterTeam) {
      setScoreReporterTeam(scheduleTeamFilter);
    }
    const seededTeam = scheduleTeamFilter !== "all" ? scheduleTeamFilter : scoreReporterTeam;
    if (seededTeam && !scoreReporterDivision) {
      const teamGame = result.schedule.find((game) => game.home === seededTeam || game.away === seededTeam);
      if (teamGame) setScoreReporterDivision(teamGame.division);
    }
  }, [isPublicMode, result, scheduleTeamFilter, scoreReporterTeam, scoreReporterDivision]);

  useEffect(() => {
    if (!scoreReporterDivision) {
      if (scoreReporterTeam) setScoreReporterTeam("");
      return;
    }
    if (!scoreTeamsForDivision.length) {
      if (scoreReporterTeam) setScoreReporterTeam("");
      return;
    }
    if (!scoreTeamsForDivision.includes(scoreReporterTeam)) {
      setScoreReporterTeam(scoreTeamsForDivision[0]);
    }
  }, [scoreReporterDivision, scoreTeamsForDivision, scoreReporterTeam]);

  useEffect(() => {
    if (!scoreReportableGames.length) {
      setScoreGameId("");
      return;
    }
    if (!scoreReportableGames.some((game) => getGameScoreKey(game) === scoreGameId)) {
      setScoreGameId(getGameScoreKey(scoreReportableGames[0]));
    }
  }, [scoreReportableGames, scoreGameId]);

  useEffect(() => {
    setScoreApproveExisting(false);
    setScoreForfeitTeam("");
    setScoreHasTechnicalFouls(false);
    setScoreTechnicalFouls([]);
  }, [scoreReporterDivision, scoreReporterTeam, scoreGameId]);

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

  const publicSelectedTeamStanding = useMemo(() => {
    if (!result || !isPublicMode || scheduleTeamFilter === "all") return null;
    const division = scheduleDivisionFilter !== "all"
      ? scheduleDivisionFilter
      : result.schedule.find((game) => game.home === scheduleTeamFilter || game.away === scheduleTeamFilter)?.division;
    if (!division) return null;
    const rows = divisionStandings[division] || [];
    const index = rows.findIndex((row) => row.team === scheduleTeamFilter);
    if (index < 0) return null;
    return { ...rows[index], rank: index + 1, division };
  }, [result, isPublicMode, scheduleTeamFilter, scheduleDivisionFilter, divisionStandings]);

  const publicNextGame = useMemo(() => {
    if (!isPublicMode || scheduleTeamFilter === "all" || !filteredSchedule.length) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = filteredSchedule.find(
      (game) => parseShortDate(game.date) >= today.getTime() && !getOfficialScoreFromReports(game, scoreReports).verified
    );
    return upcoming || filteredSchedule.find((game) => !getOfficialScoreFromReports(game, scoreReports).verified) || filteredSchedule[0] || null;
  }, [isPublicMode, scheduleTeamFilter, filteredSchedule, scoreReports]);

  const publicTeamRecordLabel = useMemo(() => {
    if (!publicSelectedTeamStanding) return "";
    const ties = Number(publicSelectedTeamStanding.ties || 0);
    return ties > 0
      ? `${publicSelectedTeamStanding.wins}-${publicSelectedTeamStanding.losses}-${ties}`
      : `${publicSelectedTeamStanding.wins}-${publicSelectedTeamStanding.losses}`;
  }, [publicSelectedTeamStanding]);

  const shareableTeamUrl = useMemo(() => {
    if (scheduleTeamFilter === "all") return "";
    if (typeof window === "undefined") return "";
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

  const dateDebugRows = useMemo(() => (result ? getDateDebugRows(result, config) : []), [result, config]);
  const lockedGameCount = useMemo(() => getLockedGamesFromSchedule(result?.schedule || []).length, [result]);

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

  function toggleTournamentDivision(division, enabled) {
    setTournamentSetup((prev) => ({
      ...prev,
      divisions: { ...(prev.divisions || {}), [division]: Boolean(enabled) },
    }));
  }

  function updateTournamentFridayStart(court, time) {
    setTournamentSetup((prev) => ({
      ...prev,
      fridayCourtStarts: { ...(prev.fridayCourtStarts || {}), [court]: time },
    }));
  }

  function addTournamentCoachRequest() {
    setTournamentSetup((prev) => ({
      ...prev,
      coachRequests: [...(prev.coachRequests || []), { id: createRowId("tourney_request"), team: "", request: "" }],
    }));
  }

  function updateTournamentCoachRequest(id, patch) {
    setTournamentSetup((prev) => ({
      ...prev,
      coachRequests: (prev.coachRequests || []).map((entry) => entry.id === id ? { ...entry, ...patch } : entry),
    }));
  }

  function removeTournamentCoachRequest(id) {
    setTournamentSetup((prev) => ({
      ...prev,
      coachRequests: (prev.coachRequests || []).filter((entry) => entry.id !== id),
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
    setGridNotice(`Moved ${sourceGame.away} @ ${sourceGame.home} to ${date} ${formatTimeDisplay(time)} ${court}.`);
    setDragState(null);
  }


  function toggleGameLocked(targetGame) {
    if (isPublicMode || !result) return;
    const nextSchedule = result.schedule.map((game) =>
      sameGameKey(game, targetGame) ? { ...game, locked: !game.locked } : { ...game }
    );
    setResult(buildResultFromSchedule(nextSchedule, config, result.unscheduled));
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

    const nextConfig = normalizeConfig(target.config);
    setConfig(nextConfig);
    setResult(null);
    setTournamentSetup(createDefaultTournamentSetup(nextConfig));
    setTournamentResult(null);
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
    const initialConfig = normalizeConfig(createInitialState());
    setConfig(initialConfig);
    setResult(null);
    setTournamentSetup(createDefaultTournamentSetup(initialConfig));
    setTournamentResult(null);
    setScheduleDivisionFilter("all");
    setScheduleTeamFilter("all");
    setActiveTab(isPublicMode ? "schedule" : "setup");
    setPublishNotice("");
    setPublishedMeta(null);
    setAdminScheduleDate("");
    setDragState(null);
    setGridNotice("");
    setSavedSetupName("");
    setScoreReports([]);
    setScoreNotice("");
    setScoreReporterEmail("");
    setScoreReporterTeam(initialTeamParam !== "all" ? initialTeamParam : "");
    setScoreGameId("");
    setScoreForInput("");
    setScoreAgainstInput("");
  }

  function runScheduler() {
    const preseasonConfig = buildPreseasonConfig(config);
    const next = generateScheduleEngine(preseasonConfig, []);
    setResult({
      ...next,
      seasonPhase: 'preseason',
      preseasonTargetGames: { ...(preseasonConfig.divisionGames || {}) },
      fullSeasonTargetGames: { ...(normalizeConfig(config).divisionGames || {}) },
    });
    setScheduleDivisionFilter("all");
    setScheduleTeamFilter("all");
    setActiveTab("schedule");
    setPublishNotice("Preseason schedule generated through the end of December.");
    setDragState(null);
    setGridNotice('');
    if (debugMode) {
      console.groupCollapsed('[COURTrax Debug] Preseason generation');
      console.log('Config snapshot', preseasonConfig);
      console.log('Schedule result', next);
      console.log('Missing teams', (next.auditRows || []).filter((row) => Number(row.games || 0) < Number(row.target || 0)));
      console.groupEnd();
    }
  }

  function runRegularSeasonScheduler() {
    if (!result?.schedule?.length) {
      setPublishNotice('Generate the preseason schedule first.');
      return;
    }

    const preseasonGames = result.schedule.filter((game) => isPreseasonDate(game.date, config));
    if (!preseasonGames.length) {
      setPublishNotice('No preseason games were found to seed the tier split.');
      return;
    }

    const incompletePreseason = preseasonGames.filter((game) => !getOfficialScoreFromReports(game, scoreReports).verified);
    if (incompletePreseason.length) {
      setPublishNotice(`Finish and verify all preseason games first. ${incompletePreseason.length} preseason game${incompletePreseason.length === 1 ? '' : 's'} still need final verified scores.`);
      return;
    }

    const next = generateTieredRegularSeasonEngine(config, result.schedule, scoreReports);
    setResult(next);
    setScheduleDivisionFilter("all");
    setScheduleTeamFilter("all");
    setActiveTab("schedule");
    setPublishNotice('Regular-season games scheduled. Divisions with 12 or more teams were split into Division 1 and Division 2 tiers from the January schedule onward.');
    setDragState(null);
    setGridNotice('');
    if (debugMode) {
      console.groupCollapsed('[COURTrax Debug] January-and-later generation');
      console.log('Config snapshot', config);
      console.log('Regular-season result', next);
      console.log('Missing teams', (next.auditRows || []).filter((row) => Number(row.games || 0) < Number(row.target || 0)));
      console.log('Unscheduled games', next.unscheduled || []);
      console.groupEnd();
    }
  }

  function generateTournamentBrackets() {
    if (!tournamentCanGenerateShell) {
      setPublishNotice(`Finish and verify all preseason games first. Preseason completion: ${preseasonGamesCompleteCount}/${preseasonGamesTotalCount || 0}.`);
      return;
    }
    const next = buildMidseasonTournament(config, tournamentSetup, { seeded: false });
    setTournamentResult(next);
    setActiveTab("tournaments");
    setPublishNotice(`Generated ${next.brackets.length} unseeded tournament bracket shell${next.brackets.length === 1 ? "" : "s"}. Teams can be seeded after all ${tournamentSeedingLockDate} games are verified.`);
  }

  function seedTournamentBrackets() {
    if (!tournamentCanSeedTeams) {
      setPublishNotice(`Teams cannot be seeded yet. Verify all games on ${tournamentSeedingLockDate} first (${tournamentSeedingLockCompleteCount}/${tournamentSeedingLockGames.length || 0} complete).`);
      return;
    }
    const next = buildMidseasonTournament(config, tournamentSetup, {
      seeded: true,
      schedule: result?.schedule || [],
      scoreReports,
    });
    setTournamentResult(next);
    setActiveTab("tournaments");
    setPublishNotice(`Seeded ${next.brackets.length} tournament bracket${next.brackets.length === 1 ? "" : "s"} using standings through ${tournamentSeedingLockDate}.`);
  }

  function randomizeAllScoresForTesting() {
    if (!result?.schedule?.length) {
      setPublishNotice("Generate a schedule first.");
      return;
    }

    const existingReports = normalizeScoreReportsCollection(scoreReports);
    const reportsToAdd = [];

    for (const game of result.schedule) {
      const existingStatus = getOfficialScoreFromReports(game, existingReports);
      if (existingStatus?.verified) continue;

      let homeScore = 20 + Math.floor(Math.random() * 41);
      let awayScore = 20 + Math.floor(Math.random() * 41);
      if (homeScore === awayScore) {
        homeScore += 1;
      }
      reportsToAdd.push({
        id: createRowId("score"),
        gameId: getGameScoreKey(game),
        division: game.division,
        date: game.date,
        time: game.time,
        court: game.court,
        home: game.home,
        away: game.away,
        reportingTeam: game.home,
        reporterEmail: "admin@test.local",
        teamScore: homeScore,
        opponentScore: awayScore,
        approvalMode: false,
        approvalOfReportId: "",
        submittedAt: new Date().toISOString(),
        forfeitTeam: "",
        technicalFouls: [],
        verifiedFinal: true,
        verifiedAt: new Date().toISOString(),
        officialHomeScore: homeScore,
        officialAwayScore: awayScore,
        verificationReason: "Admin random-fill for testing",
      });
    }

    const nextReports = normalizeScoreReportsCollection(
      [...existingReports, ...reportsToAdd]
    );

    setScoreReports(nextReports);
    setScoreNotice(`Filled ${reportsToAdd.length} unscored game${reportsToAdd.length === 1 ? "" : "s"} with random verified final scores for testing. Existing verified scores were preserved.`);
    setPublishNotice("Random testing scores applied in admin only. Publish Schedule if you want them to become live.");
  }

  function saveSandboxState() {
    try {
      const payload = {
        savedAt: new Date().toISOString(),
        config,
        result,
        scoreReports,
        tournamentSetup,
        tournamentResult,
        adminScheduleDate,
        activeTab,
      };
      window.localStorage.setItem(ADMIN_SANDBOX_STORAGE_KEY, JSON.stringify(payload));
      setPublishNotice("Sandbox saved locally in this browser. Published schedule was not changed.");
    } catch (error) {
      console.error("Could not save sandbox", error);
      setPublishNotice("Could not save the sandbox in this browser.");
    }
  }

  function loadSandboxState() {
    try {
      const raw = window.localStorage.getItem(ADMIN_SANDBOX_STORAGE_KEY);
      if (!raw) {
        setPublishNotice("No saved sandbox was found in this browser yet.");
        return;
      }
      const payload = JSON.parse(raw);
      if (payload?.config) setConfig(normalizeConfig(payload.config));
      setResult(payload?.result || null);
      setScoreReports(normalizeScoreReportsCollection(Array.isArray(payload?.scoreReports) ? payload.scoreReports : []));
      if (payload?.tournamentSetup) setTournamentSetup(payload.tournamentSetup);
      setTournamentResult(payload?.tournamentResult || null);
      if (typeof payload?.adminScheduleDate === "string") setAdminScheduleDate(payload.adminScheduleDate);
      if (typeof payload?.activeTab === "string") setActiveTab(payload.activeTab);
      setPublishNotice("Sandbox loaded into admin view. Published schedule was not changed.");
    } catch (error) {
      console.error("Could not load sandbox", error);
      setPublishNotice("Could not load the saved sandbox.");
    }
  }

  async function publishSchedule() {
    if (!result) return;
    const normalizedConfig = normalizeConfig(config);
    const coachDirectory = buildCoachDirectoryFromConfig(normalizedConfig);
    const scheduleGameIds = new Set(result.schedule.map((game) => getGameScoreKey(game)));
    const retainedReports = (Array.isArray(scoreReports) ? scoreReports : []).filter((report) => scheduleGameIds.has(report.gameId));
    const meta = {
      publishedAt: new Date().toLocaleString(),
      totalGames: result.schedule.length,
      verifiedGames: result.schedule.filter((game) => getOfficialScoreFromReports(game, retainedReports).verified).length,
    };
    const ok = await savePublishedPayload({
      result,
      meta,
      scoreReports: retainedReports,
      config: normalizedConfig,
      coachDirectory,
      tournament: tournamentResult || publishedSnapshot?.tournament || null,
    });
    if (ok) {
      setPublishedMeta(meta);
      setScoreReports(retainedReports);
      await refreshPublishedSnapshot();
      setPublishNotice("Schedule published for public view.");
    } else {
      setPublishNotice("Publish failed.");
    }
  }

  async function publishTournament() {
    const tournament = tournamentResult || buildMidseasonTournament(config, tournamentSetup);
    const existing = await loadPublishedPayload();
    const normalizedConfig = normalizeConfig(config);
    const coachDirectory = buildCoachDirectoryFromConfig(normalizedConfig);
    const scheduleResult = existing?.result || result || null;
    const retainedReports = Array.isArray(existing?.scoreReports)
      ? existing.scoreReports
      : Array.isArray(scoreReports)
        ? scoreReports
        : [];
    const meta = {
      ...(existing?.meta || publishedMeta || {}),
      publishedAt: existing?.meta?.publishedAt || new Date().toLocaleString(),
      tournamentPublishedAt: new Date().toLocaleString(),
      tournamentGames: tournament.games.length,
    };

    const ok = await savePublishedPayload({
      result: scheduleResult,
      meta,
      scoreReports: retainedReports,
      config: normalizedConfig,
      coachDirectory,
      tournament,
    });

    if (ok) {
      setTournamentResult(tournament);
      setPublishedMeta(meta);
      await refreshPublishedSnapshot();
      setPublishNotice("Tournament brackets published for public view.");
    } else {
      setPublishNotice("Tournament publish failed.");
    }
  }

  async function updatePublishedCoachInfo() {
    const published = await loadPublishedPayload();
    if (!published?.result) {
      setPublishNotice("Publish the schedule once before updating coach info only.");
      return;
    }

    const normalizedConfig = normalizeConfig(config);
    const publishedConfig = normalizeConfig(published?.config || normalizedConfig);
    const renameMap = buildPublishedTeamRenameMap(normalizedConfig, publishedConfig);
    const coachDirectory = buildCoachDirectoryFromConfig(normalizedConfig);
    const mergedPublishedConfig = {
      ...normalizeConfig(normalizedConfig),
      coachConflicts: remapCoachConflicts(normalizedConfig.coachConflicts, renameMap),
    };
    const updatedResult = {
      ...(published.result || {}),
      schedule: remapPublishedScheduleTeams(published?.result?.schedule, renameMap),
      unscheduled: Array.isArray(published?.result?.unscheduled) ? [...published.result.unscheduled] : [],
      audit: published?.result?.audit || null,
    };
    const updatedScoreReports = remapPublishedScoreReports(published?.scoreReports, renameMap);
    const updatedMeta = published?.meta
      ? {
          ...published.meta,
          publishedAt: published.meta.publishedAt || new Date().toLocaleString(),
          coachInfoUpdatedAt: new Date().toLocaleString(),
        }
      : {
          publishedAt: new Date().toLocaleString(),
          coachInfoUpdatedAt: new Date().toLocaleString(),
          totalGames: Array.isArray(updatedResult.schedule) ? updatedResult.schedule.length : 0,
          verifiedGames: Array.isArray(updatedResult.schedule)
            ? updatedResult.schedule.filter((game) => getOfficialScoreFromReports(game, updatedScoreReports).verified).length
            : 0,
        };

    const ok = await savePublishedPayload({
      result: updatedResult,
      meta: updatedMeta,
      scoreReports: updatedScoreReports,
      config: mergedPublishedConfig,
      coachDirectory,
      tournament: published?.tournament || tournamentResult || null,
    });

    if (ok) {
      setResult(updatedResult);
      setPublishedMeta(updatedMeta);
      setScoreReports(updatedScoreReports);
      setConfig(mergedPublishedConfig);
      await refreshPublishedSnapshot();
      setPublishNotice(Object.keys(renameMap).length ? "Published coach info and team codes updated." : "Published coach info updated.");
    } else {
      setPublishNotice("Could not update published coach info.");
    }
  }

  async function loadPublishedSchedule() {
    const published = await refreshPublishedSnapshot();
    if (published?.result) {
      setResult(published.result);
      setPublishedMeta(published.meta || null);
      setScoreReports(normalizeScoreReportsCollection(Array.isArray(published.scoreReports) ? published.scoreReports : []));
      setTournamentResult(published.tournament || null);
      if (published.config || published.coachDirectory) {
        setConfig(applyCoachDirectoryToConfig(published.config || config, getPublishedCoachDirectory(published, config)));
      }
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
      setPublishedSnapshot(null);
      setScoreReports([]);
      setTournamentResult(null);
      if (isPublicMode) setResult(null);
      setPublishNotice("Published schedule cleared.");
    } else {
      setPublishNotice("Could not clear published schedule.");
    }
  }

 async function sendScoreConfirmationEmail(
  game,
  report,
  approvalMode = false,
  verification = null,
  extraEmails = [],
  options = {}
) {
  try {
    const published = await loadPublishedPayload();
    const lookupConfig = normalizeConfig(published?.config || config);
    const coachDirectory = getPublishedCoachDirectory(published, lookupConfig);
    const homeCoachEmail = getCoachEmailForTeamFromDirectory(coachDirectory, lookupConfig, game.home, game.division);
    const awayCoachEmail = getCoachEmailForTeamFromDirectory(coachDirectory, lookupConfig, game.away, game.division);

    const response = await fetch("/api/score-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: getGameScoreKey(game),
        division: game.division,
        date: game.date,
        time: game.time,
        court: game.court,
        home: game.home,
        away: game.away,
        homeCoachEmail,
        awayCoachEmail,
        coachDirectory,
        reporterEmail: report.reporterEmail,
        reportingTeam: report.reportingTeam,
        teamScore: report.teamScore,
        opponentScore: report.opponentScore,
        approvalMode,
        submittedAt: report.submittedAt,
        notifyEmails: extraEmails,
        verified: Boolean(verification?.verified && verification?.official),
        officialHomeScore: verification?.official?.homeScore ?? null,
        officialAwayScore: verification?.official?.awayScore ?? null,
        verificationReason: verification?.reportSummary || "",
        reminderOnly: Boolean(options?.reminderOnly),
        reminderTeam: options?.reminderTeam || "",
        reportId: report?.id || "",
      }),
    });

    const data = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      error: data?.error || "",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown request error",
    };
  }
}

  async function sendPendingApprovalReminder(game) {
    if (!game) return;

    const published = await loadPublishedPayload();
    const payloadResult = published?.result || result;
    const currentGameInPayload = (payloadResult?.schedule || []).find(
      (entry) => getGameScoreKey(entry) === getGameScoreKey(game)
    ) || game;
    const existingReports = Array.isArray(published?.scoreReports) ? published.scoreReports : [];
    const status = getOfficialScoreFromReports(currentGameInPayload, existingReports);

    if (status?.verified) {
      setScoreNotice("That score is already verified.");
      return;
    }

    if (status?.status !== "awaiting_opponent") {
      setScoreNotice("Reminder emails can only be sent when one coach is still missing.");
      return;
    }

    const pendingTeam = !status.homeReport ? currentGameInPayload.home : (!status.awayReport ? currentGameInPayload.away : "");
    const existingReport = status.homeReport || status.awayReport;

    if (!pendingTeam || !existingReport) {
      setScoreNotice("Could not determine which coach still needs to approve this score.");
      return;
    }

    const emailResult = await sendScoreConfirmationEmail(
      currentGameInPayload,
      existingReport,
      Boolean(existingReport.approvalMode),
      status,
      [],
      { reminderOnly: true, reminderTeam: pendingTeam }
    );

    if (emailResult?.ok) {
      setScoreNotice(`Reminder email sent to ${pendingTeam}.`);
    } else {
      setScoreNotice(`Reminder email failed${emailResult?.error ? `: ${emailResult.error}` : "."}`);
    }
  }


  function getAdminSuggestedOfficialScore(game, reports) {
    const status = getOfficialScoreFromReports(game, reports);
    if (status?.verified && status?.official) {
      return {
        homeScore: Number(status.official.homeScore),
        awayScore: Number(status.official.awayScore),
        reason: status.reportSummary || "Admin edited verified score.",
      };
    }

    const latest = getLatestGameReportsByTeam(game, reports || []);
    const normalizedHome = latest.homeReport ? normalizeScoreReportForGame(game, latest.homeReport) : null;
    const normalizedAway = latest.awayReport ? normalizeScoreReportForGame(game, latest.awayReport) : null;
    const normalized = normalizedHome || normalizedAway;

    return {
      homeScore: normalized ? Number(normalized.homeScore) : 0,
      awayScore: normalized ? Number(normalized.awayScore) : 0,
      reason: status?.verified ? (status.reportSummary || "Admin edited verified score.") : "Admin verified score.",
    };
  }

  async function adminVerifyOrEditScore(game, options = {}) {
    if (!game || isPublicMode) return;

    const published = await loadPublishedPayload();
    const payloadResult = published?.result || result;
    const currentGameInPayload = (payloadResult?.schedule || []).find(
      (entry) => getGameScoreKey(entry) === getGameScoreKey(game)
    ) || game;
    const existingReports = Array.isArray(published?.scoreReports) ? published.scoreReports : [];
    const status = getOfficialScoreFromReports(currentGameInPayload, existingReports);
    const suggested = getAdminSuggestedOfficialScore(currentGameInPayload, existingReports);

    const homeLabel = currentGameInPayload.home;
    const awayLabel = currentGameInPayload.away;
    const promptPrefix = options?.editOnly || status?.verified
      ? "Enter the corrected final score for this verified game."
      : "Enter the official final score to verify this game as admin.";

    const homeInput = typeof window === "undefined"
      ? String(suggested.homeScore)
      : window.prompt(`${promptPrefix}\n\nHome team: ${homeLabel}`, String(suggested.homeScore));
    if (homeInput === null) return;

    const awayInput = typeof window === "undefined"
      ? String(suggested.awayScore)
      : window.prompt(`${promptPrefix}\n\nAway team: ${awayLabel}`, String(suggested.awayScore));
    if (awayInput === null) return;

    const officialHomeScore = parseNumericScore(homeInput);
    const officialAwayScore = parseNumericScore(awayInput);
    if (officialHomeScore === null || officialAwayScore === null) {
      setScoreNotice("Enter non-negative whole-number scores for the admin override.");
      return;
    }

    const defaultReason = status?.verified
      ? "Admin edited verified score."
      : "Admin verified score.";
    const reasonInput = typeof window === "undefined"
      ? defaultReason
      : window.prompt("Optional verification note", suggested.reason || defaultReason);
    if (reasonInput === null) return;
    const verificationReason = String(reasonInput || defaultReason).trim() || defaultReason;

    const adminReport = {
      id: createRowId("score"),
      gameId: getGameScoreKey(currentGameInPayload),
      division: currentGameInPayload.division,
      date: currentGameInPayload.date,
      time: currentGameInPayload.time,
      court: currentGameInPayload.court,
      home: currentGameInPayload.home,
      away: currentGameInPayload.away,
      reportingTeam: "__ADMIN_OVERRIDE__",
      reporterEmail: "admin-override@local",
      teamScore: officialHomeScore,
      opponentScore: officialAwayScore,
      approvalMode: false,
      approvalOfReportId: "",
      submittedAt: new Date().toISOString(),
      verifiedFinal: true,
      verifiedAt: new Date().toISOString(),
      officialHomeScore,
      officialAwayScore,
      verificationReason,
      adminOverride: true,
      technicalFouls: [],
    };

    const nextReports = existingReports
      .filter((report) => !(report.gameId === adminReport.gameId && report.adminOverride))
      .map((report) =>
        report.gameId === adminReport.gameId
          ? {
              ...report,
              verifiedFinal: true,
              verifiedAt: adminReport.verifiedAt,
              officialHomeScore,
              officialAwayScore,
              verificationReason,
            }
          : report
      );
    nextReports.push(adminReport);

    const lookupConfig = normalizeConfig(published?.config || config);
    const coachDirectory = getPublishedCoachDirectory(published, lookupConfig);

    const ok = await savePublishedPayload({
      result: payloadResult,
      meta: published?.meta || publishedMeta || null,
      scoreReports: nextReports,
      config: lookupConfig,
      coachDirectory,
      tournament: published?.tournament || tournamentResult || null,
    });

    if (!ok) {
      setScoreNotice("Could not save the admin verified score.");
      return;
    }

    setScoreReports(normalizeScoreReportsCollection(nextReports));

    const verificationStatus = {
      verified: true,
      official: { homeScore: officialHomeScore, awayScore: officialAwayScore },
      reportSummary: verificationReason,
    };

    const emailResult = await sendScoreConfirmationEmail(
      currentGameInPayload,
      adminReport,
      false,
      verificationStatus
    );

    const emailNote = emailResult?.ok
      ? " Notification email sent."
      : ` Notification email failed${emailResult?.error ? `: ${emailResult.error}` : "."}`;

    setScoreNotice(
      status?.verified
        ? `Verified score updated by admin: ${currentGameInPayload.away} ${officialAwayScore} - ${officialHomeScore} ${currentGameInPayload.home}.${emailNote}`
        : `Score verified by admin: ${currentGameInPayload.away} ${officialAwayScore} - ${officialHomeScore} ${currentGameInPayload.home}.${emailNote}`
    );
  }

  async function adminEditTechnicalFoul(technicalRow) {
    if (!technicalRow || isPublicMode) return;

    const published = await loadPublishedPayload();
    const payloadResult = published?.result || result;
    const existingReports = normalizeScoreReportsCollection(Array.isArray(published?.scoreReports) ? published.scoreReports : scoreReports);

    const teamInput = typeof window === "undefined"
      ? technicalRow.team
      : window.prompt("Team charged with the technical", technicalRow.team || "");
    if (teamInput === null) return;

    const playerNumberInput = typeof window === "undefined"
      ? technicalRow.playerNumber
      : window.prompt("Player number (99 = coach/bench, 98 = fan)", technicalRow.playerNumber || "");
    if (playerNumberInput === null) return;

    const descriptionInput = typeof window === "undefined"
      ? technicalRow.description
      : window.prompt("Description (admin-only)", technicalRow.description || "");
    if (descriptionInput === null) return;

    const currentFlagrant = technicalRow.flagrant ? "yes" : "no";
    const flagrantInput = typeof window === "undefined"
      ? currentFlagrant
      : window.prompt("Flagrant? Enter yes or no", currentFlagrant);
    if (flagrantInput === null) return;

    const normalizedFlagrant = ["yes", "y", "true", "1", "flagrant"].includes(String(flagrantInput).trim().toLowerCase());

    const updatedReports = existingReports.map((report) =>
      report.id !== technicalRow.reportId
        ? report
        : {
            ...report,
            technicalFouls: (Array.isArray(report.technicalFouls) ? report.technicalFouls : []).map((entry) =>
              entry.id !== technicalRow.id
                ? entry
                : {
                    ...entry,
                    team: String(teamInput || "").trim(),
                    playerNumber: String(playerNumberInput || "").trim(),
                    description: String(descriptionInput || "").trim(),
                    flagrant: normalizedFlagrant,
                  }
            ),
          }
    );

    const ok = await savePublishedPayload({
      result: payloadResult,
      meta: published?.meta || publishedMeta || null,
      scoreReports: updatedReports,
      config: normalizeConfig(published?.config || config),
      coachDirectory: getPublishedCoachDirectory(published, normalizeConfig(published?.config || config)),
      tournament: published?.tournament || tournamentResult || null,
    });

    if (!ok) {
      setScoreNotice("Could not save the technical foul edit.");
      return;
    }

    setScoreReports(normalizeScoreReportsCollection(updatedReports));
    setScoreNotice("Technical foul updated.");
  }

  async function adminDeleteTechnicalFoul(technicalRow) {
    if (!technicalRow || isPublicMode) return;
    const shouldDelete = typeof window === "undefined" ? true : window.confirm(`Delete technical foul for ${technicalRow.team || "team"} #${technicalRow.playerNumber || "?"}?`);
    if (!shouldDelete) return;

    const published = await loadPublishedPayload();
    const payloadResult = published?.result || result;
    const existingReports = normalizeScoreReportsCollection(Array.isArray(published?.scoreReports) ? published.scoreReports : scoreReports);

    const updatedReports = existingReports.map((report) =>
      report.id !== technicalRow.reportId
        ? report
        : {
            ...report,
            technicalFouls: (Array.isArray(report.technicalFouls) ? report.technicalFouls : []).filter((entry) => entry.id !== technicalRow.id),
          }
    );

    const ok = await savePublishedPayload({
      result: payloadResult,
      meta: published?.meta || publishedMeta || null,
      scoreReports: updatedReports,
      config: normalizeConfig(published?.config || config),
      coachDirectory: getPublishedCoachDirectory(published, normalizeConfig(published?.config || config)),
      tournament: published?.tournament || tournamentResult || null,
    });

    if (!ok) {
      setScoreNotice("Could not delete the technical foul.");
      return;
    }

    setScoreReports(normalizeScoreReportsCollection(updatedReports));
    setScoreNotice("Technical foul deleted.");
  }

  async function adminSetTechnicalReturnGame(row, returnGameId) {
    if (!row || isPublicMode) return;

    const published = await loadPublishedPayload();
    const payloadResult = published?.result || result;
    const existingReports = normalizeScoreReportsCollection(
      Array.isArray(published?.scoreReports) ? published.scoreReports : scoreReports
    );
    const normalizedReturnGameId = String(returnGameId || "").trim();

    const updatedReports = existingReports.map((report) => ({
      ...report,
      technicalFouls: (Array.isArray(report.technicalFouls) ? report.technicalFouls : []).map((entry) => {
        const normalizedEntry = normalizeTechnicalFoulEntry(entry);
        if (
          String(normalizedEntry.team || "").trim() !== String(row.team || "").trim() ||
          String(normalizedEntry.playerNumber || "").trim() !== String(row.playerNumber || "").trim()
        ) {
          return normalizedEntry;
        }
        return {
          ...normalizedEntry,
          suspensionReturnGameId: normalizedReturnGameId,
        };
      }),
    }));

    const normalizedConfig = normalizeConfig(published?.config || config);
    const ok = await savePublishedPayload({
      result: payloadResult,
      meta: published?.meta || publishedMeta || null,
      scoreReports: updatedReports,
      config: normalizedConfig,
      coachDirectory: getPublishedCoachDirectory(published, normalizedConfig),
      tournament: published?.tournament || tournamentResult || null,
    });

    if (!ok) {
      setScoreNotice("Could not save the suspension return game.");
      return;
    }

    setScoreReports(normalizeScoreReportsCollection(updatedReports));
    setScoreNotice(
      normalizedReturnGameId
        ? `Eligible return game saved for ${row.team} #${row.playerNumber}.`
        : `Eligible return game cleared for ${row.team} #${row.playerNumber}.`
    );
  }


  async function submitScoreReport() {
    if (!result) return;

    const reporterEmail = String(scoreReporterEmail || "").trim().toLowerCase();
    if (!reporterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
      setScoreNotice("Enter a valid coach email.");
      return;
    }

    if (!scoreReporterDivision) {
      setScoreNotice("Choose a division first.");
      return;
    }

    if (!scoreReporterTeam) {
      setScoreNotice("Choose a reporting team first.");
      return;
    }

    const game = selectedScoreGame;
    if (!game) {
      setScoreNotice("Choose a game to report.");
      return;
    }

    if (game.division !== scoreReporterDivision) {
      setScoreNotice("That game does not belong to the selected division.");
      return;
    }

    if (game.home !== scoreReporterTeam && game.away !== scoreReporterTeam) {
      setScoreNotice("That game does not belong to the selected team.");
      return;
    }

    const published = await loadPublishedPayload();
    const lookupConfig = normalizeConfig(published?.config || config);
    const coachDirectory = getPublishedCoachDirectory(published, lookupConfig);

    const expectedReporterEmail = getCoachEmailForTeamFromDirectory(
      coachDirectory,
      lookupConfig,
      scoreReporterTeam,
      scoreReporterDivision
    );

    if (!expectedReporterEmail) {
      setScoreNotice("That team does not have a coach email configured yet. Ask the admin to add it in Setup, then use Update Coach Info Only.");
      return;
    }

    if (reporterEmail !== expectedReporterEmail) {
      setScoreNotice(`That email does not match the saved coach email for ${scoreReporterTeam}.`);
      return;
    }

    const payloadResult = published?.result || result;
    const currentGameInPayload = (payloadResult?.schedule || []).find(
      (entry) => getGameScoreKey(entry) === getGameScoreKey(game)
    ) || game;
    const existingReports = Array.isArray(published?.scoreReports) ? published.scoreReports : [];
    const existingStatus = getOfficialScoreFromReports(currentGameInPayload, existingReports);
    if (existingStatus?.verified) {
      setScoreNotice("That score has already been verified and is locked.");
      return;
    }

    const existingReportsForGame = existingReports.filter(
      (report) => report.gameId === getGameScoreKey(currentGameInPayload)
    );

    const ownExistingReport = existingReportsForGame.find(
      (report) =>
        report.reportingTeam === scoreReporterTeam &&
        String(report.reporterEmail || "").trim().toLowerCase() === reporterEmail
    );

    if (ownExistingReport) {
      setScoreNotice("You already submitted a score for this game. It is locked pending verification.");
      return;
    }

    const opponentExistingReport = existingReportsForGame.find(
      (report) => report.reportingTeam !== scoreReporterTeam
    );

    if (opponentExistingReport && !scoreApproveExisting) {
      setScoreNotice("A score has already been reported for this game. Use Approve existing score.");
      return;
    }

    const isForfeit = Boolean(scoreForfeitTeam) && (scoreForfeitTeam === game.home || scoreForfeitTeam === game.away);

    let teamScore = null;
    let opponentScore = null;
    let verificationOverride = null;

    if (isForfeit) {
      const forfeitingTeam = scoreForfeitTeam;
      const winningTeam = forfeitingTeam === game.home ? game.away : game.home;
      const officialHomeScore = forfeitingTeam === game.home ? 0 : 15;
      const officialAwayScore = forfeitingTeam === game.away ? 0 : 15;
      teamScore = scoreReporterTeam === game.home ? officialHomeScore : officialAwayScore;
      opponentScore = scoreReporterTeam === game.home ? officialAwayScore : officialHomeScore;
      verificationOverride = {
        verified: true,
        official: {
          homeScore: officialHomeScore,
          awayScore: officialAwayScore,
        },
        reportSummary: `Forfeit by ${forfeitingTeam}; ${winningTeam} awarded a 15-0 win.`,
      };
    } else if (scoreApproveExisting && selectedScoreApprovalContext.canApprove && selectedScoreApprovalContext.approvalScores) {
      teamScore = selectedScoreApprovalContext.approvalScores.teamScore;
      opponentScore = selectedScoreApprovalContext.approvalScores.opponentScore;
    } else {
      teamScore = parseNumericScore(scoreForInput);
      opponentScore = parseNumericScore(scoreAgainstInput);
      if (teamScore === null || opponentScore === null) {
        setScoreNotice("Enter non-negative whole-number scores.");
        return;
      }
    }

    const sanitizedTechnicalFouls = scoreHasTechnicalFouls ? buildSanitizedTechnicalFouls(scoreTechnicalFouls) : [];

    if (scoreHasTechnicalFouls && !sanitizedTechnicalFouls.length) {
      setScoreNotice("Fill out each technical foul with team, player number, and description, or uncheck Technical Fouls?.");
      return;
    }

    const nextReport = normalizeScoreReportEntry({
      id: createRowId("score"),
      gameId: getGameScoreKey(game),
      division: game.division,
      date: game.date,
      time: game.time,
      court: game.court,
      home: game.home,
      away: game.away,
      reportingTeam: scoreReporterTeam,
      reporterEmail,
      teamScore,
      opponentScore,
      approvalMode: Boolean(scoreApproveExisting && selectedScoreApprovalContext.canApprove),
      approvalOfReportId: scoreApproveExisting ? (selectedScoreApprovalContext.opponentReport?.id || "") : "",
      submittedAt: new Date().toISOString(),
      forfeitTeam: isForfeit ? scoreForfeitTeam : "",
      technicalFouls: sanitizedTechnicalFouls,
    });

    let nextReports = [...existingReports, nextReport];

    const status = verificationOverride || getOfficialScoreFromReports(game, nextReports);
    if (status.verified && status.official) {
      const verifiedAt = new Date().toISOString();
      nextReports = nextReports.map((report) =>
        report.gameId === nextReport.gameId
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

    const ok = await savePublishedPayload({
      result: payloadResult,
      meta: published?.meta || publishedMeta || null,
      scoreReports: nextReports,
      config: lookupConfig,
      coachDirectory,
      tournament: published?.tournament || tournamentResult || null,
    });

    if (ok) {
      setScoreReports(normalizeScoreReportsCollection(nextReports));
      setScoreForInput("");
      setScoreAgainstInput("");
      setScoreApproveExisting(false);
      setScoreHasTechnicalFouls(false);
      setScoreTechnicalFouls([]);

      const emailResult = await sendScoreConfirmationEmail(
        game,
        nextReport,
        nextReport.approvalMode,
        status
      );

      const emailNote = emailResult?.ok
        ? " Confirmation email sent."
        : ` Confirmation email failed${emailResult?.error ? `: ${emailResult.error}` : "."}`;

      setScoreNotice(
        status.verified
          ? `Score saved and verified: ${game.away} ${status.official.awayScore} - ${status.official.homeScore} ${game.home}.${emailNote}`
          : `Score saved.${emailNote} Waiting for the other coach or a closer matching report.`
      );
    } else {
      setScoreNotice("Could not save the score report.");
    }
  }

  function handleStandingsSort(nextKey) {
    setStandingsSort((current) => {
      if (current.key === nextKey) {
        return {
          key: nextKey,
          direction: current.direction === "desc" ? "asc" : "desc",
        };
      }

      return {
        key: nextKey,
        direction: nextKey === "team" ? "asc" : "desc",
      };
    });
  }

  function getSortedStandingsRows(rows) {
    return [...(rows || [])].sort((a, b) =>
      compareStandingsRows(a, b, standingsSort.key, standingsSort.direction)
    );
  }

  function renderStandingsHeader(label, key, align = "center") {
    const isActive = standingsSort.key === key;
    const arrow = isActive ? (standingsSort.direction === "desc" ? " ▼" : " ▲") : "";
    const tooltipMap = {
      Team: "Team name",
      W: "Wins",
      L: "Losses",
      T: "Ties",
      "Win %": "Win Percentage",
      PF: "Points For",
      PA: "Points Against",
      PD: "Point Differential",
      SOS: "Strength of Schedule rank (#1 is hardest schedule)",
      PR: "Performance Rating (iterative opponent-adjusted game rating)",
    };
    const tooltip = label === "PR"
      ? "Performance Rating (iterative opponent-adjusted game rating)"
      : tooltipMap[label] || label;
    return (
      <th
        style={{ ...styles.th, textAlign: align, cursor: "pointer", userSelect: "none" }}
        onClick={() => handleStandingsSort(key)}
        title={`${tooltip} — click to sort`}
      >
        {label}{arrow}
      </th>
    );
  }


  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={styles.headerHeroWrap}>
            <img src={APP_HEADER} alt="COURTrax" style={styles.headerHeroImage} />
          </div>
          {!isPublicMode ? (
            <div style={{ ...styles.row, justifyContent: "center" }}>
              <button style={styles.button} onClick={resetAll}>Reset</button>
              <button style={styles.primaryButton} onClick={runScheduler}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Wand2 size={16} /> Generate Preseason Schedule
                </span>
              </button>
              <button style={styles.button} onClick={runRegularSeasonScheduler} disabled={!result || preseasonGamesTotalCount === 0 || preseasonGamesCompleteCount < preseasonGamesTotalCount}>
                Schedule Jan-and-Later Games
              </button>
              <button style={styles.button} onClick={randomizeAllScoresForTesting} disabled={!result || !result?.schedule?.length}>Fill All Scores (Test)</button>
              <button style={styles.button} onClick={saveSandboxState}>Save Sandbox</button>
              <button style={styles.button} onClick={loadSandboxState}>Load Sandbox</button>
              <button style={debugMode ? styles.successButton : styles.button} onClick={() => setDebugMode((prev) => !prev)}>{debugMode ? "Debug Mode: On" : "Debug Mode: Off"}</button>
              {lockedGameCount ? <span style={styles.badge}>{lockedGameCount} locked game{lockedGameCount === 1 ? "" : "s"}</span> : null}
              <button style={styles.successButton} onClick={publishSchedule} disabled={!result}>Publish Schedule</button>
              <button style={styles.button} onClick={updatePublishedCoachInfo}>Update Coach Info Only</button>
              <button style={styles.button} onClick={loadPublishedSchedule}>Load Published</button>
              <button style={styles.dangerButton} onClick={clearPublishedSchedule}>Clear Published</button>
            </div>
          ) : null}
        </div>

        {publishNotice ? <div style={styles.publishBanner}>{publishNotice}</div> : null}
        {publishedMeta ? (
          <div style={styles.publishBanner}>Published schedule: {publishedMeta.totalGames} games. Last published {publishedMeta.publishedAt}.</div>
        ) : null}

        {!isPublicMode ? (
          <div style={styles.publishBanner}>
            Current scheduling flow: preseason games are generated only through {preseasonEndLabel}. Preseason completion: {preseasonGamesCompleteCount}/{preseasonGamesTotalCount || 0} verified. After that, admin can schedule the remaining January-and-later games, and any division with 12 or more teams will split into Division 1 and Division 2 tiers based on the standings at that point.
          </div>
        ) : null}

        {!isPublicMode && debugMode ? (
          <div style={{ ...styles.publishBanner, border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e' }}>
            Debug Mode is on. The Admin debug tab now shows missing-team tables, per-division scheduling totals, and the scheduler will write detailed snapshots to the browser console each time you generate preseason or January-and-later games.
          </div>
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
          <div style={styles.publicBanner}>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}></div>
                  <div style={{ color: "#334155" }}>Browse published games, check standings, and report final scores.</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ ...styles.badge, background: "#dbeafe", color: "#1d4ed8" }}>Schedule</span>
                  <span style={{ ...styles.badge, background: "#dcfce7", color: "#166534" }}>Standings</span>
                  <span style={{ ...styles.badge, background: "#fef3c7", color: "#92400e" }}>Score Reporting</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div style={styles.publicStatCard}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Published games</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{result?.schedule?.length || 0}</div>
                </div>
                <div style={styles.publicStatCard}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Verified scores</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{result?.schedule?.filter((game) => getOfficialScoreFromReports(game, scoreReports).verified).length || 0}</div>
                </div>
                <div style={styles.publicStatCard}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Active divisions</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{publicDivisionOptions.length}</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isPublicMode ? (
          <div
            style={{
              ...styles.publicGraphicTabs,
              gridTemplateColumns: isMobilePublic
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(5, minmax(0, 1fr))",
              gap: isMobilePublic ? 12 : 10,
              maxWidth: isMobilePublic ? 560 : 1100,
            }}
          >
            {(isMobilePublic
              ? [
                  ["schedule", PUBLIC_BTN_SCHEDULE, "Schedule"],
                  ["standings", PUBLIC_BTN_STANDINGS, "Standings"],
                  ["score_reporting", PUBLIC_BTN_SCORE_REPORTING, "Score Reporting"],
                  ["technicals", PUBLIC_BTN_TECHNICALS, "Technicals"],
                  ["tournaments", PUBLIC_BTN_TOURNAMENTS, "Tournaments"],
                ]
              : [
                  ["schedule", PUBLIC_BTN_SCHEDULE, "Schedule"],
                  ["tournaments", PUBLIC_BTN_TOURNAMENTS, "Tournaments"],
                  ["standings", PUBLIC_BTN_STANDINGS, "Standings"],
                  ["score_reporting", PUBLIC_BTN_SCORE_REPORTING, "Score Reporting"],
                  ["technicals", PUBLIC_BTN_TECHNICALS, "Technicals"],
                ]).map(([key, src, label]) => {
              const active = activeTab === key;
              const isTournamentMobileRow = isMobilePublic && key === "tournaments";
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={label}
                  title={label}
                  style={{
                    ...styles.publicGraphicTabButton,
                    ...(active ? styles.publicGraphicTabButtonActive : {}),
                    ...(isTournamentMobileRow ? { gridColumn: "1 / -1", maxWidth: 260 } : {}),
                  }}
                  onClick={() => setActiveTab(key)}
                  onMouseEnter={(e) => {
                    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
                      e.currentTarget.style.transform = active ? 'translateY(-3px) scale(1.02)' : 'translateY(-4px) scale(1.03)';
                      e.currentTarget.style.boxShadow = active
                        ? '0 16px 28px rgba(234,88,12,0.42)'
                        : '0 14px 24px rgba(15,23,42,0.28)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = active
                      ? styles.publicGraphicTabButtonActive.boxShadow
                      : styles.publicGraphicTabButton.boxShadow;
                  }}
                >
                  <img
                    src={src}
                    alt={label}
                    style={{
                      ...styles.publicGraphicTabImage,
                      maxWidth: isMobilePublic
                        ? (isTournamentMobileRow ? 250 : 190)
                        : 175,
                    }}
                  />
                </button>
              );
            })}
          </div>
        ) : (
          <div style={styles.tabBarAdmin}>
            {[["setup", "Setup"], ["schedule", "Schedule Views"], ["tournaments", "Tournaments"], ["audit", "Audit"], ["debug", "Repeat Debug"], ["issues", "Issues"], ["technicals", "Technicals"]].map(([key, label]) => (
              <button key={key} style={activeTab === key ? styles.tabButtonActive : styles.tabButton} onClick={() => setActiveTab(key)}>
                {label}
              </button>
            ))}
          </div>
        )}

        {activeTab === "setup" && !isPublicMode ? (
          <div style={styles.grid2}>
            <div style={{ display: "grid", gap: 24, alignContent: "start", alignSelf: "start" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <SectionTitle icon={Settings}>Core Rules</SectionTitle>
                  <button style={styles.button} onClick={() => setShowCoreRules((prev) => !prev)}>
                    {showCoreRules ? "Hide" : "Show"}
                  </button>
                </div>
                {showCoreRules ? (
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
                ) : (
                  <div style={{ fontSize: 13, color: "#64748b" }}>Core Rules are hidden.</div>
                )}
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
                              gridTemplateColumns: "40px 90px 60px 140px 120px 1fr",
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
			    <div>Coach email</div>
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

                            const previewName = buildFormattedTeamName(division, entry, idx + 1, count);

                            return (
                              <div
                                key={`${division}-${idx}`}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "40px 90px 60px 140px 120px 1fr",
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
                                  {Array.from({ length: count }, (_, n) => n + 1)
                                    .sort((a, b) => a - b)
                                    .map((num) => (
                                      <option
                                        key={num}
                                        value={String(num)}
                                        disabled={associationCode && usedNumbers.includes(String(num))}
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

                                <input
                                  style={{ ...styles.input, maxWidth: 120 }}
                                  value={entry.coachEmail || ""}
                                  placeholder="coach@email.com"
                                  onChange={(e) =>
                                    updateDivisionTeamDetail(division, idx, {
                                      coachEmail: e.target.value.trim().toLowerCase(),
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
                        {DEFAULT_TIMES.map((time) => <option key={time} value={time}>{formatTimeDisplay(time)} start</option>)}
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
                    onClick={() => exportCsv("filtered_schedule.csv", [["Division", "Date", "Time", "Court", "Home", "Away", "Score"], ...filteredSchedule.map((g) => [g.division, g.date, formatTimeDisplay(g.time), g.court, g.home, g.away, getGameScoreDisplay(g, scoreReports)])])}
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
                          {getDateTargetForSchedule(config, adminScheduleDate) > 0 ? (
                            <span style={adminScheduleGameCount >= getDateTargetForSchedule(config, adminScheduleDate) ? styles.badge : styles.badgeDanger}>
                              target {getDateTargetForSchedule(config, adminScheduleDate)}
                            </span>
                          ) : (
                            <span style={styles.badge}>excluded from min/week</span>
                          )}
                          {lockedGameCount ? <span style={styles.badge}>{lockedGameCount} locked</span> : null}
                        </div>
                        <select style={styles.select} value={adminScheduleDate} onChange={(e) => setAdminScheduleDate(e.target.value)}>
                          {config.saturdays.filter((entry) => entry.enabled).map((entry) => <option key={entry.date} value={entry.date}>{entry.date}</option>)}
                        </select>
                      </div>
                      <div style={{ fontSize: 14, color: "#475569" }}>
                        Drag a scheduled game to another open slot on this date to manually adjust the grid. Use the lock buttons in the schedule list below, then regenerate to rebuild around those fixed games. The drop is blocked if it would break daily limits, 8:00 caps, or same-court back-to-back doubleheader rules.
                      </div>
                    </div>
                    <div style={{ marginBottom: 16, border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 12, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 700 }}>Date targets</div>
                        <button style={styles.button} onClick={() => setDateDebugExpanded((v) => !v)}>{dateDebugExpanded ? 'Hide' : 'Show'}</button>
                      </div>
                      {dateDebugExpanded ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }}>
                          {dateDebugRows.map((row) => (
                            <div key={row.date} style={{ border: `1px solid ${row.meetsTarget ? '#bbf7d0' : '#fecaca'}`, background: row.meetsTarget ? '#f0fdf4' : '#fef2f2', borderRadius: 10, padding: 10 }}>
                              <div style={{ fontWeight: 700, marginBottom: 4 }}>{row.date}</div>
                              <div style={{ fontSize: 13, color: '#475569' }}>Actual: <strong style={{ color: '#0f172a' }}>{row.actual}</strong></div>
                              <div style={{ fontSize: 13, color: '#475569' }}>Target: <strong style={{ color: '#0f172a' }}>{row.included ? row.target : '—'}</strong></div>
                              <div style={{ fontSize: 12, marginTop: 4, color: row.meetsTarget ? '#166534' : '#991b1b' }}>
                                {row.included ? (row.meetsTarget ? 'At or above minimum' : `${Math.abs(row.delta)} below minimum`) : 'Excluded from weekly minimum'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
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
                              <td style={styles.td}><strong>{formatTimeDisplay(row.time)}</strong></td>
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                          <div>{cellGame.away} @ {cellGame.home}</div>
                                          {cellGame.locked ? <span style={{ ...styles.badge, alignSelf: 'flex-start' }}>Locked</span> : null}
                                        </div>
                                        <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>{getGameScoreDisplay(cellGame, scoreReports)}</div>
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

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isPublicMode
                      ? (isMobilePublic ? "1fr" : "repeat(3, minmax(0,1fr))")
                      : "220px 280px 1fr",
                    gap: 16,
                    marginBottom: 16
                  }}
                >
                  <div style={isPublicMode ? styles.publicFilterCard : undefined}>
                    <label style={styles.smallLabel}>{isPublicMode ? "Division" : "Filter by division"}</label>
                    <select style={styles.select} value={scheduleDivisionFilter} onChange={(e) => { setScheduleDivisionFilter(e.target.value); setScheduleTeamFilter("all"); }}>
                      <option value="all">All divisions</option>
                      {DIVISIONS.map((division) => <option key={division} value={division}>{division}</option>)}
                    </select>
                  </div>
                  <div style={isPublicMode ? styles.publicFilterCard : undefined}>
                    <label style={styles.smallLabel}>{isPublicMode ? "My Team" : "Filter by team"}</label>
                    <select style={styles.select} value={scheduleTeamFilter} onChange={(e) => setScheduleTeamFilter(e.target.value)}>
                      <option value="all">All teams</option>
                      {availableScheduleTeams.map((team) => <option key={team} value={team}>{team}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "stretch", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, background: isPublicMode ? "#ffffff" : "#f8fafc", padding: "12px 16px", fontSize: 14, color: "#475569", flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{isPublicMode ? "Current view" : "View summary"}</div>
                      Showing <strong style={{ color: "#0f172a" }}>{filteredSchedule.length}</strong> games
                      {scheduleTeamFilter !== "all" ? (
                        <div style={{ marginTop: 8, color: "#1d4ed8", fontWeight: 600 }}>
                          My Team view for <strong>{scheduleTeamFilter}</strong>
                        </div>
                      ) : null}
                      {isPublicMode && publicSelectedTeamStanding ? (
                        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ ...styles.badge, background: "#dbeafe", color: "#1d4ed8" }}>Rank #{publicSelectedTeamStanding.rank}</span>
                          <span style={{ ...styles.badge, background: "#dcfce7", color: "#166534" }}>Record {publicTeamRecordLabel}</span>
                          <span style={styles.badge}>PR {Number(publicSelectedTeamStanding.performanceRating || 0).toFixed(1)}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>


                {isPublicMode && publicNextGame ? (
  <div style={{ ...styles.publicNextGameCard, marginBottom: 16 }}>
    
     <div
        style={{
          fontSize: 12,
          color: "#1d4ed8",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginBottom: 6,
          textAlign: "left", // 🔑 key fix
        }}
      >
        Next game
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
            {publicNextGame.away} @ {publicNextGame.home}
          </div>
          <div style={{ fontSize: 14, color: "#334155", marginTop: 4 }}>
            {publicNextGame.date} • {formatTimeDisplay(publicNextGame.time)} • {publicNextGame.court}
          </div>
        </div>

        <div
          style={{
            ...styles.badge,
            background: "#ffffff",
            color: "#1d4ed8",
            border: "1px solid #bfdbfe",
          }}
        >
          {getGameScoreDisplay(publicNextGame, scoreReports)}
        </div>
      </div>

   
  </div>
) : null}

                {isPublicMode ? null : (
                  <div style={{ marginBottom: 20, border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 14 }}>
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 12, color: "#64748b" }}>Reports submitted</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{scoreReports.length}</div>
                      </div>
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 12, color: "#64748b" }}>Verified games</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{result.schedule.filter((game) => getOfficialScoreFromReports(game, scoreReports).verified).length}</div>
                      </div>
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 12, color: "#64748b" }}>Waiting on opponent</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{result.schedule.filter((game) => getOfficialScoreFromReports(game, scoreReports).status === "awaiting_opponent").length}</div>
                      </div>
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 12, color: "#64748b" }}>Needs review</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{result.schedule.filter((game) => getOfficialScoreFromReports(game, scoreReports).status === "mismatch").length}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}><div style={{ fontWeight: 700 }}>Score report log</div><div style={{ fontSize: 12, color: "#64748b" }}>Admins can verify or edit scores from the schedule grid below.</div></div>
                    <div style={{ ...styles.tableWrap, maxHeight: 320 }}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Submitted</th>
                            <th style={styles.th}>Coach email</th>
                            <th style={styles.th}>Team</th>
                            <th style={styles.th}>Game</th>
                            <th style={styles.th}>Reported score</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scoreLogRows.map(({ report, game, status }) => (
                            <tr key={report.id}>
                              <td style={styles.td}>{new Date(report.submittedAt || "").toLocaleString()}</td>
                              <td style={styles.td}>{report.reporterEmail}</td>
                              <td style={styles.td}>{report.reportingTeam}</td>
                              <td style={styles.td}>{game ? `${game.date} • ${formatTimeDisplay(game.time)} • ${game.away} @ ${game.home}` : `${report.date} • ${formatTimeDisplay(report.time)} • ${report.away} @ ${report.home}`}</td>
                              <td style={styles.td}>{`${report.teamScore}-${report.opponentScore}`}</td>
                              <td style={styles.td}>{status?.verified ? `Verified (${status.officialLabel})` : status?.status === "awaiting_opponent" ? "Waiting on other coach" : status?.status === "mismatch" ? "Needs review" : "Pending"}</td>
                              <td style={styles.td}>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  {status?.status === "awaiting_opponent" && game ? (
                                    <button style={styles.button} onClick={() => sendPendingApprovalReminder(game)}>Send reminder</button>
                                  ) : null}
                                  {game ? (
                                    <button style={styles.button} onClick={() => adminVerifyOrEditScore(game, { editOnly: Boolean(status?.verified) })}>
                                      {status?.verified ? "Edit verified" : "Admin verify"}
                                    </button>
                                  ) : null}
                                  {!game ? "—" : null}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {!scoreLogRows.length ? (
                            <tr><td style={styles.td} colSpan={7}>No score reports yet.</td></tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}><div style={{ fontWeight: 700 }}>Technical foul log</div><div style={{ fontSize: 12, color: "#64748b" }}>Admin can view descriptions and edit or delete entries.</div></div>
                      <div style={{ display: "grid", gap: 10 }}>
                        {publicTechnicalRows.length ? publicTechnicalRows.map((entry) => (
                          <div key={`${entry.reportId}_${entry.id}`} style={styles.techAdminCard}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
                              <div style={{ display: "grid", gap: 4 }}>
                                <div style={{ fontWeight: 700 }}>{entry.date} • {formatTimeDisplay(entry.time)} • {entry.away} @ {entry.home}</div>
                                <div style={{ fontSize: 14, color: "#334155" }}>Charged to <strong>{entry.team}</strong> • Player #<strong>{entry.playerNumber}</strong> • {entry.flagrant ? "Flagrant" : "Non-flagrant"}</div>
                                <div style={{ fontSize: 13, color: "#64748b" }}>Description: {entry.description || "—"}</div>
                              </div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button style={styles.button} onClick={() => adminEditTechnicalFoul(entry)}>Edit</button>
                                <button style={styles.inlineDangerButton} onClick={() => adminDeleteTechnicalFoul(entry)}>Delete</button>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div style={{ border: "1px dashed #cbd5e1", borderRadius: 12, padding: 16, color: "#64748b" }}>No technical fouls reported yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isPublicMode && isMobilePublic ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {filteredSchedule.map((game, idx) => {
                      const outcomeParts = getPublishedScheduleOutcomeParts(game, scoreReports);
                      const scoreStatus = getOfficialScoreFromReports(game, scoreReports);
                      return (
                        <div key={`${game.date}-${game.time}-${game.court}-${idx}`} style={styles.publicGameCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{game.division}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{game.date} • {formatTimeDisplay(game.time)}</div>
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", textAlign: "center" }}>
                            <span style={{ color: outcomeParts.verified ? outcomeParts.homeColor : "#0f172a" }}>{game.home}</span>
                            <span style={{ margin: "0 8px", color: "#94a3b8", fontWeight: 600 }}>vs</span>
                            <span style={{ color: outcomeParts.verified ? outcomeParts.awayColor : "#0f172a" }}>{game.away}</span>
                          </div>
                          <div style={{ textAlign: "center", fontSize: 22, fontWeight: 800 }}>
                            {outcomeParts.verified ? (
                              <span>
                                <span style={{ color: outcomeParts.homeColor }}>{outcomeParts.homeScoreText}</span>
                                <span style={{ color: "#94a3b8" }}> - </span>
                                <span style={{ color: outcomeParts.awayColor }}>{outcomeParts.awayScoreText}</span>
                              </span>
                            ) : (
                              <span style={{ color: "#334155" }}>{getGameScoreDisplay(game, scoreReports)}</span>
                            )}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 13, color: "#475569" }}>
                            <div>Court: <strong style={{ color: "#0f172a" }}>{game.court}</strong></div>
                            <div>Status: <strong style={{ color: "#0f172a" }}>{scoreStatus.verified ? "Final" : "Scheduled"}</strong></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={{ ...styles.th, textAlign: "center" }}>Division</th>
                          <th style={{ ...styles.th, textAlign: "center" }}>Date</th>
                          <th style={{ ...styles.th, textAlign: "center" }}>Time</th>
                          <th style={{ ...styles.th, textAlign: "center" }}>Court</th>
                          <th style={{ ...styles.th, textAlign: "center" }}>Home</th>
                          <th style={{ ...styles.th, textAlign: "center" }}>Away</th>
                          <th style={{ ...styles.th, textAlign: "center" }}>Score</th>
                          {!isPublicMode ? <th style={{ ...styles.th, textAlign: "center" }}>Score admin</th> : null}
                          {!isPublicMode ? <th style={{ ...styles.th, textAlign: "center" }}>Lock</th> : null}
                          {!isPublicMode ? <th style={{ ...styles.th, textAlign: "center" }}>Reminder</th> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSchedule.map((game, idx) => {
                          const outcomeParts = getPublishedScheduleOutcomeParts(game, scoreReports);
                          return (
                          <tr key={`${game.date}-${game.time}-${game.court}-${idx}`}>
                            <td style={{ ...styles.td, textAlign: "center" }}>{game.division}</td>
                            <td style={{ ...styles.td, textAlign: "center" }}>{game.date}</td>
                            <td style={{ ...styles.td, textAlign: "center" }}>{formatTimeDisplay(game.time)}</td>
                            <td style={{ ...styles.td, textAlign: "center" }}>{game.court}</td>
                            <td style={{ ...styles.td, textAlign: "center", color: outcomeParts.verified ? outcomeParts.homeColor : "#0f172a", fontWeight: outcomeParts.verified ? 700 : 500 }}>{game.home}</td>
                            <td style={{ ...styles.td, textAlign: "center", color: outcomeParts.verified ? outcomeParts.awayColor : "#0f172a", fontWeight: outcomeParts.verified ? 700 : 500 }}>{game.away}</td>
                            <td style={{ ...styles.td, textAlign: "center" }}>
                              {outcomeParts.verified ? (
                                <span>
                                  <span style={{ color: outcomeParts.homeColor, fontWeight: 700 }}>{outcomeParts.homeScoreText}</span>
                                  <span>{" - "}</span>
                                  <span style={{ color: outcomeParts.awayColor, fontWeight: 700 }}>{outcomeParts.awayScoreText}</span>
                                </span>
                              ) : (
                                getGameScoreDisplay(game, scoreReports)
                              )}
                            </td>
                            {!isPublicMode ? (
                              <td style={{ ...styles.td, textAlign: "center" }}>
                                {(() => {
                                  const status = getOfficialScoreFromReports(game, scoreReports);
                                  return (
                                    <button
                                      style={status?.verified ? styles.successButton : styles.button}
                                      onClick={() => adminVerifyOrEditScore(game, { editOnly: Boolean(status?.verified) })}
                                    >
                                      {status?.verified ? "Edit verified" : "Admin verify"}
                                    </button>
                                  );
                                })()}
                              </td>
                            ) : null}
                            {!isPublicMode ? (
                              <td style={{ ...styles.td, textAlign: "center" }}>
                                <button
                                  style={game.locked ? styles.successButton : styles.button}
                                  onClick={() => toggleGameLocked(game)}
                                >
                                  {game.locked ? 'Locked' : 'Lock'}
                                </button>
                              </td>
                            ) : null}
                            {!isPublicMode ? (
                              <td style={{ ...styles.td, textAlign: "center" }}>
                                {(() => {
                                  const status = getOfficialScoreFromReports(game, scoreReports);
                                  return status?.status === "awaiting_opponent" && (status.homeReport || status.awayReport) ? (
                                    <button style={styles.button} onClick={() => sendPendingApprovalReminder(game)}>Send reminder</button>
                                  ) : "—";
                                })()}
                              </td>
                            ) : null}
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {!isPublicMode ? (
                  <div style={{ marginBottom: 20, border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Admin standings</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>
                          Compare your current sandbox standings with the last published standings without leaving Admin.
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ minWidth: 180 }}>
                          <label style={styles.smallLabel}>Source</label>
                          <select style={styles.select} value={adminStandingsSource} onChange={(e) => setAdminStandingsSource(e.target.value)}>
                            <option value="sandbox">Sandbox standings</option>
                            <option value="published">Published standings</option>
                          </select>
                        </div>
                        <div style={{ minWidth: 220 }}>
                          <label style={styles.smallLabel}>Division</label>
                          <select style={styles.select} value={adminStandingsDivisionFilter} onChange={(e) => setAdminStandingsDivisionFilter(e.target.value)}>
                            <option value="all">All divisions</option>
                            {adminDisplayedStandingsDivisions.map((division) => (
                              <option key={division} value={division}>{division}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    {!adminDisplayedStandingsDivisions.length ? (
                      <div style={{ border: "1px dashed #cbd5e1", borderRadius: 12, padding: 20, textAlign: "center", color: "#64748b", background: "#ffffff" }}>
                        {adminStandingsSource === "published" ? "No published standings are available yet." : "No sandbox standings are available yet."}
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 14 }}>
                        {(adminStandingsDivisionFilter === "all" ? adminDisplayedStandingsDivisions : [adminStandingsDivisionFilter]).map((division) => {
                          const groups = adminDisplayedStandingsGroups[division] || [];
                          return (
                            <div key={`admin-standings-${adminStandingsSource}-${division}`} style={{ display: "grid", gap: 12 }}>
                              {groups.map((group) => {
                                const rows = group.rows || [];
                                const sortedRows = getSortedStandingsRows(rows);
                                return (
                                  <div key={group.key} style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
                                    <div style={{ padding: "10px 12px", fontWeight: 700, background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                      <span>{group.label}</span>
                                      {group.sublabel ? <span style={{ color: "#1d4ed8" }}>{group.sublabel}</span> : null}
                                    </div>
                                    <div style={{ overflowX: "auto" }}>
                                      <table style={styles.table}>
                                        <thead>
                                          <tr>
                                            {renderStandingsHeader("Team", "team", "left")}
                                            {renderStandingsHeader("W", "wins")}
                                            {renderStandingsHeader("L", "losses")}
                                            {renderStandingsHeader("T", "ties")}
                                            {renderStandingsHeader("Win %", "winPct")}
                                            {renderStandingsHeader("PF", "pointsFor")}
                                            {renderStandingsHeader("PA", "pointsAgainst")}
                                            {renderStandingsHeader("PD", "pointDiff")}
                                            {renderStandingsHeader("SOS", "sos")}
                                            {renderStandingsHeader("PR", "performanceRating")}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {sortedRows.map((row) => (
                                            <tr key={`${group.key}-${row.team}`}>
                                              <td style={{ ...styles.td, textAlign: "left" }}>{row.team}</td>
                                              <td style={{ ...styles.td, textAlign: "center" }}>{row.wins}</td>
                                              <td style={{ ...styles.td, textAlign: "center" }}>{row.losses}</td>
                                              <td style={{ ...styles.td, textAlign: "center" }}>{row.ties}</td>
                                              <td style={{ ...styles.td, textAlign: "center" }}>{(row.winPct || 0).toFixed(3)}</td>
                                              <td style={{ ...styles.td, textAlign: "center" }}>{row.pointsFor}</td>
                                              <td style={{ ...styles.td, textAlign: "center" }}>{row.pointsAgainst}</td>
                                              <td style={{ ...styles.td, textAlign: "center" }}>{row.pointDiff}</td>
                                              <td style={{ ...styles.td, textAlign: "center" }}>{row.sos ? `#${row.sos}` : "—"}</td>
                                              <td style={{ ...styles.td, textAlign: "center", fontWeight: 700 }}>{(row.performanceRating || 0).toFixed(1)}</td>
                                            </tr>
                                          ))}
                                          {!rows.length ? (
                                            <tr><td style={styles.td} colSpan={10}>No verified scores yet.</td></tr>
                                          ) : null}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}

              </>
            )}
          </Card>
        ) : null}

        {activeTab === "tournaments" ? (
          <Card>
            <div style={{ ...styles.headerRow, marginBottom: 16 }}>
              <SectionTitle icon={Trophy}>Mid-Season Tournament</SectionTitle>
              {!isPublicMode ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={styles.primaryButton} onClick={generateTournamentBrackets} disabled={!tournamentCanGenerateShell}>Generate Bracket Shell</button>
                  <button style={styles.button} onClick={seedTournamentBrackets} disabled={!tournamentCanSeedTeams}>Seed Teams</button>
                  <button style={styles.successButton} onClick={publishTournament} disabled={!tournamentResult}>Publish Tournament</button>
                </div>
              ) : null}
            </div>

            {!isPublicMode ? (
              <div style={{ display: "grid", gap: 18, marginBottom: 20 }}>
                <div style={{ border: "1px solid #dbeafe", background: "#eff6ff", color: "#1e3a8a", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600 }}>
                  Bracket shells unlock after preseason is fully verified ({preseasonGamesCompleteCount}/{preseasonGamesTotalCount || 0}). Team seeding unlocks after every game on {tournamentSeedingLockDate} is verified ({tournamentSeedingLockCompleteCount}/{tournamentSeedingLockGames.length || 0}).
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                  <div>
                    <label style={styles.smallLabel}>Tournament weekend</label>
                    <select
                      style={styles.select}
                      value={tournamentSetup.weekend}
                      onChange={(e) => setTournamentSetup((prev) => ({ ...prev, weekend: e.target.value }))}
                    >
                      {TOURNAMENT_WEEKEND_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.smallLabel}>Dates</label>
                    <div style={{ ...styles.input, display: "flex", alignItems: "center", minHeight: 44 }}>
                      {Object.values(getJanuaryTournamentWeekendDates(config.seasonYear, tournamentSetup.weekend)).join(" / ")}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={styles.smallLabel}>Divisions included</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                    {DIVISIONS.map((division) => (
                      <label key={division} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc" }}>
                        <input
                          type="checkbox"
                          checked={Boolean(tournamentSetup.divisions?.[division])}
                          onChange={(e) => toggleTournamentDivision(division, e.target.checked)}
                        />
                        <span>{division}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={styles.smallLabel}>Friday court start times</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                    {TOURNAMENT_COURTS.map((court) => (
                      <div key={court}>
                        <label style={styles.smallLabel}>{court}</label>
                        <select
                          style={styles.select}
                          value={tournamentSetup.fridayCourtStarts?.[court] || "6:00"}
                          onChange={(e) => updateTournamentFridayStart(court, e.target.value)}
                        >
                          {["5:30", "5:45", "6:00", "6:15", "6:30"].map((time) => (
                            <option key={time} value={time}>{formatTimeDisplay(time)}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 }}>
                    <label style={{ ...styles.smallLabel, marginBottom: 0 }}>Coach scheduling requests</label>
                    <button type="button" style={styles.button} onClick={addTournamentCoachRequest}>Add Request</button>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {(tournamentSetup.coachRequests || []).map((entry) => (
                      <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "220px minmax(0, 1fr) auto", gap: 10, alignItems: "start" }}>
                        <select
                          style={styles.select}
                          value={entry.team}
                          onChange={(e) => updateTournamentCoachRequest(entry.id, { team: e.target.value })}
                        >
                          <option value="">Select team</option>
                          {buildTeamNamesFromConfig(config).map((teamName) => (
                            <option key={teamName} value={teamName}>{teamName}</option>
                          ))}
                        </select>
                        <textarea
                          style={{ ...styles.input, minHeight: 70, resize: "vertical" }}
                          value={entry.request}
                          onChange={(e) => updateTournamentCoachRequest(entry.id, { request: e.target.value })}
                          placeholder="Example: cannot play Friday before 7:30, prefers Saturday morning"
                        />
                        <button type="button" style={styles.inlineDangerButton} onClick={() => removeTournamentCoachRequest(entry.id)}>Remove</button>
                      </div>
                    ))}
                    {!(tournamentSetup.coachRequests || []).length ? (
                      <div style={{ border: "1px dashed #cbd5e1", borderRadius: 12, padding: 14, color: "#64748b" }}>No coach requests entered yet.</div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {!displayedTournament ? (
              <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>
                {isPublicMode ? "No tournament brackets have been published yet." : "Generate tournament brackets to preview them here."}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 18 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={styles.badge}>{displayedTournament.name}</span>
                  <span style={styles.badge}>{Object.values(displayedTournament.dates || {}).join(" / ")}</span>
                  <span style={displayedTournament.seeded ? styles.badge : styles.badgeDanger}>
                    {displayedTournament.seeded ? `Seeded through ${displayedTournament.seedingLockDate}` : "Bracket shell - teams not seeded"}
                  </span>
                  <span style={displayedTournament.unscheduledCount ? styles.badgeDanger : styles.badge}>
                    {displayedTournament.unscheduledCount || 0} unscheduled
                  </span>
                </div>

                <div style={{ display: "grid", gap: 14 }}>
                  {(displayedTournament.brackets || []).map((bracket) => (
                    <div key={bracket.division} style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ padding: "10px 12px", fontWeight: 800, background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <span>{bracket.division}</span>
                        <span style={{ color: "#1d4ed8" }}>{bracket.teamCount || bracket.teams.length} teams • {bracket.bracketSize}-team bracket</span>
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Game</th>
                              <th style={styles.th}>Round</th>
                              <th style={styles.th}>Date</th>
                              <th style={styles.th}>Time</th>
                              <th style={styles.th}>Court</th>
                              <th style={styles.th}>Matchup</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(bracket.games || []).map((game) => (
                              <tr key={game.id}>
                                <td style={styles.td}>{game.gameNumber}</td>
                                <td style={styles.td}>{game.label}</td>
                                <td style={styles.td}>{game.date || "—"}</td>
                                <td style={styles.td}>{game.time ? formatTimeDisplay(game.time) : "—"}</td>
                                <td style={styles.td}>{game.court || "—"}</td>
                                <td style={styles.td}>{game.teamA} vs {game.teamB}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {!isPublicMode && (displayedTournament.coachRequests || []).length ? (
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, background: "#f8fafc" }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>Coach requests captured</div>
                    <div style={{ display: "grid", gap: 6, fontSize: 14, color: "#334155" }}>
                      {displayedTournament.coachRequests.map((entry) => (
                        <div key={entry.id}><strong>{entry.team || "Unassigned"}:</strong> {entry.request || "—"}</div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </Card>
        ) : null}

        {activeTab === "standings" && isPublicMode ? (
          <Card>
            <div style={{ ...styles.headerRow, marginBottom: 16 }}>
              <SectionTitle icon={Trophy}>Division Standings</SectionTitle>
              <div style={{ minWidth: 240 }}>
                <label style={styles.smallLabel}>Division</label>
                <select style={styles.select} value={scheduleDivisionFilter} onChange={(e) => setScheduleDivisionFilter(e.target.value)}>
                  <option value="all">All divisions</option>
                  {publicDivisionOptions.map((division) => (
                    <option key={division} value={division}>{division}</option>
                  ))}
                </select>
              </div>
            </div>
            {!result ? (
              <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>No published schedule found yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {(scheduleDivisionFilter === "all" ? DIVISIONS : [scheduleDivisionFilter]).map((division) => {
                  const groups = publicStandingsGroups[division] || [{ key: division, label: division, sublabel: "", rows: divisionStandings[division] || [] }];
                  return (
                    <div key={division} style={{ display: "grid", gap: 12 }}>
                      {groups.map((group) => {
                        const rows = group.rows || [];
                        const sortedRows = getSortedStandingsRows(rows);
                        return (
                          <div key={group.key} style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                            <div style={{ padding: "10px 12px", fontWeight: 700, background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                              <span>{group.label}</span>
                              {group.sublabel ? <span style={{ color: "#1d4ed8" }}>{group.sublabel}</span> : null}
                            </div>
                            <div style={{ overflowX: "auto" }}>
                              <table style={styles.table}>
                                <thead>
                                  <tr>
                                    {renderStandingsHeader("Team", "team", "left")}
                                    {renderStandingsHeader("W", "wins")}
                                    {renderStandingsHeader("L", "losses")}
                                    {renderStandingsHeader("T", "ties")}
                                    {renderStandingsHeader("Win %", "winPct")}
                                    {renderStandingsHeader("PF", "pointsFor")}
                                    {renderStandingsHeader("PA", "pointsAgainst")}
                                    {renderStandingsHeader("PD", "pointDiff")}
                                    {renderStandingsHeader("SOS", "sos")}
                                    {renderStandingsHeader("PR", "performanceRating")}
                                  </tr>
                                </thead>
                                <tbody>
                                  {sortedRows.map((row) => (
                                    <tr key={`${group.key}-${row.team}`}>
                                      <td style={{ ...styles.td, textAlign: "left" }}>{row.team}</td>
                                      <td style={{ ...styles.td, textAlign: "center" }}>{row.wins}</td>
                                      <td style={{ ...styles.td, textAlign: "center" }}>{row.losses}</td>
                                      <td style={{ ...styles.td, textAlign: "center" }}>{row.ties}</td>
                                      <td style={{ ...styles.td, textAlign: "center" }}>{(row.winPct || 0).toFixed(3)}</td>
                                      <td style={{ ...styles.td, textAlign: "center" }}>{row.pointsFor}</td>
                                      <td style={{ ...styles.td, textAlign: "center" }}>{row.pointsAgainst}</td>
                                      <td style={{ ...styles.td, textAlign: "center" }}>{row.pointDiff}</td>
                                      <td style={{ ...styles.td, textAlign: "center" }}>{row.sos ? `#${row.sos}` : "—"}</td>
                                      <td style={{ ...styles.td, textAlign: "center", fontWeight: 700 }}>{(row.performanceRating || 0).toFixed(1)}</td>
                                    </tr>
                                  ))}
                                  {!rows.length ? (
                                    <tr><td style={styles.td} colSpan={10}>No verified scores yet.</td></tr>
                                  ) : null}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ) : null}

        {activeTab === "score_reporting" && isPublicMode ? (
          <Card>
            <SectionTitle icon={CalendarDays}>Coach Score Reporting</SectionTitle>
            {!result ? (
              <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>No published schedule found yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  Both coaches should report each game. Scores become official when both reports match exactly, are within one point on each side, or agree on point differential.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, alignItems: "end" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={styles.smallLabel}>Coach email</label>
                    <input
                      style={{ ...styles.input, minHeight: 48, fontSize: 16 }}
                      value={scoreReporterEmail}
                      onChange={(e) => setScoreReporterEmail(e.target.value)}
                      placeholder="coach@example.com"
                      type="email"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label style={styles.smallLabel}>Division</label>
                    <select
                      style={{ ...styles.select, minHeight: 48, fontSize: 16 }}
                      value={scoreReporterDivision}
                      onChange={(e) => setScoreReporterDivision(e.target.value)}
                    >
                      <option value="">Select division</option>
                      {publicDivisionOptions.map((division) => <option key={division} value={division}>{division}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.smallLabel}>Reporting team</label>
                    <select
                      style={{ ...styles.select, minHeight: 48, fontSize: 16 }}
                      value={scoreReporterTeam}
                      onChange={(e) => setScoreReporterTeam(e.target.value)}
                      disabled={!scoreReporterDivision}
                    >
                      <option value="">{scoreReporterDivision ? "Select team" : "Choose division first"}</option>
                      {scoreTeamsForDivision.map((team) => <option key={team} value={team}>{team}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={styles.smallLabel}>Game</label>
                    <select
                      style={{ ...styles.select, minHeight: 52, fontSize: 16 }}
                      value={scoreGameId}
                      onChange={(e) => setScoreGameId(e.target.value)}
                      disabled={!scoreReportableGames.length}
                    >
                      <option value="">{scoreReportableGames.length ? "Select game" : "Choose team first"}</option>
                      {scoreReportableGames.map((game) => (
                        <option key={getGameScoreKey(game)} value={getGameScoreKey(game)}>
                          {`${game.date} • ${formatTimeDisplay(game.time)} • ${game.away} @ ${game.home}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedScoreApprovalContext.canApprove ? (
                    <label style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 12, padding: 12, fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={scoreApproveExisting}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setScoreApproveExisting(checked);
                          if (checked) setScoreForfeitTeam("");
                        }}
                      />
                      <span>
                        Approve the existing report from <strong>{selectedScoreApprovalContext.opponentReport?.reportingTeam}</strong>
                        {selectedScoreApprovalContext.approvalScores ? ` (${selectedScoreApprovalContext.approvalScores.teamScore}-${selectedScoreApprovalContext.approvalScores.opponentScore} from your team perspective)` : ""}
                      </span>
                    </label>
                  ) : null}
                  <div>
                    <label style={styles.smallLabel}>Your score</label>
                    <input
                      style={{ ...styles.input, minHeight: 56, fontSize: 22, textAlign: "center", fontWeight: 700, background: scoreApproveExisting || scoreForfeitTeam ? "#f8fafc" : "white" }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        scoreForfeitTeam
                          ? (selectedScoreGame
                              ? String(
                                  scoreReporterTeam === selectedScoreGame.home
                                    ? (scoreForfeitTeam === selectedScoreGame.home ? 0 : 15)
                                    : (scoreForfeitTeam === selectedScoreGame.away ? 0 : 15)
                                )
                              : "")
                          : scoreApproveExisting && selectedScoreApprovalContext.approvalScores
                            ? String(selectedScoreApprovalContext.approvalScores.teamScore)
                            : scoreForInput
                      }
                      onChange={(e) => setScoreForInput(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="0"
                      disabled={selectedScoreSubmissionState.lockInputs || Boolean(scoreForfeitTeam) || (scoreApproveExisting && selectedScoreApprovalContext.canApprove)}
                    />
                  </div>
                  <div>
                    <label style={styles.smallLabel}>Opponent score</label>
                    <input
                      style={{ ...styles.input, minHeight: 56, fontSize: 22, textAlign: "center", fontWeight: 700, background: scoreApproveExisting || scoreForfeitTeam ? "#f8fafc" : "white" }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        scoreForfeitTeam
                          ? (selectedScoreGame
                              ? String(
                                  scoreReporterTeam === selectedScoreGame.home
                                    ? (scoreForfeitTeam === selectedScoreGame.home ? 15 : 0)
                                    : (scoreForfeitTeam === selectedScoreGame.away ? 15 : 0)
                                )
                              : "")
                          : scoreApproveExisting && selectedScoreApprovalContext.approvalScores
                            ? String(selectedScoreApprovalContext.approvalScores.opponentScore)
                            : scoreAgainstInput
                      }
                      onChange={(e) => setScoreAgainstInput(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="0"
                      disabled={selectedScoreSubmissionState.lockInputs || Boolean(scoreForfeitTeam) || (scoreApproveExisting && selectedScoreApprovalContext.canApprove)}
                    />
                  </div>
                  <div>
                    <label style={styles.smallLabel}>Forfeit</label>
                    <select
                      style={{ ...styles.select, minHeight: 56, fontSize: 16 }}
                      value={scoreForfeitTeam}
                      onChange={(e) => {
                        const value = e.target.value;
                        setScoreForfeitTeam(value);
                        if (value) {
                          setScoreApproveExisting(false);
                          setScoreForInput("");
                          setScoreAgainstInput("");
                        }
                      }}
                      disabled={selectedScoreSubmissionState.lockInputs || !selectedScoreGame}
                    >
                      <option value="">No forfeit</option>
                      {selectedScoreGame ? (
                        <>
                          <option value={selectedScoreGame.home}>{selectedScoreGame.home} forfeited</option>
                          <option value={selectedScoreGame.away}>{selectedScoreGame.away} forfeited</option>
                        </>
                      ) : null}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1", border: "1px solid #dbeafe", borderRadius: 14, padding: 14, background: "#f8fbff" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, color: "#0f172a" }}>
                      <input
                        type="checkbox"
                        checked={scoreHasTechnicalFouls}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setScoreHasTechnicalFouls(checked);
                          setScoreTechnicalFouls(checked ? (scoreTechnicalFouls.length ? scoreTechnicalFouls : [createEmptyTechnicalFoul()]) : []);
                        }}
                        disabled={selectedScoreSubmissionState.lockInputs}
                      />
                      <span>Technical Fouls?</span>
                    </label>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>Use 99 for coach/bench and 98 for a fan.</div>
                    {scoreHasTechnicalFouls ? (
                      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                        {scoreTechnicalFouls.map((entry, index) => (
                          <div key={entry.id} style={styles.techCard}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                              <div style={{ fontWeight: 700, color: "#0f172a" }}>Technical #{index + 1}</div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  style={{
                                    ...styles.togglePill,
                                    background: entry.flagrant ? "#dc2626" : "#16a34a",
                                    borderColor: entry.flagrant ? "#dc2626" : "#16a34a",
                                  }}
                                  onClick={() => setScoreTechnicalFouls((current) => current.map((row) => row.id !== entry.id ? row : { ...row, flagrant: !row.flagrant }))}
                                  disabled={selectedScoreSubmissionState.lockInputs}
                                >
                                  {entry.flagrant ? "Flagrant" : "Non-flagrant"}
                                </button>
                                {scoreTechnicalFouls.length > 1 ? (
                                  <button
                                    type="button"
                                    style={styles.inlineDangerButton}
                                    onClick={() => setScoreTechnicalFouls((current) => current.filter((row) => row.id !== entry.id))}
                                    disabled={selectedScoreSubmissionState.lockInputs}
                                  >
                                    Remove
                                  </button>
                                ) : null}
                              </div>
                            </div>
                            <div style={styles.techRowGrid}>
                              <div>
                                <label style={styles.smallLabel}>Team</label>
                                <select
                                  style={{ ...styles.select, minHeight: 46 }}
                                  value={entry.team}
                                  onChange={(e) => setScoreTechnicalFouls((current) => current.map((row) => row.id !== entry.id ? row : { ...row, team: e.target.value }))}
                                  disabled={selectedScoreSubmissionState.lockInputs}
                                >
                                  <option value="">Select team</option>
                                  {selectedScoreGame ? [selectedScoreGame.home, selectedScoreGame.away].map((teamName) => (
                                    <option key={teamName} value={teamName}>{teamName}</option>
                                  )) : null}
                                </select>
                              </div>
                              <div>
                                <label style={styles.smallLabel}>Player #</label>
                                <input
                                  style={{ ...styles.input, minHeight: 46 }}
                                  value={entry.playerNumber}
                                  onChange={(e) => setScoreTechnicalFouls((current) => current.map((row) => row.id !== entry.id ? row : { ...row, playerNumber: e.target.value.replace(/[^0-9]/g, "") }))}
                                  placeholder="99"
                                  inputMode="numeric"
                                  disabled={selectedScoreSubmissionState.lockInputs}
                                />
                              </div>
                              <div>
                                <label style={styles.smallLabel}>Description (admin-only)</label>
                                <input
                                  style={{ ...styles.input, minHeight: 46 }}
                                  value={entry.description}
                                  onChange={(e) => setScoreTechnicalFouls((current) => current.map((row) => row.id !== entry.id ? row : { ...row, description: e.target.value }))}
                                  placeholder="Describe the incident"
                                  disabled={selectedScoreSubmissionState.lockInputs}
                                />
                              </div>
                              <div>
                                <label style={styles.smallLabel}>&nbsp;</label>
                                <button
                                  type="button"
                                  style={styles.button}
                                  onClick={() => setScoreTechnicalFouls((current) => [...current, createEmptyTechnicalFoul()])}
                                  disabled={selectedScoreSubmissionState.lockInputs}
                                >
                                  Add another tech
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <button
                      style={{ ...styles.primaryButton, width: "100%", minHeight: 52, fontSize: 16, opacity: selectedScoreSubmissionState.lockButton ? 0.6 : 1, cursor: selectedScoreSubmissionState.lockButton ? "not-allowed" : "pointer" }}
                      onClick={submitScoreReport}
                      disabled={selectedScoreSubmissionState.lockButton}
                    >
                      {scoreForfeitTeam && !selectedScoreSubmissionState.lockButton ? "Report forfeit" : selectedScoreSubmissionState.buttonLabel}
                    </button>
                  </div>
                </div>
                {scoreNotice ? (
                  <div style={{ border: "1px solid #dbeafe", background: "#eff6ff", color: "#1d4ed8", borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600 }}>
                    {scoreNotice}
                  </div>
                ) : null}
                {selectedScoreGame && selectedScoreGameStatus ? (
                  <div style={{ fontSize: 13, color: "#475569" }}>
                    Current status: <strong style={{ color: "#0f172a" }}>{selectedScoreGameStatus.officialLabel}</strong> — {selectedScoreGameStatus.reportSummary}
                    {selectedScoreGameStatus.verified ? " Verified scores are locked and can no longer be edited by coaches." : ""}
                    {!selectedScoreGameStatus.verified ? " A forfeit auto-verifies at 15-0 and does not need approval." : ""}
                  </div>
                ) : null}
              </div>
            )}
          </Card>
        ) : null}

                {activeTab === "technicals" ? (
          <Card>
            <SectionTitle icon={AlertTriangle}>Technical Fouls</SectionTitle>
            {!result ? (
              <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>No published schedule found yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 18 }}>
                <div style={styles.techRulesCard}>
                  <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Technical foul rules</div>
                  <div style={{ display: "grid", gap: 6, color: "#334155", fontSize: 14 }}>
                    {getTechnicalSuspensionRuleText().map((rule) => (
                      <div key={rule}>• {rule}</div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>Technical foul tracker</div>
                  {technicalParticipantRows.length ? (
                    <div style={{ ...styles.tableWrap, maxHeight: 420 }}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Team</th>
                            <th style={styles.th}>Player / Coach #</th>
                            <th style={styles.th}>Techs</th>
                            <th style={styles.th}>Flagrant</th>
                            <th style={styles.th}>Suspension</th>
                            <th style={styles.th}>Eligible return</th>
                            {!isPublicMode ? <th style={styles.th}>Admin</th> : null}
                          </tr>
                        </thead>
                        <tbody>
                          {technicalParticipantRows.map((row) => (
                            <tr key={row.key}>
                              <td style={styles.td}>{row.team}</td>
                              <td style={styles.td}>{row.playerNumber}</td>
                              <td style={styles.td}>{row.totalTechs}</td>
                              <td style={styles.td}>{row.flagrantCount}</td>
                              <td style={styles.td}>
                                {row.suspensionTriggered
                                  ? typeof row.gamesToSuspend === "number"
                                    ? `${row.gamesToSuspend} game${row.gamesToSuspend === 1 ? "" : "s"}`
                                    : row.gamesToSuspend
                                  : "None"}
                              </td>
                              <td style={{ ...styles.td, textAlign: "left" }}>
                                {row.suspensionTriggered
                                  ? row.nextEligibleLabel
                                  : "—"}
                              </td>
                              {!isPublicMode ? (
                                <td style={styles.td}>
                                  {row.suspensionTriggered ? (
                                    <select
                                      style={{ ...styles.select, minWidth: 230 }}
                                      value={row.suspensionReturnGameId || ""}
                                      onChange={(e) => adminSetTechnicalReturnGame(row, e.target.value)}
                                    >
                                      <option value="">Select return game</option>
                                      {row.scheduledGames.map((game) => (
                                        <option key={`${row.key}_${getGameScoreKey(game)}`} value={getGameScoreKey(game)}>
                                          {getTechnicalReturnGameLabel(game)}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span style={{ color: "#94a3b8" }}>—</span>
                                  )}
                                </td>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 24, textAlign: "center", color: "#64748b" }}>No technical fouls have been reported yet.</div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>Currently suspended</div>
                  {currentlySuspendedRows.length ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {currentlySuspendedRows.map((row) => (
                        <div key={`susp_${row.key}`} style={styles.techSuspensionCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 800, color: "#0f172a" }}>{row.team} • #{row.playerNumber}</div>
                              <div style={{ marginTop: 4, fontSize: 14, color: "#334155" }}>
                                Suspension:
                                {" "}
                                <strong>
                                  {typeof row.gamesToSuspend === "number"
                                    ? `${row.gamesToSuspend} additional game${row.gamesToSuspend === 1 ? "" : "s"}`
                                    : row.gamesToSuspend}
                                </strong>
                              </div>
                              <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>
                                Eligible return: <strong>{row.nextEligibleLabel}</strong>
                              </div>
                            </div>
                            {!isPublicMode ? (
                              <select
                                style={{ ...styles.select, minWidth: 240 }}
                                value={row.suspensionReturnGameId || ""}
                                onChange={(e) => adminSetTechnicalReturnGame(row, e.target.value)}
                              >
                                <option value="">Select return game</option>
                                {row.scheduledGames.map((game) => (
                                  <option key={`susp_sel_${row.key}_${getGameScoreKey(game)}`} value={getGameScoreKey(game)}>
                                    {getTechnicalReturnGameLabel(game)}
                                  </option>
                                ))}
                              </select>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 24, textAlign: "center", color: "#64748b" }}>No current suspensions.</div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>{isPublicMode ? "Reported technical fouls" : "Reported technical foul log"}</div>
                  {publicTechnicalRows.length ? (
                    <div style={{ display: "grid", gap: 12 }}>
                      {publicTechnicalRows.map((entry) => (
                        <div key={`${entry.reportId}_${entry.id}`} style={styles.techPublicCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 700, color: "#0f172a" }}>{entry.date} • {formatTimeDisplay(entry.time)} • {entry.away} @ {entry.home}</div>
                              <div style={{ marginTop: 6, fontSize: 14, color: "#334155" }}>Team: <strong>{entry.team}</strong> • Player #: <strong>{entry.playerNumber}</strong></div>
                              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: entry.flagrant ? "#b91c1c" : "#15803d" }}>{entry.flagrant ? "Flagrant technical" : "Non-flagrant technical"}</div>
                              {!isPublicMode ? (
                                <div style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>
                                  Description: {entry.description || "—"}
                                </div>
                              ) : null}
                            </div>
                            {!isPublicMode ? (
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button style={styles.secondaryButton} onClick={() => adminEditTechnicalFoul(entry)}>Edit</button>
                                <button style={styles.dangerButton} onClick={() => adminDeleteTechnicalFoul(entry)}>Delete</button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 24, textAlign: "center", color: "#64748b" }}>No technical fouls have been reported yet.</div>
                  )}
                </div>
              </div>
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
                          <td style={{ ...styles.td, textAlign: "left" }}>{row.team}</td>
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

        {activeTab === "debug" && !isPublicMode ? (
          <div style={{ display: "grid", gap: 24 }}>
            <Card>
              <SectionTitle>Division Repeat Math</SectionTitle>
              <div style={{ ...styles.tableWrap, maxHeight: 420 }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Division</th>
                      <th style={styles.th}>Teams</th>
                      <th style={styles.th}>Target Games</th>
                      <th style={styles.th}>Max Unique Opponents</th>
                      <th style={styles.th}>Repeats Avoidable?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result?.divisionRepeatMath || buildDivisionRepeatMath(config)).map((row) => (
                      <tr key={row.division}>
                        <td style={{ ...styles.td, textAlign: "left" }}>{row.division}</td>
                        <td style={styles.td}>{row.teams}</td>
                        <td style={styles.td}>{row.targetGames}</td>
                        <td style={styles.td}>{row.maxUniqueOpponents}</td>
                        <td style={styles.td}>{row.repeatsShouldBeAvoidable ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {debugMode ? (
              <Card>
                <SectionTitle>Debug Mode Snapshot</SectionTitle>
                {!debugScheduleSnapshot ? (
                  <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>Generate a schedule to inspect the debug snapshot.</div>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 16 }}>
                      <StatCard label="Season phase" value={String(debugScheduleSnapshot.seasonPhase || "—").replace(/^./, (c) => c.toUpperCase())} />
                      <StatCard label="Scheduled games" value={debugScheduleSnapshot.totalScheduledGames} />
                      <StatCard label="Unscheduled games" value={debugScheduleSnapshot.totalUnscheduledGames} />
                      <StatCard label="Teams still short" value={debugScheduleSnapshot.missingTeams} />
                    </div>
                    <div style={{ ...styles.tableWrap, maxHeight: 320 }}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Division</th>
                            <th style={styles.th}>Teams</th>
                            <th style={styles.th}>Target / Team</th>
                            <th style={styles.th}>Scheduled Games</th>
                            <th style={styles.th}>Target Games</th>
                            <th style={styles.th}>Short Teams</th>
                            <th style={styles.th}>Unscheduled</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debugScheduleSnapshot.perDivision.map((row) => (
                            <tr key={row.division}>
                              <td style={{ ...styles.td, textAlign: "left" }}>{row.division}</td>
                              <td style={styles.td}>{row.teams}</td>
                              <td style={styles.td}>{row.targetGamesPerTeam}</td>
                              <td style={styles.td}>{row.scheduledGames}</td>
                              <td style={styles.td}>{row.targetGames}</td>
                              <td style={styles.td}>{row.shortTeams}</td>
                              <td style={styles.td}>{row.unscheduledGames}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Teams still missing games</div>
                      {debugMissingTeams.length === 0 ? (
                        <div style={{ fontSize: 14, color: "#166534" }}>Every team reached its target number of games.</div>
                      ) : (
                        <div style={{ ...styles.tableWrap, maxHeight: 360 }}>
                          <table style={styles.table}>
                            <thead>
                              <tr>
                                <th style={styles.th}>Team</th>
                                <th style={styles.th}>Division</th>
                                <th style={styles.th}>Games</th>
                                <th style={styles.th}>Target</th>
                                <th style={styles.th}>Missing</th>
                                <th style={styles.th}>Home</th>
                                <th style={styles.th}>Away</th>
                                <th style={styles.th}>Issues</th>
                              </tr>
                            </thead>
                            <tbody>
                              {debugMissingTeams.map((row) => (
                                <tr key={row.team}>
                                  <td style={{ ...styles.td, textAlign: "left" }}>{row.team}</td>
                                  <td style={styles.td}>{row.division}</td>
                                  <td style={styles.td}>{row.games}</td>
                                  <td style={styles.td}>{row.target}</td>
                                  <td style={styles.td}>{row.missing}</td>
                                  <td style={styles.td}>{row.home}</td>
                                  <td style={styles.td}>{row.away}</td>
                                  <td style={{ ...styles.td, textAlign: "left" }}>{row.issues?.join(', ') || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ) : null}

            <Card>
              <SectionTitle>Repeat Opponent Trace</SectionTitle>
              {!result ? (
                <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" }}>Generate a schedule to trace when repeat opponents appear.</div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {(result.repeatTrace || []).map((phase) => (
                    <div key={phase.label} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, display: "grid", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 700 }}>{phase.label}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Badge>{phase.totalGames} games</Badge>
                          <Badge danger={phase.repeatedPairs.length > 0}>{phase.repeatedPairs.length} repeated pairs</Badge>
                          <Badge danger={phase.affectedTeams > 0}>{phase.affectedTeams} affected teams</Badge>
                        </div>
                      </div>

                      {phase.repeatedPairs.length === 0 ? (
                        <div style={{ fontSize: 14, color: "#166534" }}>No repeated opponents at this phase.</div>
                      ) : (
                        <div style={{ ...styles.tableWrap, maxHeight: 320 }}>
                          <table style={styles.table}>
                            <thead>
                              <tr>
                                <th style={styles.th}>Division</th>
                                <th style={styles.th}>Pair</th>
                                <th style={styles.th}>Meetings</th>
                                <th style={styles.th}>Allowed</th>
                                <th style={styles.th}>First Appears Here?</th>
                                <th style={styles.th}>Games</th>
                              </tr>
                            </thead>
                            <tbody>
                              {phase.repeatedPairs.map((pair) => (
                                <tr key={`${phase.label}-${pair.key}`}>
                                  <td style={styles.td}>{pair.division}</td>
                                  <td style={{ ...styles.td, textAlign: "left" }}>{pair.teamA} vs {pair.teamB}</td>
                                  <td style={styles.td}>{pair.count}</td>
                                  <td style={styles.td}>{pair.allowed}</td>
                                  <td style={styles.td}>{pair.introducedHere ? "Yes" : "No"}</td>
                                  <td style={{ ...styles.td, textAlign: "left", fontSize: 12 }}>
                                    {pair.meetings.map((meeting) => `${meeting.date} ${formatTimeDisplay(meeting.time)} ${meeting.court}`).join(' • ')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
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
}function getRepeatedOpponentMeetingMap(schedule) {
  const map = {};
  for (const game of schedule || []) {
    const teams = [game.home, game.away].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const key = `${game.division}::${teams[0]}::${teams[1]}`;
    if (!map[key]) map[key] = [];
    map[key].push({
      date: game.date,
      time: game.time,
      court: game.court,
      home: game.home,
      away: game.away,
    });
  }
  Object.values(map).forEach((games) => games.sort(compareSlotLike));
  return map;
}

function buildRepeatTraceEntry(label, schedule, config) {
  const repeatedOpponentData = getRepeatedOpponentViolations(schedule, config);
  const meetingMap = getRepeatedOpponentMeetingMap(schedule);
  return {
    label,
    totalGames: (schedule || []).length,
    affectedTeams: Object.keys(repeatedOpponentData.teamViolationCounts || {}).length,
    repeatedPairs: repeatedOpponentData.pairViolations.map((entry) => {
      const key = `${entry.division}::${[entry.teamA, entry.teamB].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join('::')}`;
      return {
        ...entry,
        key,
        meetings: meetingMap[key] || [],
      };
    }),
  };
}

function annotateRepeatTrace(entries) {
  const seen = new Set();
  return (entries || []).map((entry) => ({
    ...entry,
    repeatedPairs: (entry.repeatedPairs || []).map((pair) => {
      const introducedHere = !seen.has(pair.key);
      seen.add(pair.key);
      return { ...pair, introducedHere };
    }),
  }));
}

function buildDivisionRepeatMath(config) {
  return DIVISIONS.map((division) => {
    const teams = Number(config?.divisions?.[division] || 0);
    const targetGames = Number(config?.divisionGames?.[division] || 0);
    const maxUniqueOpponents = Math.max(0, teams - 1);
    return {
      division,
      teams,
      targetGames,
      maxUniqueOpponents,
      repeatsShouldBeAvoidable: teams > 1 && targetGames <= maxUniqueOpponents,
    };
  });
}

