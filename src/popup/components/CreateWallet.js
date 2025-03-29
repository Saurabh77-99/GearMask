import React, { useState } from 'react';

function CreateWallet({ navigateTo, setWalletData }) {
  const [step, setStep] = useState('create');
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createNewWallet = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Send message to background script to create a new wallet
      chrome.runtime.sendMessage(
        { type: 'CREATE_WALLET', password },
        (response) => {
          if (response.success) {
            setMnemonic(response.mnemonic);
            setStep('backup');
          } else {
            setError(response.error || 'Failed to create wallet');
          }
          setIsCreating(false);
        }
      );
    } catch (err) {
      setError(err.message || 'An error occurred');
      setIsCreating(false);
    }
  };

  const confirmBackup = () => {
    // In a real app, you'd verify the user has backed up the mnemonic
    // For simplicity, we're just moving to the next step
    chrome.storage.local.set({ hasWallet: true });
    navigateTo('dashboard');
  };

  if (step === 'create') {
    return (
      <div className="create-wallet">
        <h2>Create a New Wallet</h2>
        <p>Set a password to encrypt your wallet</p>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label className="form-label">Password</label>
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
          onClick={createNewWallet}
          disabled={isCreating}
        >
          {isCreating ? 'Creating...' : 'Create Wallet'}
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

  if (step === 'backup') {
    return (
      <div className="backup-mnemonic">
        <h2>Backup Your Recovery Phrase</h2>
        <p>
          Write down these 12 words and keep them in a safe place. You'll need them to recover your wallet.
        </p>

        <div className="mnemonic-display">
          {mnemonic.split(' ').map((word, index) => (
            <div key={index} className="mnemonic-word">
              <span className="word-number">{index + 1}.</span> {word}
            </div>
          ))}
        </div>

        <div className="backup-warning">
          <p>⚠️ Never share your recovery phrase with anyone.</p>
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={confirmBackup}
        >
          I've backed up my phrase
        </button>
      </div>
    );
  }
}

export default CreateWallet;