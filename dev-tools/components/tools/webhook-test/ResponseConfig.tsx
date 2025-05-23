"use client";

import React, { useState, useEffect } from 'react';
import { FaSave, FaCheck, FaPlus, FaTrash, FaExpandAlt, FaCompressAlt, FaInfoCircle } from 'react-icons/fa';
import dynamic from 'next/dynamic';

// Import CodeMirror dynamically to avoid SSR issues
const CodeMirror = dynamic(
  () => import('@uiw/react-codemirror').then(mod => mod.default),
  { ssr: false }
);

interface Header {
  key: string;
  value: string;
}

interface ResponseConfigProps {
  token: string;
}

const ResponseConfig: React.FC<ResponseConfigProps> = ({ token }) => {
  const [status, setStatus] = useState(200);
  const [responseType, setResponseType] = useState<'json' | 'text'>('json');
  const [responseBody, setResponseBody] = useState('{\n  "success": true\n}');
  const [headers, setHeaders] = useState<Header[]>([
    { key: 'X-Powered-By', value: 'DevTools' }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [editorExtensions, setEditorExtensions] = useState<any[]>([]);
  const [editorTheme, setEditorTheme] = useState<any>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Initialize and update dark mode state
  useEffect(() => {
    // Initial check for system preference
    if (typeof window !== 'undefined') {
      // First check if the document has a dark class which indicates site preference
      const isDarkTheme = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDarkTheme);
      
      // Create a mutation observer to watch for theme changes on the HTML element
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const isDarkTheme = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDarkTheme);
          }
        });
      });
      
      // Start observing the document with the configured parameters
      observer.observe(document.documentElement, { attributes: true });
      
      // Clean up
      return () => observer.disconnect();
    }
  }, []);

  // Load editor extensions and theme
  useEffect(() => {
    const loadEditorDependencies = async () => {
      try {
        // Load JSON language support only for JSON type
        let langExtension = [];
        
        if (responseType === 'json') {
          try {
            const jsonLang = await import('@codemirror/lang-json');
            langExtension = [jsonLang.json()];
          } catch (err) {
            console.error('Error loading JSON language support:', err);
          }
        }
        
        // Load theme based on dark mode preference
        try {
          if (isDarkMode) {
            const vscodeTheme = await import('@uiw/codemirror-theme-vscode');
            setEditorTheme(vscodeTheme.vscodeDark);
          } else {
            const githubTheme = await import('@uiw/codemirror-theme-github');
            setEditorTheme(githubTheme.githubLight);
          }
        } catch (err) {
          console.error('Error loading theme:', err);
        }
        
        setEditorExtensions(langExtension);
        setEditorReady(true);
      } catch (err) {
        console.error('Error loading editor dependencies:', err);
        setEditorReady(true);
      }
    };
    
    loadEditorDependencies();
  }, [isDarkMode, responseType]);

  // Load saved configuration on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/webhook-test/config/${token}`);
        
        if (!response.ok) {
          throw new Error('Failed to load configuration');
        }
        
        const data = await response.json();
        
        if (data.config) {
          setStatus(data.config.status || 200);
          // Handle legacy types (xml, html) by converting them to text
          const configType = data.config.type || 'json';
          setResponseType(configType === 'json' ? 'json' : 'text');
          setResponseBody(data.config.body || '{\n  "success": true\n}');
          setHeaders(data.config.headers || [{ key: 'X-Powered-By', value: 'DevTools' }]);
        }
      } catch (err) {
        console.error('Error loading configuration:', err);
        setError('Failed to load configuration. Using defaults.');
      } finally {
        setIsLoading(false);
        setInitialLoad(false);
      }
    };
    
    loadConfig();
  }, [token]);

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = [...headers];
    newHeaders.splice(index, 1);
    setHeaders(newHeaders);
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const handleSaveConfig = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSaveSuccess(false);
      
      const response = await fetch(`/api/webhook-test/config/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          type: responseType,
          body: responseBody,
          headers
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      
      // Show success state
      setSaveSuccess(true);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEditorExpansion = () => {
    setIsEditorExpanded(!isEditorExpanded);
  };

  // Render the editor
  const renderEditor = () => {
    if (!editorReady) {
      return (
        <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    return (
      <div className={`border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden transition-all duration-300 ${
        isEditorExpanded ? 'fixed inset-6 z-50 bg-white dark:bg-gray-800 shadow-2xl' : 'relative'
      }`}>
        <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {responseType === 'json' ? 'JSON Editor' : 'Text Editor'}
          </span>
          <button
            onClick={toggleEditorExpansion}
            className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label={isEditorExpanded ? "Collapse editor" : "Expand editor"}
          >
            {isEditorExpanded ? <FaCompressAlt size={16} /> : <FaExpandAlt size={16} />}
          </button>
        </div>
        {editorReady && (
          <CodeMirror
            key={`editor-${isDarkMode ? 'dark' : 'light'}-${responseType}`}
            value={responseBody}
            height={isEditorExpanded ? "calc(100% - 40px)" : "300px"}
            extensions={editorExtensions}
            onChange={(value) => setResponseBody(value)}
            theme={editorTheme}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
            }}
            className="font-mono text-sm"
          />
        )}
      </div>
    );
  };

  if (initialLoad) {
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
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Customize how your webhook endpoint responds to requests.
      </p>
      
      {error && (
        <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Two-column layout for status and response type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          
          <div>
            <label className="block text-sm font-medium mb-2">Response Type</label>
            <select
              value={responseType}
              onChange={(e) => setResponseType(e.target.value as 'json' | 'text')}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              <option value="json">JSON</option>
              <option value="text">Plain Text</option>
            </select>
          </div>
        </div>
        
        {/* Response Headers - moved above the body */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Response Headers</label>
            <button
              onClick={handleAddHeader}
              className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <FaPlus className="mr-1" size={12} />
              <span className="text-sm">Add Header</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {headers.length > 0 ? (
              headers.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={header.key}
                    onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                    placeholder="Header name"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 font-mono text-sm"
                  />
                  <input
                    value={header.value}
                    onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                    placeholder="Header value"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 font-mono text-sm"
                  />
                  <button
                    onClick={() => handleRemoveHeader(index)}
                    className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    aria-label="Remove header"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
                <FaInfoCircle className="text-gray-400 mr-2" size={16} />
                <span className="text-gray-500 dark:text-gray-400">No headers configured</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Response Body - now below headers */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Response Body</label>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Click <FaExpandAlt className="inline mx-1" size={10} /> to expand editor
            </div>
          </div>
          {renderEditor()}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-white ${
              saveSuccess 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-70 transition-colors duration-200`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : saveSuccess ? (
              <FaCheck size={16} />
            ) : (
              <FaSave size={16} />
            )}
            {saveSuccess ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

const toggleTheme = () => {
  setIsDarkMode(prev => !prev);
};

export default ResponseConfig;