// Network configurations
export const NETWORKS = {
  ethereum: {
    mainnet: {
      name: 'Ethereum Mainnet',
      symbol: 'ETH',
      chainId: '1',
      rpcUrl: process.env.ETHEREUM_MAINNET_RPC || 'https://eth-mainnet.g.alchemy.com/v2/demo',
      blockExplorer: 'https://etherscan.io'
    },
    sepolia: {
      name: 'Sepolia Testnet',
      symbol: 'ETH',
      chainId: '11155111',
      rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo',
      blockExplorer: 'https://sepolia.etherscan.io'
    }
  },
  solana: {
    mainnet: {
      name: 'Solana Mainnet',
      symbol: 'SOL',
      rpcUrl: process.env.SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com',
      blockExplorer: 'https://explorer.solana.com'
    },
    testnet: {
      name: 'Solana Testnet',
      symbol: 'SOL',
      rpcUrl: process.env.SOLANA_TESTNET_RPC || 'https://api.testnet.solana.com',
      blockExplorer: 'https://explorer.solana.com/?cluster=testnet'
    }
  }
};

// Default networks for each chain
export const DEFAULT_NETWORKS = {
  ethereum: 'sepolia',  // Set default to Sepolia for development
  solana: 'testnet'
};

// API keys from environment variables
export const API_KEYS = {
  alchemy: process.env.ALCHEMY_API_KEY || '',
  etherscan: process.env.ETHERSCAN_API_KEY || ''
};

// Blockchain Explorer URLs
export const EXPLORERS = {
  ethereum: {
    mainnet: 'https://etherscan.io',
    sepolia: 'https://sepolia.etherscan.io'
  },
  solana: {
    mainnet: 'https://explorer.solana.com',
    testnet: 'https://explorer.solana.com/?cluster=testnet'
  }
};

// Backup RPC URLs from environment variables
export const BACKUP_RPC_URLS = {
  ethereum: {
    sepolia: [
      'https://rpc.sepolia.org',
      'https://rpc2.sepolia.org',
      'https://ethereum-sepolia.blockpi.network/v1/rpc/public'
    ]
  }
};

// Storage keys
export const STORAGE_KEYS = {
  ENCRYPTED_WALLET: 'encryptedWallet',
  SETTINGS: 'settings',
  LAST_ACTIVE: 'lastActive'
};

// Auto-lock timeout (in minutes)
export const DEFAULT_AUTO_LOCK_TIMEOUT = 5;

// Transaction confirmation blocks
export const CONFIRMATION_BLOCKS = {
  ethereum: 3,
  solana: 32
};

// Gas price preferences (in percentages above base fee)
export const GAS_PRICE_PREFERENCES = {
  slow: 100, // Base fee
  medium: 120, // 20% above base fee
  fast: 150 // 50% above base fee
};

// Maximum number of accounts per chain
export const MAX_ACCOUNTS = 5;

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};

// Token lists
export const TOKEN_LIST_URLS = {
  ethereum: 'https://tokens.coingecko.com/ethereum/all.json',
  solana: 'https://tokens.coingecko.com/solana/all.json'
};

// API endpoints
export const API_ENDPOINTS = {
  gasPrice: 'https://api.etherscan.io/api',
  tokenPrices: 'https://api.coingecko.com/api/v3'
};

// Default currency
export const DEFAULT_CURRENCY = 'USD';

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh'];

// Default language
export const DEFAULT_LANGUAGE = 'en'; 

// Network chain IDs
export const CHAIN_IDS = {
  ethereum: {
    mainnet: '0x1',
    sepolia: '0xaa36a7'
  }
}; 

// Transaction settings
export const TRANSACTION_SETTINGS = {
  ethereum: {
    maxGasLimit: '500000',
    defaultGasLimit: '21000',
    minGasPrice: '1',
  }
}; 