import React, { useState } from 'react';
import GenerateTokenView from './webhook-test/GenerateTokenView';
import TokenDetailsView from './webhook-test/TokenDetailsView';

const WebhookTestTool = () => {
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Webhook Test</h1>
      
      {!currentToken ? (
        <GenerateTokenView onTokenGenerated={setCurrentToken} />
      ) : (
        <TokenDetailsView 
          token={currentToken} 
          onReset={() => setCurrentToken(null)} 
        />
      )}
    </div>
  );
};

export default WebhookTestTool;