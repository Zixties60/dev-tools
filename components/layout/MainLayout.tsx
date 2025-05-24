"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { MdLightMode, MdDarkMode, MdComputer } from "react-icons/md";
import Sidebar from "./Sidebar";

export default function MainLayout({ 
  children, 
  activeTool 
}: { 
  children: React.ReactNode;
  activeTool?: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Only show UI after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [themeDropdownRef]);

  // Function to cycle through themes
  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  // Function to get the current theme icon
  const getThemeIcon = () => {
    if (!mounted) return <MdComputer className="h-5 w-5" />;
    
    if (theme === 'light') {
      return <MdLightMode className="h-5 w-5" />;
    } else if (theme === 'dark') {
      return <MdDarkMode className="h-5 w-5" />;
    } else {
      return <MdComputer className="h-5 w-5" />;
    }
  };

  // Function to get the theme label for accessibility
  const getThemeLabel = () => {
    if (!mounted) return 'Toggle theme';
    
    if (theme === 'light') {
      return 'Light mode';
    } else if (theme === 'dark') {
      return 'Dark mode';
    } else {
      return 'System theme';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center gap-2"
          >
            <Image 
              src="/logo.svg" 
              alt="DevTools Logo" 
              width={32} 
              height={32} 
              className="dark:invert"
            />
            <span className="font-bold text-xl">DevTools</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {mounted && (
            <div 
              ref={themeDropdownRef}
              className="relative"
            >
              <button 
                onClick={cycleTheme}
                onMouseEnter={() => setShowThemeDropdown(true)}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={`${getThemeLabel()} (click to cycle)`}
                title={`${getThemeLabel()} (click to cycle)`}
              >
                {getThemeIcon()}
              </button>
              
              {/* Theme dropdown */}
              {showThemeDropdown && (
                <div 
                  className="absolute right-0 mt-2 min-w-max rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10"
                  onMouseLeave={() => setShowThemeDropdown(false)}
                >
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => { setTheme('system'); setShowThemeDropdown(false); }}
                      className={`flex items-center gap-2 px-3 py-2 text-sm w-full text-left whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        theme === 'system' ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                      role="menuitem"
                    >
                      <MdComputer className="h-5 w-5" />
                      System
                    </button>
                    <button
                      onClick={() => { setTheme('light'); setShowThemeDropdown(false); }}
                      className={`flex items-center gap-2 px-3 py-2 text-sm w-full text-left whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        theme === 'light' ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                      role="menuitem"
                    >
                      <MdLightMode className="h-5 w-5" />
                      Light
                    </button>
                    <button
                      onClick={() => { setTheme('dark'); setShowThemeDropdown(false); }}
                      className={`flex items-center gap-2 px-3 py-2 text-sm w-full text-left whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                      role="menuitem"
                    >
                      <MdDarkMode className="h-5 w-5" />
                      Dark
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <a
            href="https://github.com/Zixties60"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            aria-label="GitHub repository"
          >
            <FaGithub className="h-6 w-6" />
          </a>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left sidebar */}
        <Sidebar activeTool={activeTool} />

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}