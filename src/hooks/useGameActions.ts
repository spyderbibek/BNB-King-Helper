import { useState } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/constants';

export const useGameActions = (
  account: string | null,
  viewAddress: string | null,
  addLog: (msg: string, type?: 'info' | 'success' | 'error') => void,
  refreshData: (addr: string) => Promise<void>
) => {
  const [actionLoading, setActionLoading] = useState(false);

  const executeTx = async (methodName: string, params: any[], value: bigint = 0n) => {
    if (!account) return addLog('Please connect wallet', 'error');
    setActionLoading(true);
    try {
      if (!window.ethereum) throw new Error("No crypto wallet found");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      addLog(`Sending ${methodName}...`, 'info');
      const tx = await contract[methodName](...params, { value });
      
      addLog(`Transaction Pending...`, 'info');
      await tx.wait();
      
      addLog(`${methodName} successful`, 'success');
      if (viewAddress || account) {
        await refreshData(viewAddress || account);
      }
    } catch (err: any) {
      console.error("TX FAIL:", err);
      let msg = err.reason || err.message || "Failed";
      if (err.code === 'ACTION_REJECTED') msg = "User rejected transaction";
      addLog(`Error: ${msg}`, 'error');
    } finally { 
      setActionLoading(false); 
    }
  };

  return { executeTx, actionLoading };
};
