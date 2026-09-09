import fs from 'fs';
import path from 'path';

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

async function fetchFixturesForSeason(seasonYear, apiKey) {
  const url = `https://v3.football.api-sports.io/fixtures?league=${UCL_LEAGUE_ID}&season=${seasonYear}`;
  console.log(`Querying API: ${url}`);

  try {
    const res = await fetch(url, {
      headers: { 'x-apisports-key': apiKey }
    });
    const data = await res.json();
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.log(`API returned errors for season ${seasonYear}:`, JSON.stringify(data.errors));
    }
    
    const fixtures = data.response || [];
    console.log(`Season ${seasonYear}: Found ${fixtures.length} fixtures total.`);
    return fixtures;
  } catch (err) {
    console.error(`Fetch error for season ${seasonYear}:`, err.message);
    return [];
  }
}

async function run() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL ERROR: FOOTBALL_API_KEY is not set in GitHub Secrets.");
    process.exit(1);
  }

  // Check 2026 season first, fallback to 2025 if API-Football indexes starting year
  let fixtures = await fetchFixturesForSeason(2026, apiKey);
  if (fixtures.length === 0) {
    console.log("Season 2026 returned 0 fixtures. Trying season 2025...");
    fixtures = await fetchFixturesForSeason(2025, apiKey);
  }

  const leagueDataPath = path.resolve('src/data/leagueData.json');
  const leagueData = JSON.parse(fs.readFileSync(leagueDataPath, 'utf8'));

  const teamStats = {};
  Object.keys(TEAM_API_IDS).forEach((teamName) => {
    teamStats[teamName] = { w: 0, d: 0, l: 0, cs: 0, rc: 0, pts: 0 };
  });

  let finishedCount = 0;

  fixtures.forEach((item) => {
    const status = item.fixture?.status?.short;
    if (!['FT', 'AET', 'PEN'].includes(status)) return;
    finishedCount++;

    const homeId = item.teams?.home?.id;
    const awayId = item.teams?.away?.id;

    const homeTeamName = Object.keys(TEAM_API_IDS).find(name => TEAM_API_IDS[name] === homeId);
    const awayTeamName = Object.keys(TEAM_API_IDS).find(name => TEAM_API_IDS[name] === awayId);

    const homeGoals90 = item.score?.fulltime?.home ?? item.goals?.home ?? 0;
    const awayGoals90 = item.score?.fulltime?.away ?? item.goals?.away ?? 0;

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
    }

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
    }

    if (item.events) {
      item.events.forEach((ev) => {
        if (ev.type === 'Card' && (ev.detail === 'Red Card' || ev.detail === 'Second Yellow card')) {
          const cardedTeam = ev.team?.id === homeId ? homeTeamName : (ev.team?.id === awayId ? awayTeamName : null);
          if (cardedTeam && teamStats[cardedTeam]) {
            teamStats[cardedTeam].rc += 1;
            teamStats[cardedTeam].pts -= 1;
          }
        }
      });
    }
  });

  console.log(`Total finished fixtures evaluated: ${finishedCount}`);

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

  calculatedStandings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.w !== a.w) return b.w - a.w;
    return a.rc - b.rc;
  });

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
