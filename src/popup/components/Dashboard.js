import React, { useState, useEffect } from 'react';

function Dashboard({ navigateTo }) {
  const [activeNetwork, setActiveNetwork] = useState('ethereum');
  const [accounts, setAccounts] = useState({
    ethereum: { address: '', balance: '0' },
    solana: { address: '', balance: '0' }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch wallet data from background script
    chrome.runtime.sendMessage({ type: 'GET_ACCOUNTS' }, (response) => {
      if (response.success) {
        setAccounts(response.accounts);
      }
      setIsLoading(false);
    });
  }, []);

  const refreshBalance = () => {
    setIsLoading(true);
    chrome.runtime.sendMessage(
      { type: 'GET_BALANCE', network: activeNetwork },
      (response) => {
        if (response.success) {
          setAccounts(prev => ({
            ...prev,
            [activeNetwork]: {
              ...prev[activeNetwork],
              balance: response.balance
            }
          }));
        }
        setIsLoading(false);
      }
    );
  };

  const switchNetwork = (network) => {
    setActiveNetwork(network);
    chrome.runtime.sendMessage(
      { type: 'SWITCH_NETWORK', network },
      (response) => {
        // Update UI based on response if needed
      }
    );
  };

  const activeAccount = accounts[activeNetwork];
  const networkSymbol = activeNetwork === 'ethereum' ? 'ETH' : 'SOL';

  return (
    <div className="dashboard">
      <div className="network-selector">
        <button
          className={`btn ${activeNetwork === 'ethereum' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchNetwork('ethereum')}
        >
          Ethereum
        </button>
        <button
          className={`btn ${activeNetwork === 'solana' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchNetwork('solana')}
          style={{ marginLeft: '8px' }}
        >
          Solana
        </button>
      </div>

      <div className="card">
        <h3 className="card-title">Account</h3>
        {isLoading ? (
          <p>Loading account details...</p>
        ) : (
          <>
            <div className="wallet-address">
              {activeAccount.address}
            </div>
            <div className="balance-container">
              <div className="balance">{activeAccount.balance}</div>
              <div className="currency">{networkSymbol}</div>
            </div>
            <button className="btn btn-secondary" onClick={refreshBalance}>
              Refresh Balance
            </button>
          </>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Actions</h3>
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            // In a real app, this would open a send transaction form
            alert('Send transaction functionality would go here');
          }}
        >
          Send
        </button>
        <button
          className="btn btn-secondary btn-block"
          onClick={() => {
            // Copy address to clipboard
            navigator.clipboard.writeText(activeAccount.address);
            alert('Address copied to clipboard');
          }}
        >
          Copy Address
        </button>
      </div>
    </div>
  );
}

export default Dashboard;