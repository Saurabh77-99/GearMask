// Inject script
class PedalsUpProvider {
    constructor() {
      this.isConnected = false;
      this.accounts = [];
      this.chainId = null;
      this.selectedAddress = null;
      
      // Listen for responses
      window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        if (!event.data?.type?.startsWith('PEDALS_')) return;
  
        if (event.data.type === 'PEDALS_CONNECT_RESPONSE') {
          if (!event.data.error && event.data.accounts) {
            this.isConnected = true;
            this.accounts = event.data.accounts;
            this.selectedAddress = event.data.accounts[0];
            this.chainId = event.data.chainId;
            this.emit('accountsChanged', this.accounts);
            this.emit('chainChanged', this.chainId);
          }
        }
      });
    }
  
    // Request method (main entry point for web3 requests)
    async request(args) {
      const { method, params = [] } = args;
  
      switch (method) {
        case 'eth_requestAccounts':
          return this.connect();
        
        case 'eth_accounts':
          return this.accounts;
        
        case 'eth_chainId':
          return this.chainId;
        
        case 'eth_sendTransaction':
          return this.sendTransaction(params[0]);
        
        default:
          throw new Error(`Method ${method} not supported`);
      }
    }
  
    // Connect to wallet
    async connect() {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection request timeout'));
        }, 30000);
  
        const handler = (event) => {
          if (event.source !== window) return;
          if (event.data.type !== 'PEDALS_CONNECT_RESPONSE') return;
  
          cleanup();
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.accounts);
          }
        };
  
        const cleanup = () => {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
        };
  
        window.addEventListener('message', handler);
        window.postMessage({ type: 'PEDALS_CONNECT_REQUEST' }, '*');
      });
    }
  
    // Send transaction
    async sendTransaction(transaction) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Transaction request timeout'));
        }, 30000);
  
        const handler = (event) => {
          if (event.source !== window) return;
          if (event.data.type !== 'PEDALS_TRANSACTION_RESPONSE') return;
  
          cleanup();
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.hash);
          }
        };
  
        const cleanup = () => {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
        };
  
        window.addEventListener('message', handler);
        window.postMessage({
          type: 'PEDALS_SEND_TRANSACTION',
          transaction
        }, '*');
      });
    }
  
    // Event handling
    on(eventName, handler) {
      if (!this._events) this._events = {};
      if (!this._events[eventName]) this._events[eventName] = [];
      this._events[eventName].push(handler);
    }
  
    emit(eventName, data) {
      if (!this._events || !this._events[eventName]) return;
      this._events[eventName].forEach(handler => handler(data));
    }
  }
  
  // Inject provider
  if (!window.ethereum) {
    window.ethereum = new PedalsUpProvider();
  }
  
  // Also provide PedalsUpWallet for direct access
  window.PedalsUpWallet = window.ethereum;
  
  // Notify webpage that injection is complete
  window.dispatchEvent(new Event('PedalsUpWalletInjected'));
  
const injectScript = () => {
    try {
      const container = document.head || document.documentElement;
      const scriptTag = document.createElement('script');
      scriptTag.src = chrome.runtime.getURL('injected.js');
      scriptTag.async = true;
      container.insertBefore(scriptTag, container.children[0]);
      scriptTag.onload = () => scriptTag.remove();
    } catch (error) {
      console.error('PedalsUp: Failed to inject script', error);
    }
  };
  
  // Handle messages from webpage
  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (!event.data?.type?.startsWith('PEDALS_')) return;
  
    try {
      switch (event.data.type) {
        case 'PEDALS_CONNECT_REQUEST': {
          const response = await chrome.runtime.sendMessage({
            type: 'CONNECT_REQUEST',
            origin: window.location.origin
          });
          window.postMessage({
            type: 'PEDALS_CONNECT_RESPONSE',
            ...response
          }, '*');
          break;
        }
        case 'PEDALS_SEND_TRANSACTION': {
          const response = await chrome.runtime.sendMessage({
            type: 'SEND_TRANSACTION',
            transaction: event.data.transaction,
            origin: window.location.origin
          });
          window.postMessage({
            type: 'PEDALS_TRANSACTION_RESPONSE',
            ...response
          }, '*');
          break;
        }
      }
    } catch (error) {
      window.postMessage({
        type: `${event.data.type}_RESPONSE`,
        error: error.message
      }, '*');
    }
  });
  
  // Initialize
  injectScript();

