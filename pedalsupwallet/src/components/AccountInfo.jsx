import React from 'react';
import { useWallet } from '../hooks/useWallet';

export const AccountInfo = ({ showBalance = false }) => {
  const { isConnected, account, chainId } = useWallet();
  
  if (!isConnected || !account) {
    return <p>Not connected to wallet</p>;
  }
  
  // Format the address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Get network name based on chainId
  const getNetworkName = (id) => {
    switch(id) {
      case '0x1': return 'Ethereum Mainnet';
      case '0xaa36a7': return 'Sepolia Testnet';
      case '0x5': return 'Goerli Testnet';
      case '0x89': return 'Polygon';
      case '0x13881': return 'Mumbai Testnet';
      default: return 'Unknown Network';
    }
  };
  
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '16px'
    }}>
      <h3>Wallet Connected</h3>
      <p><strong>Address:</strong> {formatAddress(account)}</p>
      {chainId && <p><strong>Network:</strong> {getNetworkName(chainId)}</p>}
    </div>
  );
};