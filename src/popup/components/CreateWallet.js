import React, { useState } from 'react';
import { PASSWORD_REQUIREMENTS } from '../../config';

function CreateWallet({ navigateTo, setWalletData }) {
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [confirmMnemonic, setConfirmMnemonic] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const generateMnemonic = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_MNEMONIC'
      });
      if (response.success) {
        setMnemonic(response.mnemonic);
      } else {
        setError('Failed to generate recovery phrase');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const validatePassword = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateMnemonic = () => {
    // Normalize both mnemonics by trimming whitespace, converting to lowercase
    // and ensuring single spaces between words
    const normalizedMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedConfirmMnemonic = confirmMnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
    
    if (normalizedMnemonic !== normalizedConfirmMnemonic) {
      setError('Recovery phrases do not match. Please check each word carefully.');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    setError('');

    if (step === 1) {
      if (!validatePassword()) {
        return;
      }
      // Generate mnemonic when moving to step 2
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'GENERATE_MNEMONIC'
        });
        if (response && response.success) {
          setMnemonic(response.mnemonic);
          setStep(2);
        } else {
          setError(response.error || 'Failed to generate recovery phrase');
        }
      } catch (error) {
        setError(error.message || 'Failed to generate recovery phrase');
      }
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!validateMnemonic()) {
        return;
      }
      setIsLoading(true);
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'CREATE_WALLET',
          password,
          mnemonic
        });

        if (response && response.success) {
          setWalletData(response.wallet);
          navigateTo('dashboard');
        } else {
          setError(response.error || 'Failed to create wallet');
        }
      } catch (error) {
        setError(error.message || 'Failed to create wallet');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h2>Create Password</h2>
      <p>This password will be used to unlock your wallet</p>

      <div className="form-group">
        <label className="form-label">
          Password
          <div className="password-input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a strong password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">
          Confirm Password
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
          />
        </label>
      </div>

      <div className="password-requirements">
        <p>Password requirements:</p>
        <ul>
          <li>At least 8 characters long</li>
          <li>Contains numbers and letters</li>
          <li>Contains special characters</li>
        </ul>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2>Recovery Phrase</h2>
      <p>Write down these 12 words in order and keep them safe</p>

      <div className="mnemonic-display">
        {mnemonic.split(' ').map((word, index) => (
          <div key={index} className="mnemonic-word">
            <span className="word-number">{index + 1}.</span>
            <span className="word">{word}</span>
          </div>
        ))}
      </div>

      <div className="security-notice">
        <h4>⚠️ Important</h4>
        <ul>
          <li>Never share your recovery phrase</li>
          <li>Store it in a secure location</li>
          <li>Lost phrases cannot be recovered</li>
        </ul>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h2>Verify Recovery Phrase</h2>
      <p>Enter your recovery phrase to confirm you've saved it</p>

      <div className="form-group">
        <textarea
          className="form-input mnemonic-input"
          value={confirmMnemonic}
          onChange={(e) => setConfirmMnemonic(e.target.value)}
          placeholder="Enter your 12-word recovery phrase, separated by spaces"
          rows={4}
        />
        <div className="mnemonic-help">
          Enter all 12 words in order, separated by spaces
        </div>
      </div>
    </div>
  );

  return (
    <div className="create-wallet">
      <div className="step-indicator">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`step ${step >= i ? 'active' : ''}`}>
            {i}
          </div>
        ))}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <div className="action-buttons">
        {step > 1 && (
          <button
            className="secondary-button"
            onClick={() => setStep(step - 1)}
            disabled={isLoading}
          >
            Back
          </button>
        )}
        <button
          className="primary-button"
          onClick={handleNext}
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : step === 3 ? 'Create Wallet' : 'Next'}
        </button>
      </div>

      <style jsx>{`
        .create-wallet {
          padding: 16px;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-bottom: 32px;
        }

        .step {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--background-color);
          border: 2px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
        }

        .step.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
        }

        .step-content {
          margin-bottom: 32px;
        }

        h2 {
          margin-bottom: 8px;
          font-size: 24px;
        }

        p {
          color: var(--secondary-color);
          margin-bottom: 24px;
        }

        .password-input-container {
          position: relative;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .password-requirements {
          margin-top: 16px;
          padding: 16px;
          background: var(--background-color);
          border-radius: 8px;
        }

        .password-requirements ul {
          margin-top: 8px;
          padding-left: 24px;
        }

        .mnemonic-display {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 24px 0;
          padding: 16px;
          background: var(--background-color);
          border-radius: 8px;
        }

        .mnemonic-word {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 4px;
        }

        .word-number {
          color: var(--secondary-color);
          font-size: 14px;
          min-width: 20px;
        }

        .word {
          font-weight: 500;
        }

        .security-notice {
          margin-top: 24px;
          padding: 16px;
          background: #fff3e0;
          border: 1px solid #ffb74d;
          border-radius: 8px;
        }

        .security-notice h4 {
          color: #f57c00;
          margin-bottom: 8px;
        }

        .security-notice ul {
          padding-left: 24px;
        }

        .mnemonic-help {
          margin-top: 8px;
          font-size: 14px;
          color: var(--secondary-color);
        }

        .mnemonic-input {
          font-family: monospace;
          width: 100%;
          min-height: 80px;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 16px;
          resize: vertical;
        }

        .mnemonic-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .error-message {
          margin-bottom: 16px;
          padding: 12px;
          background-color: #ffebee;
          border: 1px solid #ef5350;
          border-radius: 8px;
          color: #c62828;
        }

        .action-buttons {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .action-buttons button {
          flex: 1;
        }
      `}</style>
    </div>
  );
}

export default CreateWallet;