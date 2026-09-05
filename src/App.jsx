import React, { useState } from 'react';
import leagueData from './data/leagueData.json';
import { Trophy, Copy, Check, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const initialStandings = [
  { rank: 1, rankDelta: 0, managerName: "Westy", totalPoints: 0, totalWins: 0, totalRedCards: 0, teams: leagueData.managers[0].teams },
  { rank: 2, rankDelta: 0, managerName: "Theo", totalPoints: 0, totalWins: 0, totalRedCards: 0, teams: leagueData.managers[1].teams },
  { rank: 3, rankDelta: 0, managerName: "Antoine", totalPoints: 0, totalWins: 0, totalRedCards: 0, teams: leagueData.managers[2].teams },
  { rank: 4, rankDelta: 0, managerName: "Charlie", totalPoints: 0, totalWins: 0, totalRedCards: 0, teams: leagueData.managers[3].teams },
  { rank: 5, rankDelta: 0, managerName: "Sam", totalPoints: 0, totalWins: 0, totalRedCards: 0, teams: leagueData.managers[4].teams },
  { rank: 6, rankDelta: 0, managerName: "Matt", totalPoints: 0, totalWins: 0, totalRedCards: 0, teams: leagueData.managers[5].teams },
  { rank: 7, rankDelta: 0, managerName: "Wilson", totalPoints: 0, totalWins: 0, totalRedCards: 0, teams: leagueData.managers[6].teams },
];

export default function App() {
  const [copied, setCopied] = useState(false);

  const copyScorecard = () => {
    const text = `🏆 THESE ARE THE CHAMPIONS — Leaderboard\n\n` +
      initialStandings.map(s => {
        const delta = s.rankDelta > 0 ? `(▲${s.rankDelta})` : s.rankDelta < 0 ? `(▼${Math.abs(s.rankDelta)})` : `(-)`;
        return `${s.rank}. ${s.managerName} — ${s.totalPoints} pts ${delta} [${s.totalWins}W | 🟥 ${s.totalRedCards}]`;
      }).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRankDeltaBadge = (delta) => {
    if (delta > 0) return <span className="inline-flex items-center text-emerald-400 font-semibold text-xs"><ArrowUp className="w-3 h-3 mr-0.5" />{delta}</span>;
    if (delta < 0) return <span className="inline-flex items-center text-rose-400 font-semibold text-xs"><ArrowDown className="w-3 h-3 mr-0.5" />{Math.abs(delta)}</span>;
    return <span className="inline-flex items-center text-slate-500 text-xs"><Minus className="w-3 h-3" /></span>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            ⭐ UEFA Champions League Mini League
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{leagueData.competition}</h1>
        </div>
        <button
          onClick={copyScorecard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-medium transition active:scale-95"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied to Clipboard' : 'Copy Scorecard'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 my-6">
        <div className="bg-gradient-to-b from-amber-500/15 to-transparent border border-amber-500/30 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-1" />
          <div className="text-xs font-semibold text-amber-400 uppercase">1st Place</div>
          <div className="text-xl font-bold text-white mt-1">{leagueData.prizes["1st"]}</div>
        </div>
        <div className="bg-gradient-to-b from-slate-400/15 to-transparent border border-slate-400/30 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-slate-300 mx-auto mb-1" />
          <div className="text-xs font-semibold text-slate-300 uppercase">2nd Place</div>
          <div className="text-xl font-bold text-white mt-1">{leagueData.prizes["2nd"]}</div>
        </div>
        <div className="bg-gradient-to-b from-amber-700/15 to-transparent border border-amber-700/30 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-amber-600 mx-auto mb-1" />
          <div className="text-xs font-semibold text-amber-600 uppercase">3rd Place</div>
          <div className="text-xl font-bold text-white mt-1">{leagueData.prizes["3rd"]}</div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 font-semibold text-sm text-slate-400 flex justify-between">
          <span>Standings</span>
          <span className="text-xs font-normal text-slate-500">Tiebreakers: Wins ➔ Lowest Red Cards</span>
        </div>
        <div className="divide-y divide-white/5">
          {initialStandings.map((row) => (
            <div key={row.managerName} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition gap-3">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center w-6">
                  <span className={`text-base font-bold ${row.rank === 1 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {row.rank}
                  </span>
                  {getRankDeltaBadge(row.rankDelta)}
                </div>
                <div>
                  <div className="font-semibold text-white text-base">{row.managerName}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {row.teams.map((t, idx) => (
                      <span key={t.code || idx} className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        {t.code || t.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span title="Total Wins">🏆 {row.totalWins}W</span>
                  <span title="Total Red Cards" className="text-rose-400">🟥 {row.totalRedCards}</span>
                </div>
                <div className="text-2xl font-black text-cyan-400 w-16 text-right">
                  {row.totalPoints} <span className="text-xs font-normal text-slate-500 block">PTS</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
