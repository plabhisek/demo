import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import App from './components/App';
import { AuthProvider } from './contexts/AuthContext';
import './assets/styles/main.css';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);