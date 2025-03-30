import React, { createContext, useState, useEffect, useCallback } from 'react';

// Create the context and export it
export const PedalsUpContext = createContext(null);

// Installation instructions component
const InstallationInstructions = ({ onClose }) => (
  <div className="modal" style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}>
    <div className="modal-content" style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      maxWidth: '500px',
      width: '100%'
    }}>
      <h2>Install PedalsUp Wallet</h2>
      <p>Follow these steps to install the PedalsUp Wallet extension locally:</p>
      <ol>
        <li>Download the extension code from GitHub or your local build</li>
        <li>Open Chrome and go to chrome://extensions/</li>
        <li>Enable "Developer mode" in the top-right corner</li>
        <li>Click "Load unpacked" and select your extension directory</li>
        <li>The extension should now appear in your browser toolbar</li>
        <li>Refresh this page and click "Connect" again</li>
      </ol>
      <button 
        onClick={onClose}
        style={{
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Close
      </button>
    </div>
  </div>
);

export const PedalsUpProvider = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [error, setError] = useState(null);

  // Check if the extension is installed
  useEffect(() => {
    const checkForWallet = () => {
      // This checks if your extension has injected the provider
      const walletInstalled = typeof window !== 'undefined' && 
                             typeof window.PedalsUpWallet !== 'undefined';
      
      console.log("PedalsUp Wallet installed:", walletInstalled);
      setIsInstalled(walletInstalled);
      
      // If wallet is installed, check if already connected
      if (walletInstalled && window.PedalsUpWallet.isConnected) {
        setIsConnected(true);
        setAccount(window.PedalsUpWallet.selectedAddress);
        setChainId(window.PedalsUpWallet.chainId);
        
        // Try to get accounts if already connected
        if (!window.PedalsUpWallet.selectedAddress) {
          try {
            window.PedalsUpWallet.getAccounts().then(accounts => {
              if (accounts && accounts.length > 0) {
                setAccount(accounts[0]);
              }
            }).catch(err => {
              console.error("Error getting accounts:", err);
            });
          } catch (err) {
            console.error("Cannot call getAccounts:", err);
          }
        }
      }
    };
    
    // Initial check
    checkForWallet();
    
    // Set up event listener for delayed injection
    window.addEventListener('PedalsUpWalletInjected', checkForWallet);
    
    // Clean up
    return () => {
      window.removeEventListener('PedalsUpWalletInjected', checkForWallet);
    };
  }, []);

  // Listen for events from the wallet
  useEffect(() => {
    if (!isInstalled) return;
    
    const handleAccountsChanged = (event) => {
      const accounts = event.detail || [];
      setAccount(accounts[0] || null);
      setIsConnected(accounts.length > 0);
    };
    
    const handleChainChanged = (event) => {
      setChainId(event.detail);
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
      setAccount(null);
    };
    
    // Add event listeners
    window.addEventListener('pedalsup_accountsChanged', handleAccountsChanged);
    window.addEventListener('pedalsup_chainChanged', handleChainChanged);
    window.addEventListener('pedalsup_disconnect', handleDisconnect);
    
    // Clean up
    return () => {
      window.removeEventListener('pedalsup_accountsChanged', handleAccountsChanged);
      window.removeEventListener('pedalsup_chainChanged', handleChainChanged);
      window.removeEventListener('pedalsup_disconnect', handleDisconnect);
    };
  }, [isInstalled]);

  // Connect function
  const connect = useCallback(async () => {
    if (!isInstalled) {
      setShowInstructions(true);
      return false;
    }
    
    setIsConnecting(true);
    
    try {
      // Request accounts - this will trigger the wallet's permission popup
      const accounts = await window.PedalsUpWallet.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Get chain ID
        try {
          const chainId = await window.PedalsUpWallet.request({ 
            method: 'eth_chainId' 
          });
          setChainId(chainId);
        } catch (err) {
          console.error("Error getting chain ID:", err);
          setChainId(window.PedalsUpWallet.chainId);
        }
        
        return true;
      }
      return false;
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect");
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isInstalled]);

  // Disconnect function
  const disconnect = useCallback(async () => {
    if (!isInstalled || !isConnected) return false;
    
    try {
      // Some wallets provide a disconnect method
      if (typeof window.PedalsUpWallet.disconnect === 'function') {
        await window.PedalsUpWallet.disconnect();
      }
      
      // Update state regardless
      setIsConnected(false);
      setAccount(null);
      return true;
    } catch (err) {
      console.error("Disconnect error:", err);
      return false;
    }
  }, [isInstalled, isConnected]);

  // Send transaction function
  const sendTransaction = useCallback(async (transaction) => {
    if (!isInstalled || !isConnected) {
      throw new Error("Wallet not connected");
    }
    
    try {
      const txHash = await window.PedalsUpWallet.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });
      
      return txHash;
    } catch (err) {
      console.error("Transaction error:", err);
      throw err;
    }
  }, [isInstalled, isConnected]);

  // Switch chain function
  const switchChain = useCallback(async (chainId) => {
    if (!isInstalled || !isConnected) {
      throw new Error("Wallet not connected");
    }
    
    try {
      await window.PedalsUpWallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      });
      
      return true;
    } catch (err) {
      console.error("Chain switch error:", err);
      throw err;
    }
  }, [isInstalled, isConnected]);

  // Context value
  const value = {
    isInstalled,
    isConnected,
    isConnecting,
    account,
    chainId,
    error,
    connect,
    disconnect,
    sendTransaction,
    switchChain,
    showInstructions,
    hideInstructions: () => setShowInstructions(false)
  };

  return (
    <PedalsUpContext.Provider value={value}>
      {children}
      {showInstructions && <InstallationInstructions onClose={() => setShowInstructions(false)} />}
    </PedalsUpContext.Provider>
  );
};