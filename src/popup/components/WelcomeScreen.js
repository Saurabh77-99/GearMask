import React from 'react';

function WelcomeScreen({ navigateTo }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-logo">
        <img src="../icons/icon128.png" alt="Pedals Up Wallet Logo" width="64" height="64" />
      </div>
      <h2>Welcome to Pedals Up Wallet</h2>
      <p>A secure multi-chain wallet for Ethereum and Solana</p>
      
      <div className="welcome-actions">
        <button className="btn btn-primary btn-block" onClick={() => navigateTo('create')}>
          Create New Wallet
        </button>
        <button className="btn btn-secondary btn-block" onClick={() => navigateTo('import')}>
          Import Existing Wallet
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;