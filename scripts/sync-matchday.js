import fs from 'fs';
import path from 'path';

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    console.error("Missing FOOTBALL_API_KEY");
    process.exit(1);
  }

  const leagueData = JSON.parse(fs.readFileSync(path.resolve('src/data/leagueData.json'), 'utf8'));

  // 1. Fetch Fixtures Summary
  const res = await fetch(`https://api.football-data.org/v4/competitions/CL/matches`, {
    headers: { 'X-Auth-Token': apiKey }
  });
  const data = await res.json();
  const finishedMatches = (data.matches || []).filter(m => m.status === 'FINISHED');

  const teamStats = {};
  Object.keys(TEAM_ALIASES).forEach(t => teamStats[t] = { w: 0, d: 0, l: 0, cs: 0, rc: 0, pts: 0 });

  // 2. Process Finished Matches
  for (const match of finishedMatches) {
    const homeTeam = matchDraftTeam(match.homeTeam?.name, match.homeTeam?.shortName);
    const awayTeam = matchDraftTeam(match.awayTeam?.name, match.awayTeam?.shortName);
    const homeGoals = match.score?.regularTime?.home ?? match.score?.fullTime?.home ?? 0;
    const awayGoals = match.score?.regularTime?.away ?? match.score?.fullTime?.away ?? 0;

    if (homeTeam && teamStats[homeTeam]) {
      if (homeGoals > awayGoals) { teamStats[homeTeam].w += 1; teamStats[homeTeam].pts += 3; }
      else if (homeGoals === awayGoals) { teamStats[homeTeam].d += 1; teamStats[homeTeam].pts += 1; }
      else { teamStats[homeTeam].l += 1; }
      if (awayGoals === 0) { teamStats[homeTeam].cs += 1; teamStats[homeTeam].pts += 1; }
    }

    if (awayTeam && teamStats[awayTeam]) {
      if (awayGoals > homeGoals) { teamStats[awayTeam].w += 1; teamStats[awayTeam].pts += 3; }
      else if (awayGoals === homeGoals) { teamStats[awayTeam].d += 1; teamStats[awayTeam].pts += 1; }
      else { teamStats[awayTeam].l += 1; }
      if (homeGoals === 0) { teamStats[awayTeam].cs += 1; teamStats[awayTeam].pts += 1; }
    }

    // 3. Query Match Details for Red Cards (Throttled for Free Tier)
    if (homeTeam || awayTeam) {
      try {
        await sleep(6500); // 6.5s delay keeps rate at ~9 requests/min (under the 10/min limit)
        const matchRes = await fetch(`https://api.football-data.org/v4/matches/${match.id}`, {
          headers: { 'X-Auth-Token': apiKey }
        });
        const matchData = await matchRes.json();
        const bookings = matchData.bookings || [];

        bookings.forEach(b => {
          if (b.card === 'RED_CARD' || b.card === 'YELLOW_RED_CARD') {
            const cardTeam = matchDraftTeam(b.team?.name, b.team?.shortName);
            if (cardTeam && teamStats[cardTeam]) {
              teamStats[cardTeam].rc += 1;
              teamStats[cardTeam].pts -= 1;
            }
          }
        });
      } catch (err) {
        console.error(`Failed to fetch bookings for match ${match.id}:`, err.message);
      }
    }
  }

  // 4. Calculate Manager Standings
  const calculatedStandings = leagueData.managers.map((m) => {
    let w = 0, d = 0, cs = 0, rc = 0, pts = 0;
    const teams = m.teams.map((t) => {
      const stats = teamStats[t.name] || { w: 0, d: 0, l: 0, cs: 0, rc: 0, pts: 0 };
      w += stats.w; d += stats.d; cs += stats.cs; rc += stats.rc; pts += stats.pts;
      return { ...t, ...stats };
    });
    return { managerName: m.name, w, d, cs, rc, pts, teams };
  });

  calculatedStandings.sort((a, b) => (b.pts !== a.pts ? b.pts - a.pts : b.w !== a.w ? b.w - a.w : a.rc - b.rc));

  const standingsPath = path.resolve('src/data/standings.json');
  let previousRanks = {};
  if (fs.existsSync(standingsPath)) {
    try {
      const prevData = JSON.parse(fs.readFileSync(standingsPath, 'utf8'));
      prevData.forEach((row) => { previousRanks[row.managerName] = row.rank; });
    } catch (e) {}
  }

  const finalOutput = calculatedStandings.map((row, index) => ({
    ...row,
    rank: index + 1,
    rankDelta: (previousRanks[row.managerName] || (index + 1)) - (index + 1)
  }));

  fs.writeFileSync(standingsPath, JSON.stringify(finalOutput, null, 2));
  console.log('Successfully written updated standings with red cards to src/data/standings.json');
}

run();
