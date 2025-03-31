import { createContext, useState, useEffect, useContext } from 'react';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [chain, setChain] = useState('ethereum');
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [signature, setSignature] = useState(null);
  const [isLoading, setIsLoading] = useState({ connect: false, transaction: false, sign: false });
  const [success, setSuccess] = useState({ connect: false, transaction: false, sign: false });

  useEffect(() => {
    const walletInstance = window.GearMaskWallet || window.ethereum;
    setWallet(walletInstance);

    if (walletInstance) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
        } else {
          setAccount(null);
          setConnected(false);
        }
      };

      const handleChainChanged = (newChainId) => setChainId(newChainId);
      const handleDisconnect = () => {
        setConnected(false);
        setAccount(null);
      };

      walletInstance.on('accountsChanged', handleAccountsChanged);
      walletInstance.on('chainChanged', handleChainChanged);
      walletInstance.on('disconnect', handleDisconnect);

      return () => {
        if (walletInstance.removeListener) {
          walletInstance.removeListener('accountsChanged', handleAccountsChanged);
          walletInstance.removeListener('chainChanged', handleChainChanged);
          walletInstance.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, []);

  const connectWallet = async () => {
    setError(null);
    setIsLoading(prev => ({ ...prev, connect: true }));
    setSuccess(prev => ({ ...prev, connect: false }));
    
    try {
      if (!wallet) throw new Error('Wallet not installed');
      const accounts = await wallet.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) throw new Error('Wallet is locked or no accounts available.');
      
      setAccount(accounts[0]);
      setConnected(true);
      const chainId = await wallet.request({ method: 'eth_chainId' });
      setChainId(chainId);
      setSuccess(prev => ({ ...prev, connect: true }));
    } catch (error) {
      setError(error.message);
      setConnected(false);
    } finally {
      setIsLoading(prev => ({ ...prev, connect: false }));
    }
  };

  const sendTransaction = async () => {
    setError(null);
    setTxHash(null);
    setIsLoading(prev => ({ ...prev, transaction: true }));
    setSuccess(prev => ({ ...prev, transaction: false }));

    try {
      if (!wallet || !connected) throw new Error('Wallet not connected');
      const transaction = { to: '0x0000000000000000000000000000000000000000', value: '0.0001' };
      const result = await wallet.request({ method: 'eth_sendTransaction', params: [transaction] });
      setTxHash(result);
      setSuccess(prev => ({ ...prev, transaction: true }));
      setTimeout(() => getBalance(), 5000);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(prev => ({ ...prev, transaction: false }));
    }
  };

  const signMessage = async () => {
    setError(null);
    setSignature(null);
    setIsLoading(prev => ({ ...prev, sign: true }));
    setSuccess(prev => ({ ...prev, sign: false }));

    try {
      if (!wallet || !connected) throw new Error('Wallet not connected');
      const message = 'Hello, GearMask!';
      const result = await wallet.request({ method: 'personal_sign', params: [message, account] });
      setSignature(result);
      setSuccess(prev => ({ ...prev, sign: true }));
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(prev => ({ ...prev, sign: false }));
    }
  };

  const getBalance = async () => {
    if (!wallet || !connected || !account) return;
    try {
      const balance = await wallet.request({ method: 'eth_getBalance', params: [account, 'latest'] });
      console.log('Updated balance:', balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAccount(null);
    setSuccess(prev => ({ ...prev, connect: false }));
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <WalletContext.Provider value={{
      wallet, connected, account, chainId, chain, error, txHash, signature,
      isLoading, success, connectWallet, disconnect, sendTransaction, signMessage, formatAddress
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
}
