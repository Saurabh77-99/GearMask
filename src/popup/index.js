import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
    <style jsx global>{`
      :root {
        --primary-color: #4CAF50;
        --secondary-color: #757575;
        --background-color: #f5f5f5;
        --border-color: #e0e0e0;
        --text-color: #212121;
        --error-color: #f44336;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
          Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: var(--text-color);
      }

      button {
        cursor: pointer;
        font-family: inherit;
      }

      input, textarea {
        font-family: inherit;
      }
    `}</style>
  </React.StrictMode>
);