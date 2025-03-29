import { generateMnemonic, mnemonicToSeed } from 'bip39';
import { ethers } from 'ethers';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import { RPC_URLS, DEFAULT_NETWORKS } from '../config';

// Initialize state
let state = {
  wallet: null,
  activeNetwork: 'ethereum',
  activeChain: DEFAULT_NETWORKS.ethereum,
  accounts: {
    ethereum: { address: '', privateKey: '' },
    solana: { address: '', secretKey: null }
  },
  pendingTransaction: null,
  isUnlocked: false
};

// Network providers
const providers = {
  ethereum: new ethers.JsonRpcProvider(RPC_URLS.ethereum[DEFAULT_NETWORKS.ethereum]),
  solana: new Connection(RPC_URLS.solana[DEFAULT_NETWORKS.solana])
};

// Utility functions
const encryptData = (data, password) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), password).toString();
};

const decryptData = (encryptedData, password) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    throw new Error('Incorrect password or corrupted data');
  }
};

const deriveEthereumWallet = async (seed) => {
  const hdNode = ethers.HDNodeWallet.fromSeed(seed);
  const wallet = hdNode.derivePath("m/44'/60'/0'/0/0");
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
};

const deriveSolanaWallet = async (seed) => {
  // This is a simplified version - in production, use proper Solana derivation
  const hash = CryptoJS.SHA256(seed.toString('hex'));
  const secretKey = new Uint8Array(32);
  const hashArray = hash.words;
  
  for (let i = 0; i < 8; i++) {
    const word = hashArray[i];
    secretKey[i * 4] = (word >> 24) & 0xff;
    secretKey[i * 4 + 1] = (word >> 16) & 0xff;
    secretKey[i * 4 + 2] = (word >> 8) & 0xff;
    secretKey[i * 4 + 3] = word & 0xff;
  }
  
  const keypair = Keypair.fromSecretKey(secretKey);
  return {
    address: keypair.publicKey.toString(),
    secretKey: Array.from(keypair.secretKey)
  };
};

// Wallet creation and management
const createWallet = async (password, sendResponse) => {
  try {
    const mnemonic = generateMnemonic();
    const seed = await mnemonicToSeed(mnemonic);
    
    // Derive Ethereum wallet
    const ethWallet = await deriveEthereumWallet(seed);
    
    // Derive Solana wallet
    const solWallet = await deriveSolanaWallet(seed);
    
    // Update state
    state.accounts = {
      ethereum: ethWallet,
      solana: solWallet
    };
    
    // Encrypt wallet data for storage
    const encryptedWallet = encryptData({
      mnemonic,
      accounts: state.accounts
    }, password);
    
    // Store encrypted wallet
    chrome.storage.local.set({ encryptedWallet }, () => {
      state.isUnlocked = true;
      sendResponse({ success: true, mnemonic });
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
};

const importWallet = async (mnemonic, password, sendResponse) => {
  try {
    const seed = await mnemonicToSeed(mnemonic);
    
    // Derive Ethereum wallet
    const ethWallet = await deriveEthereumWallet(seed);
    
    // Derive Solana wallet
    const solWallet = await deriveSolanaWallet(seed);
    
    // Update state
    state.accounts = {
      ethereum: ethWallet,
      solana: solWallet
    };
    
    // Encrypt wallet data for storage
    const encryptedWallet = encryptData({
      mnemonic,
      accounts: state.accounts
    }, password);
    
    // Store encrypted wallet
    chrome.storage.local.set({ encryptedWallet }, () => {
      state.isUnlocked = true;
      sendResponse({ success: true });
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
};

const unlockWallet = async (password, sendResponse) => {
  try {
    // Get encrypted wallet from storage
    chrome.storage.local.get(['encryptedWallet'], (result) => {
      if (!result.encryptedWallet) {
        sendResponse({ success: false, error: 'No wallet found' });
        return;
      }
      
      try {
        // Decrypt wallet data
        const walletData = decryptData(result.encryptedWallet, password);
        
        // Update state
        state.accounts = walletData.accounts;
        state.isUnlocked = true;
        
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
};

const getAccounts = (sendResponse) => {
  if (!state.isUnlocked) {
    sendResponse({ success: false, error: 'Wallet is locked' });
    return;
  }
  
  sendResponse({
    success: true,
    accounts: {
      ethereum: { address: state.accounts.ethereum.address, balance: '0' },
      solana: { address: state.accounts.solana.address, balance: '0' }
    }
  });
};

const getBalance = async (network, sendResponse) => {
  if (!state.isUnlocked) {
    sendResponse({ success: false, error: 'Wallet is locked' });
    return;
  }
  
  try {
    let balance = '0';
    
    if (network === 'ethereum') {
      const address = state.accounts.ethereum.address;
      const ethBalance = await providers.ethereum.getBalance(address);
      balance = ethers.formatEther(ethBalance);
    } else if (network === 'solana') {
      const address = state.accounts.solana.address;
      const solBalance = await providers.solana.getBalance(new PublicKey(address));
      balance = (solBalance / 1e9).toString();
    }
    
    sendResponse({ success: true, balance });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
};

const switchNetwork = async (network, chain, sendResponse) => {
  try {
    if (network === 'ethereum') {
      providers.ethereum = new ethers.JsonRpcProvider(RPC_URLS.ethereum[chain]);
    } else if (network === 'solana') {
      providers.solana = new Connection(RPC_URLS.solana[chain]);
    }
    
    state.activeNetwork = network;
    state.activeChain = chain;
    
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
};

const signTransaction = async (transaction, sendResponse) => {
  if (!state.isUnlocked) {
    sendResponse({ success: false, error: 'Wallet is locked' });
    return;
  }
  
  try {
    state.pendingTransaction = transaction;
    
    // Notify popup to show transaction approval
    chrome.runtime.sendMessage({ type: 'TRANSACTION_REQUEST' });
    
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
};

const getPendingTransaction = (sendResponse) => {
  sendResponse({
    success: true,
    transaction: state.pendingTransaction
  });
};

const approveTransaction = async (sendResponse) => {
  if (!state.isUnlocked) {
    sendResponse({ success: false, error: 'Wallet is locked' });
    return;
  }
  
  if (!state.pendingTransaction) {
    sendResponse({ success: false, error: 'No pending transaction' });
    return;
  }
  
  try {
    const tx = state.pendingTransaction;
    let result;
    
    if (tx.network === 'ethereum') {
      // Create transaction for Ethereum
      const wallet = new ethers.Wallet(state.accounts.ethereum.privateKey, providers.ethereum);
      const txResponse = await wallet.sendTransaction({
        to: tx.to,
        value: ethers.parseEther(tx.value.toString())
      });
      result = txResponse.hash;
    } else if (tx.network === 'solana') {
      // For Solana, we'd implement transaction building and signing here
      // This is a simplified example
      result = 'solana-tx-hash';
    }
    
    // Clear pending transaction
    state.pendingTransaction = null;
    
    sendResponse({ success: true, result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
};

const rejectTransaction = (sendResponse) => {
  state.pendingTransaction = null;
  sendResponse({ success: true });
};

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'CREATE_WALLET':
      createWallet(message.password, sendResponse);
      return true;
      
    case 'IMPORT_WALLET':
      importWallet(message.mnemonic, message.password, sendResponse);
      return true;
      
    case 'UNLOCK_WALLET':
      unlockWallet(message.password, sendResponse);
      return true;
      
    case 'GET_ACCOUNTS':
      getAccounts(sendResponse);
      return false;
      
    case 'GET_BALANCE':
      getBalance(message.network, sendResponse);
      return true;
      
    case 'SWITCH_NETWORK':
      switchNetwork(message.network, message.chain, sendResponse);
      return false;
      
    case 'SIGN_TRANSACTION':
      signTransaction(message.transaction, sendResponse);
      return true;
      
    case 'GET_PENDING_TRANSACTION':
      getPendingTransaction(sendResponse);
      return false;
      
    case 'APPROVE_TRANSACTION':
      approveTransaction(sendResponse);
      return true;
      
    case 'REJECT_TRANSACTION':
      rejectTransaction(sendResponse);
      return false;
      
    default:
      return false;
  }
});