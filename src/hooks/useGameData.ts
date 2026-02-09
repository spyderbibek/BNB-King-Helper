import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers, Contract, formatEther, isAddress } from 'ethers';
import { KingdomData } from '../types';
import { CONTRACT_ADDRESS, CONTRACT_ABI, BSC_RPC_URL, GEM_RATE, BLOCKS_PER_DAY, BATTLE_COOLDOWN, SAFETY_BUFFER, BUILDING_TYPES, EXIT_HORIZON_HOURS } from '../config/constants';

export const useGameData = (viewAddress: string, account: string | null, _addLog: (msg: string, type?: 'info' | 'success' | 'error') => void) => {
  const [balance, setBalance] = useState<string>('0');
  const [contractBalance, setContractBalance] = useState<{bnb: string, usd: string, raw: number}>({bnb: '0', usd: '0', raw: 0});
  const [dailyWithdrawals, setDailyWithdrawals] = useState<number>(0);
  const [kingdom, setKingdom] = useState<KingdomData | null>(null);
  const [accumulated, setAccumulated] = useState({ gold: 0, gems: 0 });
  const [battleCooldownStr, setBattleCooldownStr] = useState<string>('');
  const [isBattleReady, setIsBattleReady] = useState<boolean>(false);
  const [bnbPrice, setBnbPrice] = useState<number>(0);
  const [winChance, setWinChance] = useState<string>('60');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchGlobalData = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
      
      // Fetch BNB Price
      const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
      const priceData = await priceRes.json();
      const currentPrice = parseFloat(priceData.price);
      setBnbPrice(currentPrice);

      // Fetch Contract Balance
      const cBal = await provider.getBalance(CONTRACT_ADDRESS);
      const bnbVal = formatEther(cBal);
      setContractBalance({
        raw: Number(bnbVal),
        bnb: Number(bnbVal).toFixed(2),
        usd: (Number(bnbVal) * currentPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      });

      // Fetch Daily Withdrawals (estimated via BattleResult gems)
      const currentBlock = await provider.getBlockNumber();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const filter = contract.filters.BattleResult();
      const events = await contract.queryFilter(filter, currentBlock - BLOCKS_PER_DAY, currentBlock);
      
      let totalGemsOut = 0;
      events.forEach((event: any) => {
        // args: [king, isWin, winChance, battleReward]
        if (event.args && event.args[1] === true) {
          totalGemsOut += Number(event.args[3]);
        }
      });
      // Also assume some manual sellGems calls happen. 
      // Since we don't have GemSold event in ABI, we use BattleResult as a primary activity indicator.
      setDailyWithdrawals(totalGemsOut / GEM_RATE);

    } catch (err) { 
      console.warn("Global sync skipped or limited by RPC"); 
    }
  };

  const refreshData = useCallback(async (addr: string) => {
    if (!isAddress(addr)) return;
    try {
      const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
      const bal = await provider.getBalance(addr);
      setBalance(formatEther(bal));
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const kd = await contract.getKingdom(addr);
      setKingdom({
        gold: Number(kd[0]),
        gems: Number(kd[1]),
        perHour: Number(kd[2]),
        alliesCount: Number(kd[3]),
        alliesEarned: Number(kd[4]),
        claimTime: Number(kd[5]),
        battleTime: Number(kd[6]),
        tiles: Array.from(kd[11]).map((t: any) => Number(t))
      });
    } catch (err) { 
       console.warn('Sync attempt failed'); 
    }
  }, []);

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const addr = viewAddress || account;
    if (addr && isAddress(addr)) {
      refreshData(addr);
      const interval = setInterval(() => refreshData(addr), 15000);
      return () => clearInterval(interval);
    }
  }, [account, viewAddress, refreshData]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      
      if (kingdom && kingdom.claimTime > 0) {
        const lastHour = Math.floor(kingdom.claimTime / 3600);
        const currentHour = Math.floor(now / 3600);
        if (currentHour > lastHour) {
          const earned = (currentHour - lastHour) * kingdom.perHour;
          setAccumulated({ gold: earned, gems: earned });
        } else {
          setAccumulated({ gold: 0, gems: 0 });
        }
      }

      if (kingdom && kingdom.battleTime > 0) {
        const nextBattle = kingdom.battleTime + BATTLE_COOLDOWN + SAFETY_BUFFER;
        const diff = nextBattle - now;
        if (diff > 0) {
          const h = Math.floor(diff / 3600).toString().padStart(2, '0');
          const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
          const s = (diff % 60).toString().padStart(2, '0');
          setBattleCooldownStr(`${h}:${m}:${s}`);
          setIsBattleReady(false);
        } else {
          setBattleCooldownStr('');
          setIsBattleReady(true);
        }
      } else if (kingdom) {
        setIsBattleReady(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [kingdom]);

  const totalGold = (kingdom?.gold || 0) + accumulated.gold;
  const totalGems = (kingdom?.gems || 0) + accumulated.gems;
  const perHour = kingdom?.perHour || 0;
  const dailyGems = perHour * 24;

  const totalGemsUsd = (totalGems / GEM_RATE) * bnbPrice;
  const dailyGemsUsd = (dailyGems / GEM_RATE) * bnbPrice;

  const runwayDays = dailyWithdrawals > 0 ? (contractBalance.raw / dailyWithdrawals) : Infinity;

  const activeBuildings = useMemo(() => {
      return kingdom?.tiles.map((raw, id) => {
        const baseType = raw % 10;
        const upgrades = Math.floor(raw / 10);
        return { id, raw, baseType, upgrades, level: upgrades + 1 };
      }).filter(b => b.raw > 0) || [];
  }, [kingdom]);

  const bestAction = useMemo(() => {
      if (!kingdom) return null;
      const options: any[] = [];
      const effectiveYield = kingdom.perHour * 1.34;
  
      const evalAction = (cost: number, yieldInc: number, name: string, icon: string, type: string, payload: any) => {
        const costToSave = Math.max(0, cost - totalGold);
        const hoursToSave = effectiveYield > 0 ? (costToSave / effectiveYield) : (costToSave > 0 ? 9999 : 0);
        const productiveHours = EXIT_HORIZON_HOURS - hoursToSave;
        if (productiveHours > 0) {
          options.push({ name, cost, totalGems: yieldInc * productiveHours, hoursToSave, icon, type, payload });
        }
      };
  
      if (kingdom.tiles.includes(0)) {
        BUILDING_TYPES.forEach(b => evalAction(b.cost, b.yield, b.name, b.icon, 'BUY', [b.type, b.cost]));
      }
      activeBuildings.forEach(b => {
        if (b.upgrades < 9) {
          const base = BUILDING_TYPES.find(t => t.type === b.baseType);
          if (base) evalAction(base.cost / 4, base.yield / 4, `${base.name} #${b.id}`, base.icon, 'UPGRADE', [b.id]);
        }
      });
  
      if (options.length === 0) return { type: 'STOP' };
      return options.sort((a, b) => b.totalGems - a.totalGems)[0];
  }, [kingdom, activeBuildings, totalGold]);

  const potentialReward = Math.floor(perHour * 24 * (parseInt(winChance) / 100) * 1.5);
  const potentialLoss = Math.floor(perHour * 24 * 0.5);

  return {
      balance,
      contractBalance,
      dailyWithdrawals,
      kingdom,
      accumulated,
      battleCooldownStr,
      isBattleReady,
      bnbPrice,
      winChance,
      setWinChance,
      loading,
      setLoading,
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
      refreshData,
  };
};
