import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Header = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">
          Meeting Manager
        </Link>

        <nav className="flex items-center space-x-4">
          {currentUser ? (
            <>
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/meetings" className="text-gray-600 hover:text-blue-600">
                  Meetings
                </Link>
                <Link to="/stakeholders" className="text-gray-600 hover:text-blue-600">
                  Stakeholders
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-gray-600 hover:text-blue-600">
                    Admin Dashboard
                  </Link>
                )}
              </div>
              
              <div className="relative group">
                <button className="flex items-center text-gray-700 hover:text-blue-600 focus:outline-none">
                  <span className="mr-2">{currentUser.name}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block group-focus-within:block">
                  <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-blue-600">
                Sign in
              </Link>
              {/*<Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Sign up
              </Link>*/}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;