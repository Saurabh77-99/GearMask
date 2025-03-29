import React, { useState } from 'react';

function ImportWallet({ navigateTo, setWalletData }) {
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const importWallet = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!mnemonic.trim()) {
      setError('Please enter your recovery phrase');
      return;
    }

    // Simple validation that the mnemonic has 12 words
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      setError('Recovery phrase must be 12 words');
      return;
    }

    setIsImporting(true);
    setError('');

    try {
      // Send message to background script to import the wallet
      chrome.runtime.sendMessage(
        { type: 'IMPORT_WALLET', mnemonic, password },
        (response) => {
          if (response.success) {
            chrome.storage.local.set({ hasWallet: true });
            navigateTo('dashboard');
          } else {
            setError(response.error || 'Failed to import wallet');
          }
          setIsImporting(false);
        }
      );
    } catch (err) {
      setError(err.message || 'An error occurred');
      setIsImporting(false);
    }
  };

  return (
    <div className="import-wallet">
      <h2>Import Existing Wallet</h2>
      <p>Enter your 12-word recovery phrase</p>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label className="form-label">Recovery Phrase</label>
        <textarea
          className="form-input"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          placeholder="Enter your 12-word recovery phrase separated by spaces"
          rows={4}
        ></textarea>
      </div>

      <div className="form-group">
        <label className="form-label">New Password</label>
        <input
          type="password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter a strong password"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Confirm Password</label>
        <input
          type="password"
          className="form-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
        />
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={importWallet}
        disabled={isImporting}
      >
        {isImporting ? 'Importing...' : 'Import Wallet'}
      </button>
      
      <button
        className="btn btn-secondary btn-block"
        onClick={() => navigateTo('welcome')}
      >
        Back
      </button>
    </div>
  );
}

export default ImportWallet;