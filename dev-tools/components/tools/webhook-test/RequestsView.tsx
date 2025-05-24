"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils/dateFormat';
import { FaSync } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface Request {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  response?: {
    status: number;
    headers?: Record<string, string>;
    body?: any;
  };
}

interface RequestsViewProps {
  token: string;
}

const RequestsView: React.FC<RequestsViewProps> = ({ token }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');
  const [mounted, setMounted] = useState(false);
  
  // Use next-themes to detect theme
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  // Mark component as mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initial load of requests
  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/webhook-test/requests/${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const data = await response.json();
      const fetchedRequests = data.requests || [];
      setRequests(fetchedRequests);
      
      // Select the latest request by default if there are requests and none is currently selected
      // or if the currently selected request is no longer in the list
      if (fetchedRequests.length > 0) {
        if (!selectedRequest || !fetchedRequests.some((req: Request) => req.id === selectedRequest.id)) {
          // Sort by timestamp in descending order and select the most recent one
          const sortedRequests = [...fetchedRequests].sort((a, b) => b.timestamp - a.timestamp);
          setSelectedRequest(sortedRequests[0]);
          setActiveTab('request'); // Reset to request tab when selecting a new request
        }
      } else {
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Enhance the getBodyLanguage function to better detect the language based on content-type
  const getBodyLanguage = (body: any, headers: Record<string, string> = {}) => {
    // Normalize header keys to lowercase for case-insensitive matching
    const normalizedHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      normalizedHeaders[key.toLowerCase()] = value;
    });
    
    const contentType = normalizedHeaders['content-type'] || '';
    
    // Handle binary data
    if (contentType.includes('application/octet-stream') || 
        contentType.includes('image/') || 
        contentType.includes('audio/') || 
        contentType.includes('video/')) {
      return 'text'; // Use plain text for binary data
    }
    
    // Try to determine if it's JSON by checking the body
    if (typeof body === 'object') return 'json';
    
    // Check if it's a JSON string
    if (typeof body === 'string') {
      try {
        const trimmed = body.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          JSON.parse(trimmed);
          return 'json';
        }
      } catch (e) {
        // Not valid JSON, continue with other checks
      }
      
      // Check for XML structure
      if ((body.trim().startsWith('<?xml') || body.trim().startsWith('<')) && 
          (body.includes('</') || body.includes('/>'))) {
        return 'xml';
      }
      
      // Check for HTML structure
      if (body.trim().startsWith('<!DOCTYPE html') || 
          body.trim().startsWith('<html') || 
          (body.includes('<head') && body.includes('<body'))) {
        return 'html';
      }
    }
    
    // Check content-type header for more specific types
    if (contentType.includes('application/json')) return 'json';
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) return 'xml';
    if (contentType.includes('text/html')) return 'html';
    if (contentType.includes('text/css')) return 'css';
    if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) return 'javascript';
    if (contentType.includes('application/x-www-form-urlencoded')) return 'text';
    if (contentType.includes('text/markdown')) return 'markdown';
    if (contentType.includes('text/csv')) return 'text';
    if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) return 'yaml';
    if (contentType.includes('application/graphql')) return 'graphql';
    if (contentType.includes('application/sql')) return 'sql';
    
    // For programming languages
    if (contentType.includes('text/x-python')) return 'python';
    if (contentType.includes('text/x-java')) return 'java';
    if (contentType.includes('text/x-c')) return 'c';
    if (contentType.includes('text/x-typescript')) return 'typescript';
    
    // Default to text for anything else
    return 'text';
  };

  // Also enhance the formatBody function to better handle different content types
  const formatBody = (body: any, headers: Record<string, string> = {}) => {
    if (body === undefined || body === null) return '(empty body)';
    
    // Normalize header keys to lowercase
    const normalizedHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      normalizedHeaders[key.toLowerCase()] = value;
    });
    
    const contentType = normalizedHeaders['content-type'] || '';
    
    // Handle binary data
    if (contentType.includes('application/octet-stream') || 
        contentType.includes('image/') || 
        contentType.includes('audio/') || 
        contentType.includes('video/')) {
      return '[Binary data]';
    }
    
    // If it's already an object, stringify it
    if (typeof body === 'object') {
      return JSON.stringify(body, null, 2);
    }
    
    // If it's a string, try to parse it as JSON if appropriate
    if (typeof body === 'string') {
      const trimmed = body.trim();
      
      // Try to parse JSON
      if (contentType.includes('application/json') || 
          (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);
          return JSON.stringify(parsed, null, 2);
        } catch (e) {
          // Not valid JSON, return as is
        }
      }
      
      // For form-urlencoded, try to make it more readable
      if (contentType.includes('application/x-www-form-urlencoded')) {
        try {
          const params = new URLSearchParams(body);
          const formattedParams: Record<string, string> = {};
          params.forEach((value, key) => {
            formattedParams[key] = value;
          });
          return JSON.stringify(formattedParams, null, 2);
        } catch (e) {
          // Failed to parse, return as is
        }
      }
      
      return body;
    }
    
    // For other types, convert to string
    return String(body);
  };

  const getStatusCodeColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600 dark:text-green-400';
    if (statusCode >= 300 && statusCode < 400) return 'text-blue-600 dark:text-blue-400';
    if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600 dark:text-yellow-400';
    if (statusCode >= 500) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // Add this helper function to get the status text for a given status code
  const getStatusText = (statusCode: number): string => {
    const statusTexts: Record<number, string> = {
      100: 'Continue',
      101: 'Switching Protocols',
      200: 'OK',
      201: 'Created',
      202: 'Accepted',
      204: 'No Content',
      300: 'Multiple Choices',
      301: 'Moved Permanently',
      302: 'Found',
      304: 'Not Modified',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };
    
    return statusTexts[statusCode] || '';
  };

  // Add a function to check if content should be displayed as plain text
  const isPlainText = (body: any, headers: Record<string, string> = {}): boolean => {
    // Normalize header keys to lowercase for case-insensitive matching
    const normalizedHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      normalizedHeaders[key.toLowerCase()] = value;
    });
    
    const contentType = normalizedHeaders['content-type'] || '';
    
    // Check if it's explicitly text/plain
    if (contentType.includes('text/plain')) return true;
    
    // If it's a string but not JSON, XML, HTML, CSS, or JavaScript, treat as plain text
    if (typeof body === 'string') {
      if (contentType.includes('application/json')) return false;
      if (contentType.includes('application/xml') || contentType.includes('text/xml')) return false;
      if (contentType.includes('text/html')) return false;
      if (contentType.includes('text/css')) return false;
      if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) return false;
      
      // Try to detect if it's JSON by structure
      const trimmed = body.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          JSON.parse(trimmed);
          return false; // It's valid JSON
        } catch (e) {
          // Not valid JSON
        }
      }
      
      return true; // Default to plain text for strings
    }
    
    return false; // Objects and other types are not plain text
  };

  // Create a memoized syntax highlighter component to ensure it re-renders when theme changes
  const CodeHighlighter = useCallback(({ language, body }: { language: string, body: string }) => {
    return (
      <SyntaxHighlighter
        language={language}
        style={isDarkMode ? vscDarkPlus : prism}
        customStyle={{
          margin: 0,
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-mono), Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
        wrapLongLines={true}
      >
        {body}
      </SyntaxHighlighter>
    );
  }, [isDarkMode]);

  // Don't render anything until the component is mounted to avoid hydration issues
  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Received Requests</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Received Requests</h2>
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Received Requests</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No requests received yet.</p>
          <p className="mt-2">Send a request to your webhook URL to see it here.</p>
          <button
            onClick={fetchRequests}
            disabled={isRefreshing}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-70"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    );
  }

  // Sort requests by timestamp in descending order (newest first)
  const sortedRequests = [...requests].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Received Requests</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-700 pr-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">Request History</h3>
            <button
              onClick={fetchRequests}
              disabled={isRefreshing}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Refresh requests"
              title="Refresh requests"
            >
              <FaSync className={isRefreshing ? "animate-spin" : ""} size={16} />
            </button>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {sortedRequests.map((req) => (
              <div 
                key={req.id}
                onClick={() => {
                  setSelectedRequest(req);
                  setActiveTab('request'); // Reset to request tab when selecting a new request
                }}
                className={`p-3 rounded-md cursor-pointer ${
                  selectedRequest?.id === req.id 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Received at
                </div>
                <div className="text-base font-medium">
                  {formatDate(req.timestamp)}
                </div>
                {req.response && (
                  <div className="mt-1 text-sm">
                    <span className={`font-medium ${getStatusCodeColor(req.response.status)}`}>
                      {req.response.status} {getStatusText(req.response.status)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="md:col-span-2">
          {selectedRequest ? (
            <div>
              <h3 className="text-lg font-medium mb-3">Request Details</h3>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`font-medium text-lg ${
                      selectedRequest.method === 'GET' ? 'text-green-600 dark:text-green-400' :
                      selectedRequest.method === 'POST' ? 'text-blue-600 dark:text-blue-400' :
                      selectedRequest.method === 'PUT' ? 'text-yellow-600 dark:text-yellow-400' :
                      selectedRequest.method === 'DELETE' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {selectedRequest.method}
                    </span>
                    <span className="text-lg text-blue-900 dark:text-blue-200 ml-2">
                      {selectedRequest.path}
                    </span>
                  </div>
                  <span className="text-blue-900 dark:text-blue-200">
                    {formatDate(selectedRequest.timestamp)}
                  </span>
                </div>
                {selectedRequest.response && (
                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Response:</span>
                    <span className={`font-medium ${getStatusCodeColor(selectedRequest.response.status)}`}>
                      {selectedRequest.response.status} {getStatusText(selectedRequest.response.status)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveTab('request')}
                    className={`py-2 px-4 font-medium ${
                      activeTab === 'request' 
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    Request
                  </button>
                  <button
                    onClick={() => setActiveTab('response')}
                    className={`py-2 px-4 font-medium ${
                      activeTab === 'response' 
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    Response
                  </button>
                </div>
              </div>
              
              {activeTab === 'request' ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Headers</h4>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                      <table className="w-full text-sm font-mono">
                        <tbody>
                          {Object.entries(selectedRequest.headers || {}).map(([key, value], index) => (
                            <tr key={index} className="border-b border-gray-200 dark:border-gray-600 last:border-0">
                              <td className="py-2 pr-4 text-blue-600 dark:text-blue-400 align-top whitespace-nowrap font-semibold">
                                {key}
                              </td>
                              <td className="py-2 break-words">
                                {value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {selectedRequest.query && Object.keys(selectedRequest.query).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Query Parameters</h4>
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                        <table className="w-full text-sm font-mono">
                          <tbody>
                            {Object.entries(selectedRequest.query).map(([key, value], index) => (
                              <tr key={index} className="border-b border-gray-200 dark:border-gray-600 last:border-0">
                                <td className="py-2 pr-4 text-green-600 dark:text-green-400 align-top whitespace-nowrap font-semibold">
                                  {key}
                                </td>
                                <td className="py-2 break-words">
                                  {value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Body</h4>
                    <div className="rounded-md overflow-hidden">
                      <CodeHighlighter 
                        language={getBodyLanguage(selectedRequest.body, selectedRequest.headers)}
                        body={formatBody(selectedRequest.body, selectedRequest.headers)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                selectedRequest.response ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Status</h4>
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                        <span className={`font-medium ${getStatusCodeColor(selectedRequest.response.status)}`}>
                          {selectedRequest.response.status} {getStatusText(selectedRequest.response.status)}
                        </span>
                      </div>
                    </div>
                    
                    {selectedRequest.response.headers && Object.keys(selectedRequest.response.headers).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Headers</h4>
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                          <table className="w-full text-sm font-mono">
                            <tbody>
                              {Object.entries(selectedRequest.response.headers).map(([key, value], index) => (
                                <tr key={index} className="border-b border-gray-200 dark:border-gray-600 last:border-0">
                                  <td className="py-2 pr-4 text-blue-600 dark:text-blue-400 align-top whitespace-nowrap font-semibold">
                                    {key}
                                  </td>
                                  <td className="py-2 break-words">
                                    {value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Body</h4>
                      <div className="rounded-md overflow-hidden">
                        {selectedRequest.response.body ? (
                          isPlainText(selectedRequest.response.body, selectedRequest.response.headers || {}) ? (
                            // Plain text display
                            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md font-mono text-sm whitespace-pre-wrap">
                              {typeof selectedRequest.response.body === 'string' 
                                ? selectedRequest.response.body 
                                : String(selectedRequest.response.body)}
                            </div>
                          ) : (
                            // Syntax highlighted display
                            <CodeHighlighter
                              language={getBodyLanguage(
                                selectedRequest.response.body, 
                                selectedRequest.response.headers || {}
                              )}
                              body={formatBody(
                                selectedRequest.response.body, 
                                selectedRequest.response.headers || {}
                              )}
                            />
                          )
                        ) : (
                          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-gray-500 dark:text-gray-400">
                            (empty body)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
                    No response data available
                  </div>
                )
              )}
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