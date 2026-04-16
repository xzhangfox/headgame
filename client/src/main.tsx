import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'rgba(10, 8, 0, 0.95)',
          color: '#fff',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          fontFamily: 'Noto Sans SC, sans-serif',
        },
        success: {
          iconTheme: { primary: '#39ff14', secondary: '#000' },
        },
        error: {
          iconTheme: { primary: '#ff2d78', secondary: '#000' },
        },
      }}
    />
  </React.StrictMode>
);
