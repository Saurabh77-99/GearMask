import React, { useState, useEffect } from 'react';
import { NETWORKS } from '../../config';

function Dashboard({ navigateTo, walletData }) {
  const [accounts, setAccounts] = useState({
    ethereum: { address: '', balance: '0' },
    solana: { address: '', balance: '0' }
  });
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [tokens, setTokens] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAccountData();
    loadTransactionHistory();
  }, [selectedChain]);

  const loadAccountData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_ACCOUNTS'
      });

      if (response && response.success) {
        setAccounts(response.accounts || {
          ethereum: { address: '', balance: '0' },
          solana: { address: '', balance: '0' }
        });
        
        // Load tokens for the selected chain
        try {
          const tokensResponse = await chrome.runtime.sendMessage({
            type: 'GET_TOKENS',
            chain: selectedChain
          });
          if (tokensResponse && tokensResponse.success) {
            setTokens(tokensResponse.tokens || []);
          } else {
            setTokens([]);
          }
        } catch (error) {
          console.error('Failed to load tokens:', error);
          setTokens([]);
        }
      } else {
        setError(response?.error || 'Failed to load account data');
        setAccounts({
          ethereum: { address: '', balance: '0' },
          solana: { address: '', balance: '0' }
        });
      }
    } catch (error) {
      setError(error.message || 'Failed to load account data');
      setAccounts({
        ethereum: { address: '', balance: '0' },
        solana: { address: '', balance: '0' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TRANSACTIONS',
        chain: selectedChain
      });
      
      if (response && response.success) {
        // Get transactions for the selected chain
        const chainTransactions = response.transactions[selectedChain] || [];
        setTransactions(chainTransactions);
      } else {
        console.error('Failed to load transactions:', response?.error || 'Unknown error');
        setTransactions([]);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    }
  };

  const handleSend = () => {
    navigateTo('send');
  };

  const handleReceive = () => {
    navigateTo('receive');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance, symbol) => {
    return `${parseFloat(balance || 0).toFixed(4)} ${symbol}`;
  };

  const renderAccountCard = () => {
    const account = accounts[selectedChain] || { address: '', balance: '0' };
    const networkData = NETWORKS[selectedChain]?.mainnet || NETWORKS.ethereum.mainnet;

    return (
      <div className="account-card">
        <div className="chain-selector" onClick={() => navigateTo('network')}>
          <img 
            src={`/images/${selectedChain}.png`}
            alt={selectedChain}
            width="24"
            height="24"
          />
          <span>{networkData.name}</span>
          <span className="chevron">▼</span>
        </div>

        <div className="balance-display">
          <h2>{formatBalance(account.balance, networkData.symbol)}</h2>
          <p className="address">{formatAddress(account.address)}</p>
        </div>

        <div className="action-buttons">
          <button 
            className="primary-button" 
            onClick={handleSend}
            disabled={!account.address}
          >
            Send
          </button>
          <button 
            className="secondary-button" 
            onClick={handleReceive}
            disabled={!account.address}
          >
            Receive
          </button>
        </div>
      </div>
    );
  };

  const renderTokenList = () => {
    if (tokens.length === 0) {
      return (
        <div className="empty-state">
          <p>No tokens found</p>
        </div>
      );
    }

    return (
      <div className="token-list">
        {tokens.map(token => (
          <div key={token.address} className="token-item">
            <img src={token.logo} alt={token.symbol} width="32" height="32" />
            <div className="token-info">
              <span className="token-name">{token.name}</span>
              <span className="token-balance">
                {formatBalance(token.balance, token.symbol)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTransactionHistory = () => {
    if (transactions.length === 0) {
      return (
        <div className="empty-state">
          <p>No transactions yet</p>
        </div>
      );
    }

    return (
      <div className="transaction-list">
        {transactions.map(tx => (
          <div key={tx.hash} className="transaction-item">
            <div className="transaction-icon">
              {tx.type === 'send' ? '↑' : '↓'}
            </div>
            <div className="transaction-info">
              <span className="transaction-type">
                {tx.type === 'send' ? 'Sent' : 'Received'}
              </span>
              <span className="transaction-amount">
                {formatBalance(tx.amount, tx.token)}
              </span>
            </div>
            <div className="transaction-status">
              {tx.status === 'confirmed' ? '✓' : '⏳'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button className="secondary-button" onClick={loadAccountData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {isLoading ? (
        <div className="loading-spinner" />
      ) : (
        <>
          {renderAccountCard()}
          
          <div className="section">
            <h3>Tokens</h3>
            {renderTokenList()}
          </div>

          <div className="section">
            <h3>Recent Transactions</h3>
            {renderTransactionHistory()}
          </div>
        </>
      )}

      <style jsx>{`
        .dashboard {
          padding: 16px;
        }

        .account-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .chain-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          background: var(--background-color);
        }

        .balance-display {
          text-align: center;
          margin: 24px 0;
        }

        .balance-display h2 {
          margin: 0;
          font-size: 32px;
          color: var(--text-color);
        }

        .address {
          color: var(--secondary-color);
          margin: 8px 0;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .section {
          margin-bottom: 24px;
        }

        .section h3 {
          margin-bottom: 16px;
        }

        .token-list,
        .transaction-list {
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }

        .token-item,
        .transaction-item {
          display: flex;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .token-info,
        .transaction-info {
          flex-grow: 1;
          margin-left: 12px;
        }

        .token-name,
        .transaction-type {
          display: block;
          color: var(--text-color);
          font-weight: 500;
        }

        .token-balance,
        .transaction-amount {
          display: block;
          color: var(--secondary-color);
          font-size: 14px;
        }

        .empty-state {
          text-align: center;
          padding: 24px;
          color: var(--secondary-color);
        }

        .transaction-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--background-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .transaction-status {
          margin-left: 12px;
          color: var(--secondary-color);
        }
      `}</style>
    </div>
  );
}

export default Dashboard;