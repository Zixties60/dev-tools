import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { FaTrash, FaSync, FaSpinner, FaPlus, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { formatDate } from '@/lib/utils/dateFormat';

interface SavedToken {
  token: string;
  name: string;
  createdAt: number;
}

// Define the props interface for TokenListView
export interface TokenListViewProps {
  onTokenGenerated: (token: string) => void;
  onTokenSelect: (token: string) => void;
  onDeleteRequest: (token: string) => void;
  onCopyToken: (token: string) => void;
  copiedToken: string | null;
}

// Define the ref interface
export interface TokenListViewRef {
  loadSavedTokens: () => Promise<void>;
}

const TokenListView = forwardRef<TokenListViewRef, TokenListViewProps>(
  ({ 
    onTokenGenerated, 
    onTokenSelect,
    onDeleteRequest,
    onCopyToken,
    copiedToken,
  }, ref) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [savedTokens, setSavedTokens] = useState<SavedToken[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Load saved tokens on component mount
  useEffect(() => {
    loadSavedTokens();
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingTokenId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTokenId]);

  const loadSavedTokens = async () => {
    try {
      const response = await fetch('/api/webhook-test/tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      
      const data = await response.json();
      if (data.tokens) {
        setSavedTokens(data.tokens);
      }
    } catch (error) {
      console.error('Error loading saved tokens:', error);
      setError('Failed to load tokens. Please try again.');
    }
  };

  useImperativeHandle(ref, () => ({
    loadSavedTokens,
  }));

  const refreshTokens = async () => {
    setIsRefreshing(true);
    try {
      await loadSavedTokens();
      // Clear selections after refresh
      setSelectedTokens(new Set());
    } catch (err) {
      console.error('Error refreshing tokens:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateToken = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError("");
    
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
      
      // Refresh the token list
      await loadSavedTokens();
      
      onTokenGenerated(data.token);
    } catch (err) {
      console.error('Token generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate token. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteToken = (e: React.MouseEvent, tokenId: string) => {
    e.stopPropagation(); // Prevent navigation to token detail
    
    // If onDeleteRequest is provided, use it
    if (onDeleteRequest) {
      onDeleteRequest(tokenId);
    } else {
      // Fallback to direct deletion if needed
      deleteToken(tokenId);
    }
  };

  // This function would be called from the parent after confirmation
  const deleteToken = async (tokenId: string) => {
    try {
      // Delete from Redis
      const response = await fetch(`/api/webhook-test/token/${tokenId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete token from server');
      }
      
      // Refresh the token list
      await loadSavedTokens();
      
      // Remove from selected tokens if it was selected
      if (selectedTokens.has(tokenId)) {
        const newSelected = new Set(selectedTokens);
        newSelected.delete(tokenId);
        setSelectedTokens(newSelected);
      }
    } catch (error) {
      console.error('Error deleting token:', error);
      alert('Failed to delete token. Please try again.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTokens.size === 0) {
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedTokens.size} selected token(s)? This will remove all associated data.`)) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Delete each selected token
      for (const tokenToDelete of selectedTokens) {
        try {
          // Delete from Redis
          await fetch(`/api/webhook-test/token/${tokenToDelete}`, {
            method: 'DELETE'
          });
        } catch (error) {
          console.error(`Error deleting token ${tokenToDelete}:`, error);
        }
      }
      
      // Refresh the token list
      await loadSavedTokens();
      
      // Clear selections
      setSelectedTokens(new Set());
    } catch (error) {
      console.error('Error deleting selected tokens:', error);
      alert('Some tokens could not be deleted. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTokenSelection = (e: React.ChangeEvent<HTMLInputElement>, tokenId: string) => {
    e.stopPropagation();
    
    const newSelected = new Set(selectedTokens);
    if (e.target.checked) {
      newSelected.add(tokenId);
    } else {
      newSelected.delete(tokenId);
    }
    
    setSelectedTokens(newSelected);
  };

  const toggleAllTokens = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all tokens
      const allTokenIds = savedTokens.map(t => t.token);
      setSelectedTokens(new Set(allTokenIds));
    } else {
      // Deselect all
      setSelectedTokens(new Set());
    }
  };

  const startEditing = (e: React.MouseEvent, token: string, currentName: string) => {
    e.stopPropagation();
    setEditingTokenId(token);
    setEditingName(currentName);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTokenId(null);
    setEditingName("");
  };

  const saveTokenName = async (e: React.MouseEvent, token: string) => {
    e.stopPropagation();
    
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
      
      // Refresh the token list
      await loadSavedTokens();
      
      // Exit edit mode
      setEditingTokenId(null);
      setEditingName("");
    } catch (error) {
      console.error('Error updating token name:', error);
      alert('Failed to update token name. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, token: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTokenName(e as unknown as React.MouseEvent, token);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing(e as unknown as React.MouseEvent);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 pt-3 px-6 pb-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Your Webhook URLs</h3>
          
          <div className="flex items-center gap-3">
            {selectedTokens.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 border border-red-500 hover:border-red-600 dark:text-red-400 dark:hover:text-red-300 dark:border-red-500 dark:hover:border-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
              >
                {isDeleting ? (
                  <FaSpinner className="animate-spin" size={14} />
                ) : (
                  <FaTrash size={14} />
                )}
                <span>Delete Selected ({selectedTokens.size})</span>
              </button>
            )}
            
            <button
              onClick={refreshTokens}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 border border-blue-500 hover:border-blue-600 dark:text-blue-400 dark:hover:text-blue-300 dark:border-blue-500 dark:hover:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
            >
              {isRefreshing ? (
                <FaSpinner className="animate-spin" size={14} />
              ) : (
                <FaSync size={14} />
              )}
              <span>Refresh</span>
            </button>
            
            <button
              onClick={generateToken}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {isGenerating ? (
                <FaSpinner className="animate-spin" size={14} />
              ) : (
                <FaPlus size={14} />
              )}
              <span>New Token</span>
            </button>
          </div>
        </div>
        
        {savedTokens.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        checked={selectedTokens.size === savedTokens.length && savedTokens.length > 0}
                        onChange={toggleAllTokens}
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Token
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {savedTokens.map((savedToken) => (
                  <tr 
                    key={savedToken.token} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => editingTokenId !== savedToken.token && onTokenSelect(savedToken.token)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        checked={selectedTokens.has(savedToken.token)}
                        onChange={(e) => toggleTokenSelection(e, savedToken.token)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingTokenId === savedToken.token ? (
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, savedToken.token)}
                            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-sm w-full"
                          />
                          <button 
                            onClick={(e) => saveTokenName(e, savedToken.token)}
                            className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <FaCheck size={14} />
                          </button>
                          <button 
                            onClick={cancelEditing}
                            className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{savedToken.name}</span>
                          <button
                            onClick={(e) => startEditing(e, savedToken.token, savedToken.name)}
                            className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Edit name"
                          >
                            <FaEdit size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {savedToken.token}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(savedToken.createdAt)}
                    </td>
                    <td 
                      className="w-20 py-4 whitespace-nowrap text-center" 
                      onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking anywhere in this cell
                    >
                      <div className="flex justify-center">
                        <button
                          onClick={(e) => handleDeleteToken(e, savedToken.token)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 inline-flex items-center justify-center"
                          aria-label={`Delete token ${savedToken.token}`}
                          title="Delete token"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No webhook URLs generated yet.</p>
            <button
              onClick={generateToken}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              <FaPlus size={14} />
              <span>Generate Your First Token</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

TokenListView.displayName = 'TokenListView';

export default TokenListView;