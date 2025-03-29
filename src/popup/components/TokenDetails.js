import React, { useState, useEffect } from 'react';
import { NETWORKS } from '../../config';

function TokenDetails({ token, selectedChain, navigateTo }) {
  const [transactions, setTransactions] = useState([]);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTokenData();
    loadTransactionHistory();
  }, [token.address]);

  const loadTokenData = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TOKEN_INFO',
        chain: selectedChain,
        tokenAddress: token.address
      });

      if (response.success) {
        setTokenInfo(response.tokenInfo);
        setPriceData(response.priceData);
      } else {
        setError('Failed to load token information');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TOKEN_TRANSACTIONS',
        chain: selectedChain,
        tokenAddress: token.address
      });

      if (response.success) {
        setTransactions(response.transactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const formatAmount = (amount, decimals = token.decimals) => {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    return value.toFixed(6);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleSend = () => {
    navigateTo('send', { selectedToken: token });
  };

  const handleReceive = () => {
    navigateTo('receive');
  };

  if (isLoading) {
    return <div className="loading-spinner" />;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button className="secondary-button" onClick={loadTokenData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="token-details">
      <div className="token-header">
        <img
          src={token.logo}
          alt={token.symbol}
          width="48"
          height="48"
        />
        <div className="token-info">
          <h2>{token.name}</h2>
          <p className="token-symbol">{token.symbol}</p>
        </div>
      </div>

      <div className="balance-card">
        <div className="balance-amount">
          <span className="label">Balance</span>
          <h3>{formatAmount(token.balance)} {token.symbol}</h3>
          {priceData && (
            <p className="fiat-value">
              ≈ ${(formatAmount(token.balance) * priceData.price).toFixed(2)} USD
            </p>
          )}
        </div>

        <div className="action-buttons">
          <button className="primary-button" onClick={handleSend}>
            Send
          </button>
          <button className="secondary-button" onClick={handleReceive}>
            Receive
          </button>
        </div>
      </div>

      {tokenInfo && (
        <div className="info-card">
          <h3>Token Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Contract Address</span>
              <span className="value">{formatAddress(token.address)}</span>
            </div>
            <div className="info-item">
              <span className="label">Network</span>
              <span className="value">{NETWORKS[selectedChain].mainnet.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Decimals</span>
              <span className="value">{token.decimals}</span>
            </div>
            {priceData && (
              <>
                <div className="info-item">
                  <span className="label">Current Price</span>
                  <span className="value">${priceData.price.toFixed(4)}</span>
                </div>
                <div className="info-item">
                  <span className="label">24h Change</span>
                  <span className={`value ${priceData.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                    {priceData.priceChange24h.toFixed(2)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="transactions-card">
        <h3>Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="transaction-list">
            {transactions.map(tx => (
              <div key={tx.hash} className="transaction-item">
                <div className="transaction-icon">
                  {tx.type === 'send' ? '↑' : '↓'}
                </div>
                <div className="transaction-info">
                  <div className="transaction-main">
                    <span className="transaction-type">
                      {tx.type === 'send' ? 'Sent' : 'Received'}
                    </span>
                    <span className="transaction-amount">
                      {formatAmount(tx.amount)} {token.symbol}
                    </span>
                  </div>
                  <div className="transaction-details">
                    <span className="transaction-date">
                      {formatDate(tx.timestamp)}
                    </span>
                    <span className="transaction-status">
                      {tx.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .token-details {
          padding: 16px;
        }

        .token-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .token-info h2 {
          margin: 0;
          font-size: 24px;
        }

        .token-symbol {
          margin: 4px 0 0 0;
          color: var(--secondary-color);
        }

        .balance-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          text-align: center;
        }

        .balance-amount h3 {
          margin: 8px 0;
          font-size: 32px;
        }

        .fiat-value {
          color: var(--secondary-color);
          margin: 0;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }

        .info-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .info-grid {
          display: grid;
          gap: 16px;
          margin-top: 16px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label {
          color: var(--secondary-color);
        }

        .value {
          font-weight: 500;
        }

        .value.positive {
          color: #4caf50;
        }

        .value.negative {
          color: #f44336;
        }

        .transactions-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
        }

        .transaction-list {
          margin-top: 16px;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .transaction-item:last-child {
          border-bottom: none;
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

        .transaction-info {
          flex-grow: 1;
        }

        .transaction-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .transaction-type {
          font-weight: 500;
        }

        .transaction-amount {
          color: var(--text-color);
        }

        .transaction-details {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--secondary-color);
        }

        .empty-state {
          text-align: center;
          padding: 32px;
          color: var(--secondary-color);
        }
      `}</style>
    </div>
  );
}

export default TokenDetails;