"use client";

import React, { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils/dateFormat';

interface Request {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
}

interface RequestsViewProps {
  token: string;
}

const RequestsView: React.FC<RequestsViewProps> = ({ token }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  useEffect(() => {
    fetchRequests();
    
    // Poll for new requests every 5 seconds
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/webhook-test/requests/${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Received Requests</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Received Requests</h2>
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Received Requests</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No requests received yet.</p>
          <p className="mt-2">Send a request to your webhook URL to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4">Received Requests</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-700 pr-4">
          <h3 className="text-lg font-medium mb-3">Request History</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {requests.map((req) => (
              <div 
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className={`p-3 rounded-md cursor-pointer ${
                  selectedRequest?.id === req.id 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${
                    req.method === 'GET' ? 'text-green-600 dark:text-green-400' :
                    req.method === 'POST' ? 'text-blue-600 dark:text-blue-400' :
                    req.method === 'PUT' ? 'text-yellow-600 dark:text-yellow-400' :
                    req.method === 'DELETE' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {req.method}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(req.timestamp)}
                  </span>
                </div>
                <div className="text-sm truncate mt-1">
                  {req.path}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="md:col-span-2">
          {selectedRequest ? (
            <div>
              <h3 className="text-lg font-medium mb-3">Request Details</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">URL</h4>
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md font-mono text-sm">
                    {selectedRequest.method} {selectedRequest.path}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Received at: {formatDate(selectedRequest.timestamp)}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Headers</h4>
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md font-mono text-sm max-h-40 overflow-y-auto">
                    {Object.entries(selectedRequest.headers || {}).map(([key, value]) => (
                      <div key={key} className="mb-1">
                        <span className="text-blue-600 dark:text-blue-400">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedRequest.query && Object.keys(selectedRequest.query).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Query Parameters</h4>
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md font-mono text-sm max-h-40 overflow-y-auto">
                      {Object.entries(selectedRequest.query).map(([key, value]) => (
                        <div key={key} className="mb-1">
                          <span className="text-green-600 dark:text-green-400">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Body</h4>
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md font-mono text-sm max-h-60 overflow-y-auto">
                    <pre>{JSON.stringify(selectedRequest.body || {}, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              Select a request to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsView;