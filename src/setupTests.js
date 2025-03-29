// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  }
};

// Mock window.pedalsUpWallet
global.window.pedalsUpWallet = {
  connect: jest.fn(),
  getAccounts: jest.fn(),
  getNetwork: jest.fn(),
  switchNetwork: jest.fn(),
  sendTransaction: jest.fn(),
  signMessage: jest.fn()
};

// Mock crypto
global.crypto = {
  getRandomValues: jest.fn()
}; 