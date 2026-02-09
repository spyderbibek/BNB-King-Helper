import { useRef, useEffect } from 'react';
import { useWallet } from './hooks/useWallet';
import { useLogs } from './hooks/useLogs';
import { useGameData } from './hooks/useGameData';
import { useGameActions } from './hooks/useGameActions';
import { BUILDING_TYPES } from './config/constants';
import { LogEntry, BuildingType } from './types';

// ============================================================================
// COMPLETELY REDESIGNED UI - Modern Card-Based Dashboard Layout
// ============================================================================

function App() {
  const { logs, addLog } = useLogs();
  const { account, viewAddress, connectWallet, handleViewAddressChange, loading: walletLoading } = useWallet(addLog);
  
  const {
    balance,
    contractBalance,
    dailyWithdrawals,
    kingdom,
    battleCooldownStr,
    isBattleReady,
    bnbPrice,
    winChance,
    setWinChance,
    totalGold,
    totalGems,
    perHour,
    dailyGems,
    totalGemsUsd,
    dailyGemsUsd,
    runwayDays,
    activeBuildings,
    bestAction,
    potentialReward,
    potentialLoss,
    refreshData
  } = useGameData(viewAddress, account, addLog);

  const { executeTx, actionLoading } = useGameActions(account, viewAddress, addLog, refreshData);

  const handleBuild = (type: number, cost: number) => {
    if (!kingdom) return;
    const slot = kingdom.tiles.indexOf(0);
    if (slot === -1) return addLog('No free slots', 'error');
    if (totalGold < cost) return addLog('Need more gold', 'error');
    executeTx('placeBuildings', [[slot], type]);
  };

  const handleUpgrade = (id: number, cost: number) => {
    if (totalGold < cost) return addLog('Need more gold', 'error');
    executeTx('upgradeBuilding', [id]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        
        {/* ===== TOP BAR: Logo + Wallet ===== */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center">
              <span className="text-2xl font-black">K</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">BNB King</h1>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>BNB ${bnbPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Wallet address..."
              value={viewAddress}
              onChange={e => handleViewAddressChange(e.target.value)}
              className="hidden md:block w-48 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-violet-500/50 focus:outline-none"
            />
            <button
              onClick={connectWallet}
              disabled={walletLoading}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm ${
                account
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-violet-600 text-white'
              }`}
            >
              {account ? `${account.slice(0,6)}...${account.slice(-4)}` : 'Connect'}
            </button>
          </div>
        </header>

        {/* ===== HERO STATS ROW ===== */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Gold" value={totalGold.toLocaleString()} icon="🪙" color="amber" />
          <StatCard label="Gems" value={totalGems.toLocaleString()} sub={`$${totalGemsUsd.toFixed(2)}`} icon="💎" color="violet" />
          <StatCard label="Hourly" value={`+${perHour.toLocaleString()}`} icon="⏱️" color="emerald" />
          <StatCard label="Daily" value={dailyGems.toLocaleString()} sub={`$${dailyGemsUsd.toFixed(2)}`} icon="📊" color="blue" />
          <StatCard label="Wallet" value={Number(balance).toFixed(3)} sub="BNB" icon="💳" color="slate" />
        </div>

        {/* ===== MAIN CONTENT: 3-Column Layout (Different from old 2-column) ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* COLUMN 1: Building Shop */}
          <div className="space-y-4">
            <SectionCard title="Build" icon="🏗️" accent="violet">
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {BUILDING_TYPES.map(b => (
                  <BuildingRow
                    key={b.type}
                    building={b}
                    canAfford={totalGold >= b.cost}
                    disabled={actionLoading || !kingdom?.tiles.includes(0)}
                    onBuy={() => handleBuild(b.type, b.cost)}
                  />
                ))}
              </div>
            </SectionCard>

            {/* AI Advisor - Compact */}
            {bestAction && bestAction.type !== 'STOP' && (
              <SectionCard title="AI Advisor" icon="🤖" accent="blue">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{bestAction.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{bestAction.name}</p>
                      <p className="text-xs text-emerald-400">+{Math.floor(bestAction.totalGems).toLocaleString()} gems/30d</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (bestAction.type === 'BUY') handleBuild(bestAction.payload[0], bestAction.cost);
                      else if (bestAction.type === 'UPGRADE') handleUpgrade(bestAction.payload[0], bestAction.cost);
                    }}
                    disabled={actionLoading || totalGold < bestAction.cost}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${
                      totalGold >= bestAction.cost
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    {totalGold >= bestAction.cost ? 'Execute' : `Wait ${Math.ceil(bestAction.hoursToSave)}h`}
                  </button>
                </div>
              </SectionCard>
            )}
          </div>

          {/* COLUMN 2: Active Buildings (Compact) + Treasury */}
          <div className="space-y-4">
            <SectionCard title="Your Buildings" icon="🏙️" accent="emerald" badge={`${activeBuildings.length}/12`}>
              <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                {activeBuildings.length === 0 ? (
                  <div className="col-span-3 text-center text-zinc-500 py-6 text-sm">No buildings yet</div>
                ) : (
                  activeBuildings.map(b => {
                    const base = BUILDING_TYPES.find(t => t.type === b.baseType) || BUILDING_TYPES[0];
                    const upCost = base.cost / 4;
                    return (
                      <div
                        key={b.id}
                        onClick={() => b.level < 10 && totalGold >= upCost && handleUpgrade(b.id, upCost)}
                        className={`p-2 rounded-lg bg-white/5 border border-white/10 text-center cursor-pointer ${
                          b.level >= 10 ? 'opacity-60 cursor-default' : ''
                        }`}
                      >
                        <div className="text-xl mb-1">{base.icon}</div>
                        <div className="text-[10px] font-medium text-zinc-400 truncate">{base.name}</div>
                        <div className={`text-xs font-bold ${b.level >= 10 ? 'text-amber-400' : 'text-white'}`}>
                          L{b.level}{b.level >= 10 && ' ★'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </SectionCard>

            {/* Treasury / Extraction */}
            <SectionCard title="Treasury" icon="💎" accent="fuchsia">
              <div className="text-center py-4">
                <div className="text-3xl font-black text-violet-400">
                  {totalGems.toLocaleString()}
                </div>
                <div className="text-sm text-zinc-400">≈ ${totalGemsUsd.toFixed(2)}</div>
                <button
                  onClick={() => executeTx('sellGems', [totalGems])}
                  disabled={actionLoading || totalGems === 0}
                  className="mt-4 w-full py-3 rounded-xl bg-violet-600 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Withdraw to BNB'}
                </button>
              </div>
            </SectionCard>
          </div>

          {/* COLUMN 3: Battle Arena + Contract Info */}
          <div className="space-y-4">
            <SectionCard title="Battle Arena" icon="⚔️" accent="red">
              <div className="space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-400">Win: +{potentialReward.toLocaleString()}</span>
                  <span className="text-red-400">Loss: -{potentialLoss.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="40"
                    max="60"
                    value={winChance}
                    onChange={e => setWinChance(e.target.value)}
                    className="flex-1"
                  />
                  <div className="w-14 h-14 rounded-xl bg-black/40 flex flex-col items-center justify-center border border-white/10">
                    <span className="text-lg font-black">{winChance}%</span>
                  </div>
                </div>

                <button
                  onClick={() => executeTx('battle', [parseInt(winChance)])}
                  disabled={!isBattleReady || perHour === 0 || actionLoading}
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider ${
                    isBattleReady && perHour > 0
                      ? 'bg-red-600'
                      : 'bg-white/10 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {isBattleReady ? '⚔️ ENGAGE' : `Cooldown: ${battleCooldownStr}`}
                </button>
              </div>
            </SectionCard>

            {/* Contract Health */}
            <SectionCard title="Contract Health" icon="📈" accent="emerald">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-zinc-500 mb-1">Liquidity</div>
                  <div className="font-bold text-emerald-400">{contractBalance.bnb} BNB</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-zinc-500 mb-1">24h Outflow</div>
                  <div className="font-bold text-amber-400">{dailyWithdrawals.toFixed(3)} BNB</div>
                </div>
                <div className="col-span-2 p-3 bg-white/5 rounded-lg text-center">
                  <div className="text-xs text-zinc-500 mb-1">Runway</div>
                  <div className={`font-bold ${runwayDays < 5 ? 'text-red-500' : 'text-blue-400'}`}>
                    {runwayDays === Infinity ? '∞' : `~${runwayDays.toFixed(0)} days`}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ===== SYSTEM LOG (Compact Footer) ===== */}
        <SystemLog logs={logs} />
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: Stat Card
// ============================================================================
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: 'amber' | 'violet' | 'emerald' | 'blue' | 'slate';
}

const colorClasses = {
  amber: 'text-amber-400',
  violet: 'text-violet-400',
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  slate: 'text-zinc-300',
};

function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
        <span className="text-lg opacity-50">{icon}</span>
      </div>
      <div className={`text-xl font-bold ${colorClasses[color]}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

// ============================================================================
// COMPONENT: Section Card
// ============================================================================
interface SectionCardProps {
  title: string;
  icon: string;
  accent: 'violet' | 'emerald' | 'blue' | 'fuchsia' | 'red';
  badge?: string;
  children: React.ReactNode;
}

const accentBorders = {
  violet: 'border-violet-500/20',
  emerald: 'border-emerald-500/20',
  blue: 'border-blue-500/20',
  fuchsia: 'border-fuchsia-500/20',
  red: 'border-red-500/20',
};

function SectionCard({ title, icon, accent, badge, children }: SectionCardProps) {
  return (
    <div className={`bg-white/5 border ${accentBorders[accent]} rounded-2xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <span>{icon}</span> {title}
        </h3>
        {badge && <span className="text-xs text-zinc-500 bg-white/10 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// COMPONENT: Building Row (for shop)
// ============================================================================
interface BuildingRowProps {
  building: BuildingType;
  canAfford: boolean;
  disabled: boolean;
  onBuy: () => void;
}

function BuildingRow({ building, canAfford, disabled, onBuy }: BuildingRowProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-xl">{building.icon}</span>
        <div>
          <div className="text-sm font-medium">{building.name}</div>
          <div className="text-xs text-emerald-400">+{building.yield}/h</div>
        </div>
      </div>
      <button
        onClick={onBuy}
        disabled={disabled || !canAfford}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
          canAfford && !disabled
            ? 'bg-violet-600 text-white'
            : 'bg-white/10 text-zinc-500 cursor-not-allowed'
        }`}
      >
        {building.cost / 1000}k
      </button>
    </div>
  );
}

// ============================================================================
// COMPONENT: System Log
// ============================================================================
function SystemLog({ logs }: { logs: LogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="mt-6 bg-black/30 border border-white/10 rounded-xl p-3 max-h-24 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs text-zinc-500 uppercase tracking-wider">System Log</span>
      </div>
      <div className="space-y-1">
        {logs.map(log => (
          <div key={log.id} className="text-xs flex gap-3">
            <span className="text-zinc-600 font-mono">{log.timestamp}</span>
            <span className={
              log.type === 'error' ? 'text-red-400' :
              log.type === 'success' ? 'text-emerald-400' :
              'text-zinc-400'
            }>{log.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

export default App;
