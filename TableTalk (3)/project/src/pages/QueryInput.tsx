import React, { useState } from 'react';
import { Search } from 'lucide-react';

const QueryInput = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="flex-1 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white text-gray-900 rounded-lg p-8 shadow-xl">
          <div className="flex items-center mb-8">
            <Search className="h-8 w-8 mr-2" />
            <h1 className="text-2xl font-bold">Tabletalk AI</h1>
          </div>

          <h2 className="text-3xl font-bold mb-8 text-center">Ask Your Question</h2>

          <div className="mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your natural language query here"
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          <div className="flex justify-center">
            <a
              href="http://127.0.0.1:5000"
              className="bg-[#e5e500] text-gray-900 px-6 py-3 rounded-md hover:bg-[#cccc00] flex items-center justify-center"
            >
              Execute
            </a>
          </div>

          <div className="bg-[#f5f5dc] p-6 rounded-lg mt-6">
            <h3 className="font-semibold mb-4">Example Queries</h3>
            <ul className="space-y-2 mb-6">
              <li>What is the total revenue for each product category?</li>
              <li>Show me the top 5 customers by order value</li>
              <li>Compare sales performance across different regions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryInput;