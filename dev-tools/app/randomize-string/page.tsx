"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";

export default function RandomStringGenerator() {
  const [length, setLength] = useState<number>(16);
  const [lengthError, setLengthError] = useState<string>("");
  const [count, setCount] = useState<number>(1);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSpecial, setIncludeSpecial] = useState<boolean>(false);
  const [randomStrings, setRandomStrings] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === "") {
      setLength(0);
      setLengthError("Length is required");
      return;
    }
    
    const numValue = parseInt(value);
    if (numValue <= 0) {
      setLength(numValue);
      setLengthError("Length must be greater than 0");
    } else {
      setLength(numValue);
      setLengthError("");
    }
  };

  const generateRandomStrings = () => {
    if (length <= 0) {
      setLengthError("Length must be greater than 0");
      return;
    }

    let charset = "";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeNumbers) charset += "0123456789";
    if (includeSpecial) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (charset === "") {
      alert("Please select at least one character type");
      return;
    }

    const newStrings = [];
    for (let j = 0; j < count; j++) {
      let result = "";
      for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      newStrings.push(result);
    }

    setRandomStrings(newStrings);
    setCopied(null);
  };

  const copyToClipboard = (index: number) => {
    navigator.clipboard.writeText(randomStrings[index]);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAllToClipboard = () => {
    navigator.clipboard.writeText(randomStrings.join('\n'));
    setCopied(-1); // -1 indicates "all copied"
    setTimeout(() => setCopied(null), 2000);
  };

  const isGenerateDisabled = !!lengthError || length <= 0;

  const toggleOption = (setter: React.Dispatch<React.SetStateAction<boolean>>, currentValue: boolean) => {
    setter(!currentValue);
  };

  return (
    <MainLayout activeTool="randomize-string">
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Random String Generator</h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          Generate secure random strings for passwords, tokens, or any other purpose requiring unpredictable text.
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center">
                <label className="whitespace-nowrap mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">Length</label>
                <input
                  type="number"
                  value={length || ""}
                  onChange={handleLengthChange}
                  className={`w-28 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    lengthError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              
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
                onClick={generateRandomStrings}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  isGenerateDisabled
                    ? "bg-gray-300 cursor-not-allowed text-gray-500 dark:bg-gray-700 dark:text-gray-500"
                    : "bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg"
                }`}
                disabled={isGenerateDisabled}
              >
                Generate
              </button>
            </div>
            <div className="h-6 mt-2">
              {lengthError && (
                <p className="text-sm text-red-500 font-medium">{lengthError}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">Character Types</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                onClick={() => toggleOption(setIncludeUppercase, includeUppercase)}
                className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
                  includeUppercase 
                    ? "bg-green-100 dark:bg-green-900/30 border border-green-500/50 text-green-800 dark:text-green-200" 
                    : "bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-650"
                }`}
              >
                <span className="select-none text-base font-medium">Uppercase (A-Z)</span>
                {includeUppercase && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div 
                onClick={() => toggleOption(setIncludeLowercase, includeLowercase)}
                className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
                  includeLowercase 
                    ? "bg-green-100 dark:bg-green-900/30 border border-green-500/50 text-green-800 dark:text-green-200" 
                    : "bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-650"
                }`}
              >
                <span className="select-none text-base font-medium">Lowercase (a-z)</span>
                {includeLowercase && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div 
                onClick={() => toggleOption(setIncludeNumbers, includeNumbers)}
                className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
                  includeNumbers 
                    ? "bg-green-100 dark:bg-green-900/30 border border-green-500/50 text-green-800 dark:text-green-200" 
                    : "bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-650"
                }`}
              >
                <span className="select-none text-base font-medium">Numbers (0-9)</span>
                {includeNumbers && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div 
                onClick={() => toggleOption(setIncludeSpecial, includeSpecial)}
                className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
                  includeSpecial 
                    ? "bg-green-100 dark:bg-green-900/30 border border-green-500/50 text-green-800 dark:text-green-200" 
                    : "bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-650"
                }`}
              >
                <span className="select-none text-base font-medium">Special Characters (!@#$%^&*...)</span>
                {includeSpecial && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {randomStrings.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Generated Strings ({randomStrings.length})</h2>
              {randomStrings.length > 1 && (
                <button
                  onClick={copyAllToClipboard}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                >
                  {copied === -1 ? "✓ All Copied!" : "Copy All"}
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {randomStrings.map((str, index) => (
                <div key={index} className="flex items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-650 transition-colors">
                  <code className="flex-1 font-mono text-sm overflow-x-auto whitespace-nowrap px-2 py-1 text-gray-800 dark:text-gray-200">
                    {str}
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