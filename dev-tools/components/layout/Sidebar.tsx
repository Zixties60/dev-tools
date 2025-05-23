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
          {/* Add more tools here */}
        </ul>
      </nav>
    </aside>
  );
}