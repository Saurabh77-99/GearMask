import { useContext } from 'react';
import { PedalsUpContext } from '../components/PedalsUpProvider';

export const useWallet = () => {
  const context = useContext(PedalsUpContext);
  
  if (context === null) {
    throw new Error('useWallet must be used within a PedalsUpProvider');
  }
  
  return context;
};