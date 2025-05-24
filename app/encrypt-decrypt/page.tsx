"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import CryptoJS from 'crypto-js';

export default function EncryptDecrypt() {
  const [input, setInput] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [keySize, setKeySize] = useState<string>('256');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<'encrypt' | 'decrypt' | null>(null);

  const handleKeySizeChange = (size: string) => {
    setKeySize(size);
    // Clear the key when key size changes
    setKey('');
  };

  const handleEncrypt = () => {
    if (!input) {
      setError('Please enter text to encrypt');
      return;
    }

    if (!key) {
      setError('Please enter an encryption key');
      return;
    }

    setError('');
    setLastAction('encrypt');
    
    try {
      // Configure AES with the selected key size
      const keySizeInt = parseInt(keySize);
      const encrypted = CryptoJS.AES.encrypt(
        input, 
        key,
        {
          keySize: keySizeInt / 32, // keySize is in words (32 bits)
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      ).toString();
      
      setOutput(encrypted);
    } catch (e) {
      setError(`Encryption failed: ${e.message}`);
      setOutput('');
    }
  };

  const handleDecrypt = () => {
    if (!input) {
      setError('Please enter text to decrypt');
      return;
    }

    if (!key) {
      setError('Please enter a decryption key');
      return;
    }

    setError('');
    setLastAction('decrypt');
    
    try {
      // Configure AES with the selected key size
      const keySizeInt = parseInt(keySize);
      const decrypted = CryptoJS.AES.decrypt(
        input, 
        key,
        {
          keySize: keySizeInt / 32, // keySize is in words (32 bits)
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      ).toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Decryption failed. Check your key and encrypted text.');
      }
      
      setOutput(decrypted);
    } catch (e) {
      setError('Decryption failed. Check your key and encrypted text.');
      setOutput('');
    }
  };

  const generateRandomKey = () => {
    // Generate a random key based on the selected key size
    const keySizeInBytes = parseInt(keySize) / 8;
    const randomBytes = new Uint8Array(keySizeInBytes);
    window.crypto.getRandomValues(randomBytes);
    
    // Convert to base64 for readability
    const randomKey = btoa(String.fromCharCode.apply(null, randomBytes));
    setKey(randomKey);
  };

  const clearKey = () => {
    setKey('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setInput('');
    setKey('');
    setOutput('');
    setError('');
  };

  return (
    <MainLayout activeTool="encrypt-decrypt">
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">AES Encryption and Decryption</h1>
        
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          This tool allows you to encrypt and decrypt text using AES (Advanced Encryption Standard).
          You can select different key sizes for varying levels of security.
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">AES Key Size</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleKeySizeChange('128')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    keySize === '128'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  128-bit
                </button>
                <button
                  type="button"
                  onClick={() => handleKeySizeChange('192')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    keySize === '192'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  192-bit
                </button>
                <button
                  type="button"
                  onClick={() => handleKeySizeChange('256')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    keySize === '256'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  256-bit
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Secret Key</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Enter your secret key"
                  className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={generateRandomKey}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm whitespace-nowrap"
                  title="Generate random key"
                >
                  Random Key
                </button>
                <button
                  onClick={clearKey}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm"
                  title="Clear key"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Input Text</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text to encrypt or decrypt"
                rows={5}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleEncrypt}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
              >
                Encrypt
              </button>
              <button
                onClick={handleDecrypt}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
              >
                Decrypt
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {output && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {lastAction === 'encrypt' ? 'Encrypted Text' : 'Decrypted Text'}
              </h2>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
              <pre className="whitespace-pre-wrap break-all font-mono text-sm">
                {output}
              </pre>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}