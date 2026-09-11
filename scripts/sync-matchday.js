import fs from 'fs';
import path from 'path';

// Alias dictionary to ensure 100% accurate team matching
const TEAM_ALIASES = {
  "Inter Milan": ["inter", "internazionale", "inter milan"],
  "Man United": ["manchester united", "man united", "man utd"],
  "RB Leipzig": ["rb leipzig", "leipzig", "rasenballsport leipzig"],
  "Stuttgart": ["vfb stuttgart", "stuttgart"],
  "Liverpool": ["liverpool", "liverpool fc"],
  "Porto": ["fc porto", "porto"],
  "Shakhtar Donetsk": ["shakhtar donetsk", "shakhtar", "shaktar"],
  "Como": ["como", "como 1907"],
  "Real Madrid": ["real madrid", "real madrid cf"],
  "PSV Eindhoven": ["psv", "psv eindhoven"],
  "Feyenoord": ["feyenoord", "feyenoord rotterdam"],
  "Lens": ["rc lens", "lens"],
  "PSG": ["paris saint-germain", "psg", "paris sg"],
  "Dortmund": ["borussia dortmund", "dortmund", "bvb"],
  "Bodø/Glimt": ["bodø/glimt", "bodo/glimt", "fk bodø/glimt", "bodo glimt"],
  "Viking": ["viking", "viking fk"],
  "Arsenal": ["arsenal", "arsenal fc"],
  "Aston Villa": ["aston villa", "villa"],
  "Galatasaray": ["galatasaray", "galatasaray sk"],
  "Slavia Praha": ["slavia praha", "slavia prague", "sk slavia praha"],
  "Bayern Munich": ["bayern münchen", "bayern munich", "fc bayern"],
  "Sporting CP": ["sporting cp", "sporting lisbon", "sporting clobe de portugal"],
  "Lille": ["lille", "lille osc", "losc lille"],
  "LASK": ["lask", "lask linz"],
  "Barcelona": ["barcelona", "fc barcelona", "barça"],
  "Roma": ["roma", "as roma"],
  "Napoli": ["napoli", "ssc napoli"],
  "AEK Athens": ["aek athens", "aek", "pae aek", "aek athens fc"]
};

function matchDraftTeam(apiTeamName) {
  if (!apiTeamName) return null;
  const cleanApiName = apiTeamName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  for (const [officialName, aliases] of Object.entries(TEAM_ALIASES)) {
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (cleanApiName === cleanAlias || cleanApiName.includes(cleanAlias) || cleanAlias.includes(cleanApiName)) {
        return officialName;
      }
    }
  }
  return null;
}

async function fetchMatches(apiKey) {
  const url = `https://api.football-data.org/v4/competitions/CL/matches`;
  console.log(`Fetching matches from: ${url}`);

  const res = await fetch(url, {
    headers: { 'X-Auth-Token': apiKey }
  });

  const data = await res.json();
  if (data.message) {
    console.error("API Message / Notice:", data.message);
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

  const matches = await fetchMatches(apiKey);
  console.log(`Total CL matches retrieved: ${matches.length}`);

  const teamStats = {};
  Object.keys(TEAM_ALIASES).forEach((teamName) => {
    teamStats[teamName] = { w: 0, d: 0, l: 0, cs: 0, rc: 0, pts: 0 };
  });

  let finishedCount = 0;

  matches.forEach((item) => {
    if (item.status !== 'FINISHED') return;
    finishedCount++;

    const homeRaw = item.homeTeam?.name || item.homeTeam?.shortName;
    const awayRaw = item.awayTeam?.name || item.awayTeam?.shortName;

    const homeTeamName = matchDraftTeam(homeRaw);
    const awayTeamName = matchDraftTeam(awayRaw);

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

  // Sort by Points -> Total Wins -> Lowest Red Cards
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
