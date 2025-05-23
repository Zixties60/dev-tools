"use client";

import React, { useState, useEffect } from 'react';
import { FaCheckCircle } from 'react-icons/fa';

interface Header {
  key: string;
  value: string;
}

interface Config {
  status: number;
  type: string;
  body: string;
  headers: Header[];
}

interface ResponseConfigProps {
  token: string;
}

const ResponseConfig: React.FC<ResponseConfigProps> = ({ token }) => {
  const [status, setStatus] = useState(200);
  const [responseType, setResponseType] = useState('json');
  const [responseBody, setResponseBody] = useState('{\n  "success": true\n}');
  const [headers, setHeaders] = useState<Header[]>([{ key: "X-Powered-By", value: "DevTools" }]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch the configuration when the component mounts
  useEffect(() => {
    if (token) {
      fetchConfig();
    }
  }, [token]);

  const fetchConfig = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Fetching config for token:', token);
      const response = await fetch(`/api/webhook-test/config/${token}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load configuration');
      }
      
      const data = await response.json();
      console.log('Received config data:', data);
      
      if (data.config) {
        setStatus(data.config.status || 200);
        setResponseType(data.config.type || 'json');
        setResponseBody(data.config.body || '{\n  "success": true\n}');
        setHeaders(data.config.headers?.length > 0 
          ? data.config.headers 
          : [{ key: "X-Powered-By", value: "DevTools" }]
        );
      }
    } catch (err) {
      console.error('Error loading config:', err);
      setError('Failed to load saved configuration. Using defaults.');
    } finally {
      setIsLoading(false);
    }
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      console.log('Saving config for token:', token);
      const configData = {
        status,
        type: responseType,
        body: responseBody,
        headers: headers.filter(h => h.key.trim() !== '')
      };
      console.log('Config data to save:', configData);
      
      const response = await fetch(`/api/webhook-test/config/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }

      // Show success message
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Response Configuration</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4">Response Configuration</h2>
      <p className="mb-6">
        Customize how your webhook endpoint responds to requests.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-md flex items-center">
          <FaCheckCircle className="mr-2" />
          <p>Configuration saved successfully!</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Status Code */}
        <div>
          <label className="block text-sm font-medium mb-2">Status Code</label>
          <select
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          >
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="202">202 Accepted</option>
            <option value="204">204 No Content</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Internal Server Error</option>
          </select>
        </div>

        {/* Response Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Response Type</label>
          <select
            value={responseType}
            onChange={(e) => setResponseType(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          >
            <option value="json">JSON</option>
            <option value="text">Plain Text</option>
            <option value="xml">XML</option>
            <option value="html">HTML</option>
          </select>
        </div>

        {/* Response Body */}
        <div>
          <label className="block text-sm font-medium mb-2">Response Body</label>
          <textarea
            value={responseBody}
            onChange={(e) => setResponseBody(e.target.value)}
            rows={6}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm bg-white dark:bg-gray-700"
          />
        </div>

        {/* Headers */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Response Headers</label>
            <button
              type="button"
              onClick={addHeader}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Add Header
            </button>
          </div>
          
          {headers.map((header, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Header name"
                value={header.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
              <input
                type="text"
                placeholder="Value"
                value={header.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
              <button
                type="button"
                onClick={() => removeHeader(index)}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div>
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseConfig;