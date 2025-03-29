import React, { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import CreateWallet from './components/CreateWallet';
import ImportWallet from './components/ImportWallet';
import Dashboard from './components/Dashboard';
import TransactionApproval from './components/TransactionApproval';

function App() {
  const [activeScreen, setActiveScreen] = useState('welcome');
  const [hasWallet, setHasWallet] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletData, setWalletData] = useState(null);

  useEffect(() => {
    // Check if user has a wallet
    chrome.storage.local.get(['hasWallet'], (result) => {
      if (result.hasWallet) {
        setHasWallet(true);
        setActiveScreen('login');
      }
    });
    
    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'TRANSACTION_REQUEST') {
        setActiveScreen('approve');
      }
    });
  }, []);

  const navigateTo = (screen) => {
    setActiveScreen(screen);
  };

  // Render different screens based on state
  const renderScreen = () => {
    switch (activeScreen) {
      case 'welcome':
        return <WelcomeScreen navigateTo={navigateTo} />;
      case 'create':
        return <CreateWallet navigateTo={navigateTo} setWalletData={setWalletData} />;
      case 'import':
        return <ImportWallet navigateTo={navigateTo} setWalletData={setWalletData} />;
      case 'dashboard':
        return <Dashboard walletData={walletData} navigateTo={navigateTo} />;
      case 'approve':
        return <TransactionApproval navigateTo={navigateTo} />;
      default:
        return <WelcomeScreen navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Pedals Up Wallet</h1>
      </header>
      <main className="app-content">
        {renderScreen()}
      </main>
    </div>
  );
}

export default App;