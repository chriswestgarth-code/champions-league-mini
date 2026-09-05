import React, { useState } from 'react';
import leagueData from './data/leagueData.json';
import { 
  Trophy, Copy, Check, ArrowUp, ArrowDown, Minus, 
  ChevronDown, ChevronUp, Layers, BookOpen
} from 'lucide-react';

const potBadgeStyles = {
  1: 'ring-1 ring-amber-400/50 bg-amber-400/10',
  2: 'ring-1 ring-slate-300/50 bg-slate-300/10',
  3: 'ring-1 ring-amber-700/50 bg-amber-700/10',
  4: 'ring-1 ring-cyan-400/50 bg-cyan-400/10',
};

const initialStandings = [
  { 
    rank: 1, rankDelta: 2, managerName: "Westy", totalPoints: 16, totalWins: 5, totalRedCards: 0,
    teams: [
      { pot: 1, name: "Inter Milan", code: "INT", w: 2, d: 0, l: 0, cs: 2, rc: 0, pts: 8, badge: leagueData.managers[0].teams[0].badge },
      { pot: 2, name: "Man United", code: "MUN", w: 1, d: 0, l: 1, cs: 0, rc: 0, pts: 3, badge: leagueData.managers[0].teams[1].badge },
      { pot: 3, name: "RB Leipzig", code: "RBL", w: 1, d: 1, l: 0, cs: 0, rc: 0, pts: 4, badge: leagueData.managers[0].teams[2].badge },
      { pot: 4, name: "Stuttgart", code: "STU", w: 0, d: 1, l: 1, cs: 0, rc: 0, pts: 1, badge: leagueData.managers[0].teams[3].badge },
    ]
  },
  { 
    rank: 2, rankDelta: -1, managerName: "Antoine", totalPoints: 14, totalWins: 4, totalRedCards: 0,
    teams: [
      { pot: 1, name: "Real Madrid", code: "RMA", w: 2, d: 0, l: 0, cs: 1, rc: 0, pts: 7, badge: leagueData.managers[2].teams[0].badge },
      { pot: 2, name: "PSV Eindhoven", code: "PSV", w: 1, d: 0, l: 1, cs: 0, rc: 0, pts: 3, badge: leagueData.managers[2].teams[1].badge },
      { pot: 3, name: "Feyenoord", code: "FEY", w: 1, d: 0, l: 1, cs: 0, rc: 0, pts: 3, badge: leagueData.managers[2].teams[2].badge },
      { pot: 4, name: "Lens", code: "RCL", w: 0, d: 1, l: 1, cs: 0, rc: 0, pts: 1, badge: leagueData.managers[2].teams[3].badge },
    ]
  },
  { 
    rank: 3, rankDelta: 0, managerName: "Sam", totalPoints: 13, totalWins: 4, totalRedCards: 1,
    teams: [
      { pot: 1, name: "Arsenal", code: "ARS", w: 2, d: 0, l: 0, cs: 2, rc: 0, pts: 8, badge: leagueData.managers[4].teams[0].badge },
      { pot: 2, name: "Aston Villa", code: "AVL", w: 1, d: 0, l: 1, cs: 0, rc: 0, pts: 3, badge: leagueData.managers[4].teams[1].badge },
      { pot: 3, name: "Galatasaray", code: "GAL", w: 1, d: 0, l: 1, cs: 0, rc: 1, pts: 2, badge: leagueData.managers[4].teams[2].badge },
      { pot: 4, name: "Slavia Praha", code: "SLA", w: 0, d: 0, l: 2, cs: 0, rc: 0, pts: 0, badge: leagueData.managers[4].teams[3].badge },
    ]
  },
  { 
    rank: 4, rankDelta: 1, managerName: "Theo", totalPoints: 11, totalWins: 3, totalRedCards: 0,
    teams: [
      { pot: 1, name: "Liverpool", code: "LIV", w: 2, d: 0, l: 0, cs: 1, rc: 0, pts: 7, badge: leagueData.managers[1].teams[0].badge },
      { pot: 2, name: "Porto", code: "POR", w: 1, d: 0, l: 1, cs: 0, rc: 0, pts: 3, badge: leagueData.managers[1].teams[1].badge },
      { pot: 3, name: "Shakhtar Donetsk", code: "SHK", w: 0, d: 1, l: 1, cs: 0, rc: 0, pts: 1, badge: leagueData.managers[1].teams[2].badge },
      { pot: 4, name: "Como", code: "COM", w: 0, d: 0, l: 2, cs: 0, rc: 0, pts: 0, badge: leagueData.managers[1].teams[3].badge },
    ]
  },
  { 
    rank: 5, rankDelta: -2, managerName: "Matt", totalPoints: 10, totalWins: 3, totalRedCards: 1,
    teams: [
      { pot: 1, name: "Bayern Munich", code: "BAY", w: 2, d: 0, l: 0, cs: 1, rc: 0, pts: 7, badge: leagueData.managers[5].teams[0].badge },
      { pot: 2, name: "Sporting CP", code: "SCP", w: 1, d: 0, l: 1, cs: 0, rc: 0, pts: 3, badge: leagueData.managers[5].teams[1].badge },
      { pot: 3, name: "Lille", code: "LIL", w: 0, d: 1, l: 1, cs: 0, rc: 1, pts: 0, badge: leagueData.managers[5].teams[2].badge },
      { pot: 4, name: "LASK", code: "LSK", w: 0, d: 0, l: 2, cs: 0, rc: 0, pts: 0, badge: leagueData.managers[5].teams[3].badge },
    ]
  },
  { 
    rank: 6, rankDelta: 0, managerName: "Charlie", totalPoints: 9, totalWins: 2, totalRedCards: 2,
    teams: [
      { pot: 1, name: "PSG", code: "PSG", w: 1, d: 0, l: 1, cs: 1, rc: 1, pts: 3, badge: leagueData.managers[3].teams[0].badge },
      { pot: 2, name: "Dortmund", code: "BVB", w: 1, d: 0, l: 1, cs: 0, rc: 0, pts: 3, badge: leagueData.managers[3].teams[1].badge },
      { pot: 3, name: "Bodø/Glimt", code: "BOD", w: 0, d: 1, l: 1, cs: 0, rc: 1, pts: 0, badge: leagueData.managers[3].teams[2].badge },
      { pot: 4, name: "Viking", code: "VIK", w: 0, d: 1, l: 1, cs: 0, rc: 0, pts: 1, badge: leagueData.managers[3].teams[3].badge },
    ]
  },
  { 
    rank: 7, rankDelta: 0, managerName: "Wilson", totalPoints: 7, totalWins: 2, totalRedCards: 1,
    teams: [
      { pot: 1, name: "Barcelona", code: "BAR", w: 1, d: 0, l: 1, cs: 0, rc: 0, pts: 3, badge: leagueData.managers[6].teams[0].badge },
      { pot: 2, name: "Roma", code: "ROM", w: 1, d: 0, l: 1, cs: 0, rc: 0, pts: 3, badge: leagueData.managers[6].teams[1].badge },
      { pot: 3, name: "Napoli", code: "NAP", w: 0, d: 1, l: 1, cs: 0, rc: 1, pts: 0, badge: leagueData.managers[6].teams[2].badge },
      { pot: 4, name: "AEK Athens", code: "AEK", w: 0, d: 1, l: 1, cs: 0, rc: 0, pts: 1, badge: leagueData.managers[6].teams[3].badge },
    ]
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('standings');
  const [expandedManager, setExpandedManager] = useState(null);
  const [copied, setCopied] = useState(false);

  const toggleExpand = (name) => {
    setExpandedManager(expandedManager === name ? null : name);
  };

  const copyScorecard = () => {
    const text = `🏆 CHAMP' MAN' TAIWAN — Standings\n\n` +
      initialStandings.map(s => {
        const delta = s.rankDelta > 0 ? `(▲${s.rankDelta})` : s.rankDelta < 0 ? `(▼${Math.abs(s.rankDelta)})` : `(-)`;
        return `${s.rank}. ${s.managerName} — ${s.totalPoints} pts ${delta} [${s.totalWins}W | 🟥 ${s.totalRedCards}]`;
      }).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRankDeltaBadge = (delta) => {
    if (delta > 0) return <span className="inline-flex items-center text-emerald-400 font-bold text-xs"><ArrowUp className="w-3 h-3 mr-0.5" />{delta}</span>;
    if (delta < 0) return <span className="inline-flex items-center text-rose-400 font-bold text-xs"><ArrowDown className="w-3 h-3 mr-0.5" />{Math.abs(delta)}</span>;
    return <span className="inline-flex items-center text-slate-500 text-xs"><Minus className="w-3 h-3" /></span>;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Floating Stars */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="star-particle"
            style={{
              left: `${(i * 8.5) + 2}%`,
              animationDuration: `${12 + (i % 6) * 3}s`,
              animationDelay: `${(i % 5) * 1.8}s`,
              fontSize: `${12 + (i % 4) * 6}px`
            }}
          >
            ★
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 py-6 font-sans">
        
        {/* Banner Section */}
        <div className="rounded-2xl overflow-hidden border border-blue-500/20 shadow-2xl bg-[#08112e] mb-5 relative group">
          <img 
            src="/banner.webp.webp" 
            alt="Champ' Man' Taiwan Banner" 
            className="w-full h-auto object-cover max-h-64 sm:max-h-72 object-center"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040817] via-transparent to-transparent opacity-80 pointer-events-none" />
          
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 backdrop-blur-md">
                ⭐ UCL 2026/27 Mini League
              </span>
            </div>
            <button
              onClick={copyScorecard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition active:scale-95 shadow-lg shadow-cyan-500/30"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        {/* Prize Podia Bar */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 rounded-xl px-3 py-2">
            <span className="text-xs text-amber-400 font-bold flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> 1st</span>
            <span className="text-xs sm:text-sm font-black text-white">{leagueData.prizes["1st"]}</span>
          </div>
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-300/10 to-transparent border border-slate-300/30 rounded-xl px-3 py-2">
            <span className="text-xs text-slate-300 font-bold flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> 2nd</span>
            <span className="text-xs sm:text-sm font-black text-white">{leagueData.prizes["2nd"]}</span>
          </div>
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-700/10 to-transparent border border-amber-700/30 rounded-xl px-3 py-2">
            <span className="text-xs text-amber-600 font-bold flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> 3rd</span>
            <span className="text-xs sm:text-sm font-black text-white">{leagueData.prizes["3rd"]}</span>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'standings' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-3.5 h-3.5" /> Standings & Teams
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'rules' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Scoring Rules
          </button>
        </div>

        {activeTab === 'standings' ? (
          <div className="space-y-2.5">
            {initialStandings.map((row) => {
              const isExpanded = expandedManager === row.managerName;
              return (
                <div 
                  key={row.managerName} 
                  className={`rounded-xl border transition-all duration-200 overflow-hidden backdrop-blur-md ${
                    row.rank === 1 
                      ? 'bg-gradient-to-r from-amber-500/10 via-white/[0.04] to-transparent border-amber-500/40 shadow-lg shadow-amber-500/5' 
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div 
                    onClick={() => toggleExpand(row.managerName)}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center w-7 text-center">
                        <span className={`text-base sm:text-lg font-black ${row.rank === 1 ? 'text-amber-400' : 'text-slate-200'}`}>
                          #{row.rank}
                        </span>
                        {getRankDeltaBadge(row.rankDelta)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm sm:text-base">{row.managerName}</span>
                          {row.rank === 1 && <span className="text-[9px] bg-amber-400/20 text-amber-300 px-2 py-0.2 rounded-full font-bold">LEADER</span>}
                        </div>

                        {/* Crests Row */}
                        <div className="flex items-center gap-2 mt-1.5">
                          {row.teams.map((t) => (
                            <div 
                              key={t.code} 
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full p-1 flex items-center justify-center bg-black/40 ${potBadgeStyles[t.pot]}`}
                              title={`Pot ${t.pot}: ${t.name}`}
                            >
                              <img src={t.badge} alt={t.name} className="w-full h-full object-contain" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                        <span title="Total Wins">🏆 {row.totalWins}W</span>
                        <span title="Total Red Cards" className="text-rose-400">🟥 {row.totalRedCards}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-xl sm:text-2xl font-black text-cyan-400">{row.totalPoints}</span>
                          <span className="text-[9px] text-slate-500 font-bold ml-1">PTS</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded View */}
                  {isExpanded && (
                    <div className="bg-black/40 border-t border-white/10 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {row.teams.map((t) => (
                        <div key={t.code} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full p-1 bg-black/50 flex items-center justify-center ${potBadgeStyles[t.pot]}`}>
                              <img src={t.badge} alt={t.name} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs sm:text-sm">{t.name}</div>
                              <span className="text-[10px] text-slate-400 font-medium">Pot {t.pot}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-slate-400 text-[11px]">{t.w}W-{t.d}D-{t.l}L</span>
                            {t.cs > 0 && <span className="text-emerald-400 font-semibold" title="Clean Sheets">🛡️+{t.cs}</span>}
                            {t.rc > 0 && <span className="text-rose-400 font-semibold" title="Red Cards">🟥-{t.rc}</span>}
                            <span className="text-cyan-300 font-black text-sm">{t.pts} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Rules Matrix Tab */
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-slate-300 space-y-5">
            <div>
              <h3 className="text-white font-extrabold text-sm mb-3">⚽ Match Scoring Matrix</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5"><span className="text-emerald-400 font-bold block text-sm">+3 PTS</span> Win (90' / 120')</div>
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5"><span className="text-slate-300 font-bold block text-sm">+1 PT</span> Draw (90' / 120')</div>
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5"><span className="text-slate-500 font-bold block text-sm">0 PTS</span> Loss</div>
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5"><span className="text-cyan-400 font-bold block text-sm">+1 PT</span> Clean Sheet (Locked at 90')</div>
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5"><span className="text-rose-400 font-bold block text-sm">-1 PT</span> Red Card (Per player carded)</div>
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5"><span className="text-amber-400 font-bold block text-sm">+1 BONUS</span> PK Shootout Winner</div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-white font-extrabold text-sm mb-2">⚖️ Tiebreaker Hierarchy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                1. Most total wins across all 4 picked teams.<br />
                2. Fewest total red cards across all 4 picked teams.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
