import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Download, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex-1">
      <div className="bg-[#f5f5dc] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="max-w-lg">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Effortless data interaction, simplified for you!
              </h1>
              <p className="text-gray-600 mb-8">
                Secure data storage, safeguarding your information from unauthorized access.
              </p>
              <Link
                to="/query"
                className="bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800"
              >
                Explore now
              </Link>
            </div>
            <div className="hidden lg:block">
              <Database className="w-64 h-64" />
            </div>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#f5f5dc] p-8 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Engaged users</h3>
              <div className="flex items-center">
                <span className="text-2xl font-bold">Effortless</span>
                <Users className="ml-2 h-6 w-6" />
              </div>
            </div>
            <div className="bg-[#f5f5dc] p-8 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Queries processed</h3>
              <div className="flex items-center">
                <span className="text-2xl font-bold">Vast data</span>
                <Database className="ml-2 h-6 w-6" />
              </div>
            </div>
            <div className="bg-[#f5f5dc] p-8 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Data uploaded</h3>
              <div className="flex items-center">
                <span className="text-2xl font-bold">Smooth</span>
                <Download className="ml-2 h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;