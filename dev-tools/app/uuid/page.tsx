"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { v4 as uuidv4 } from 'uuid';

export default function UUIDGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState<number>(1);
  const [copied, setCopied] = useState<number | null>(null);

  const generateUUIDs = () => {
    const newUuids = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(uuidv4());
    }
    setUuids(newUuids);
    setCopied(null);
  };

  const copyToClipboard = (index: number) => {
    navigator.clipboard.writeText(uuids[index]);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAllToClipboard = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
    setCopied(-1); // -1 indicates "all copied"
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <MainLayout activeTool="uuid">
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">UUID Generator</h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          A UUID (Universally Unique Identifier) is a 128-bit identifier that is unique across both space and time. 
          They are commonly used in distributed systems as identifiers for resources, database records, or any entity 
          that needs a globally unique ID.
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Generate UUIDs</h2>
          
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center">
                <label className="whitespace-nowrap mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">Number of results</label>
                <div className="flex gap-1.5">
                  {[1, 5, 10, 15, 20].map((num) => (
                    <button 
                      key={num}
                      onClick={() => setCount(num)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-all ${
                        count === num 
                          ? "bg-blue-500 text-white shadow-md" 
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={generateUUIDs}
                className="px-6 py-2.5 rounded-lg font-medium transition-all bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
        
        {uuids.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Generated UUIDs ({uuids.length})</h2>
              {uuids.length > 1 && (
                <button
                  onClick={copyAllToClipboard}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                >
                  {copied === -1 ? "✓ All Copied!" : "Copy All"}
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {uuids.map((uuid, index) => (
                <div key={index} className="flex items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-650 transition-colors">
                  <code className="flex-1 font-mono text-sm overflow-x-auto whitespace-nowrap px-2 py-1 text-gray-800 dark:text-gray-200">
                    {uuid}
                  </code>
                  <button
                    onClick={() => copyToClipboard(index)}
                    className={`ml-3 px-4 py-2 text-sm rounded-lg transition-all ${
                      copied === index 
                        ? "bg-green-500 text-white" 
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    } shadow-md`}
                  >
                    {copied === index ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}