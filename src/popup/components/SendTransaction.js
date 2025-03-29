import React, { useState, useEffect } from 'react';
import { NETWORKS } from '../../config';

function SendTransaction({ navigateTo, selectedChain }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [gasPrice, setGasPrice] = useState(null);
  const [estimatedGas, setEstimatedGas] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState('sepolia'); // Default to Sepolia

  useEffect(() => {
    loadTokens();
    if (selectedChain === 'ethereum') {
      loadGasPrice();
    }
  }, [selectedChain, selectedNetwork]);

  const loadTokens = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TOKENS',
        chain: selectedChain,
        network: selectedNetwork
      });
      
      if (response && response.success && response.tokens.length > 0) {
        setAvailableTokens(response.tokens);
        setSelectedToken(response.tokens[0]); // Set first token (native token) as default
      } else {
        setError('No tokens available');
      }
    } catch (error) {
      setError('Failed to load tokens');
    }
  };

  const loadGasPrice = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_GAS_PRICE',
        chain: selectedChain,
        network: selectedNetwork
      });
      
      if (response && response.success) {
        setGasPrice(response.gasPrice);
      } else {
        console.error('Failed to load gas price:', response?.error);
      }
    } catch (error) {
      console.error('Failed to load gas price:', error);
    }
  };

  const validateAddress = (address) => {
    if (selectedChain === 'ethereum') {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    } else if (selectedChain === 'solana') {
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    }
    return false;
  };

  const handleRecipientChange = (e) => {
    setRecipient(e.target.value);
    setError(null);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleTokenSelect = (e) => {
    const token = availableTokens.find(t => t.address === e.target.value);
    setSelectedToken(token);
    setError(null);
  };

  const estimateTransaction = async () => {
    if (!validateAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid amount');
      return;
    }

    if (selectedToken && parseFloat(amount) > parseFloat(selectedToken.balance)) {
      setError('Insufficient balance');
      return;
    }

    setIsLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ESTIMATE_TRANSACTION',
        chain: selectedChain,
        network: selectedNetwork,
        transaction: {
          to: recipient,
          value: amount,
          token: selectedToken?.address
        }
      });

      if (response && response.success) {
        setEstimatedGas(response.estimatedGas);
        setGasPrice(response.gasPrice);
      } else {
        setError(response?.error || 'Failed to estimate transaction');
      }
    } catch (error) {
      setError(error.message || 'Failed to estimate transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!estimatedGas) {
      await estimateTransaction();
      if (error) return;
    }

    setIsLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEND_TRANSACTION',
        transaction: {
          to: recipient,
          value: amount,
          token: selectedToken?.address,
          gasLimit: estimatedGas,
          gasPrice: gasPrice,
          chain: selectedChain,
          network: selectedNetwork
        }
      });

      if (response && response.success) {
        setError(null);
        const networkExplorer = NETWORKS[selectedChain][selectedNetwork].blockExplorer;
        const txUrl = `${networkExplorer}/tx/${response.hash}`;
        alert(`Transaction sent! View on explorer: ${txUrl}`);
        navigateTo('dashboard');
      } else {
        setError(response?.error || 'Failed to send transaction');
      }
    } catch (error) {
      setError(error.message || 'Failed to send transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="send-transaction">
      <h2>Send {selectedToken?.symbol || ''}</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="form-container">
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

        <div className="form-group">
          <label className="form-label">
            Recipient Address
            <input
              type="text"
              className="form-input"
              value={recipient}
              onChange={handleRecipientChange}
              placeholder={`Enter ${selectedChain} address`}
            />
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">
            Amount
            <div className="amount-input-container">
              <input
                type="text"
                className="form-input"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
              />
              <select
                className="token-select"
                value={selectedToken?.address || ''}
                onChange={handleTokenSelect}
              >
                {availableTokens.map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
          </label>
          {selectedToken && (
            <p className="balance-text">
              Available: {selectedToken.balance} {selectedToken.symbol}
            </p>
          )}
        </div>

        {selectedChain === 'ethereum' && (
          <div className="gas-info">
            {gasPrice && (
              <div className="info-row">
                <span>Gas Price:</span>
                <span>{gasPrice} GWEI</span>
              </div>
            )}
            {estimatedGas && (
              <div className="info-row">
                <span>Estimated Gas:</span>
                <span>{estimatedGas} GWEI</span>
              </div>
            )}
            {estimatedGas && gasPrice && (
              <div className="info-row total">
                <span>Total Cost (including gas):</span>
                <span>
                  {(parseFloat(amount) + (parseFloat(estimatedGas) * parseFloat(gasPrice) / 1e9)).toFixed(6)} ETH
                </span>
              </div>
            )}
          </div>
        )}

        <div className="action-buttons">
          {!estimatedGas ? (
            <button
              className="primary-button"
              onClick={estimateTransaction}
              disabled={isLoading || !selectedToken || !amount || !recipient}
            >
              {isLoading ? 'Estimating...' : 'Review Transaction'}
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={handleSend}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Transaction'}
            </button>
          )}
          <button
            className="secondary-button"
            onClick={() => navigateTo('dashboard')}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        .send-transaction {
          padding: 16px;
        }

        .form-container {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-top: 16px;
        }

        .amount-input-container {
          display: flex;
          gap: 8px;
        }

        .token-select {
          min-width: 100px;
          padding: 8px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: white;
          font-size: 16px;
        }

        .balance-text {
          margin-top: 8px;
          font-size: 14px;
          color: var(--secondary-color);
        }

        .gas-info {
          margin-top: 16px;
          padding: 12px;
          background: var(--background-color);
          border-radius: 8px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }

        .error-message {
          margin-bottom: 16px;
          padding: 12px;
          background: #ffebee;
          border: 1px solid #ef5350;
          border-radius: 8px;
          color: #c62828;
        }

        .info-row.total {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
          font-weight: 500;
        }

        .network-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 16px;
          width: 100%;
        }

        .network-option {
          padding: 8px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 500;
        }

        .network-option.active {
          border-color: var(--primary-color);
          background: var(--primary-color);
          color: white;
        }

        .network-option:hover:not(.active) {
          background: var(--background-color);
        }
      `}</style>
    </div>
  );
}

export default SendTransaction; 