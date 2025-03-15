import React, { useState } from 'react';
import { BarChart, Download, Table, Database } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const ResultsDisplay = () => {
  const location = useLocation();
  const { query, files } = location.state || { query: '', files: [] };
  const [exportLoading, setExportLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const mockData = [
    { id: 1, name: 'Alice Johnson', email: 'alice.j@example.com', age: 29, country: 'USA' },
    { id: 2, name: 'Bob Smith', email: 'bob.s@example.com', age: 34, country: 'UK' },
    { id: 3, name: 'Charlie Brown', email: 'charlie.b@example.com', age: 27, country: 'Canada' },
  ];

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + mockData.map(row => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "query_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToMongoDB = async () => {
    setExportLoading(true);
    setExportStatus('');

    try {
      const response = await fetch('http://localhost:3000/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          data: mockData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const result = await response.json();
      setExportStatus('Data exported successfully to MongoDB!');
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('Failed to export data to MongoDB');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Query Results</h2>
              <div className="flex space-x-4">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2 bg-[#e5e500] text-gray-900 px-4 py-2 rounded-md hover:bg-[#cccc00]"
                >
                  <Download className="h-5 w-5" />
                  <span>Export to CSV</span>
                </button>
                <button
                  onClick={handleExportToMongoDB}
                  disabled={exportLoading}
                  className={`flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 ${
                    exportLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Database className="h-5 w-5" />
                  <span>{exportLoading ? 'Exporting...' : 'Export to MongoDB'}</span>
                </button>
              </div>
            </div>

            {exportStatus && (
              <div className={`mb-4 p-3 rounded-md ${
                exportStatus.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {exportStatus}
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Query</h3>
              <p className="bg-gray-50 p-3 rounded-md">{query || 'No query provided'}</p>
            </div>

            {files.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Processed Files</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <ul className="space-y-2">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center">
                        <Table className="h-5 w-5 mr-2" />
                        <span>{file.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockData.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{item.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.age}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.country}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="bg-[#e5e500] text-gray-900 px-4 py-2 rounded-md hover:bg-[#cccc00]">
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#f5f5dc] p-6 rounded-lg">
            <div className="flex justify-between items-start">
              <div className="w-1/2">
                <BarChart className="w-full h-48" />
              </div>
              <div className="w-1/2 pl-8">
                <h3 className="text-xl font-semibold mb-4">Data Insights</h3>
                <p className="text-gray-600 mb-4">
                  Explore the insights gathered from the analysis. The results are processed using Google TAPAS model to provide accurate and relevant information based on your query.
                </p>
                <div className="space-y-4">
                  <button className="w-full bg-[#e5e500] text-gray-900 px-6 py-2 rounded-md hover:bg-[#cccc00] flex items-center justify-center space-x-2">
                    <Table className="h-5 w-5" />
                    <span>View Full Analysis</span>
                  </button>
                  <button className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 flex items-center justify-center space-x-2">
                    <Download className="h-5 w-5" />
                    <span>Download Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsDisplay;