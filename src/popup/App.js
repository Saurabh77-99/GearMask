import React, { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import CreateWallet from './components/CreateWallet';
import ImportWallet from './components/ImportWallet';
import Dashboard from './components/Dashboard';
import SendTransaction from './components/SendTransaction';
import Receive from './components/Receive';
import TokenDetails from './components/TokenDetails';
import TransactionApproval from './components/TransactionApproval';
import NetworkSelector from './components/NetworkSelector';
import Settings from './components/Settings';
import UnlockWallet from './components/UnlockWallet';

function App() {
  const [currentView, setCurrentView] = useState('welcome');
  const [walletData, setWalletData] = useState(null);
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [viewParams, setViewParams] = useState({});

  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_WALLET_STATUS'
      });

      if (response && response.success) {
        if (response.hasWallet) {
          if (response.isUnlocked) {
            setCurrentView('dashboard');
          } else {
            setCurrentView('unlock');
          }
        }
      } else {
        console.error('Failed to check wallet status:', response?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to check wallet status:', error);
    }
  };

  const navigateTo = (view, params = {}) => {
    setCurrentView(view);
    setViewParams(params);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'welcome':
        return <WelcomeScreen navigateTo={navigateTo} />;
      case 'create':
        return <CreateWallet navigateTo={navigateTo} setWalletData={setWalletData} />;
      case 'import':
        return <ImportWallet navigateTo={navigateTo} setWalletData={setWalletData} />;
      case 'unlock':
        return <UnlockWallet navigateTo={navigateTo} setWalletData={setWalletData} />;
      case 'dashboard':
        return (
          <Dashboard
            navigateTo={navigateTo}
            walletData={walletData}
            selectedChain={selectedChain}
          />
        );
      case 'send':
        return (
          <SendTransaction
            navigateTo={navigateTo}
            selectedChain={selectedChain}
            selectedToken={viewParams.selectedToken}
          />
        );
      case 'receive':
        return (
          <Receive
            navigateTo={navigateTo}
            selectedChain={selectedChain}
          />
        );
      case 'token':
        return (
          <TokenDetails
            navigateTo={navigateTo}
            token={viewParams.token}
            selectedChain={selectedChain}
          />
        );
      case 'approve':
        return (
          <TransactionApproval
            navigateTo={navigateTo}
            transaction={viewParams.transaction}
          />
        );
      case 'network':
        return (
          <NetworkSelector
            navigateTo={navigateTo}
            selectedChain={selectedChain}
            setSelectedChain={setSelectedChain}
          />
        );
      case 'settings':
        return (
          <Settings
            navigateTo={navigateTo}
            walletData={walletData}
          />
        );
      default:
        return <WelcomeScreen navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="app">
      {renderCurrentView()}

      <style jsx global>{`
        :root {
          --primary-color: #1a73e8;
          --primary-color-dark: #1557b0;
          --text-color: #202124;
          --secondary-color: #5f6368;
          --background-color: #f8f9fa;
          --border-color: #dadce0;
          --error-color: #d93025;
          --success-color: #1e8e3e;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                       'Helvetica Neue', Arial, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          color: var(--text-color);
          background: var(--background-color);
        }

        h1, h2, h3, h4, h5, h6 {
          color: var(--text-color);
          line-height: 1.2;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-color);
          font-weight: 500;
        }

        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .primary-button {
          display: inline-block;
          padding: 12px 24px;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .primary-button:hover {
          background: var(--primary-color-dark);
        }

        .primary-button:disabled {
          background: var(--border-color);
          cursor: not-allowed;
        }

        .secondary-button {
          display: inline-block;
          padding: 12px 24px;
          background: white;
          color: var(--primary-color);
          border: 1px solid var(--primary-color);
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-button:hover {
          background: var(--background-color);
        }

        .secondary-button:disabled {
          border-color: var(--border-color);
          color: var(--secondary-color);
          cursor: not-allowed;
        }

        .error-message {
          padding: 12px;
          margin-bottom: 16px;
          background: #fce8e6;
          border: 1px solid var(--error-color);
          border-radius: 8px;
          color: var(--error-color);
        }

        .loading-spinner {
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 3px solid var(--background-color);
          border-radius: 50%;
          border-top-color: var(--primary-color);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default App;