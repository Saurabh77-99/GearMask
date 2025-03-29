import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context for the wallet
const PedalsUpWalletContext = createContext(null);

// Provider component that will wrap your app
export const PedalsUpWalletProvider = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [accounts, setAccounts] = useState({
    ethereum: [],
    solana: []
  });
  const [activeNetwork, setActiveNetwork] = useState('ethereum');
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if the wallet is available
  useEffect(() => {
    const checkWalletAvailability = () => {
      setIsAvailable(!!window.pedalsUpWallet);
    };

    // Check immediately
    checkWalletAvailability();

    // Also set up event listener for wallet injection
    window.addEventListener('pedalsUpWalletReady', checkWalletAvailability);

    return () => {
      window.removeEventListener('pedalsUpWalletReady', checkWalletAvailability);
    };
  }, []);

  // Connect to the wallet
  const connect = async () => {
    if (!isAvailable) {
      throw new Error('Pedals Up Wallet is not installed');
    }

    setIsConnecting(true);

    try {
      const response = await window.pedalsUpWallet.connect();

      if (response.success) {
        setIsConnected(true);
        
        // Fetch accounts after successful connection
        const accounts = await window.pedalsUpWallet.getAccounts();
        setAccounts(accounts);
        
        // Get current network
        const network = await window.pedalsUpWallet.getNetwork();
        setActiveNetwork(network);
      } else {
        throw new Error(response.error || 'Failed to connect wallet');
      }
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch network
  const switchNetwork = async (network) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      await window.pedalsUpWallet.switchNetwork(network);
      setActiveNetwork(network);
    } catch (error) {
      console.error('Network switch error:', error);
      throw error;
    }
  };

  // Send a transaction
  const sendTransaction = async (transaction) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      return await window.pedalsUpWallet.sendTransaction({
        ...transaction,
        network: activeNetwork
      });
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  };

  // Sign a message
  const signMessage = async (message) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      return await window.pedalsUpWallet.signMessage(message, activeNetwork);
    } catch (error) {
      console.error('Signing error:', error);
      throw error;
    }
  };

  // The value that will be provided to consumers of this context
  const value = {
    isAvailable,
    isConnected,
    isConnecting,
    accounts,
    activeNetwork,
    connect,
    switchNetwork,
    sendTransaction,
    signMessage,
    getActiveAccount: () => accounts[activeNetwork][0]
  };

  return (
    <PedalsUpWalletContext.Provider value={value}>
      {children}
    </PedalsUpWalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const usePedalsUpWallet = () => {
  const context = useContext(PedalsUpWalletContext);
  
  if (context === null) {
    throw new Error('usePedalsUpWallet must be used within a PedalsUpWalletProvider');
  }
  
  return context;
};

// A button component that can be used to connect to the wallet
export const ConnectWalletButton = ({ onSuccess, onError, children }) => {
  const { isAvailable, isConnected, isConnecting, connect } = usePedalsUpWallet();

  const handleConnect = async () => {
    try {
      await connect();
      if (onSuccess) onSuccess();
    } catch (error) {
      if (onError) onError(error);
    }
  };

  if (!isAvailable) {
    return (
      <button
        onClick={() => window.open('https://chrome.google.com/webstore/pedals-up-wallet', '_blank')}
        style={{
          backgroundColor: '#4a6cf7',
          color: 'white',
          padding: '10px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Install Pedals Up Wallet
      </button>
    );
  }

  if (isConnected) {
    return children || (
      <button
        style={{
          backgroundColor: '#4a6cf7',
          color: 'white',
          padding: '10px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Connected
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      style={{
        backgroundColor: '#4a6cf7',
        color: 'white',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: isConnecting ? 'default' : 'pointer',
        opacity: isConnecting ? 0.7 : 1
      }}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};