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
  
  // Fix the webhook URL path to use webhook-test instead of webhook
  const webhookUrl = `${window.location.origin}/api/webhook-test/${token}`;
  
  // Calculate expiration date (30 days from creation)
  const expirationDate = new Date(createdAt + (TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000));
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
  
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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4">Your Webhook URL</h2>
      <p className="mb-4">
        Send requests to this URL to test your webhook integration.
      </p>
      
      <div className="flex items-center">
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-3 rounded-l-md font-mono text-sm overflow-x-auto">
          {webhookUrl}
        </div>
        <button
          onClick={copyToClipboard}
          className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 p-3 rounded-r-md"
          aria-label="Copy to clipboard"
        >
          {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
        </button>
      </div>
      
      <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
        <FaClock className="mr-2" />
        <div>
          <p>Created: {formatDate(createdAt)}</p>
          <p>Expires: {formatDate(expirationDate)} ({daysRemaining} days remaining)</p>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Send any HTTP request to this URL and it will be captured for inspection.
          You can customize the response in the configuration tab.
        </p>
      </div>
    </div>
  );
};

export default TokenView;