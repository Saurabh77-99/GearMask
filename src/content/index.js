// Listen for messages from web page
window.addEventListener('message', (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;
    
    // Check if message is from our injected script
    if (event.data.source !== 'pedals-up-wallet-page') return;
    
    // Forward message to background script
    chrome.runtime.sendMessage(event.data.message, (response) => {
      // Send response back to web page
      window.postMessage(
        {
          source: 'pedals-up-wallet-content',
          response: {
            id: event.data.message.id,
            data: response
          }
        },
        '*'
      );
    });
  });
  
  // Inject script into page
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
  
  // Inject our script
  injectScript();
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Forward to page if needed
    if (message.target === 'page') {
      window.postMessage(
        {
          source: 'pedals-up-wallet-content',
          message: message.data
        },
        '*'
      );
    }
    
    // Always send a response to avoid "The message port closed before a response was received" error
    sendResponse({});
  });