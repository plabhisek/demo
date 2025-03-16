// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import App from './components/App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import './assets/styles/main.css' 
import 'react-toastify/dist/ReactToastify.css';

// Make sure there's a div with id="root" in your HTML
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Could not find root element to mount React app");
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Router>
        <AuthProvider>
          <App />
          <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
      </Router>
    </React.StrictMode>
  );
}