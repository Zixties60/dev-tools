"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import TokenView from '@/components/tools/webhook-test/TokenView';
import ResponseConfig from '@/components/tools/webhook-test/ResponseConfig';
import RequestsView from '@/components/tools/webhook-test/RequestsView';
import { FaArrowLeft, FaTrash, FaEdit, FaCheck, FaTimes, FaCopy } from 'react-icons/fa';

interface TokenParams {
  token: string;
}

interface TokenDetailPageProps {
  params: Promise<TokenParams> | undefined;
}

const TokenDetailPage: React.FC<TokenDetailPageProps> = ({ params }) => {
  // Unwrap the params object using React.use() with proper typing
  const resolvedParams = params ? React.use(params) : { token: '' };
  const token = resolvedParams.token;
  
  const router = useRouter();
  const [tokenName, setTokenName] = useState<string>("");
  const [tokenCreatedAt, setTokenCreatedAt] = useState<number>(Date.now());
  const [activeTab, setActiveTab] = useState<'config' | 'requests'>('config');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load token information when component mounts
  useEffect(() => {
    if (token) {
      fetchTokenInfo();
    }
  }, [token]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  // Reset copy success message after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const fetchTokenInfo = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/webhook-test/token/${token}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Token not found. It may have expired or been deleted.');
        }
        throw new Error('Failed to load token information');
      }
      
      const data = await response.json();
      
      if (data.createdAt) {
        setTokenCreatedAt(data.createdAt);
      }
      
      if (data.name) {
        setTokenName(data.name);
      } else {
        setTokenName(token);
      }
    } catch (err) {
      console.error('Error fetching token info:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading token information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    router.push('/webhook-test');
  };

  const handleDeleteToken = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteToken = async () => {
    try {
      // Delete from Redis
      const response = await fetch(`/api/webhook-test/token/${token}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete token from server');
      }
      
      // Close the modal
      setIsDeleteModalOpen(false);
      
      // Go back to token list
      router.push('/webhook-test');
    } catch (error) {
      console.error('Error deleting token:', error);
      alert('Failed to delete token. Please try again.');
      setIsDeleteModalOpen(false);
    }
  };

  const cancelDeleteToken = () => {
    setIsDeleteModalOpen(false);
  };

  const startEditingName = () => {
    setEditingName(tokenName);
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditingName("");
  };

  const saveTokenName = async () => {
    if (!editingName.trim()) {
      alert('Token name cannot be empty');
      return;
    }
    
    try {
      // Update name on server
      const response = await fetch(`/api/webhook-test/token/${token}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: editingName.trim() })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update token name');
      }
      
      // Update in state
      setTokenName(editingName.trim());
      
      // Exit edit mode
      setIsEditingName(false);
      setEditingName("");
    } catch (error) {
      console.error('Error updating token name:', error);
      alert('Failed to update token name. Please try again.');
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTokenName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingName();
    }
  };

  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(token)
      .then(() => {
        setCopySuccess(true);
      })
      .catch(err => {
        console.error('Failed to copy token: ', err);
        alert('Failed to copy token to clipboard');
      });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">
            Loading token information...
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div>
          <div className="flex items-center mb-6">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <FaArrowLeft size={14} />
              <span>Back to Webhook List</span>
            </button>
          </div>
          
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md">
            <h3 className="text-lg font-medium mb-2">Error</h3>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <FaArrowLeft size={14} />
              <span>Back</span>
            </button>
            
            <div className="ml-4">
              {isEditingName ? (
                <div className="flex items-center">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-lg font-semibold w-96"
                    placeholder="Enter token name"
                  />
                  <button 
                    onClick={saveTokenName}
                    className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    title="Save name"
                  >
                    <FaCheck size={16} />
                  </button>
                  <button 
                    onClick={cancelEditingName}
                    className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Cancel"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <h2 className="text-lg font-semibold">{tokenName}</h2>
                    <button
                      onClick={startEditingName}
                      className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Edit name"
                    >
                      <FaEdit size={14} />
                    </button>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="mr-1">Token:</span>
                    <code className="font-mono">{token}</code>
                    <button
                      onClick={copyTokenToClipboard}
                      className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
                      title="Copy token to clipboard"
                    >
                      <FaCopy size={12} />
                      {copySuccess && (
                        <span className="ml-1 text-green-500 text-xs">Copied!</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteToken}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <FaTrash size={14} />
              <span>Delete Token</span>
            </button>
          </div>
        </div>
        
        <TokenView token={token} createdAt={tokenCreatedAt} />
        
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
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {activeTab === 'config' ? (
            <ResponseConfig token={token} />
          ) : (
            <RequestsView token={token} />
          )}
        </div>
      </div>
    );
  };

  return (
    <MainLayout activeTool="webhook-test">
      {renderContent()}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this webhook token? This action cannot be undone and all associated data will be removed.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteToken}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteToken}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default TokenDetailPage;