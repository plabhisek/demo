import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';

const MultiUserSelect = ({ 
  users, 
  selectedUsers = [], 
  onChange, 
  placeholder = "Select users" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    const newSelectedUsers = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    
    onChange(newSelectedUsers);
  };

  // Remove a selected user
  const removeUser = (userId) => {
    onChange(selectedUsers.filter(id => id !== userId));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected Users Display */}
      <div 
        onClick={() => setIsOpen(true)}
        className="w-full min-h-[42px] border border-gray-300 rounded-md px-3 py-2 flex flex-wrap gap-2 items-center cursor-pointer"
      >
        {selectedUsers.length === 0 ? (
          <span className="text-gray-500">{placeholder}</span>
        ) : (
          selectedUsers.map(userId => {
            const user = users.find(u => u._id === userId);
            return user ? (
              <div 
                key={userId} 
                className="flex items-center bg-blue-100 px-2 py-1 rounded text-sm"
              >
                {user.name}
                <X 
                  className="ml-2 w-4 h-4 text-red-500 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUser(userId);
                  }} 
                />
              </div>
            ) : null;
          })
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Search Input */}
          <div className="p-2 border-b flex items-center">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input 
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full focus:outline-none"
            />
          </div>

          {/* User List */}
          {filteredUsers.length === 0 ? (
            <div className="p-2 text-center text-gray-500">No users found</div>
          ) : (
            filteredUsers.map(user => (
              <div 
                key={user._id}
                onClick={() => toggleUserSelection(user._id)}
                className="px-3 py-2 hover:bg-gray-100 flex items-center cursor-pointer"
              >
                <div className="flex-1">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
                {selectedUsers.includes(user._id) && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MultiUserSelect;