import { useWallet } from '../contexts/WalletContext';

function WalletDemo() {
  const {
    wallet,
    connected,
    account,
    chainId,
    chain,
    error,
    txHash,
    signature,
    isLoading,
    success,
    connectWallet,
    disconnect,
    sendTransaction,
    signMessage,
    setChainType,
    formatAddress
  } = useWallet();

  return (
    <div>
      <div className="card">
        <h1>GearMask Demo App</h1>
        <p>This simple app demonstrates how to connect with the GearMask wallet extension.</p>
        
        <div className="info-section">
          <strong>Wallet status:</strong> {wallet ? 'Detected' : 'Not detected'}<br/>
          <strong>Connection status:</strong> {
            connected ? 
              `Connected to ${account ? formatAddress(account) : 'wallet'}` 
              : 'Not connected'
          }<br/>
          <strong>Current chain:</strong> {chain}<br/>
          {chainId && <><strong>Chain ID:</strong> {chainId}<br/></>}
          {account && (
            <>
              <strong>Account:</strong> 
              <span title={account}>
                {account.substring(0, 10)}...{account.substring(Math.max(0, account.length - 6))}
              </span>
              <br/>
            </>
          )}
        </div>
        
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="chain-selector">
          <div 
            className={`chain-option ${chain === 'ethereum' ? 'active' : ''}`}
            onClick={() => setChainType('ethereum')}
          >
            Ethereum
          </div>
          <div 
            className={`chain-option ${chain === 'solana' ? 'active' : ''}`}
            onClick={() => setChainType('solana')}
          >
            Solana
          </div>
        </div>
        
        <div className="action-panel">
          {!connected ? (
            <button 
              onClick={connectWallet} 
              disabled={!wallet || isLoading.connect}
              className={isLoading.connect ? 'loading' : ''}
            >
              {isLoading.connect ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <button onClick={disconnect}>
              Disconnect
            </button>
          )}
          
          <button 
            onClick={sendTransaction} 
            disabled={!wallet || !connected || isLoading.transaction}
            className={isLoading.transaction ? 'loading' : ''}
          >
            {isLoading.transaction ? 'Sending...' : 'Send Test Transaction'}
          </button>
          
          <button 
            onClick={signMessage} 
            disabled={!wallet || !connected || isLoading.sign}
            className={isLoading.sign ? 'loading' : ''}
          >
            {isLoading.sign ? 'Signing...' : 'Sign Message'}
          </button>
        </div>
        
        {success.connect && !txHash && !signature && (
          <div className="success-notice">
            Successfully connected to GearMask wallet!
          </div>
        )}
        
        {txHash && (
          <div className="info-section">
            <strong>Transaction Hash:</strong>
            <code>{txHash}</code>
            {success.transaction && (
              <div className="success-notice">
                Transaction sent successfully!
              </div>
            )}
          </div>
        )}
        
        {signature && (
          <div className="info-section">
            <strong>Message Signature:</strong>
            <code>{signature}</code>
            {success.sign && (
              <div className="success-notice">
                Message signed successfully!
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="card">
        <h2>Integration Guide</h2>
        <p>Use the following code to integrate with GearMask in your React app:</p>
        
        <pre>
          <code>
{`// Check for wallet
const wallet = window.GearMaskWallet || window.ethereum;

// Connect to wallet
async function connect() {
  // EIP-1193 way (recommended)
  const accounts = await wallet.request({ method: 'eth_requestAccounts' });
  const account = accounts[0];
  
  // Or for Solana:
  const solAccount = await wallet.request({ 
    method: 'sol_requestAccounts',
    params: [{ chain: 'solana' }]
  });
}

// Send a transaction
async function sendTransaction() {
  const result = await wallet.request({
    method: 'eth_sendTransaction',
    params: [{
      to: '0x...',
      value: '0x...',  // hex value
    }]
  });
}`}
          </code>
        </pre>
      </div>
    </div>
  );
}

export default WalletDemo;