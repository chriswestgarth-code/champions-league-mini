import React, { useState } from 'react';
import leagueData from './data/leagueData.json';
import liveStandings from './data/standings.json';
import { 
  Trophy, Copy, Check, ArrowUp, ArrowDown, Minus, 
  ChevronDown, ChevronUp, BookOpen, X, Shield, AlertOctagon
} from 'lucide-react';

const potColors = {
  1: 'border-amber-400/40 text-amber-300 bg-amber-400/10',
  2: 'border-slate-300/40 text-slate-200 bg-slate-300/10',
  3: 'border-amber-700/40 text-amber-500 bg-amber-700/10',
  4: 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10',
};

// Initial state with 0s across all stats (pre-season)
const initialStandings = liveStandings.map((s) => {
  const managerConfig = leagueData.managers.find(m => m.name === s.managerName) || {};
  return {
    ...s,
    teams: s.teams || (managerConfig.teams || []).map(t => ({ ...t, w: 0, d: 0, l: 0, cs: 0, rc: 0, pts: 0 }))
  };
});

export default function App() {
  const [copied, setCopied] = useState(false);
  const [expandedManager, setExpandedManager] = useState(null);
  const [showRules, setShowRules] = useState(false);

  const toggleExpand = (name) => {
    setExpandedManager(expandedManager === name ? null : name);
  };

  const copyScorecard = () => {
    const text = `🏆 CHAMP' MAN' TAIWAN — Leaderboard\n\n` +
      initialStandings.map(s => {
        const delta = s.rankDelta > 0 ? `(▲${s.rankDelta})` : s.rankDelta < 0 ? `(▼${Math.abs(s.rankDelta)})` : `(-)`;
        return `${s.rank}. ${s.managerName} — ${s.pts} pts ${delta} [${s.w}W | ${s.d}D | 🛡️${s.cs}CS | 🟥${s.rc}]`;
      }).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRankDeltaBadge = (delta) => {
    if (delta > 0) return <span className="inline-flex items-center text-emerald-400 font-bold text-[10px]"><ArrowUp className="w-2.5 h-2.5 mr-0.5" />{delta}</span>;
    if (delta < 0) return <span className="inline-flex items-center text-rose-400 font-bold text-[10px]"><ArrowDown className="w-2.5 h-2.5 mr-0.5" />{Math.abs(delta)}</span>;
    return <span className="inline-flex items-center text-slate-500 text-[10px]"><Minus className="w-2.5 h-2.5" /></span>;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="text-3xl font-black text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">1</span>;
    if (rank === 2) return <span className="text-3xl font-black text-slate-300 drop-shadow-[0_0_12px_rgba(203,213,225,0.4)]">2</span>;
    if (rank === 3) return <span className="text-3xl font-black text-amber-600 drop-shadow-[0_0_12px_rgba(217,119,6,0.4)]">3</span>;
    return <span className="text-2xl font-black text-slate-500">#{rank}</span>;
  };

  return (
    <div className="relative min-h-screen pb-12 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Cascading UCL Stars */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="star-particle"
            style={{
              left: `${(i * 10) + 3}%`,
              animationDuration: `${12 + (i % 5) * 3}s`,
              animationDelay: `${(i % 4) * 2}s`,
              fontSize: `${14 + (i % 3) * 6}px`
            }}
          >
            ★
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 py-4">
        
        {/* Banner */}
        <div className="rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-[#08112e] mb-4 relative">
          <img 
            src="/banner.webp" 
            alt="Champ' Man' Taiwan" 
            className="w-full h-auto object-cover max-h-56 sm:max-h-64 object-center"
            onError={(e) => {
              if (!e.target.dataset.tried) {
                e.target.dataset.tried = "true";
                e.target.src = "/banner.webp.webp";
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040817] via-transparent to-transparent opacity-80 pointer-events-none" />
        </div>

        {/* Prize Podia Bar & Quick Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-slate-900/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl">
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto flex-1 max-w-lg">
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5">
              <span className="text-[11px] text-amber-400 font-extrabold flex items-center gap-1"><Trophy className="w-3 h-3" /> 1st</span>
              <span className="text-xs font-black text-white">{leagueData.prizes["1st"]}</span>
            </div>
            <div className="flex items-center justify-between bg-slate-300/10 border border-slate-300/30 rounded-xl px-3 py-1.5">
              <span className="text-[11px] text-slate-300 font-extrabold flex items-center gap-1"><Trophy className="w-3 h-3" /> 2nd</span>
              <span className="text-xs font-black text-white">{leagueData.prizes["2nd"]}</span>
            </div>
            <div className="flex items-center justify-between bg-amber-700/10 border border-amber-700/30 rounded-xl px-3 py-1.5">
              <span className="text-[11px] text-amber-600 font-extrabold flex items-center gap-1"><Trophy className="w-3 h-3" /> 3rd</span>
              <span className="text-xs font-black text-white">{leagueData.prizes["3rd"]}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowRules(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs tracking-wider uppercase transition border border-white/10"
            >
              <BookOpen className="w-3.5 h-3.5" /> Rules
            </button>
            <button
              onClick={copyScorecard}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs tracking-wider uppercase transition active:scale-95 shadow-lg shadow-cyan-500/20"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'COPIED' : 'COPY SCORECARD'}
            </button>
          </div>
        </div>

        {/* Table Header Columns */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-6 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-white/10 mb-3">
          <div className="col-span-1 text-center">RANK</div>
          <div className="col-span-6">OWNER / SQUAD ROSTER</div>
          <div className="col-span-1 text-center">W</div>
          <div className="col-span-1 text-center">D</div>
          <div className="col-span-1 text-center">CS</div>
          <div className="col-span-1 text-center">RC</div>
          <div className="col-span-1 text-right">PTS</div>
        </div>

        {/* Standings List */}
        <div className="space-y-3">
          {initialStandings.map((row) => {
            const isExpanded = expandedManager === row.managerName;
            return (
              <div 
                key={row.managerName}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden backdrop-blur-md ${
                  row.rank === 1 
                    ? 'bg-gradient-to-r from-amber-500/15 via-[#0B1536]/80 to-[#060D24] border-amber-500/50 shadow-xl shadow-amber-500/5' 
                    : row.rank === 2
                    ? 'bg-gradient-to-r from-slate-400/10 via-[#0B1536]/80 to-[#060D24] border-slate-400/30'
                    : row.rank === 3
                    ? 'bg-gradient-to-r from-amber-800/15 via-[#0B1536]/80 to-[#060D24] border-amber-700/30'
                    : 'bg-[#081230]/70 border-white/10 hover:border-cyan-500/30'
                }`}
              >
                {/* Main Card Clickable Row */}
                <div 
                  onClick={() => toggleExpand(row.managerName)}
                  className="p-4 sm:p-5 cursor-pointer select-none"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2 items-center">
                    
                    {/* Rank & Movement Delta */}
                    <div className="sm:col-span-1 flex items-center justify-between sm:justify-center">
                      <div className="flex items-center gap-2 sm:flex-col sm:gap-0.5">
                        {getRankBadge(row.rank)}
                        {getRankDeltaBadge(row.rankDelta)}
                      </div>
                      <div className="sm:hidden text-3xl font-black text-[#A6FF00] tracking-tight">
                        {row.pts} <span className="text-xs text-slate-400 font-bold">PTS</span>
                      </div>
                    </div>

                    {/* Manager Name + 4 Pot Badges */}
                    <div className="sm:col-span-6">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-lg tracking-tight uppercase">
                          {row.managerName}
                        </span>
                        {row.rank === 1 && (
                          <span className="text-[10px] bg-amber-400/20 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded-full font-black tracking-wider">
                            LEADER
                          </span>
                        )}
                      </div>

                      {/* Badges and Names Row */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-2.5">
                        {row.teams.map((t) => (
                          <div 
                            key={t.code} 
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-black/40 ${potColors[t.pot]}`}
                          >
                            <img 
                              src={t.badge} 
                              alt={t.name} 
                              className="w-4 h-4 object-contain"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span className="text-[11px] font-extrabold text-slate-200 truncate">
                              {t.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Desktop Stat Columns */}
                    <div className="hidden sm:block sm:col-span-1 text-center font-bold text-base text-slate-200">{row.w}</div>
                    <div className="hidden sm:block sm:col-span-1 text-center font-bold text-base text-slate-200">{row.d}</div>
                    <div className="hidden sm:block sm:col-span-1 text-center font-bold text-base text-cyan-300">{row.cs}</div>
                    <div className="hidden sm:block sm:col-span-1 text-center font-bold text-base text-rose-400">{row.rc}</div>
                    
                    {/* Desktop Points Column + Expand Arrow */}
                    <div className="hidden sm:flex sm:col-span-1 items-center justify-end gap-2 text-right">
                      <span className="font-black text-3xl text-[#A6FF00] tracking-tight drop-shadow-[0_0_10px_rgba(166,255,0,0.3)]">
                        {row.pts}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>

                    {/* Mobile Stat Strip */}
                    <div className="grid grid-cols-4 sm:hidden pt-3 border-t border-white/10 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">WINS</span>
                        <span className="font-black text-white text-sm">{row.w}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">DRAWS</span>
                        <span className="font-black text-white text-sm">{row.d}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-cyan-300 block font-bold">CLEAN SH.</span>
                        <span className="font-black text-cyan-300 text-sm">{row.cs}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-400 block font-bold">REDS</span>
                        <span className="font-black text-rose-400 text-sm">{row.rc}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Detailed Club Breakdown (Expanded View) */}
                {isExpanded && (
                  <div className="bg-black/50 border-t border-white/10 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {row.teams.map((t) => (
                      <div key={t.code} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={t.badge} 
                            alt={t.name} 
                            className="w-6 h-6 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div>
                            <div className="font-bold text-white text-xs sm:text-sm">{t.name}</div>
                            <span className="text-[10px] text-slate-400 font-medium">Pot {t.pot}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 text-[11px]">{t.w}W-{t.d}D-{t.l}L</span>
                          {t.cs > 0 && <span className="text-emerald-400 font-semibold" title="Clean Sheets">🛡️+{t.cs}</span>}
                          {t.rc > 0 && <span className="text-rose-400 font-semibold" title="Red Cards">🟥-{t.rc}</span>}
                          <span className="text-[#A6FF00] font-black text-sm">{t.pts} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rules Modal */}
        {showRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0B1536] border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 text-slate-200 relative shadow-2xl">
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                ⚽ Scoring & Tiebreaker Rules
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-cyan-300 uppercase tracking-wider mb-2">Match Scoring</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-white/5 rounded-lg border border-white/5"><span className="text-emerald-400 font-bold block text-sm">+3 PTS</span> Win (90' / 120')</div>
                    <div className="p-2.5 bg-white/5 rounded-lg border border-white/5"><span className="text-slate-300 font-bold block text-sm">+1 PT</span> Draw (90' / 120')</div>
                    <div className="p-2.5 bg-white/5 rounded-lg border border-white/5"><span className="text-slate-500 font-bold block text-sm">0 PTS</span> Loss</div>
                    <div className="p-2.5 bg-white/5 rounded-lg border border-white/5"><span className="text-cyan-400 font-bold block text-sm">+1 PT</span> Clean Sheet (Locked at 90')</div>
                    <div className="p-2.5 bg-white/5 rounded-lg border border-white/5"><span className="text-rose-400 font-bold block text-sm">-1 PT</span> Red Card (All game)</div>
                    <div className="p-2.5 bg-white/5 rounded-lg border border-white/5"><span className="text-amber-400 font-bold block text-sm">+1 BONUS</span> Shootout Winner</div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <h3 className="font-bold text-cyan-300 uppercase tracking-wider mb-1">⚖️ Tiebreakers</h3>
                  <p className="text-slate-400 leading-relaxed">
                    1. Most total wins across all 4 picked teams.<br />
                    2. Fewest total red cards across all 4 picked teams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
