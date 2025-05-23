"use client";

import React, { useState, useEffect, useRef } from 'react';
import GenerateTokenView from './webhook-test/GenerateTokenView';
import TokenView from './webhook-test/TokenView';
import ResponseConfig from './webhook-test/ResponseConfig';
import RequestsView from './webhook-test/RequestsView';
import { FaPlus, FaTrash, FaChevronDown } from 'react-icons/fa';
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
  const [showGenerateView, setShowGenerateView] = useState(false);
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

  const handleTokenGenerated = (newToken: string) => {
    setToken(newToken);
    saveTokenToLocalStorage(newToken);
    setShowGenerateView(false);
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

  if (showGenerateView || !token) {
    return <GenerateTokenView onTokenGenerated={handleTokenGenerated} />;
  }

  // Find the current token in saved tokens to get its creation date
  const currentTokenData = savedTokens.find(t => t.token === token);
  const createdAt = currentTokenData?.createdAt || Date.now();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <div className="flex items-center gap-4 order-1 sm:order-2">
          <div className="relative" ref={dropdownRef}>
            <div 
              className="flex items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer"
              onClick={() => setShowTokenDropdown(!showTokenDropdown)}
            >
              <span className="font-medium mr-2">Token:</span>
              <span className="font-mono text-sm truncate max-w-[120px] sm:max-w-[200px]">{token}</span>
              <FaChevronDown className="ml-2" />
            </div>
            
            {showTokenDropdown && (
              <div className="absolute z-10 mt-1 right-0 w-full sm:w-96 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                {savedTokens.map((savedToken) => (
                  <div 
                    key={savedToken.token}
                    className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div 
                      className="truncate font-mono text-sm flex-1"
                      onClick={() => handleTokenSelect(savedToken.token)}
                    >
                      {savedToken.token}
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(savedToken.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteToken(savedToken.token);
                      }}
                      className="text-red-500 hover:text-red-700 p-1 ml-2"
                      aria-label="Delete token"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowGenerateView(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            <FaPlus size={14} />
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