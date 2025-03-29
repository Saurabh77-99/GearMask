// Network RPC URLs
export const RPC_URLS = {
  ethereum: {
    mainnet: process.env.ETHEREUM_MAINNET_RPC || 'https://eth-mainnet.g.alchemy.com/v2/aTStryPcLTWuKHVWG1b0f2XKeb41eExW',
    sepolia: process.env.ETHEREUM_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/aTStryPcLTWuKHVWG1b0f2XKeb41eExW'
  },
  solana: {
    mainnet: process.env.SOLANA_MAINNET_RPC || 'https://solana-mainnet.g.alchemy.com/v2/UnTzGIuP-ttv3tcge5iF4vIpehPHWT1h',
    devnet: process.env.SOLANA_DEVNET_RPC || 'https://solana-devnet.g.alchemy.com/v2/UnTzGIuP-ttv3tcge5iF4vIpehPHWT1h'
  }
};

// Default networks
export const DEFAULT_NETWORKS = {
  ethereum: 'mainnet',
  solana: 'mainnet'
};

// Network chain IDs
export const CHAIN_IDS = {
  ethereum: {
    mainnet: '0x1',
    sepolia: '0xaa36a7'
  }
}; 