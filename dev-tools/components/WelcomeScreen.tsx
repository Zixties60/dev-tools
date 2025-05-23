import React from 'react';

const WelcomeScreen = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome to DevTools</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="mb-4">This is a collection of tools to help with development and testing.</p>
        <p className="mb-4">Select a tool from the left menu to get started.</p>
        <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md text-blue-800 dark:text-blue-200">
          <p>First available tool: <strong>Webhook Test</strong> - Create and test webhooks with custom responses.</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;