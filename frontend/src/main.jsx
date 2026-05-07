import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import App from './App.jsx'
import './index.css'

// Migrate auth keys from localStorage → sessionStorage (one-time, per tab)
;['token', 'refreshToken', 'user'].forEach(key => {
  if (!sessionStorage.getItem(key) && localStorage.getItem(key)) {
    sessionStorage.setItem(key, localStorage.getItem(key));
    localStorage.removeItem(key);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
