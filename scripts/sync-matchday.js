import fs from 'fs';
import path from 'path';

// Mapping team names to Football-Data.org Team IDs
const TEAM_IDS = {
  "Inter Milan": 108,
  "Man United": 66,
  "RB Leipzig": 721,
  "Stuttgart": 10,
  "Liverpool": 64,
  "Porto": 503,
  "Shakhtar Donetsk": 654,
  "Como": 1077,
  "Real Madrid": 86,
  "PSV Eindhoven": 674,
  "Feyenoord": 675,
  "Lens": 546,
  "PSG": 524,
  "Dortmund": 4,
  "Bodø/Glimt": 7458,
  "Viking": 7455,
  "Arsenal": 57,
  "Aston Villa": 58,
  "Galatasaray": 610,
  "Slavia Praha": 1097,
  "Bayern Munich": 5,
  "Sporting CP": 498,
  "Lille": 521,
  "LASK": 2014,
  "Barcelona": 81,
  "Roma": 100,
  "Napoli": 113,
  "AEK Athens": 639
};

async function fetchMatches(apiKey) {
  const url = `https://api.football-data.org/v4/competitions/CL/matches`;
  console.log(`Fetching from Football-Data.org: ${url}`);

  const res = await fetch(url, {
    headers: { 'X-Auth-Token': apiKey }
  });

  const data = await res.json();
  if (data.message) {
    console.error("API Message / Notice:", data.message);
  }
  if (data.errorCode) {
    console.error(`API Error Code: ${data.errorCode} - ${data.message}`);
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
  Object.keys(TEAM_IDS).forEach((teamName) => {
    teamStats[teamName] = { w: 0, d: 0, l: 0, cs: 0, rc: 0, pts: 0 };
  });

  let finishedCount = 0;

  matches.forEach((item) => {
    if (item.status !== 'FINISHED') return;
    finishedCount++;

    const homeId = item.homeTeam?.id;
    const awayId = item.awayTeam?.id;

    const homeTeamName = Object.keys(TEAM_IDS).find(name => TEAM_IDS[name] === homeId);
    const awayTeamName = Object.keys(TEAM_IDS).find(name => TEAM_IDS[name] === awayId);

    const homeGoals = item.score?.regularTime?.home ?? item.score?.fullTime?.home ?? 0;
    const awayGoals = item.score?.regularTime?.away ?? item.score?.fullTime?.away ?? 0;

    // Evaluate Home Team
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

    // Evaluate Away Team
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

  console.log(`Processed ${finishedCount} finished matches.`);

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
  console.log('Successfully written updated standings to src/data/standings.json');
}

run();
