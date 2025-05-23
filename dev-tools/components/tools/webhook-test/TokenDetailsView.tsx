import React, { useState, useEffect } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

interface TokenDetailsViewProps {
  token: string;
  onReset: () => void;
}

interface RequestData {
  id: string;
  token: string;
  timestamp: number;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
}

interface ResponseHeader {
  key: string;
  value: string;
}

const TokenDetailsView: React.FC<TokenDetailsViewProps> = ({ token, onReset }) => {
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [copied, setCopied] = useState(false);
  
  // Response configuration
  const [responseStatus, setResponseStatus] = useState(200);
  const [responseType, setResponseType] = useState("json");
  const [responseBody, setResponseBody] = useState('{\n  "success": true\n}');
  const [responseHeaders, setResponseHeaders] = useState<ResponseHeader[]>([
    { key: "X-Powered-By", value: "DevTools" }
  ]);
  
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhook-test/${token}`);
    }
  }, [token]);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/webhook-test/validate-token?token=${token}`);
        if (response.ok) {
          setTokenValid(true);
          fetchRequests();
          
          // Set up polling for new requests
          const interval = setInterval(fetchRequests, 5000);
          return () => clearInterval(interval);
        } else {
          setTokenValid(false);
        }
      } catch (err) {
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/webhook-test/requests?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  const saveResponseConfig = async () => {
    try {
      await fetch(`/api/webhook-test/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          config: {
            status: responseStatus,
            type: responseType,
            body: responseBody,
            headers: responseHeaders,
          }
        }),
      });
    } catch (err) {
      console.error("Failed to save response config", err);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addHeader = () => {
    setResponseHeaders([...responseHeaders, { key: "", value: "" }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...responseHeaders];
    newHeaders[index][field] = value;
    setResponseHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    const newHeaders = [...responseHeaders];
    newHeaders.splice(index, 1);
    setResponseHeaders(newHeaders);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Invalid Token</h2>
        <p className="mb-6">
          The webhook token you provided is invalid or has expired. Please generate a new token.
        </p>
        <button 
          onClick={onReset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Generate New Token
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Webhook URL</h2>
        <div className="flex items-center mb-4">
          <input
            type="text"
            value={webhookUrl}
            readOnly
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-700"
          />
          <button
            onClick={copyWebhookUrl}
            className="p-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-r-md"
          >
            {copied ? <FiCheck className="h-5 w-5 text-green-600" /> : <FiCopy className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Send POST requests to this URL to test your webhooks. All requests will be captured and displayed below.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-xl font-semibold mb-4">Configure Response</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Status Code</label>
          <input
            type="number"
            value={responseStatus}
            onChange={(e) => setResponseStatus(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Response Type</label>
          <select
            value={responseType}
            onChange={(e) => setResponseType(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
          >
            <option value="json">JSON</option>
            <option value="text">Plain Text</option>
            <option value="empty">Empty</option>
          </select>
        </div>
        
        {responseType !== 'empty' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Response Body</label>
            <textarea
              value={responseBody}
              onChange={(e) => setResponseBody(e.target.value)}
              rows={6}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 font-mono"
            />
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Response Headers</label>
            <button
              onClick={addHeader}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Add Header
            </button>
          </div>
          
          {responseHeaders.map((header, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={header.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                placeholder="Header name"
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                placeholder="Header value"
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
              />
              <button
                onClick={() => removeHeader(index)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        
        <button
          onClick={saveResponseConfig}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Save Response Configuration
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Received Requests</h2>
        
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No requests received yet.</p>
            <p className="text-sm mt-2">Send a POST request to your webhook URL to see it here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-750 p-3 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-sm">{request.method} {request.path}</span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{new Date(request.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="p-3">
                  <h4 className="font-medium mb-2">Headers</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md mb-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(request.headers).map(([key, value]) => (
                          <tr key={key}>
                            <td className="pr-4 py-1 font-mono text-gray-600 dark:text-gray-400">{key}:</td>
                            <td className="py-1 font-mono">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <h4 className="font-medium mb-2">Body</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {request.body}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TokenDetailsView;