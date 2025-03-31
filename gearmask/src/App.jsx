import { WalletProvider } from './contexts/WalletContext';
import WalletDemo from './components/WalletDemo';
import './index.css';

function App() {
  return (
    <WalletProvider>
      <WalletDemo />
    </WalletProvider>
  );
}

export default App;