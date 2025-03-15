import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <MessageSquare className="h-8 w-8" />
            <span className="text-xl font-semibold">Tabletalk AI</span>
          </Link>
          <div className="flex space-x-4">
            <Link to="/" className="text-gray-700 hover:text-gray-900">Home</Link>
            <Link to="/query" className="text-gray-700 hover:text-gray-900">Query Input</Link>
            <Link to="/results" className="text-gray-700 hover:text-gray-900">Results Display</Link>
            <Link to="/contact" className="text-gray-700 hover:text-gray-900">Contact</Link>
            <button className="bg-gray-100 px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;