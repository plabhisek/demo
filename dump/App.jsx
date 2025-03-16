import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Layout from './components/App';  // Or './components/layout/App' if you moved it there.
import './App.css';

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
