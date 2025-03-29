import React, { useState, useEffect } from 'react';

function Settings({ navigateTo, walletData }) {
  const [settings, setSettings] = useState({
    autoLockTimeout: DEFAULT_AUTO_LOCK_TIMEOUT,
    showTestNetworks: false,
    gasPreference: 'medium',
    currency: 'USD'
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load settings from storage
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
      setIsLoading(false);
    });
  }, []);

  const saveSettings = async (newSettings) => {
    try {
      await chrome.storage.local.set({ settings: newSettings });
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleChange = (field, value) => {
    const newSettings = { ...settings, [field]: value };
    saveSettings(newSettings);
  };

  if (isLoading) {
    return <div className="loading-spinner" />;
  }

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>Security</h3>
        
        <div className="form-group">
          <label className="form-label">
            Auto-lock Timer (minutes)
          </label>
          <select
            className="form-input"
            value={settings.autoLockTimeout}
            onChange={(e) => handleChange('autoLockTimeout', Number(e.target.value))}
          >
            <option value={1}>1 minute</option>
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigateTo('backup')}
        >
          Backup Recovery Phrase
        </button>
      </div>

      <div className="settings-section">
        <h3>Networks</h3>
        
        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={settings.showTestNetworks}
              onChange={(e) => handleChange('showTestNetworks', e.target.checked)}
            />
            {' '}Show Test Networks
          </label>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigateTo('network')}
        >
          Manage Networks
        </button>
      </div>

      <div className="settings-section">
        <h3>Transactions</h3>
        
        <div className="form-group">
          <label className="form-label">
            Default Gas Price
          </label>
          <select
            className="form-input"
            value={settings.gasPreference}
            onChange={(e) => handleChange('gasPreference', e.target.value)}
          >
            <option value="slow">Low (Slower)</option>
            <option value="medium">Medium</option>
            <option value="fast">High (Faster)</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3>Display</h3>
        
        <div className="form-group">
          <label className="form-label">
            Currency
          </label>
          <select
            className="form-input"
            value={settings.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <p className="version-info">Version 1.0.0</p>
        <div className="links">
          <a href="https://docs.pedalsup.com" target="_blank" rel="noopener noreferrer">
            Documentation
          </a>
          {' | '}
          <a href="https://support.pedalsup.com" target="_blank" rel="noopener noreferrer">
            Support
          </a>
        </div>
      </div>

      <button
        className="secondary-button danger"
        onClick={() => {
          if (window.confirm('Are you sure you want to reset your wallet? This cannot be undone.')) {
            chrome.storage.local.clear();
            navigateTo('welcome');
          }
        }}
      >
        Reset Wallet
      </button>
    </div>
  );
}

export default Settings; 