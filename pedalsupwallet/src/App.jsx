import React from 'react';
import { PedalsUpProvider, ConnectButton, AccountInfo } from './index';

function App() {
  return (
    <PedalsUpProvider>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>PedalsUp Wallet Demo</h1>
        <ConnectButton onSuccess={() => console.log("Connected successfully")} />
        <AccountInfo showBalance={true} />
        
        <div style={{ marginTop: '30px' }}>
          <h2>About PedalsUp Wallet</h2>
          <p>This is a demo of the PedalsUp Wallet integration. The wallet supports multiple blockchain networks including Ethereum and Solana.</p>
          <p>To use this demo, you need to have the PedalsUp Wallet extension installed in your browser.</p>
        </div>
      </div>
    </PedalsUpProvider>
  );
}

export default App;