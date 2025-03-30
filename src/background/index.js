import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { JsonRpcProvider, formatEther, formatUnits, parseEther, Wallet } from 'ethers';
import { HDNodeWallet, ethers } from 'ethers';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import { RPC_URLS, DEFAULT_NETWORKS, NETWORKS, BACKUP_RPC_URLS } from '../config';

// Import Buffer explicitly
import { Buffer } from 'buffer';
let currentPopup = null;
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
  isUnlocked: false,
  connectedSites: {} // Track connected sites/dApps
};

// Track pending connection and transaction requests
let pendingRequests = {};

// Initialize providers object first
let providers = {
  ethereum: null,
  solana: null
};

// Initialize providers
const getProvider = (chain, network = 'sepolia') => {
  if (chain === 'ethereum') {
    const networkConfig = NETWORKS[chain][network];
    if (!networkConfig || !networkConfig.rpcUrl) {
      console.error(`Invalid network configuration for ${chain}:${network}`);
      return null;
    }
    
    try {
      return new JsonRpcProvider(networkConfig.rpcUrl);
    } catch (error) {
      console.error(`Failed to connect to primary RPC for ${network}:`, error);
      
      // Try backup RPCs
      const backupUrls = BACKUP_RPC_URLS?.ethereum?.[network] || [];
      for (const backupUrl of backupUrls) {
        try {
          return new JsonRpcProvider(backupUrl);
        } catch (e) {
          console.error(`Failed to connect to backup RPC ${backupUrl}:`, e);
          continue;
        }
      }
      
      console.error('All RPC connections failed');
      return null;
    }
  } else if (chain === 'solana') {
    try {
      const networkConfig = NETWORKS.solana[network || DEFAULT_NETWORKS.solana];
      return new Connection(networkConfig.endpoint);
    } catch (error) {
      console.error(`Failed to connect to Solana endpoint:`, error);
      return null;
    }
  }
  
  console.error('Unsupported chain:', chain);
  return null;
};

const createPopup = async (route, data = {}, windowWidth = 400, windowHeight = 600) => {
  // Close existing popup if any
  if (currentPopup) {
    try {
      await chrome.windows.remove(currentPopup);
    } catch (e) {
      console.error('Error closing existing popup:', e);
    }
  }
  
  // Calculate center position
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const left = Math.round((screenWidth - windowWidth) / 2);
  const top = Math.round((screenHeight - windowHeight) / 2);
  
  // Create new popup
  const popup = await chrome.windows.create({
    url: chrome.runtime.getURL(`popup.html#${route}?${new URLSearchParams(data)}`),
    type: 'popup',
    width: windowWidth,
    height: windowHeight,
    left: left,
    top: top,
    focused: true
  });
  
  currentPopup = popup.id;
  return popup;
};

// Initialize providers with error handling
const initializeProviders = () => {
  try {
    providers = {
      ethereum: getProvider('ethereum', DEFAULT_NETWORKS.ethereum),
      solana: getProvider('solana', DEFAULT_NETWORKS.solana)
    };
    console.log('Providers initialized:', providers);
  } catch (error) {
    console.error('Failed to initialize providers:', error);
    // Set providers to null to indicate initialization failure
    providers = {
      ethereum: null,
      solana: null
    };
  }
};

// Update provider for a specific chain with error handling
const updateProvider = (chain, network) => {
  try {
    providers[chain] = getProvider(chain, network);
    return !!providers[chain]; // Return true if provider was successfully created
  } catch (error) {
    console.error(`Failed to update provider for ${chain}:${network}:`, error);
    return false;
  }
};

// Initialize providers on startup
initializeProviders();

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
  const hdNode = HDNodeWallet.fromSeed(seed);
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
const createWallet = async (password, mnemonic, sendResponse) => {
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
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        state.isUnlocked = true;
        sendResponse({ 
          success: true, 
          wallet: {
            ethereum: { address: ethWallet.address },
            solana: { address: solWallet.address }
          }
        });
      }
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
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
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        state.isUnlocked = true;
        sendResponse({ success: true });
      }
    });
  } catch (error) {
    console.error('Error importing wallet:', error);
    sendResponse({ success: false, error: error.message });
  }
};

// Unlock wallet
const unlockWallet = async (password, sendResponse) => {
  try {
    chrome.storage.local.get(['encryptedWallet', 'connectedSites'], (result) => {
      if (!result.encryptedWallet) {
        sendResponse({ success: false, error: 'No wallet found' });
        return;
      }

      try {
        const walletData = decryptData(result.encryptedWallet, password);

        // Update state
        state.accounts = walletData.accounts;
        state.isUnlocked = true;
        
        // Restore connected sites if available
        if (result.connectedSites) {
          state.connectedSites = result.connectedSites;
        }

        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
  } catch (error) {
    console.error('Error unlocking wallet:', error);
    sendResponse({ success: false, error: error.message });
  }
};

// Get wallet accounts with balances
const getAccounts = async (sendResponse) => {
  if (!state.isUnlocked) {
    sendResponse({ success: false, error: 'Wallet is locked' });
    return;
  }

  try {
    let ethBalance = '0';
    let solBalance = '0';
    
    // Check if ethereum provider is available
    if (providers.ethereum) {
      try {
        const balance = await providers.ethereum.getBalance(state.accounts.ethereum.address);
        ethBalance = formatEther(balance);
      } catch (error) {
        console.error('Error getting Ethereum balance:', error);
      }
    }
    
    // Check if solana provider is available
    if (providers.solana) {
      try {
        const balance = await providers.solana.getBalance(
          new PublicKey(state.accounts.solana.address)
        );
        solBalance = (balance / 1e9).toString();
      } catch (error) {
        console.error('Error getting Solana balance:', error);
      }
    }

    sendResponse({
      success: true,
      accounts: {
        ethereum: { 
          address: state.accounts.ethereum.address, 
          balance: ethBalance 
        },
        solana: { 
          address: state.accounts.solana.address, 
          balance: solBalance 
        }
      }
    });
  } catch (error) {
    console.error('Error getting account balances:', error);
    sendResponse({
      success: true,
      accounts: {
        ethereum: { address: state.accounts.ethereum.address, balance: '0' },
        solana: { address: state.accounts.solana.address, balance: '0' }
      }
    });
  }
};

// Get transactions for an account
const getTransactions = async (sendResponse, chain, network) => {
  try {
    if (!state.isUnlocked) {
      sendResponse({ success: false, error: 'Wallet is locked' });
      return;
    }

    if (chain === 'ethereum') {
      const provider = getProvider(chain, network || 'sepolia');
      const address = state.accounts.ethereum.address;
      
      // Fetch the latest transactions from Etherscan or a similar API
      // You may need to use the Etherscan API with your API key
      try {
        const response = await fetch(`https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEYS.etherscan}`);
        const data = await response.json();
        
        if (data.status === '1') {
          // Format transactions for your UI
          const transactions = data.result.slice(0, 10).map(tx => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: ethers.formatEther(tx.value),
            timestamp: parseInt(tx.timeStamp) * 1000,
            isIncoming: tx.to.toLowerCase() === address.toLowerCase(),
            status: tx.isError === '0' ? 'success' : 'failed'
          }));
          
          sendResponse({
            success: true,
            transactions: transactions
          });
        } else {
          // If no transactions or API error
          sendResponse({
            success: true,
            transactions: []
          });
        }
      } catch (error) {
        console.error('Error fetching Ethereum transactions:', error);
        sendResponse({
          success: true,
          transactions: []
        });
      }
    } else if (chain === 'solana') {
      // Implement Solana transaction history logic
      sendResponse({ success: true, transactions: [] });
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    sendResponse({ success: false, error: error.message });
  }
};

// Get native token balance
const getNativeBalance = async (chain, network) => {
  try {
    // Make sure we have a provider for this chain
    if (!providers[chain]) {
      const success = updateProvider(chain, network);
      if (!success) {
        console.error(`Could not get provider for ${chain}:${network}`);
        return '0';
      }
    }
    
    if (chain === 'ethereum') {
      const balance = await providers.ethereum.getBalance(state.accounts.ethereum.address);
      return formatEther(balance);
    } else if (chain === 'solana') {
      const balance = await providers.solana.getBalance(
        new PublicKey(state.accounts.solana.address)
      );
      return (balance / 1e9).toString();
    }
    return '0';
  } catch (error) {
    console.error('Error getting native balance:', error);
    return '0';
  }
};

// Get current gas price
const getGasPrice = async (chain, network) => {
  try {
    // Make sure we have a provider for this chain
    if (!providers[chain]) {
      const success = updateProvider(chain, network);
      if (!success) {
        console.error(`Could not get provider for ${chain}:${network}`);
        return '0';
      }
    }
    
    if (chain === 'ethereum') {
      const feeData = await providers.ethereum.getFeeData();
      if (feeData.gasPrice) {
        return formatUnits(feeData.gasPrice, 'gwei');
      }
    }
    return '0';
  } catch (error) {
    console.error('Error getting gas price:', error);
    return '0';
  }
};

// Estimate transaction gas
const estimateTransactionGas = async (chain, network, transaction) => {
  try {
    // Make sure we have a provider for this chain
    if (!providers[chain]) {
      const success = updateProvider(chain, network);
      if (!success) {
        console.error(`Could not get provider for ${chain}:${network}`);
        return '21000';
      }
    }
    
    if (chain === 'ethereum') {
      const gasEstimate = await providers.ethereum.estimateGas({
        to: transaction.to,
        value: ethers.parseEther(transaction.value || '0'),
        from: state.accounts.ethereum.address
      });
      return gasEstimate.toString();
    }
    return '21000'; // Default gas limit for ETH transfers
  } catch (error) {
    console.error('Error estimating gas:', error);
    return '21000';
  }
};

// Send Transaction with network selection
const sendTransaction = async (transaction, sendResponse) => {
  try {
    if (!state.isUnlocked) {
      sendResponse({ success: false, error: 'Wallet is locked' });
      return;
    }
    
    let gasPrice;
    if (transaction.gasPrice) {
      // Convert from gwei (decimal) to wei (BigInt)
      gasPrice = ethers.parseUnits(transaction.gasPrice.toString(), 'gwei');
    } else {
      // Get current gas price if not provided
      gasPrice = await providers[transaction.chain].getGasPrice();
    }

    if (transaction.chain === 'ethereum') {
      const wallet = new Wallet(state.accounts.ethereum.privateKey, providers.ethereum);
      
      const tx = {
        to: transaction.to,
        value: ethers.parseEther(transaction.value),
        gasLimit: transaction.gasLimit || '21000', // Default gas limit for ETH transfers
        gasPrice: gasPrice,
        nonce: await providers.ethereum.getTransactionCount(wallet.address, 'latest'),
        chainId: parseInt(NETWORKS.ethereum[transaction.network || 'sepolia'].chainId)
      };

      const txResponse = await wallet.sendTransaction(tx);
      const receipt = await txResponse.wait(1); // Wait for 1 confirmation
      
      sendResponse({
        success: true,
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        network: transaction.network || 'sepolia'
      });
    } else if (transaction.chain === 'solana') {
      sendResponse({ success: false, error: 'Solana transactions not yet implemented' });
    }
  } catch (error) {
    console.error('Transaction error:', error);
    sendResponse({ 
      success: false, 
      error: error.message || 'Failed to send transaction' 
    });
  }
};

const handleConnectionRequest = (origin, sendResponse) => {
  if (!state.isUnlocked) {
    sendResponse({ success: false, error: 'Wallet is locked' });
    return;
  }
  
  // Check if this site is already connected
  if (state.connectedSites[origin]) {
    sendResponse({
      success: true,
      accounts: [state.accounts.ethereum.address],
      chainId: NETWORKS.ethereum[state.activeNetwork].chainId
    });
    return;
  }
  
  // Open popup for user approval
  createPopup('/approve-connection', { origin: origin })
    .then(popupWindow => {
      // Store the request details for later use
      pendingRequests[popupWindow.id] = {
        type: 'connect',
        origin: origin,
        sendResponse: sendResponse
      };
    });
};

// Connection approval management
// const handleConnectionRequest = (origin, sendResponse) => {
//   if (!state.isUnlocked) {
//     sendResponse({ success: false, error: 'Wallet is locked' });
//     return;
//   }
  
//   // Check if this site is already connected
//   if (state.connectedSites[origin]) {
//     sendResponse({
//       success: true,
//       accounts: [state.accounts.ethereum.address],
//       chainId: NETWORKS.ethereum[state.activeNetwork].chainId
//     });
//     return;
//   }
  
//   // Open popup for user approval
//   chrome.windows.create({
//     url: chrome.runtime.getURL('popup.html#/approve-connection') + 
//          '?origin=' + encodeURIComponent(origin),
//     type: 'popup',
//     width: 400,
//     height: 600
//   }, function(popupWindow) {
//     // Store the request details for later use
//     pendingRequests[popupWindow.id] = {
//       type: 'connect',
//       origin: origin,
//       sendResponse: sendResponse
//     };
//   });
// };

// Transaction approval management
const handleTransactionRequest = (transaction, origin, sendResponse) => {
  if (!state.isUnlocked) {
    sendResponse({ success: false, error: 'Wallet is locked' });
    return;
  }
  
  // Check if the site is connected
  if (!state.connectedSites[origin]) {
    sendResponse({ success: false, error: 'Site not connected. Please connect first.' });
    return;
  }
  createPopup('/approve-transaction', { 
    origin: origin,
    transaction: JSON.stringify(transaction)
  }).then(popupWindow => {
  // Open popup for transaction approval
  // chrome.windows.create({
  //   url: chrome.runtime.getURL('popup.html#/approve-transaction') + 
  //        '?origin=' + encodeURIComponent(origin),
  //   type: 'popup',
  //   width: 400,
  //   height: 600
  // }, function(popupWindow) {
    // Store transaction details and callback
    pendingRequests[popupWindow.id] = {
      type: 'transaction',
      transaction: transaction,
      origin: origin,
      sendResponse: sendResponse
    };
  });
};

// Save connected sites to storage
const saveConnectedSites = () => {
  chrome.storage.local.set({ connectedSites: state.connectedSites }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving connected sites:', chrome.runtime.lastError);
    }
  });
};

// Message listener for background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message.type);
  
  switch (message.type) {
    case 'GENERATE_MNEMONIC':
      try {
        const mnemonic = generateMnemonic();
        sendResponse({ success: true, mnemonic });
      } catch (error) {
        console.error('Error generating mnemonic:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;

    case 'CHECK_WALLET_STATUS':
      chrome.storage.local.get(['encryptedWallet'], (result) => {
        sendResponse({
          success: true,
          hasWallet: !!result.encryptedWallet,
          isUnlocked: state.isUnlocked
        });
      });
      return true;

    case 'CREATE_WALLET':
      createWallet(message.password, message.mnemonic, sendResponse);
      return true;

    case 'IMPORT_WALLET':
      importWallet(message.mnemonic, message.password, sendResponse);
      return true;

    case 'UNLOCK_WALLET':
      unlockWallet(message.password, sendResponse);
      return true;

    case 'GET_ACCOUNTS':
      getAccounts(sendResponse);
      return true;

    case 'GET_TOKENS':
      (async () => {
        if (!state.isUnlocked) {
          sendResponse({ success: false, error: 'Wallet is locked' });
          return;
        }
        try {
          const nativeBalance = await getNativeBalance(message.chain, message.network);
          const networkData = NETWORKS[message.chain][message.network || DEFAULT_NETWORKS[message.chain]];
          const nativeToken = {
            address: '0x0000000000000000000000000000000000000000',
            symbol: networkData.symbol,
            name: networkData.name,
            decimals: message.chain === 'ethereum' ? 18 : 9,
            balance: nativeBalance,
            isNative: true
          };
          
          sendResponse({
            success: true,
            tokens: [nativeToken]
          });
        } catch (error) {
          console.error('Error getting tokens:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;

    case 'GET_GAS_PRICE':
      (async () => {
        if (!state.isUnlocked) {
          sendResponse({ success: false, error: 'Wallet is locked' });
          return;
        }
        try {
          const gasPrice = await getGasPrice(message.chain, message.network);
          sendResponse({
            success: true,
            gasPrice
          });
        } catch (error) {
          console.error('Error getting gas price:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;

    case 'GET_TRANSACTIONS':
      (async () => {
        await getTransactions(
          sendResponse, 
          message.chain, 
          message.network
        );
      })();
      return true;

    case 'ESTIMATE_TRANSACTION':
      (async () => {
        if (!state.isUnlocked) {
          sendResponse({ success: false, error: 'Wallet is locked' });
          return;
        }
        try {
          const estimatedGas = await estimateTransactionGas(
            message.chain,
            message.network,
            message.transaction
          );
          const gasPrice = await getGasPrice(message.chain, message.network);
          sendResponse({
            success: true,
            estimatedGas,
            gasPrice
          });
        } catch (error) {
          console.error('Error estimating transaction:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;

    case 'SEND_TRANSACTION':
      if (message.origin) {
        // This is a dApp request that needs approval
        handleTransactionRequest(message.transaction, message.origin, sendResponse);
      } else {
        // Direct request from our UI
        sendTransaction(message.transaction, sendResponse);
      }
      return true;

    case 'UPDATE_NETWORK':
      (async () => {
        try {
          const success = updateProvider(message.chain, message.network);
          if (success) {
            state.activeNetwork = message.network;
            state.activeChain = message.chain;
            sendResponse({ success: true });
          } else {
            sendResponse({ 
              success: false, 
              error: `Failed to connect to ${message.chain}:${message.network}` 
            });
          }
        } catch (error) {
          console.error('Error updating network:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;

    // New handlers for connection approval workflow
    case 'CONNECT_REQUEST':
      handleConnectionRequest(message.origin, sendResponse);
      return true;

    case 'CONNECTION_APPROVED':
      const connectRequest = pendingRequests[message.windowId];
      if (connectRequest && connectRequest.type === 'connect') {
        // Add to connected sites
        state.connectedSites[connectRequest.origin] = {
          connectedAt: Date.now(),
          chain: state.activeChain,
          network: state.activeNetwork
        };
        
        // Save to storage
        saveConnectedSites();
        
        // Send approval response
        connectRequest.sendResponse({
          success: true,
          accounts: [state.accounts.ethereum.address],
          chainId: NETWORKS.ethereum[state.activeNetwork].chainId
        });
        
        // Clean up
        delete pendingRequests[message.windowId];
        chrome.windows.remove(message.windowId);
      }
      return true;

    case 'CONNECTION_REJECTED':
      const rejectedRequest = pendingRequests[message.windowId];
      if (rejectedRequest && rejectedRequest.type === 'connect') {
        rejectedRequest.sendResponse({
          success: false,
          error: 'User rejected the request'
        });
        
        // Clean up
        delete pendingRequests[message.windowId];
        chrome.windows.remove(message.windowId);
      }
      return true;

    case 'TRANSACTION_APPROVED':
      const txRequest = pendingRequests[message.windowId];
      if (txRequest && txRequest.type === 'transaction') {
        // Process the approved transaction
        sendTransaction(txRequest.transaction, txRequest.sendResponse);
        
        // Clean up
        delete pendingRequests[message.windowId];
        chrome.windows.remove(message.windowId);
      }
      return true;

    case 'TRANSACTION_REJECTED':
      const rejectedTx = pendingRequests[message.windowId];
      if (rejectedTx && rejectedTx.type === 'transaction') {
        rejectedTx.sendResponse({
          success: false,
          error: 'User rejected the transaction'
        });
        
        // Clean up
        delete pendingRequests[message.windowId];
        chrome.windows.remove(message.windowId);
      }
      return true;

    case 'GET_PENDING_REQUEST':
      // Used by the approval popup to get details about what it's approving
      const windowId = message.windowId;
      if (pendingRequests[windowId]) {
        sendResponse({
          success: true,
          request: pendingRequests[windowId]
        });
      } else {
        sendResponse({
          success: false,
          error: 'No pending request found'
        });
      }
      return true;

    case 'GET_CONNECTED_SITES':
      sendResponse({
        success: true,
        sites: state.connectedSites
      });
      return true;

    case 'DISCONNECT_SITE':
      if (state.connectedSites[message.origin]) {
        delete state.connectedSites[message.origin];
        saveConnectedSites();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Site not connected' });
      }
      return true;

    default:
      console.warn('Unknown message type:', message.type);
      return false;
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (pendingRequests[windowId]) {
    // Handle user closing the popup without responding
    const request = pendingRequests[windowId];
    if (request.sendResponse) {
      request.sendResponse({ 
        success: false, 
        error: 'User rejected the request' 
      });
    }
    delete pendingRequests[windowId];
  }
  
  if (currentPopup === windowId) {
    currentPopup = null;
  }
});
// Log that the service worker has been initialized
console.log('Smart Wallet background script initialized');