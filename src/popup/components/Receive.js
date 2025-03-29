import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { NETWORKS } from '../../config';

function Receive({ selectedChain, navigateTo }) {
  const [accounts, setAccounts] = useState({});
  const [selectedNetwork, setSelectedNetwork] = useState('sepolia');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, [selectedChain, selectedNetwork]);

  const loadAccounts = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_ACCOUNTS',
        chain: selectedChain,
        network: selectedNetwork
      });

      if (response.success) {
        setAccounts(response.accounts);
      } else {
        setError('Failed to load account addresses');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCopyAddress = async () => {
    const address = accounts[selectedChain]?.address;
    if (address) {
      try {
        // Use the Clipboard API with fallback
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(address);
        } else {
          // Fallback for browsers that don't support clipboard API
          const textArea = document.createElement('textarea');
          textArea.value = address;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        setError('Failed to copy address: ' + error.message);
      }
    }
  };

  const networkData = NETWORKS[selectedChain][selectedNetwork];
  const currentAddress = accounts[selectedChain]?.address;

  return (
    <div className="receive">
      <h2>Receive {networkData.symbol}</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="content-container">
        <div className="network-info">
          <img
            src={`/images/${selectedChain}.png`}
            alt={selectedChain}
            width="32"
            height="32"
          />
          <span>{networkData.name}</span>
        </div>

        <div className="qr-container">
          {currentAddress && (
            <QRCode
              value={currentAddress}
              size={200}
              level="H"
              includeMargin={true}
              renderAs="svg"
            />
          )}
        </div>

        <div className="address-container">
          <p className="label">Your {selectedChain} Address</p>
          <div className="address-box">
            <input
              type="text"
              readOnly
              className="address-input"
              value={currentAddress || ''}
            />
            <button
              className="copy-button"
              onClick={handleCopyAddress}
              disabled={!currentAddress}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {selectedChain === 'ethereum' && (
          <div className="network-selector">
            <button
              className={`network-option ${selectedNetwork === 'mainnet' ? 'active' : ''}`}
              onClick={() => setSelectedNetwork('mainnet')}
            >
              Mainnet
            </button>
            <button
              className={`network-option ${selectedNetwork === 'sepolia' ? 'active' : ''}`}
              onClick={() => setSelectedNetwork('sepolia')}
            >
              Sepolia
            </button>
          </div>
        )}

        <div className="security-notice">
          <h4>⚠️ Important</h4>
          <ul>
            <li>Only send {networkData.symbol} and {selectedChain}-based tokens to this address</li>
            <li>Make sure you're on the correct network (Sepolia Testnet for testing)</li>
            <li>Sending other types of tokens may result in permanent loss</li>
          </ul>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigateTo('dashboard')}
        >
          Done
        </button>
      </div>

      <style jsx>{`
        .receive {
          padding: 16px;
        }

        .content-container {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .network-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .qr-container {
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .address-container {
          width: 100%;
          text-align: center;
        }

        .label {
          color: var(--secondary-color);
          margin-bottom: 8px;
        }

        .address-input {
          flex-grow: 1;
          font-family: monospace;
          font-size: 14px;
          padding: 8px;
          border: none;
          background: transparent;
          outline: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .address-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: var(--background-color);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .copy-button {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: var(--primary-color);
          color: white;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .copy-button:hover:not(:disabled) {
          background: var(--primary-color-dark);
        }

        .copy-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .network-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          width: 100%;
        }

        .network-option {
          padding: 8px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .network-option.active {
          border-color: var(--primary-color);
          background: var(--primary-color);
          color: white;
        }

        .security-notice {
          width: 100%;
          padding: 16px;
          background: #fff8e1;
          border-radius: 8px;
          border: 1px solid #ffd54f;
        }

        .security-notice h4 {
          margin: 0 0 8px 0;
          color: #f57c00;
        }

        .security-notice ul {
          margin: 0;
          padding-left: 20px;
          color: #666;
        }

        .security-notice li {
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
}

export default Receive; 