"use client";

import React, { useState, useEffect, useRef } from 'react';
import GenerateTokenView from './webhook-test/GenerateTokenView';
import TokenView from './webhook-test/TokenView';
import ResponseConfig from './webhook-test/ResponseConfig';
import RequestsView from './webhook-test/RequestsView';
import { FaPlus, FaTrash, FaChevronDown, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import { formatDate } from '@/lib/utils/dateFormat';

interface SavedToken {
  token: string;
  createdAt: number;
}

const WebhookTestTool: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [savedTokens, setSavedTokens] = useState<SavedToken[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'requests'>('config');
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTokenDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load saved tokens from localStorage on component mount
  useEffect(() => {
    const loadSavedTokens = () => {
      try {
        const tokensJson = localStorage.getItem('webhookTokens');
        if (tokensJson) {
          const tokens = JSON.parse(tokensJson) as SavedToken[];
          setSavedTokens(tokens);
          
          // Set the most recent token as active if no token is selected
          if (!token && tokens.length > 0) {
            // Sort by createdAt (newest first) and take the first one
            const sortedTokens = [...tokens].sort((a, b) => b.createdAt - a.createdAt);
            setToken(sortedTokens[0].token);
          }
        }
      } catch (error) {
        console.error('Error loading saved tokens:', error);
      }
    };
    
    loadSavedTokens();
  }, []);

  const saveTokenToLocalStorage = (newToken: string) => {
    try {
      const tokensJson = localStorage.getItem('webhookTokens');
      let tokens: SavedToken[] = tokensJson ? JSON.parse(tokensJson) : [];
      
      // Check if token already exists
      if (!tokens.some(t => t.token === newToken)) {
        // Add new token with timestamp
        tokens.push({
          token: newToken,
          createdAt: Date.now()
        });
        
        // Save updated tokens
        localStorage.setItem('webhookTokens', JSON.stringify(tokens));
        setSavedTokens(tokens);
      }
    } catch (error) {
      console.error('Error saving token to localStorage:', error);
    }
  };

  const generateNewToken = async () => {
    if (isGeneratingToken) return;
    
    setIsGeneratingToken(true);
    setTokenError(null);
    
    try {
      const response = await fetch('/api/webhook-test/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate token');
      }
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      // Set the new token as active
      setToken(data.token);
      saveTokenToLocalStorage(data.token);
    } catch (err) {
      console.error('Token generation error:', err);
      setTokenError(err instanceof Error ? err.message : 'Failed to generate token. Please try again.');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleTokenSelect = (selectedToken: string) => {
    setToken(selectedToken);
    setShowTokenDropdown(false);
  };

  const handleDeleteToken = async (tokenToDelete: string) => {
    if (!confirm('Are you sure you want to delete this token? This will remove all associated data.')) {
      return;
    }
    
    try {
      // Delete from Redis
      const response = await fetch(`/api/webhook-test/token/${tokenToDelete}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete token from server');
      }
      
      // Delete from localStorage
      const updatedTokens = savedTokens.filter(t => t.token !== tokenToDelete);
      localStorage.setItem('webhookTokens', JSON.stringify(updatedTokens));
      setSavedTokens(updatedTokens);
      
      // If the deleted token was the active one, select another token or show generate view
      if (token === tokenToDelete) {
        if (updatedTokens.length > 0) {
          setToken(updatedTokens[0].token);
        } else {
          setToken(null);
        }
      }
    } catch (error) {
      console.error('Error deleting token:', error);
      alert('Failed to delete token. Please try again.');
    }
  };

  // If no token is available, show the generate token view
  if (!token) {
    return <GenerateTokenView onTokenGenerated={(newToken) => {
      setToken(newToken);
      saveTokenToLocalStorage(newToken);
    }} />;
  }

  // Find the current token in saved tokens to get its creation date
  const currentTokenData = savedTokens.find(t => t.token === token);
  const createdAt = currentTokenData?.createdAt || Date.now();

  // Filter out the current token from the dropdown options
  const otherTokens = savedTokens.filter(t => t.token !== token);

  return (
    <div className="space-y-6">
      {tokenError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md">
          <p>{tokenError}</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <div className="flex items-center gap-4 order-1 sm:order-2">
          <div className="relative" ref={dropdownRef}>
            <div 
              className="flex items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer min-w-[250px]"
              onClick={() => setShowTokenDropdown(!showTokenDropdown)}
            >
              <span className="font-medium mr-2 whitespace-nowrap">Token:</span>
              <span className="font-mono text-sm overflow-hidden text-ellipsis flex-1">{token}</span>
              <FaChevronDown className="ml-2 flex-shrink-0" />
            </div>
            
            {showTokenDropdown && (
              <div className="absolute z-10 mt-1 right-0 min-w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-w-md">
                {otherTokens.length > 0 ? (
                  otherTokens.map((savedToken) => (
                    <div 
                      key={savedToken.token}
                      className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div 
                        className="font-mono text-sm flex-1 overflow-hidden cursor-pointer"
                        onClick={() => handleTokenSelect(savedToken.token)}
                      >
                        <div className="overflow-hidden text-ellipsis">{savedToken.token}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(savedToken.createdAt)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteToken(savedToken.token);
                        }}
                        className="text-red-500 hover:text-white hover:bg-red-500 p-2 ml-2 flex-shrink-0 rounded transition-colors"
                        aria-label={`Delete token ${savedToken.token}`}
                        title="Delete token"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                    <FaInfoCircle className="text-blue-500" />
                    <span>No other tokens available</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={() => handleDeleteToken(token)}
            className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            aria-label="Delete current token"
          >
            <FaTrash size={14} />
            Delete
          </button>
          
          <button
            onClick={generateNewToken}
            disabled={isGeneratingToken}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-70"
          >
            {isGeneratingToken ? (
              <FaSpinner className="animate-spin" size={14} />
            ) : (
              <FaPlus size={14} />
            )}
            New Token
          </button>
        </div>
      </div>
      
      <TokenView token={token} createdAt={createdAt} />
      
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Response Configuration
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Received Requests
          </button>
        </nav>
      </div>
      
      {activeTab === 'config' ? (
        <ResponseConfig token={token} />
      ) : (
        <RequestsView token={token} />
      )}
    </div>
  );
};

export default WebhookTestTool;