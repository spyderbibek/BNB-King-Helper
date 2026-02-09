import { useState, useCallback, useEffect } from 'react';
import { isAddress } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWallet = (addLog: (msg: string, type?: 'info' | 'success' | 'error') => void) => {
  const [account, setAccount] = useState<string | null>(null);
  const [viewAddress, setViewAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) return addLog('MetaMask not found', 'error');
    setLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setAccount(address);
      if (!viewAddress) setViewAddress(address);
      addLog('Wallet connected', 'success');
    } catch (err) {
      addLog('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  }, [addLog, viewAddress]);

  // Update viewAddress if user types, but validate it? No, just set it.
  const handleViewAddressChange = (addr: string) => {
    setViewAddress(addr);
  };

  return { account, viewAddress, connectWallet, handleViewAddressChange, loading };
};
