import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Sidebar = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  // Check if the current path matches the link
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="w-64 bg-gray-800 text-white h-full">
      <div className="p-4">
        <nav className="space-y-1">
          <Link
            to="/dashboard"
            className={`block px-4 py-2 rounded-md ${
              isActive('/dashboard') ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Dashboard
          </Link>
          
          {isAdmin && (
            <Link
              to="/admin"
              className={`block px-4 py-2 rounded-md ${
                isActive('/admin') ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Admin Dashboard
            </Link>
          )}
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Meetings
            </p>
          </div>
          
          <Link
            to="/meetings"
            className={`block px-4 py-2 rounded-md ${
              isActive('/meetings') ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Meetings
          </Link>
          
          <Link
            to="/meetings/new"
            className={`block px-4 py-2 rounded-md ${
              isActive('/meetings/new') ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Create Meeting
          </Link>
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Stakeholders
            </p>
          </div>
          
          <Link
            to="/stakeholders"
            className={`block px-4 py-2 rounded-md ${
              isActive('/stakeholders') ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Stakeholders
          </Link>
          
          <Link
            to="/stakeholders/new"
            className={`block px-4 py-2 rounded-md ${
              isActive('/stakeholders/new') ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Add Stakeholder
          </Link>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;