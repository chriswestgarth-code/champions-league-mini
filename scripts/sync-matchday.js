import fs from 'fs';
import path from 'path';

// =========================================================================
// 🟥 LIVE GOOGLE SHEET RED CARD TRACKER
// =========================================================================
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR7djO-SH_Lxd06QKHKxKvOKX9IpTDe49cF8P2LOckg3IN9gehX1uWfBpThwjtUtL945hKdmw37Vg6N/pub?output=csv";

// Fallback values in case Google Sheets is temporarily unreachable
const FALLBACK_RED_CARDS = {
  "Inter Milan": 0,
  "Liverpool": 0,
  "Real Madrid": 0,
  "PSG": 0,
  "Arsenal": 0,
  "Bayern Munich": 1,
  "Barcelona": 0,
  "Man United": 1,
  "Porto": 0,
  "PSV Eindhoven": 0,
  "Dortmund": 0,
  "Aston Villa": 0,
  "Sporting CP": 0,
  "Roma": 0,
  "RB Leipzig": 0,
  "Shakhtar Donetsk": 0,
  "Feyenoord": 0,
  "Bodø/Glimt": 1,
  "Galatasaray": 0,
  "Lille": 1,
  "Napoli": 0,
  "Stuttgart": 0,
  "Como": 0,
  "Lens": 0,
  "Viking": 0,
  "Slavia Praha": 1,
  "LASK": 0,
  "AEK Athens": 0
};

// Complete team aliases for 100% fixture matching accuracy
const TEAM_ALIASES = {
  "Inter Milan": ["inter", "internazionale", "inter milan", "fc internazionale milano"],
  "Man United": ["manchester united", "man united", "man utd", "manchester united fc"],
  "RB Leipzig": ["rb leipzig", "leipzig", "rasenballsport leipzig"],
  "Stuttgart": ["vfb stuttgart", "stuttgart", "vfb stuttgart 1893"],
  "Liverpool": ["liverpool", "liverpool fc"],
  "Porto": ["fc porto", "porto", "futebol clube do porto"],
  "Shakhtar Donetsk": ["shakhtar donetsk", "shakhtar", "fc shakhtar donetsk"],
  "Como": ["como", "como 1907"],
  "Real Madrid": ["real madrid", "real madrid cf"],
  "PSV Eindhoven": ["psv", "psv eindhoven"],
  "Feyenoord": ["feyenoord", "feyenoord rotterdam"],
  "Lens": ["rc lens", "lens", "racing club de lens"],
  "PSG": ["paris saint-germain", "psg", "paris saint germain", "paris sg"],
  "Dortmund": ["borussia dortmund", "dortmund", "bvb", "bvb 09 dortmund"],
  "Bodø/Glimt": ["bodø/glimt", "bodo/glimt", "fk bodø/glimt", "bodo glimt", "bodoe/glimt"],
  "Viking": ["viking", "viking fk", "viking stavanger"],
  "Arsenal": ["arsenal", "arsenal fc"],
  "Aston Villa": ["aston villa", "aston villa fc", "villa"],
  "Galatasaray": ["galatasaray", "galatasaray sk", "galatasaray a.s."],
  "Slavia Praha": ["slavia praha", "slavia prague", "sk slavia praha"],
  "Bayern Munich": ["bayern münchen", "bayern munich", "fc bayern münchen", "fc bayern"],
  "Sporting CP": ["sporting cp", "sporting", "sporting lisbon", "sporting clube de portugal", "sporting cp lisbon"],
  "Lille": ["lille", "lille osc", "losc lille", "losc"],
  "LASK": ["lask", "lask linz"],
  "Barcelona": ["barcelona", "fc barcelona", "barça"],
  "Roma": ["as roma", "roma"],
  "Napoli": ["ssc napoli", "napoli"],
  "AEK Athens": ["aek athens", "aek", "pae aek", "aek athens fc", "aek fc"]
};

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchDraftTeam(rawName, shortName) {
  const candidates = [normalize(rawName), normalize(shortName)].filter(Boolean);

  for (const [officialName, aliases] of Object.entries(TEAM_ALIASES)) {
    for (const alias of aliases) {
      const cleanAlias = normalize(alias);
      for (const cand of candidates) {
        if (cand === cleanAlias || cand.includes(cleanAlias) || cleanAlias.includes(cand)) {
          return officialName;
        }
      }
    }
  }
  return null;
}

async function fetchRedCardsFromSheet() {
  const redCards = { ...FALLBACK_RED_CARDS };
  try {
    console.log("Fetching live red card counts from Google Sheets...");
    const res = await fetch(`${SHEET_CSV_URL}&t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csvText = await res.text();
    const lines = csvText.split(/\r?\n/);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      const rawTeam = parts[0]?.replace(/^"|"$/g, '').trim();
      const rawCount = parts[1]?.replace(/^"|"$/g, '').trim();

      if (rawTeam && rawCount !== undefined) {
        const matchedTeam = matchDraftTeam(rawTeam, rawTeam) || rawTeam;
        const parsedCount = parseInt(rawCount, 10);
        if (!isNaN(parsedCount)) {
          redCards[matchedTeam] = parsedCount;
        }
      }
    }
    console.log("Successfully loaded red cards from Google Sheet:", redCards);
  } catch (err) {
    console.error("Failed to fetch Google Sheet, using fallback red cards:", err.message);
  }
  return redCards;
}

async function fetchMatches(apiKey) {
  const url = `https://api.football-data.org/v4/competitions/CL/matches`;
  console.log(`Fetching matches from: ${url}`);

  const res = await fetch(url, {
    headers: { 'X-Auth-Token': apiKey }
  });

  const data = await res.json();
  if (data.message) {
    console.error("API Message:", data.message);
  }
  return data.matches || [];
}

async function run() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    console.error("Missing FOOTBALL_API_KEY environment variable.");
    process.exit(1);
  }

  const leagueDataPath = path.resolve('src/data/leagueData.json');
  const leagueData = JSON.parse(fs.readFileSync(leagueDataPath, 'utf8'));

  const [redCards, matches] = await Promise.all([
    fetchRedCardsFromSheet(),
    fetchMatches(apiKey)
  ]);

  console.log(`Total CL matches retrieved: ${matches.length}`);

  // Initialize stats with live Google Sheet red card values
  const teamStats = {};
  Object.keys(TEAM_ALIASES).forEach((teamName) => {
    const rcCount = redCards[teamName] || 0;
    teamStats[teamName] = { w: 0, d: 0, l: 0, cs: 0, rc: rcCount, pts: -rcCount };
  });

  let finishedCount = 0;

  matches.forEach((item) => {
    if (item.status !== 'FINISHED') return;
    finishedCount++;

    const homeTeamName = matchDraftTeam(item.homeTeam?.name, item.homeTeam?.shortName);
    const awayTeamName = matchDraftTeam(item.awayTeam?.name, item.awayTeam?.shortName);

    const homeGoals = item.score?.regularTime?.home ?? item.score?.fullTime?.home ?? 0;
    const awayGoals = item.score?.regularTime?.away ?? item.score?.fullTime?.away ?? 0;

    // Home Team Points
    if (homeTeamName && teamStats[homeTeamName]) {
      if (homeGoals > awayGoals) {
        teamStats[homeTeamName].w += 1;
        teamStats[homeTeamName].pts += 3;
      } else if (homeGoals === awayGoals) {
        teamStats[homeTeamName].d += 1;
        teamStats[homeTeamName].pts += 1;
      } else {
        teamStats[homeTeamName].l += 1;
      }

      if (awayGoals === 0) {
        teamStats[homeTeamName].cs += 1;
        teamStats[homeTeamName].pts += 1;
      }
    }

    // Away Team Points
    if (awayTeamName && teamStats[awayTeamName]) {
      if (awayGoals > homeGoals) {
        teamStats[awayTeamName].w += 1;
        teamStats[awayTeamName].pts += 3;
      } else if (awayGoals === homeGoals) {
        teamStats[awayTeamName].d += 1;
        teamStats[awayTeamName].pts += 1;
      } else {
        teamStats[awayTeamName].l += 1;
      }

      if (homeGoals === 0) {
        teamStats[awayTeamName].cs += 1;
        teamStats[awayTeamName].pts += 1;
      }
    }
  });

  console.log(`Successfully processed ${finishedCount} finished matches.`);

  // Calculate manager standings
  const calculatedStandings = leagueData.managers.map((m) => {
    let w = 0, d = 0, cs = 0, rc = 0, pts = 0;
    const teams = m.teams.map((t) => {
      const stats = teamStats[t.name] || { w: 0, d: 0, l: 0, cs: 0, rc: 0, pts: 0 };
      w += stats.w;
      d += stats.d;
      cs += stats.cs;
      rc += stats.rc;
      pts += stats.pts;
      return { ...t, ...stats };
    });

    return {
      managerName: m.name,
      w,
      d,
      cs,
      rc,
      pts,
      teams
    };
  });

  // Sort by Points -> Total Wins -> Fewest Red Cards
  calculatedStandings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.w !== a.w) return b.w - a.w;
    return a.rc - b.rc;
  });

  // Calculate rank movement deltas
  const standingsPath = path.resolve('src/data/standings.json');
  let previousRanks = {};
  if (fs.existsSync(standingsPath)) {
    try {
      const prevData = JSON.parse(fs.readFileSync(standingsPath, 'utf8'));
      prevData.forEach((row) => {
        previousRanks[row.managerName] = row.rank;
      });
    } catch (e) {}
  }

  const finalOutput = calculatedStandings.map((row, index) => {
    const currentRank = index + 1;
    const prevRank = previousRanks[row.managerName] || currentRank;
    return {
      ...row,
      rank: currentRank,
      rankDelta: prevRank - currentRank
    };
  });

  fs.writeFileSync(standingsPath, JSON.stringify(finalOutput, null, 2));
  console.log('Successfully wrote updated standings to src/data/standings.json');
}

run();
