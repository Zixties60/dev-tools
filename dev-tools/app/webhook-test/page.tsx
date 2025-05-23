"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function WebhookTest() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const generateToken = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/webhook-test/generate-token', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate token');
      }
      
      const data = await response.json();
      setToken(data.token);
      router.push(`/webhook-test/${data.token}`);
    } catch (err) {
      setError('Failed to generate token. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Webhook Test</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Generate a Webhook URL</h2>
        <p className="mb-6">
          Create a unique webhook URL that you can use to test your webhook integrations. 
          The URL will be valid for 1 month and will capture all requests sent to it.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <button
          onClick={generateToken}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Webhook URL'}
        </button>
      </div>
    </div>
  );
}