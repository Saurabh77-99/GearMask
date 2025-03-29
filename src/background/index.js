import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { JsonRpcProvider, formatEther, formatUnits, parseEther, Wallet } from 'ethers';
import { HDNodeWallet } from 'ethers';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import { RPC_URLS, DEFAULT_NETWORKS, NETWORKS, BACKUP_RPC_URLS } from '../config';

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
const getTransactions = async (sendResponse) => {
  try {
    if (!state.isUnlocked) {
      sendResponse({ success: false, error: 'Wallet is locked' });
      return;
    }

    // For now, return empty transactions until we implement actual blockchain queries
    sendResponse({
      success: true,
      transactions: {
        ethereum: [],
        solana: []
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
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
        value: parseEther(transaction.value || '0'),
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

    // Make sure we have a provider for this chain
    if (!providers[transaction.chain]) {
      const success = updateProvider(transaction.chain, transaction.network);
      if (!success) {
        sendResponse({ 
          success: false, 
          error: `Could not connect to ${transaction.chain} network` 
        });
        return;
      }
    }

    if (transaction.chain === 'ethereum') {
      const wallet = new Wallet(state.accounts.ethereum.privateKey, providers.ethereum);
      
      // Get current gas price if not provided
      let gasPrice = transaction.gasPrice;
      if (!gasPrice) {
        const feeData = await providers.ethereum.getFeeData();
        gasPrice = feeData.gasPrice.toString();
      }
      
      const tx = {
        to: transaction.to,
        value: parseEther(transaction.value),
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

// Message listener
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
      getTransactions(sendResponse);
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
      sendTransaction(message.transaction, sendResponse);
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

    default:
      console.warn('Unknown message type:', message.type);
      return false;
  }
});

// Log that the service worker has been initialized
console.log('Smart Wallet background script initialized');
// import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
// import { JsonRpcProvider } from 'ethers';
// import { Connection, PublicKey, Keypair } from '@solana/web3.js';
// import CryptoJS from 'crypto-js';
// import { RPC_URLS, DEFAULT_NETWORKS, NETWORKS, BACKUP_RPC_URLS } from '../config';

// // Import Buffer explicitly
// import { Buffer } from 'buffer';

// // Initialize state
// let state = {
//   wallet: null,
//   activeNetwork: 'ethereum',
//   activeChain: DEFAULT_NETWORKS.ethereum,
//   accounts: {
//     ethereum: { address: '', privateKey: '' },
//     solana: { address: '', secretKey: null }
//   },
//   pendingTransaction: null,
//   isUnlocked: false
// };

// // Initialize providers
// const getProvider = (chain, network = 'sepolia') => {
//   if (chain === 'ethereum') {
//     const networkConfig = NETWORKS[chain][network];
//     if (!networkConfig || !networkConfig.rpcUrl) {
//       throw new Error('Invalid network configuration');
//     }
//     // Try primary RPC first
//     try {
//       return new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
//     } catch (error) {
//       // If primary fails, try backup RPCs
//       const backupUrls = BACKUP_RPC_URLS.ethereum[network] || [];
//       for (const backupUrl of backupUrls) {
//         try {
//           return new ethers.providers.JsonRpcProvider(backupUrl);
//         } catch (e) {
//           continue;
//         }
//       }
//       throw new Error('Failed to connect to any RPC endpoint');
//     }
//   } else if (chain === 'solana') {
//     const networkConfig = NETWORKS.solana[network || DEFAULT_NETWORKS.solana];
//     return new Connection(networkConfig.endpoint);
//   }
//   throw new Error('Unsupported chain');
// };

// // Initialize providers with error handling
// const initializeProviders = () => {
//   try {
//     providers = {
//       ethereum: getProvider('ethereum', DEFAULT_NETWORKS.ethereum),
//       solana: getProvider('solana', DEFAULT_NETWORKS.solana)
//     };
//   } catch (error) {
//     console.error('Failed to initialize providers:', error);
//     // Set providers to null to indicate initialization failure
//     providers = {
//       ethereum: null,
//       solana: null
//     };
//   }
// };

// // Update provider for a specific chain with error handling
// const updateProvider = (chain, network) => {
//   try {
//     providers[chain] = getProvider(chain, network);
//     return true;
//   } catch (error) {
//     console.error(`Failed to update provider for ${chain}:${network}:`, error);
//     return false;
//   }
// };

// // Initialize providers on startup
// initializeProviders();

// // Utility functions
// const encryptData = (data, password) => {
//   return CryptoJS.AES.encrypt(JSON.stringify(data), password).toString();
// };

// const decryptData = (encryptedData, password) => {
//   try {
//     const bytes = CryptoJS.AES.decrypt(encryptedData, password);
//     return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
//   } catch (error) {
//     throw new Error('Incorrect password or corrupted data');
//   }
// };

// // ✅ Correct Ethereum Wallet Derivation
// const deriveEthereumWallet = (seed) => {
//   const hdNode = ethers.HDNodeWallet.fromSeed(seed);
//   const wallet = hdNode.derivePath("m/44'/60'/0'/0/0");
//   return {
//     address: wallet.address,
//     privateKey: wallet.privateKey
//   };
// };

// // ✅ Correct Solana Wallet Derivation
// const deriveSolanaWallet = (seed) => {
//   const derivedSeed = Buffer.from(seed).slice(0, 32); // Ensure proper key size
//   const keypair = Keypair.fromSeed(derivedSeed);
  
//   return {
//     address: keypair.publicKey.toString(),
//     secretKey: Array.from(keypair.secretKey) // 64-byte array
//   };
// };

// // Wallet creation and management
// const createWallet = async (password, mnemonic, sendResponse) => {
//   try {
//     const seed = mnemonicToSeedSync(mnemonic);

//     // Derive Ethereum and Solana wallets
//     const ethWallet = deriveEthereumWallet(seed);
//     const solWallet = deriveSolanaWallet(seed);

//     // Update state
//     state.accounts = {
//       ethereum: ethWallet,
//       solana: solWallet
//     };

//     // Encrypt wallet data for storage
//     const encryptedWallet = encryptData({
//       mnemonic,
//       accounts: state.accounts
//     }, password);

//     // Store encrypted wallet
//     chrome.storage.local.set({ encryptedWallet }, () => {
//       if (chrome.runtime.lastError) {
//         sendResponse({ success: false, error: chrome.runtime.lastError.message });
//       } else {
//         state.isUnlocked = true;
//         sendResponse({ 
//           success: true, 
//           wallet: {
//             ethereum: { address: ethWallet.address },
//             solana: { address: solWallet.address }
//           }
//         });
//       }
//     });
//   } catch (error) {
//     sendResponse({ success: false, error: error.message });
//   }
// };

// // Import wallet function
// const importWallet = async (mnemonic, password, sendResponse) => {
//   try {
//     const seed = mnemonicToSeedSync(mnemonic);

//     // Derive Ethereum and Solana wallets
//     const ethWallet = deriveEthereumWallet(seed);
//     const solWallet = deriveSolanaWallet(seed);

//     // Update state
//     state.accounts = {
//       ethereum: ethWallet,
//       solana: solWallet
//     };

//     // Encrypt wallet data for storage
//     const encryptedWallet = encryptData({
//       mnemonic,
//       accounts: state.accounts
//     }, password);

//     // Store encrypted wallet
//     chrome.storage.local.set({ encryptedWallet }, () => {
//       state.isUnlocked = true;
//       sendResponse({ success: true });
//     });
//   } catch (error) {
//     sendResponse({ success: false, error: error.message });
//   }
// };

// // Unlock wallet
// const unlockWallet = async (password, sendResponse) => {
//   try {
//     chrome.storage.local.get(['encryptedWallet'], (result) => {
//       if (!result.encryptedWallet) {
//         sendResponse({ success: false, error: 'No wallet found' });
//         return;
//       }

//       try {
//         const walletData = decryptData(result.encryptedWallet, password);

//         // Update state
//         state.accounts = walletData.accounts;
//         state.isUnlocked = true;

//         sendResponse({ success: true });
//       } catch (error) {
//         sendResponse({ success: false, error: error.message });
//       }
//     });
//   } catch (error) {
//     sendResponse({ success: false, error: error.message });
//   }
// };

// // Get wallet accounts with balances
// const getAccounts = async (sendResponse) => {
//   if (!state.isUnlocked) {
//     sendResponse({ success: false, error: 'Wallet is locked' });
//     return;
//   }

//   try {
//     // Get Ethereum balance
//     const ethBalance = await providers.ethereum.getBalance(state.accounts.ethereum.address);
//     const formattedEthBalance = ethers.formatEther(ethBalance);

//     // Get Solana balance
//     const solBalance = await providers.solana.getBalance(new PublicKey(state.accounts.solana.address));
//     const formattedSolBalance = (solBalance / 1e9).toString();

//     sendResponse({
//       success: true,
//       accounts: {
//         ethereum: { 
//           address: state.accounts.ethereum.address, 
//           balance: formattedEthBalance 
//         },
//         solana: { 
//           address: state.accounts.solana.address, 
//           balance: formattedSolBalance 
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Error getting account balances:', error);
//     sendResponse({
//       success: true,
//       accounts: {
//         ethereum: { address: state.accounts.ethereum.address, balance: '0' },
//         solana: { address: state.accounts.solana.address, balance: '0' }
//       }
//     });
//   }
// };

// // Get transactions for an account
// const getTransactions = async (sendResponse) => {
//   try {
//     if (!state.isUnlocked) {
//       sendResponse({ success: false, error: 'Wallet is locked' });
//       return;
//     }

//     // For now, return empty transactions until we implement actual blockchain queries
//     sendResponse({
//       success: true,
//       transactions: {
//         ethereum: [],
//         solana: []
//       }
//     });
//   } catch (error) {
//     sendResponse({ success: false, error: error.message });
//   }
// };

// // Get native token balance
// const getNativeBalance = async (chain, network) => {
//   try {
//     if (chain === 'ethereum') {
//       const provider = getProvider(chain, network);
//       const balance = await provider.getBalance(state.accounts.ethereum.address);
//       return ethers.formatEther(balance);
//     } else if (chain === 'solana') {
//       // Implement Solana balance check here
//       return '0';
//     }
//     return '0';
//   } catch (error) {
//     console.error('Error getting native balance:', error);
//     return '0';
//   }
// };

// // Get current gas price
// const getGasPrice = async (chain, network) => {
//   try {
//     if (chain === 'ethereum') {
//       const provider = getProvider(chain, network);
//       const gasPrice = await provider.getGasPrice();
//       return ethers.formatUnits(gasPrice, 'gwei');
//     }
//     return '0';
//   } catch (error) {
//     console.error('Error getting gas price:', error);
//     return '0';
//   }
// };

// // Estimate transaction gas
// const estimateTransactionGas = async (chain, network, transaction) => {
//   try {
//     if (chain === 'ethereum') {
//       const provider = getProvider(chain, network);
//       const gasEstimate = await provider.estimateGas({
//         to: transaction.to,
//         value: ethers.parseEther(transaction.value || '0'),
//         from: state.accounts.ethereum.address
//       });
//       return gasEstimate.toString();
//     }
//     return '21000'; // Default gas limit for ETH transfers
//   } catch (error) {
//     console.error('Error estimating gas:', error);
//     return '21000';
//   }
// };

// // Send Transaction with network selection
// const sendTransaction = async (transaction, sendResponse) => {
//   try {
//     if (!state.isUnlocked) {
//       sendResponse({ success: false, error: 'Wallet is locked' });
//       return;
//     }

//     if (transaction.chain === 'ethereum') {
//       const provider = getProvider(transaction.chain, transaction.network);
//       const wallet = new ethers.Wallet(state.accounts.ethereum.privateKey, provider);
      
//       // Get current gas price if not provided
//       let gasPrice = transaction.gasPrice;
//       if (!gasPrice) {
//         const currentGasPrice = await provider.getGasPrice();
//         gasPrice = currentGasPrice.toString();
//       }
      
//       const tx = {
//         to: transaction.to,
//         value: ethers.parseEther(transaction.value),
//         gasLimit: transaction.gasLimit || '21000', // Default gas limit for ETH transfers
//         gasPrice: gasPrice,
//         nonce: await provider.getTransactionCount(wallet.address, 'latest'),
//         chainId: parseInt(NETWORKS.ethereum[transaction.network || 'sepolia'].chainId)
//       };

//       const txResponse = await wallet.sendTransaction(tx);
//       const receipt = await txResponse.wait(1); // Wait for 1 confirmation
      
//       sendResponse({
//         success: true,
//         hash: receipt.hash,
//         blockNumber: receipt.blockNumber,
//         network: transaction.network || 'sepolia'
//       });
//     } else if (transaction.chain === 'solana') {
//       sendResponse({ success: false, error: 'Solana transactions not yet implemented' });
//     }
//   } catch (error) {
//     console.error('Transaction error:', error);
//     sendResponse({ 
//       success: false, 
//       error: error.message || 'Failed to send transaction' 
//     });
//   }
// };

// // Message listener
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   switch (message.type) {
//     case 'GENERATE_MNEMONIC':
//       try {
//         const mnemonic = generateMnemonic();
//         sendResponse({ success: true, mnemonic });
//       } catch (error) {
//         sendResponse({ success: false, error: error.message });
//       }
//       return true;

//     case 'CHECK_WALLET_STATUS':
//       chrome.storage.local.get(['encryptedWallet'], (result) => {
//         sendResponse({
//           success: true,
//           hasWallet: !!result.encryptedWallet,
//           isUnlocked: state.isUnlocked
//         });
//       });
//       return true;

//     case 'CREATE_WALLET':
//       createWallet(message.password, message.mnemonic, sendResponse);
//       return true;

//     case 'IMPORT_WALLET':
//       importWallet(message.mnemonic, message.password, sendResponse);
//       return true;

//     case 'UNLOCK_WALLET':
//       unlockWallet(message.password, sendResponse);
//       return true;

//     case 'GET_ACCOUNTS':
//       getAccounts(sendResponse);
//       return true;

//     case 'GET_TOKENS':
//       (async () => {
//         if (!state.isUnlocked) {
//           sendResponse({ success: false, error: 'Wallet is locked' });
//           return;
//         }
//         try {
//           const nativeBalance = await getNativeBalance(message.chain, message.network);
//           const networkData = NETWORKS[message.chain][message.network || DEFAULT_NETWORKS[message.chain]];
//           const nativeToken = {
//             address: '0x0000000000000000000000000000000000000000',
//             symbol: networkData.symbol,
//             name: networkData.name,
//             decimals: message.chain === 'ethereum' ? 18 : 9,
//             balance: nativeBalance,
//             isNative: true
//           };
          
//           sendResponse({
//             success: true,
//             tokens: [nativeToken]
//           });
//         } catch (error) {
//           sendResponse({ success: false, error: error.message });
//         }
//       })();
//       return true;

//     case 'GET_GAS_PRICE':
//       (async () => {
//         if (!state.isUnlocked) {
//           sendResponse({ success: false, error: 'Wallet is locked' });
//           return;
//         }
//         try {
//           const gasPrice = await getGasPrice(message.chain, message.network);
//           sendResponse({
//             success: true,
//             gasPrice
//           });
//         } catch (error) {
//           sendResponse({ success: false, error: error.message });
//         }
//       })();
//       return true;

//     case 'GET_TRANSACTIONS':
//       getTransactions(sendResponse);
//       return true;

//     case 'ESTIMATE_TRANSACTION':
//       (async () => {
//         if (!state.isUnlocked) {
//           sendResponse({ success: false, error: 'Wallet is locked' });
//           return;
//         }
//         try {
//           const estimatedGas = await estimateTransactionGas(
//             message.chain,
//             message.network,
//             message.transaction
//           );
//           const gasPrice = await getGasPrice(message.chain, message.network);
//           sendResponse({
//             success: true,
//             estimatedGas,
//             gasPrice
//           });
//         } catch (error) {
//           sendResponse({ success: false, error: error.message });
//         }
//       })();
//       return true;

//     case 'SEND_TRANSACTION':
//       sendTransaction(message.transaction, sendResponse);
//       return true;

//     default:
//       return false;
//   }
// });
