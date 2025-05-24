"use client";

import { useState } from "react";
import Link from "next/link";

export default function Sidebar({ activeTool }: { activeTool?: string | null }) {
  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 p-4">
      <nav>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase">Tools</h2>
        <ul className="space-y-2">
          <li>
            <Link 
              href="/webhook-test"
              className={`flex w-full items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-left ${
                activeTool === "webhook-test" ? "bg-gray-100 dark:bg-gray-800" : ""
              }`}
            >
              <span>Webhook Test</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/uuid"
              className={`flex w-full items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-left ${
                activeTool === "uuid" ? "bg-gray-100 dark:bg-gray-800" : ""
              }`}
            >
              <span>UUID Generator</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/randomize-string"
              className={`flex w-full items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-left ${
                activeTool === "randomize-string" ? "bg-gray-100 dark:bg-gray-800" : ""
              }`}
            >
              <span>Random String Generator</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/encrypt-decrypt"
              className={`flex w-full items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-left ${
                activeTool === "encrypt-decrypt" ? "bg-gray-100 dark:bg-gray-800" : ""
              }`}
            >
              <span>AES Encryption</span>
            </Link>
          </li>
          {/* Add more tools here */}
        </ul>

        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-8 mb-4 uppercase">External Tools</h2>
        <ul className="space-y-2">
          <li>
            <a 
              href="https://crontab.guru/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
            >
              <span>Crontab Guru</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 text-gray-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                />
              </svg>
            </a>
          </li>
          <li>
            <a 
              href="https://it-tools.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
            >
              <span>IT Tools</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 text-gray-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                />
              </svg>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}