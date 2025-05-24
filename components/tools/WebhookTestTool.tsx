"use client";

import React, { useState, useRef } from 'react';
import TokenListView from './webhook-test/TokenListView';
import { useRouter } from 'next/navigation';

const WebhookTestTool: React.FC = () => {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const tokenListRef = useRef<any>(null);

  const handleTokenSelect = (token: string) => {
    router.push(`/webhook-test/${token}`);
  };

  const handleTokenGenerated = (token: string) => {
    router.push(`/webhook-test/${token}`);
  };

  const handleDeleteRequest = (token: string) => {
    setTokenToDelete(token);
    setIsDeleteModalOpen(true);
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Webhook Testing Tool</h2>
      
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-300">
          Create a unique webhook URL that you can use to test your webhook integrations. 
          The URL will be valid for 30 days and will capture all requests sent to it.
        </p>
      </div>
      
      <TokenListView 
        onTokenGenerated={handleTokenGenerated}
        onTokenSelect={handleTokenSelect}
        onDeleteRequest={handleDeleteRequest}
        onCopyToken={handleCopyToken}
        copiedToken={copiedToken}
        ref={tokenListRef}
      />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this webhook token? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTokenToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (tokenToDelete) {
                    try {
                      const response = await fetch(`/api/webhook-test/token/${tokenToDelete}`, {
                        method: 'DELETE'
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to delete token');
                      }
                      
                      // Close the modal
                      setIsDeleteModalOpen(false);
                      setTokenToDelete(null);
                      
                      // Refresh the token list
                      if (tokenListRef.current && tokenListRef.current.loadSavedTokens) {
                        tokenListRef.current.loadSavedTokens();
                      } else {
                        // Fallback: reload the page
                        window.location.reload();
                      }
                    } catch (error) {
                      console.error('Error deleting token:', error);
                      alert('Failed to delete token. Please try again.');
                    }
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookTestTool;
