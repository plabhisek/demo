import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import Footer from './layout/Footer';
import AppRoutes from '../routes';
import useAuth from '../hooks/useAuth';

const App = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  // Check if the current route is login or register
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render a simplified layout for auth pages
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    );
  }

  // Render the full app layout with sidebar for authenticated users
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <div className="flex flex-1">
        {currentUser && <Sidebar />}
        <main className="flex-1 p-6 overflow-auto">
          <AppRoutes />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default App;