import React, { useState, useRef } from 'react';
import { Search, Upload, FileType, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileData {
  name: string;
  type: string;
  content: any[];
}

const QueryInput = () => {
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileRead = async (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          let content: any[] = [];
          const fileName = file.name;
          const fileType = file.type;

          if (fileType.includes('csv') || fileName.endsWith('.csv')) {
            const csvData = Papa.parse(e.target?.result as string, {
              header: true,
              skipEmptyLines: true,
              error: (error) => {
                reject(new Error(`CSV parsing error: ${error}`));
              }
            });
            content = csvData.data;
          } else if (
            fileType.includes('spreadsheet') ||
            fileType.includes('excel') ||
            fileName.endsWith('.xlsx') ||
            fileName.endsWith('.xls')
          ) {
            const data = e.target?.result;
            if (!data) {
              throw new Error('No data received from file');
            }
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
              throw new Error('Excel file has no sheets');
            }
            const worksheet = workbook.Sheets[sheetName];
            content = XLSX.utils.sheet_to_json(worksheet);
          } else if (fileType.includes('json') || fileName.endsWith('.json')) {
            const jsonContent = e.target?.result;
            if (typeof jsonContent !== 'string') {
              throw new Error('Invalid JSON file content');
            }
            content = JSON.parse(jsonContent);
            if (!Array.isArray(content)) {
              content = [content]; // Wrap non-array JSON in array
            }
          } else {
            throw new Error(`Unsupported file type: ${fileType}`);
          }

          if (!content || content.length === 0) {
            throw new Error('No valid data found in file');
          }

          resolve({
            name: fileName,
            type: fileType || 'application/octet-stream',
            content
          });
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Unknown error processing file'));
        }
      };

      reader.onerror = () => reject(new Error(`Error reading file: ${file.name}`));

      if (file.type.includes('csv') || file.type.includes('json') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const filePromises = Array.from(uploadedFiles).map(handleFileRead);
      const processedFiles = await Promise.all(filePromises);
      setFiles(prev => [...prev, ...processedFiles]);
    } catch (error) {
      console.error('Error processing files:', error);
      setError(error instanceof Error ? error.message : 'Failed to process files');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(files.filter(file => file.name !== fileName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Here we would typically process the query using Google TAPAS
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/results', { 
        state: { 
          query,
          files,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error processing query:', error);
      setError('Failed to process query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white text-gray-900 rounded-lg p-8 shadow-xl">
          <div className="flex items-center mb-8">
            <Search className="h-8 w-8 mr-2" />
            <h1 className="text-2xl font-bold">Tabletalk AI</h1>
          </div>

          <h2 className="text-3xl font-bold mb-8 text-center">Ask Your Question</h2>

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="mb-6">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your natural language query here"
                className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upload Data Files</h3>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200"
                  disabled={loading}
                >
                  <Upload className="h-5 w-5" />
                  <span>{loading ? 'Processing...' : 'Upload Files'}</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileUpload}
                className="hidden"
              />

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                    >
                      <div className="flex items-center space-x-2">
                        <FileType className="h-5 w-5 text-gray-500" />
                        <span>{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.name)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 bg-[#e5e500] text-gray-900 px-6 py-3 rounded-md hover:bg-[#cccc00] flex items-center justify-center ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Execute'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setFiles([]);
                  setError(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="bg-[#f5f5dc] p-6 rounded-lg">
            <h3 className="font-semibold mb-4">Example Queries</h3>
            <ul className="space-y-2 mb-6">
              <li>What is the total revenue for each product category?</li>
              <li>Show me the top 5 customers by order value</li>
              <li>Compare sales performance across different regions</li>
            </ul>

            <h3 className="font-semibold mb-4">Supported File Types</h3>
            <ul className="space-y-2">
              <li>CSV files (.csv)</li>
              <li>Excel files (.xlsx, .xls)</li>
              <li>JSON files (.json)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueryInput;