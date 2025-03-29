import React, { useState } from 'react';

function UnlockWallet({ navigateTo, setWalletData }) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleUnlock = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UNLOCK_WALLET',
        password
      });

      if (response.success) {
        setWalletData(response.wallet);
        navigateTo('dashboard');
      } else {
        setError(response.error || 'Invalid password');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  const handleForgotPassword = () => {
    navigateTo('importWallet');
  };

  return (
    <div className="unlock-wallet">
      <div className="logo-container">
        <img
          src="/images/logo.png"
          alt="Pedals Up Wallet"
          width="64"
          height="64"
        />
        <h1>Pedals Up Wallet</h1>
      </div>

      <div className="form-container">
        <h2>Welcome Back!</h2>
        <p>Enter your password to unlock your wallet</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            Password
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                autoFocus
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

        <button
          className="primary-button"
          onClick={handleUnlock}
          disabled={isLoading}
        >
          {isLoading ? 'Unlocking...' : 'Unlock'}
        </button>

        <button
          className="text-button"
          onClick={handleForgotPassword}
        >
          Forgot Password?
        </button>
      </div>

      <style jsx>{`
        .unlock-wallet {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 16px;
          background: var(--background-color);
        }

        .logo-container {
          text-align: center;
          margin-bottom: 48px;
        }

        .logo-container h1 {
          margin: 16px 0 0 0;
          font-size: 24px;
          color: var(--text-color);
        }

        .form-container {
          width: 100%;
          max-width: 400px;
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .form-container h2 {
          margin: 0;
          color: var(--text-color);
        }

        .form-container p {
          margin: 8px 0 24px 0;
          color: var(--secondary-color);
        }

        .password-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-size: 20px;
        }

        .form-input {
          padding-right: 40px;
        }

        .text-button {
          background: none;
          border: none;
          color: var(--primary-color);
          padding: 8px;
          margin-top: 16px;
          cursor: pointer;
          font-size: 14px;
        }

        .text-button:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .form-container {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}

export default UnlockWallet;