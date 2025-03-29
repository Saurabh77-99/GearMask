(function() {
    // Define the API that will be exposed to websites
    class PedalsUpWallet {
      constructor() {
        this._requestId = 0;
        this._callbacks = {};
        
        // Listen for responses from the content script
        window.addEventListener('message', (event) => {
          // Only accept messages from our content script
          if (event.source !== window || event.data.source !== 'pedals-up-wallet-content') {
            return;
          }
          
          // Check if this is a response to one of our requests
          if (event.data.response && event.data.response.id !== undefined) {
            const { id, data } = event.data.response;
            
            // Call the stored callback with the response data
            if (this._callbacks[id]) {
              this._callbacks[id](data);
              delete this._callbacks[id];
            }
          }
        });
      }
      
      // Generate a unique request ID
      _generateRequestId() {
        return this._requestId++;
      }
      
      // Send a message to the extension
      _sendMessage(type, data = {}) {
        return new Promise((resolve) => {
          const id = this._generateRequestId();
          
          // Store the callback to be called when a response is received
          this._callbacks[id] = resolve;
          
          // Post message to content script
          window.postMessage(
            {
              source: 'pedals-up-wallet-page',
              message: {
                id,
                type,
                ...data
              }
            },
            '*'
          );
        });
      }
      
      // Check if the extension is installed
      isInstalled() {
        return true;
      }
      
      // Request wallet connection
      async connect() {
        return this._sendMessage('CONNECT_WALLET');
      }
      
      // Get user accounts
      async getAccounts() {
        const response = await this._sendMessage('GET_ACCOUNTS');
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to get accounts');
        }
        
        const accounts = {
          ethereum: [response.accounts.ethereum.address],
          solana: [response.accounts.solana.address]
        };
        
        return accounts;
      }
      
      // Switch to a different network
      async switchNetwork(network) {
        const response = await this._sendMessage('SWITCH_NETWORK', { network });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to switch network');
        }
        
        return true;
      }
      
      // Get the current network
      async getNetwork() {
        const response = await this._sendMessage('GET_NETWORK');
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to get network');
        }
        
        return response.network;
      }
      
      // Sign and send a transaction
      async sendTransaction(transaction) {
        const response = await this._sendMessage('SIGN_TRANSACTION', { transaction });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to send transaction');
        }
        
        return response.result;
      }
      
      // Sign a message
      async signMessage(message, network = 'ethereum') {
        const response = await this._sendMessage('SIGN_MESSAGE', { message, network });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to sign message');
        }
        
        return response.signature;
      }
    }
    
    // Install the API on window object
    window.pedalsUpWallet = new PedalsUpWallet();
    
    // Dispatch an event to notify dApps that the wallet is available
    window.dispatchEvent(new Event('pedalsUpWalletReady'));
  })();