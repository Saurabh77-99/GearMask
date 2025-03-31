import React from 'react';

function WelcomeScreen({ navigateTo }) {
  return (
    <div className="welcome-screen">
      <div className="logo-container">
        <img
          src="/images/logo.png"
          alt="GearMask Wallet"
          width="128"
          height="128"
        />
        <h1>GearMask Wallet</h1>
        <p className="tagline">Your Secure Multi-Chain Wallet</p>
      </div>

      <div className="features">
        <div className="feature-item">
          <span className="feature-icon">🔒</span>
          <h3>Secure</h3>
          <p>Your keys, your crypto. Full control over your assets.</p>
        </div>
        <div className="feature-item">
          <span className="feature-icon">⚡</span>
          <h3>Fast</h3>
          <p>Quick transactions across multiple blockchains.</p>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🌐</span>
          <h3>Multi-Chain</h3>
          <p>Support for Ethereum, Solana, and more.</p>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="primary-button"
          onClick={() => navigateTo('create')}
        >
          Create New Wallet
        </button>
        <button
          className="secondary-button"
          onClick={() => navigateTo('import')}
        >
          Import Existing Wallet
        </button>
      </div>

      <style jsx>{`
        .welcome-screen {
          min-height: 100vh;
          padding: 48px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: var(--background-color);
        }

        .logo-container {
          margin-bottom: 48px;
        }

        .logo-container h1 {
          margin: 16px 0 0 0;
          font-size: 32px;
          color: var(--text-color);
        }

        .tagline {
          margin: 8px 0 0 0;
          color: var(--secondary-color);
          font-size: 18px;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 48px;
          width: 100%;
          max-width: 800px;
        }

        .feature-item {
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s;
        }

        .feature-item:hover {
          transform: translateY(-4px);
        }

        .feature-icon {
          font-size: 32px;
          margin-bottom: 16px;
          display: block;
        }

        .feature-item h3 {
          margin: 0 0 8px 0;
          color: var(--text-color);
        }

        .feature-item p {
          margin: 0;
          color: var(--secondary-color);
          font-size: 14px;
          line-height: 1.4;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          width: 100%;
          max-width: 320px;
        }

        @media (max-width: 768px) {
          .features {
            grid-template-columns: 1fr;
            padding: 0 16px;
          }

          .welcome-screen {
            padding: 32px 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default WelcomeScreen;