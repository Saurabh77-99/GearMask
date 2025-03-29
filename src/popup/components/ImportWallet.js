import React, { useState } from 'react';

function ImportWallet({ navigateTo, setWalletData }) {
  const [importType, setImportType] = useState('seedPhrase');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (importType === 'seedPhrase') {
      const words = seedPhrase.trim().split(/\s+/);
      if (![12, 24].includes(words.length)) {
        setError('Seed phrase must be 12 or 24 words');
        return false;
      }
    } else if (importType === 'privateKey') {
      if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
        setError('Invalid private key format');
        return false;
      }
    }

    return true;
  };

  const handleImport = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'IMPORT_WALLET',
        importType,
        data: importType === 'seedPhrase' ? seedPhrase : privateKey,
        password
      });

      if (response.success) {
        setWalletData(response.wallet);
        navigateTo('dashboard');
      } else {
        setError(response.error || 'Failed to import wallet');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="import-wallet">
      <h2>Import Wallet</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="import-type-selector">
        <button
          className={`tab-button ${importType === 'seedPhrase' ? 'active' : ''}`}
          onClick={() => setImportType('seedPhrase')}
        >
          Seed Phrase
        </button>
        <button
          className={`tab-button ${importType === 'privateKey' ? 'active' : ''}`}
          onClick={() => setImportType('privateKey')}
        >
          Private Key
        </button>
      </div>

      <div className="form-container">
        {importType === 'seedPhrase' ? (
          <div className="form-group">
            <label className="form-label">
              Recovery Phrase
              <textarea
                className="form-input textarea"
                value={seedPhrase}
                onChange={(e) => setSeedPhrase(e.target.value)}
                placeholder="Enter your 12 or 24 word recovery phrase"
                rows={4}
              />
            </label>
            <p className="helper-text">
              Enter your recovery phrase with words separated by spaces
            </p>
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">
              Private Key
              <input
                type="text"
                className="form-input"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter your private key"
              />
            </label>
            <p className="helper-text">
              Enter your private key in hexadecimal format (64 characters)
            </p>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            New Password
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
            />
          </label>
          <p className="helper-text">
            Password must be at least 8 characters long
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">
            Confirm Password
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </label>
        </div>

        <div className="security-notice">
          <h4>🔒 Security Notice</h4>
          <p>
            Your wallet data will be encrypted and stored locally. Make sure to:
          </p>
          <ul>
            <li>Use a strong password that you haven't used elsewhere</li>
            <li>Back up your recovery phrase in a secure location</li>
            <li>Never share your recovery phrase or private keys with anyone</li>
          </ul>
        </div>

        <button
          className="primary-button"
          onClick={handleImport}
          disabled={isLoading}
        >
          {isLoading ? 'Importing...' : 'Import Wallet'}
        </button>
      </div>

      <style jsx>{`
        .import-wallet {
          padding: 16px;
        }

        .import-type-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 24px 0;
        }

        .tab-button {
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-button.active {
          border-color: var(--primary-color);
          background-color: #f0f4ff;
          color: var(--primary-color);
        }

        .form-container {
          background: white;
          border-radius: 12px;
          padding: 16px;
        }

        .textarea {
          min-height: 100px;
          resize: vertical;
        }

        .helper-text {
          font-size: 12px;
          color: var(--secondary-color);
          margin-top: 4px;
        }

        .security-notice {
          margin: 24px 0;
          padding: 16px;
          background: #fff8e1;
          border-radius: 8px;
          border: 1px solid #ffd54f;
        }

        .security-notice h4 {
          margin: 0 0 8px 0;
          color: #f57c00;
        }

        .security-notice p {
          margin: 0 0 8px 0;
        }

        .security-notice ul {
          margin: 0;
          padding-left: 20px;
        }

        .security-notice li {
          margin: 4px 0;
          color: #666;
        }
      `}</style>
    </div>
  );
}

export default ImportWallet;