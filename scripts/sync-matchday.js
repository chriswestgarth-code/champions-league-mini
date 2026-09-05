import fs from 'fs';
import path from 'path';

// Team ID Mapping to API-Football IDs
const TEAM_API_IDS = {
  "Inter Milan": 505,
  "Man United": 33,
  "RB Leipzig": 173,
  "Stuttgart": 172,
  "Liverpool": 40,
  "Porto": 212,
  "Shakhtar Donetsk": 550,
  "Como": 880,
  "Real Madrid": 541,
  "PSV Eindhoven": 197,
  "Feyenoord": 247,
  "Lens": 116,
  "PSG": 85,
  "Dortmund": 165,
  "Bodø/Glimt": 328,
  "Viking": 329,
  "Arsenal": 42,
  "Aston Villa": 66,
  "Galatasaray": 645,
  "Slavia Praha": 559,
  "Bayern Munich": 157,
  "Sporting CP": 228,
  "Lille": 79,
  "LASK": 2045,
  "Barcelona": 529,
  "Roma": 497,
  "Napoli": 492,
  "AEK Athens": 553
};

const UCL_LEAGUE_ID = 2; // UEFA Champions League
const SEASON = 2026; // Current season

async function fetchFixtures() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    console.error("Missing FOOTBALL_API_KEY environment variable.");
    process.exit(1);
  }

  const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=${UCL_LEAGUE_ID}&season=${SEASON}`, {
    headers: {
      'x-apisports-key': apiKey
    }
  });

  const data = await res.json();
  return data.response || [];
}

async function run() {
  const leagueDataPath = path.resolve('src/data/leagueData.json');
  const leagueData = JSON.parse(fs.readFileSync(leagueDataPath, 'utf8'));

  const fixtures = await fetchFixtures();

  // Track each team's points and tiebreaker stats
  const teamStats = {};
  Object.keys(TEAM_API_IDS).forEach((teamName) => {
    teamStats[teamName] = { w: 0, d: 0, l: 0, cs: 0, rc: 0, pts: 0 };
  });

  // Process completed UCL matches
  fixtures.forEach((item) => {
    const status = item.fixture.status.short;
    if (!['FT', 'AET', 'PEN'].includes(status)) return; // Only process finished fixtures

    const homeId = item.teams.home.id;
    const awayId = item.teams.away.id;

    const homeTeamName = Object.keys(TEAM_API_IDS).find(name => TEAM_API_IDS[name] === homeId);
    const awayTeamName = Object.keys(TEAM_API_IDS).find(name => TEAM_API_IDS[name] === awayId);

    // 90-minute regulation score
    const homeGoals90 = item.score.fulltime.home ?? item.goals.home;
    const awayGoals90 = item.score.fulltime.away ?? item.goals.away;

    // Evaluate Home Team
    if (homeTeamName && teamStats[homeTeamName]) {
      if (homeGoals90 > awayGoals90) {
        teamStats[homeTeamName].w += 1;
        teamStats[homeTeamName].pts += 3;
      } else if (homeGoals90 === awayGoals90) {
        teamStats[homeTeamName].d += 1;
        teamStats[homeTeamName].pts += 1;
      } else {
        teamStats[homeTeamName].l += 1;
      }

      if (awayGoals90 === 0) {
        teamStats[homeTeamName].cs += 1;
        teamStats[homeTeamName].pts += 1;
      }

      if (status === 'AET' && item.score.extratime.home > item.score.extratime.away) {
        teamStats[homeTeamName].pts += 1;
      }
      if (status === 'PEN' && item.score.penalty.home > item.score.penalty.away) {
        teamStats[homeTeamName].pts += 1;
      }
    }

    // Evaluate Away Team
    if (awayTeamName && teamStats[awayTeamName]) {
      if (awayGoals90 > homeGoals90) {
        teamStats[awayTeamName].w += 1;
        teamStats[awayTeamName].pts += 3;
      } else if (awayGoals90 === homeGoals90) {
        teamStats[awayTeamName].d += 1;
        teamStats[awayTeamName].pts += 1;
      } else {
        teamStats[awayTeamName].l += 1;
      }

      if (homeGoals90 === 0) {
        teamStats[awayTeamName].cs += 1;
        teamStats[awayTeamName].pts += 1;
      }

      if (status === 'AET' && item.score.extratime.away > item.score.extratime.home) {
        teamStats[awayTeamName].pts += 1;
      }
      if (status === 'PEN' && item.score.penalty.away > item.score.penalty.home) {
        teamStats[awayTeamName].pts += 1;
      }
    }

    // Evaluate Red Cards from Events
    if (item.events) {
      item.events.forEach((ev) => {
        if (ev.type === 'Card' && (ev.detail === 'Red Card' || ev.detail === 'Second Yellow card')) {
          const cardedTeam = ev.team.id === homeId ? homeTeamName : (ev.team.id === awayId ? awayTeamName : null);
          if (cardedTeam && teamStats[cardedTeam]) {
            teamStats[cardedTeam].rc += 1;
            teamStats[cardedTeam].pts -= 1;
          }
        }
      });
    }
  });

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

  // Sort by Points ➔ Total Wins ➔ Lowest Red Cards
  calculatedStandings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.w !== a.w) return b.w - a.w;
    return a.rc - b.rc;
  });

  // Read previous ranks to calculate deltas
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
  console.log('Successfully updated standings.json');
}

run();
