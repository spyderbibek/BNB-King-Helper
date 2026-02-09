import { BuildingType } from '../types';

export const CONTRACT_ADDRESS = '0x864EE1d1B51306e30836B84AdE81e39ebB6e8e0C';
export const BSC_CHAIN_ID = '0x38'; // 56 in hex
export const BSC_RPC_URL = 'https://bsc-dataseed.binance.org/';

export const CONTRACT_ABI = [
  {"inputs":[{"components":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"uint32","name":"share","type":"uint32"}],"internalType":"struct Manager[]","name":"_managers","type":"tuple[]"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"king","type":"address"},{"indexed":false,"internalType":"bool","name":"isWin","type":"bool"},{"indexed":false,"internalType":"uint8","name":"winChance","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"battleReward","type":"uint256"}],"name":"BattleResult","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"king","type":"address"},{"indexed":false,"internalType":"uint16","name":"tileId","type":"uint16"}],"name":"BuildingUpgraded","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"king","type":"address"},{"indexed":false,"internalType":"uint16[]","name":"tileIds","type":"uint16[]"},{"indexed":false,"internalType":"uint8","name":"level","type":"uint8"}],"name":"BuildingsPlaced","type":"event"},
  {"inputs":[{"internalType":"uint8","name":"_winChance","type":"uint8"}],"name":"battle","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_ally","type":"address"}],"name":"buyGold","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"getGlobalState","outputs":[{"components":[{"internalType":"uint128","name":"totalDeposited","type":"uint128"},{"internalType":"uint32","name":"totalKings","type":"uint32"},{"internalType":"uint64","name":"deploymentTime","type":"uint64"},{"internalType":"uint32","name":"totalDeposits","type":"uint32"}],"internalType":"struct GlobalState","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_player","type":"address"}],"name":"getKingdom","outputs":[{"components":[{"internalType":"uint32","name":"gold","type":"uint32"},{"internalType":"uint32","name":"gems","type":"uint32"},{"internalType":"uint32","name":"perHour","type":"uint32"},{"internalType":"uint32","name":"alliesCount","type":"uint32"},{"internalType":"uint32","name":"alliesEarned","type":"uint32"},{"internalType":"uint32","name":"claimTime","type":"uint32"},{"internalType":"uint32","name":"battleTime","type":"uint32"},{"internalType":"uint16","name":"battleId","type":"uint16"},{"internalType":"uint8","name":"battlesInRow","type":"uint8"},{"internalType":"bool","name":"isWinInRow","type":"bool"},{"internalType":"address","name":"ally","type":"address"},{"internalType":"uint8[360]","name":"tiles","type":"uint8[360]"}],"internalType":"struct Kingdom","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint16[]","name":"_tileIds","type":"uint16[]"},{"internalType":"uint8","name":"_level","type":"uint8"}],"name":"placeBuildings","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_gems","type":"uint256"}],"name":"sellGems","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_gems","type":"uint256"}],"name":"swapGemsToGold","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint16","name":"_tileId","type":"uint16"}],"name":"upgradeBuilding","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

export const BUILDING_TYPES: BuildingType[] = [
  { type: 1, name: "Trolls Den", cost: 10000, yield: 8, icon: "🏰" },
  { type: 2, name: "Thrower's Pit", cost: 28000, yield: 24, icon: "⚔️" },
  { type: 3, name: "Warrior Cave", cost: 54000, yield: 48, icon: "🛡️" },
  { type: 4, name: "Hunter's Lodge", cost: 100000, yield: 96, icon: "🏛️" },
  { type: 5, name: "Marauder Camp", cost: 250000, yield: 248, icon: "🏯" },
  { type: 6, name: "Blast Workshop", cost: 500000, yield: 520, icon: "⚒️" },
  { type: 7, name: "Wolf Den", cost: 1000000, yield: 1100, icon: "👑" },
  { type: 8, name: "Minotaur Lair", cost: 2000000, yield: 2300, icon: "💎" },
];

export const EXIT_HORIZON_HOURS = 30 * 24; 
export const BATTLE_COOLDOWN = 86400; 
export const SAFETY_BUFFER = 5;
export const GEM_RATE = 1000000; // 1,000,000 Gems = 1 BNB
export const BLOCKS_PER_DAY = 28800; // ~3s per block on BSC
