// This script gets injected into web pages
const PedalsUpWallet = {
    isConnected: false,
    
    // Method to check if wallet is installed
    isInstalled: () => true,

    // Method to request connection
    connect: async () => {
        if (!PedalsUpWallet.isConnected) {
            // Send message to content script
            window.postMessage({ type: 'PEDALS_CONNECT_REQUEST' }, '*');
            return new Promise((resolve) => {
                window.addEventListener('message', function handler(event) {
                    if (event.data.type === 'PEDALS_CONNECT_RESPONSE') {
                        PedalsUpWallet.isConnected = event.data.connected;
                        window.removeEventListener('message', handler);
                        resolve(event.data.connected);
                    }
                });
            });
        }
        return PedalsUpWallet.isConnected;
    },

    // Method to send transaction
    sendTransaction: async (transaction) => {
        if (!PedalsUpWallet.isConnected) {
            throw new Error('Wallet not connected');
        }
        window.postMessage({ 
            type: 'PEDALS_SEND_TRANSACTION', 
            transaction 
        }, '*');
        return new Promise((resolve, reject) => {
            window.addEventListener('message', function handler(event) {
                if (event.data.type === 'PEDALS_TRANSACTION_RESPONSE') {
                    window.removeEventListener('message', handler);
                    if (event.data.error) {
                        reject(new Error(event.data.error));
                    } else {
                        resolve(event.data.result);
                    }
                }
            });
        });
    }
};

// Inject the wallet object into window
window.PedalsUpWallet = PedalsUpWallet; 