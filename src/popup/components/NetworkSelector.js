import React, { useState, useEffect } from 'react';
import { NETWORKS } from '../../config';

function NetworkSelector({ navigateTo, currentNetwork }) {
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [selectedNetwork, setSelectedNetwork] = useState(currentNetwork || 'mainnet');
  const [showTestnets, setShowTestnets] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load settings
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings?.showTestNetworks) {
        setShowTestnets(result.settings.showTestNetworks);
      }
    });
  }, []);

  const handleNetworkChange = async (chain, network) => {
    setIsLoading(true);
    try {
      // Send message to background script to switch network
      await chrome.runtime.sendMessage({
        type: 'SWITCH_NETWORK',
        chain,
        network
      });

      setSelectedChain(chain);
      setSelectedNetwork(network);
      navigateTo('dashboard');
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderNetworkButton = (chain, network, networkData) => {
    const isSelected = selectedChain === chain && selectedNetwork === network;
    const isTestnet = network !== 'mainnet';

    if (isTestnet && !showTestnets) return null;

    return (
      <button
        key={`${chain}-${network}`}
        className={`network-button ${isSelected ? 'selected' : ''}`}
        onClick={() => handleNetworkChange(chain, network)}
        disabled={isLoading}
      >
        <div className="network-icon">
          <img 
            src={`/images/${chain}.png`} 
            alt={networkData.name} 
            width="24" 
            height="24" 
          />
        </div>
        <div className="network-info">
          <span className="network-name">{networkData.name}</span>
          <span className="network-details">
            {networkData.symbol} • {isTestnet ? 'Testnet' : 'Mainnet'}
          </span>
        </div>
        {isSelected && <span className="selected-indicator">✓</span>}
      </button>
    );
  };

  return (
    <div className="network-selector">
      <h2>Select Network</h2>

      {isLoading && <div className="loading-spinner" />}

      <div className="chain-section">
        <h3>Ethereum</h3>
        {Object.entries(NETWORKS.ethereum).map(([network, data]) =>
          renderNetworkButton('ethereum', network, data)
        )}
      </div>

      <div className="chain-section">
        <h3>Solana</h3>
        {Object.entries(NETWORKS.solana).map(([network, data]) =>
          renderNetworkButton('solana', network, data)
        )}
      </div>

      <div className="network-settings">
        <label className="form-label">
          <input
            type="checkbox"
            checked={showTestnets}
            onChange={(e) => {
              setShowTestnets(e.target.checked);
              chrome.storage.local.get(['settings'], (result) => {
                const newSettings = {
                  ...result.settings,
                  showTestNetworks: e.target.checked
                };
                chrome.storage.local.set({ settings: newSettings });
              });
            }}
          />
          {' '}Show Test Networks
        </label>
      </div>

      <style jsx>{`
        .network-selector {
          padding: 16px;
        }

        .chain-section {
          margin-bottom: 24px;
        }

        .network-button {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 12px;
          margin: 8px 0;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .network-button:hover {
          border-color: var(--primary-color);
        }

        .network-button.selected {
          border-color: var(--primary-color);
          background-color: #f0f4ff;
        }

        .network-icon {
          margin-right: 12px;
        }

        .network-info {
          flex-grow: 1;
          text-align: left;
        }

        .network-name {
          display: block;
          font-weight: 500;
          color: var(--text-color);
        }

        .network-details {
          display: block;
          font-size: 12px;
          color: var(--secondary-color);
        }

        .selected-indicator {
          color: var(--primary-color);
          margin-left: 12px;
        }

        .network-settings {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }
      `}</style>
    </div>
  );
}

export default NetworkSelector; 