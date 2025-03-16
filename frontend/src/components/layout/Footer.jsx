import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-lg font-semibold">Meeting Manager</p>
            <p className="text-sm text-gray-400">Simplify your meeting management workflow</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <a href="#" className="text-gray-400 hover:text-white">
              Terms
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              Help
            </a>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Meeting Manager. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;