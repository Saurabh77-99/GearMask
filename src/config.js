export const NETWORKS = {
  ethereum: {
    mainnet: {
      name: 'Ethereum Mainnet',
      symbol: 'ETH',
      chainId: '1',
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/aTStryPcLTWuKHVWG1b0f2XKeb41eExW',
      blockExplorer: 'https://etherscan.io'
    },
    sepolia: {
      name: 'Sepolia Testnet',
      symbol: 'ETH',
      chainId: '11155111',
      rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/aTStryPcLTWuKHVWG1b0f2XKeb41eExW',
      blockExplorer: 'https://sepolia.etherscan.io'
    }
  },
  solana: {
    mainnet: {
      name: 'Solana Mainnet',
      symbol: 'SOL',
      rpcUrl: 'https://solana-mainnet.g.alchemy.com/v2/UnTzGIuP-ttv3tcge5iF4vIpehPHWT1h',
      blockExplorer: 'https://explorer.solana.com'
    },
    testnet: {
      name: 'Solana Testnet',
      symbol: 'SOL',
      rpcUrl:"https://solana-devnet.g.alchemy.com/v2/UnTzGIuP-ttv3tcge5iF4vIpehPHWT1h",
      endpoint: 'https://api.testnet.solana.com',
      blockExplorer: 'https://explorer.solana.com/?cluster=testnet'
    }
  }
};

export const DEFAULT_NETWORKS = {
  ethereum: 'sepolia',  // Set default to Sepolia for development
  solana: 'testnet'
};

// ... rest of the config file ... 

export const API_KEYS = {
  alchemy: 'aTStryPcLTWuKHVWG1b0f2XKeb41eExW',
  etherscan: 'FYSGSK2FU9DS8S3WTVEF7THFGVJEFMSTNJ'
};

export const BACKUP_RPC_URLS = {
  ethereum: {
    sepolia: [
      'https://rpc.sepolia.org',
      'https://rpc2.sepolia.org',
      'https://ethereum-sepolia.blockpi.network/v1/rpc/public'
    ]
  }
}; 