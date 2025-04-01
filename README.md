# Pedals Up Wallet

A multi-chain browser extension wallet with seamless React integration.

## Features

- Multi-chain support (Ethereum and Solana)
- Secure key management
- Transaction signing
- Network switching
- React integration
- dApp connectivity

## Setup

1. **Install Dependencies**:
```bash
pnpm install
```

2. **Environment Variables**:
Create a `.env` file with your RPC URLs:
```env
ETHEREUM_MAINNET_RPC=your_ethereum_mainnet_rpc
ETHEREUM_SEPOLIA_RPC=your_ethereum_sepolia_rpc
SOLANA_MAINNET_RPC=your_solana_mainnet_rpc
SOLANA_DEVNET_RPC=your_solana_devnet_rpc
```

3. **Build**:
```bash
pnpm build
```

4. **Load Extension**:
- Open Chrome
- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` folder

## Development

- Watch mode: `pnpm watch`
- Test: `pnpm test`

## React Integration

```jsx
import { PedalsUpWalletProvider, usePedalsUpWallet } from '@pedals-up-wallet/react';

function App() {
  return (
    <PedalsUpWalletProvider>
      <YourApp />
    </PedalsUpWalletProvider>
  );
}

function YourApp() {
  const { connect, isConnected, accounts } = usePedalsUpWallet();
  
  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <div>Connected: {accounts.ethereum[0]}</div>
      )}
    </div>
  );
}
```

## Security

- Private keys are encrypted using AES
- Secure storage using chrome.storage
- Password-based authentication
- Transaction validation
- Network validation

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage
```
### Contributors
<a href="https://github.com/Saurabh77-99/GearMask/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Saurabh77-99/GearMask" />
</a>

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 
