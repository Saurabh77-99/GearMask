import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { ethers } from 'ethers';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import { RPC_URLS, DEFAULT_NETWORKS } from '../config';

// Import Buffer explicitly
import { Buffer } from 'buffer';

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

// ✅ Correct Ethereum Wallet Derivation
const deriveEthereumWallet = (seed) => {
  const hdNode = ethers.HDNodeWallet.fromSeed(seed);
  const wallet = hdNode.derivePath("m/44'/60'/0'/0/0");
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
};

// ✅ Correct Solana Wallet Derivation
const deriveSolanaWallet = (seed) => {
  const derivedSeed = Buffer.from(seed).slice(0, 32); // Ensure proper key size
  const keypair = Keypair.fromSeed(derivedSeed);
  
  return {
    address: keypair.publicKey.toString(),
    secretKey: Array.from(keypair.secretKey) // 64-byte array
  };
};

// Wallet creation and management
const createWallet = async (password, sendResponse) => {
  try {
    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic); // Use synchronous method

    // Derive Ethereum and Solana wallets
    const ethWallet = deriveEthereumWallet(seed);
    const solWallet = deriveSolanaWallet(seed);

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

// Import wallet function
const importWallet = async (mnemonic, password, sendResponse) => {
  try {
    const seed = mnemonicToSeedSync(mnemonic);

    // Derive Ethereum and Solana wallets
    const ethWallet = deriveEthereumWallet(seed);
    const solWallet = deriveSolanaWallet(seed);

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

// Unlock wallet
const unlockWallet = async (password, sendResponse) => {
  try {
    chrome.storage.local.get(['encryptedWallet'], (result) => {
      if (!result.encryptedWallet) {
        sendResponse({ success: false, error: 'No wallet found' });
        return;
      }

      try {
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

// Get wallet accounts
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

    default:
      return false;
  }
});
