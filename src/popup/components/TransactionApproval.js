import React, { useState } from 'react';
import { NETWORKS } from '../../config';

function TransactionApproval({ transaction, navigateTo, onComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gasPrice, setGasPrice] = useState(transaction.suggestedGasPrice);
  const [gasPriceOption, setGasPriceOption] = useState('medium');

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount, decimals = 18) => {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    return value.toFixed(6);
  };

  const handleApprove = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'APPROVE_TRANSACTION',
        transaction: {
          ...transaction,
          gasPrice
        }
      });

      if (response.success) {
        onComplete();
      } else {
        setError(response.error || 'Failed to approve transaction');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      await chrome.runtime.sendMessage({
        type: 'REJECT_TRANSACTION',
        transaction
      });
      onComplete();
    } catch (error) {
      setError(error.message);
    }
  };

  const updateGasPrice = (option) => {
    setGasPriceOption(option);
    const prices = {
      slow: transaction.suggestedGasPrice * 0.8,
      medium: transaction.suggestedGasPrice,
      fast: transaction.suggestedGasPrice * 1.2
    };
    setGasPrice(prices[option]);
  };

  const networkData = NETWORKS[transaction.chain][transaction.network];

  return (
    <div className="transaction-approval">
      <h2>Approve Transaction</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="transaction-details">
        <div className="detail-row">
          <span className="label">From</span>
          <span className="value">{formatAddress(transaction.from)}</span>
        </div>

        <div className="detail-row">
          <span className="label">To</span>
          <span className="value">{formatAddress(transaction.to)}</span>
        </div>

        <div className="detail-row">
          <span className="label">Amount</span>
          <span className="value">
            {formatAmount(transaction.value)} {networkData.symbol}
          </span>
        </div>

        {transaction.chain === 'ethereum' && (
          <div className="gas-settings">
            <h3>Gas Settings</h3>
            
            <div className="gas-options">
              <button
                className={`gas-option ${gasPriceOption === 'slow' ? 'selected' : ''}`}
                onClick={() => updateGasPrice('slow')}
              >
                <span>Slow</span>
                <span className="gas-price">
                  {(transaction.suggestedGasPrice * 0.8).toFixed(2)} Gwei
                </span>
              </button>

              <button
                className={`gas-option ${gasPriceOption === 'medium' ? 'selected' : ''}`}
                onClick={() => updateGasPrice('medium')}
              >
                <span>Medium</span>
                <span className="gas-price">
                  {transaction.suggestedGasPrice.toFixed(2)} Gwei
                </span>
              </button>

              <button
                className={`gas-option ${gasPriceOption === 'fast' ? 'selected' : ''}`}
                onClick={() => updateGasPrice('fast')}
              >
                <span>Fast</span>
                <span className="gas-price">
                  {(transaction.suggestedGasPrice * 1.2).toFixed(2)} Gwei
                </span>
              </button>
            </div>

            <div className="estimated-fee">
              <span>Estimated Fee:</span>
              <span>
                {formatAmount(gasPrice * transaction.gasLimit)} {networkData.symbol}
              </span>
            </div>
          </div>
        )}

        {transaction.data && (
          <div className="contract-interaction">
            <h3>Contract Interaction</h3>
            <div className="contract-data">
              <pre>{transaction.data}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button
          className="primary-button"
          onClick={handleApprove}
          disabled={isLoading}
        >
          {isLoading ? 'Approving...' : 'Approve'}
        </button>
        <button
          className="secondary-button"
          onClick={handleReject}
          disabled={isLoading}
        >
          Reject
        </button>
      </div>

      <style jsx>{`
        .transaction-approval {
          padding: 16px;
        }

        .transaction-details {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin: 24px 0;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .label {
          color: var(--secondary-color);
        }

        .value {
          font-weight: 500;
          color: var(--text-color);
        }

        .gas-settings {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .gas-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin: 16px 0;
        }

        .gas-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: none;
          cursor: pointer;
        }

        .gas-option.selected {
          border-color: var(--primary-color);
          background-color: #f0f4ff;
        }

        .gas-price {
          font-size: 12px;
          color: var(--secondary-color);
          margin-top: 4px;
        }

        .estimated-fee {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--background-color);
          border-radius: 8px;
          margin-top: 16px;
        }

        .contract-interaction {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .contract-data {
          background: var(--background-color);
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
          overflow-x: auto;
        }

        .contract-data pre {
          margin: 0;
          font-size: 12px;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
}

export default TransactionApproval;