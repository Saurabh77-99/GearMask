import React from 'react';
import { useWallet } from '../hooks/useWallet';

export const ConnectButton = ({ 
  onSuccess, 
  onError, 
  className = '', 
  children = null 
}) => {
  const { isInstalled, isConnected, connect, disconnect } = useWallet();
  
  const handleClick = async () => {
    try {
      if (isConnected) {
        const success = await disconnect();
        if (success && onSuccess) {
          onSuccess();
        }
      } else {
        const success = await connect();
        if (success && onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error("Button error:", err);
      if (onError) {
        onError(err);
      }
    }
  };
  
  return (
    <button 
      className={className} 
      onClick={handleClick}
      style={{
        padding: '10px 16px',
        backgroundColor: isConnected ? '#f44336' : '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      {children || (isConnected ? 'Disconnect' : 'Connect Wallet')}
    </button>
  );
};