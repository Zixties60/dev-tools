"use client";

import React, { useState } from 'react';
import { FaCopy, FaCheck, FaClock } from 'react-icons/fa';
import { formatDate } from '@/lib/utils/dateFormat';

interface TokenViewProps {
  token: string;
  createdAt: number;
}

const TOKEN_EXPIRATION_DAYS = 30;

const TokenView: React.FC<TokenViewProps> = ({ token, createdAt }) => {
  const [copied, setCopied] = useState(false);
  const webhookUrl = `${window.location.origin}/api/webhook-test/${token}`;
  
  // Calculate expiration date
  const expirationDate = new Date(createdAt + (TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000));
  const daysRemaining = Math.max(0, Math.ceil((expirationDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)));
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-2">Webhook URL</h2>
      
      <div className="flex items-center mb-2">
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-l-md font-mono text-xs overflow-x-auto whitespace-nowrap">
          {webhookUrl}
        </div>
        <button
          onClick={copyToClipboard}
          className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 p-2 rounded-r-md"
          aria-label="Copy to clipboard"
        >
          {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
        </button>
      </div>
      
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        Send POST requests to this URL to test your webhook integration. Requests will be captured for inspection.
      </p>
      
      <div className="border-t pt-2 mt-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-1">
          <FaClock className="mr-1 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-sm font-medium">
            <span className="text-amber-600 dark:text-amber-400">
              Expires in {daysRemaining} days
            </span>
            <span className="text-gray-600 dark:text-gray-400 text-xs ml-2">
              ({formatDate(expirationDate)})
            </span>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
          Created: {formatDate(createdAt)}
        </div>
      </div>
    </div>
  );
};

export default TokenView;