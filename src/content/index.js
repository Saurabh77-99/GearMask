// Inject the script
function injectScript() {
  try {
    const container = document.head || document.documentElement;
    const scriptTag = document.createElement('script');
    scriptTag.src = chrome.runtime.getURL('injected.js');
    scriptTag.onload = function() {
      this.remove();
    };
    container.appendChild(scriptTag);
  } catch (error) {
    console.error('Pedals Up Wallet: Failed to inject script', error);
  }
}

// Execute script injection
injectScript();

// Message request ID counter
let messageIdCounter = 1;

// Pending requests tracking
const pendingRequests = new Map();

// Listen for messages from the injected script
window.addEventListener('message', function(event) {
  // Only accept messages from this window
  if (event.source !== window) return;
  
  // Handle messages based on type
  if (event.data.type === 'PEDALS_CONNECT_REQUEST') {
    // Forward connection request to background script
    chrome.runtime.sendMessage({
      id: messageIdCounter++,
      type: 'CONNECT_REQUEST',
      origin: window.location.origin
    }, function(response) {
      // Forward response back to page
      window.postMessage({
        type: 'PEDALS_CONNECT_RESPONSE',
        accounts: response?.accounts || [],
        chainId: response?.chainId,
        connected: response?.accounts ? true : false,
        error: response?.error
      }, '*');
    });
  } else if (event.data.type === 'PEDALS_SEND_TRANSACTION') {
    // Forward transaction request to background script
    chrome.runtime.sendMessage({
      id: messageIdCounter++,
      type: 'SEND_TRANSACTION',
      transaction: event.data.transaction,
      origin: window.location.origin
    }, function(response) {
      // Forward response back to page
      window.postMessage({
        type: 'PEDALS_TRANSACTION_RESPONSE',
        result: response?.hash || response?.result,
        error: response?.error
      }, '*');
    });
  } else if (event.data.source === 'pedals-up-wallet-page') {
    // Handle message with legacy format from first implementation
    const requestId = event.data.message.id || messageIdCounter++;
    
    // Store callback in pendingRequests if using legacy approach
    pendingRequests.set(requestId, (response) => {
      window.postMessage({
        source: 'pedals-up-wallet-content',
        response: {
          id: requestId,
          data: response
        }
      }, '*');
    });
    
    // Forward message to background script
    chrome.runtime.sendMessage({
      ...event.data.message,
      id: requestId
    }, function(response) {
      // Handle the response
      const callback = pendingRequests.get(requestId);
      if (callback) {
        callback(response);
        pendingRequests.delete(requestId);
      }
    });
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Forward to page if needed
  if (message.target === 'page') {
    window.postMessage({
      source: 'pedals-up-wallet-content',
      message: message.data
    }, '*');
  }
  
  // Always send a response to avoid "The message port closed before a response was received" error
  sendResponse({});
  return true;
});