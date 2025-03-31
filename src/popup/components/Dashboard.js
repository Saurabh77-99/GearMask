import React, { useState, useEffect } from 'react';
import { NETWORKS } from '../../config';

function Dashboard({ navigateTo, walletData, selectedChain }) {
  const [accounts, setAccounts] = useState({
    ethereum: { address: '', balance: '0' },
    solana: { address: '', balance: '0' }
  });
  const [selectedNetwork, setSelectedNetwork] = useState('sepolia'); // Add this line
  const [tokens, setTokens] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState('0.0378'); // Default ETH balance
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  useEffect(() => {
    loadAccountData();
    loadTransactionHistory();
    fetchBalance();
  }, [selectedChain,selectedNetwork]);

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
    setIsLoading(true);
    setError(null);

    try {
      setTransactions([]);

      const response = await chrome.runtime.sendMessage({
        type: 'GET_TRANSACTIONS',
        chain: selectedChain,
        network: selectedNetwork || 'sepolia'
      });
      
      if (response && response.success) {
        // Get transactions for the selected chain
        const txlist = response.transactions|| [];
        setTransactions(txlist);
        
        if (txList.length === 0) {
          console.log('No transactions found. There might be a network delay, try refreshing later.');
        }
      } else {
        console.error('Failed to load transactions:', response?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const response = await chrome.runtime.sendMessage({
        type: 'GET_BALANCE',
        chain: selectedChain,
        address: walletData?.accounts?.ethereum?.address
      });

      if (response.success) {
        setBalance(response.balance);
      } else {
        console.error('Failed to fetch balance:', response.error);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    navigateTo('send');
  };

  const handleReceive = () => {
    navigateTo('receive');
  };

  const handleLogout = async () => {
    try {
      // Send logout message to background script
      const response = await chrome.runtime.sendMessage({
        type: 'LOGOUT'
      });

      if (response.success) {
        // Navigate back to welcome screen
        navigateTo('welcome');
      } else {
        console.error('Logout failed:', response.error);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
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

  const fetchBalance = async () => {
    try {
      setIsLoading(true);
      const response = await chrome.runtime.sendMessage({
        type: 'GET_BALANCE',
        chain: selectedChain
      });

      if (response.success) {
        setBalance(response.balance);
      } else {
        console.error('Failed to fetch balance:', response.error);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoadingTx(true);
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TRANSACTIONS',
        chain: selectedChain,
        address: walletData?.accounts?.ethereum?.address,
        limit: 3 // Get last 3 transactions
      });

      if (response.success) {
        setTransactions(response.transactions);
      } else {
        console.error('Failed to fetch transactions:', response.error);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoadingTx(false);
    }
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

          <div className="transactions-section">
            <h3>Recent Transactions</h3>
            {isLoadingTx ? (
              <div className="loading-spinner" />
            ) : transactions.length > 0 ? (
              <div className="transaction-list">
                {transactions.map((tx, index) => (
                  <div key={tx.hash} className="transaction-item" style={{
                    padding: '12px',
                    borderBottom: index !== transactions.length - 1 ? '1px solid #eee' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', color: '#1a73e8' }}>
                        {tx.type === 'send' ? 'Sent' : 'Received'} ETH
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '14px',
                      color: tx.type === 'send' ? '#f44336' : '#4caf50'
                    }}>
                      {tx.type === 'send' ? '-' : '+'}{tx.value} ETH
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No transactions yet
              </div>
            )}
          </div>
        </>
      )}

      <div className="balance-section" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3>Balance: {balance} ETH</h3>
            <div style={{ color: '#666', fontSize: '14px' }}>
              {walletData?.accounts?.ethereum?.address?.slice(0, 6)}...
              {walletData?.accounts?.ethereum?.address?.slice(-4)}
            </div>
          </div>
          <button 
            className="secondary-button"
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {isLoading ? (
              <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
            ) : (
              <>
                <span style={{ transform: 'rotate(90deg)' }}>↻</span>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      <button 
        className="secondary-button"
        onClick={handleLogout}
        style={{ 
          marginTop: '20px',
          width: '100%',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none'
        }}
      >
        Logout
      </button>

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

        .balance-section {
          margin-bottom: 24px;
        }

        .balance-section h3 {
          margin-bottom: 16px;
        }

        .balance-amount {
          font-size: 24px;
          font-weight: 500;
          color: var(--text-color);
        }
      `}</style>
    </div>
  );
}

export default Dashboard;