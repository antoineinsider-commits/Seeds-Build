'use client';

import React, { useState, useEffect } from 'react';
import { isLoggedIn, clearTokens } from '../lib/auth';

export default function Nav() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  const handleLogout = () => {
    clearTokens();
    window.location.href = '/';
  };

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="text-lg font-bold text-slate-900">
          SEEDS
        </a>

        <div className="flex items-center gap-6 text-sm font-medium">
          <a href="/listings" className="text-slate-600 hover:text-slate-900">
            Browse Solutions
          </a>
          <a href="/problems/new" className="text-slate-600 hover:text-slate-900">
            Post a Problem
          </a>
          <a href="/inbox" className="text-slate-600 hover:text-slate-900">
            Inbox
          </a>

          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200"
            >
              Log out
            </button>
          ) : (
            <>
              <a href="/login" className="text-slate-600 hover:text-slate-900">
                Log in
              </a>
              
                href="/signup"
                className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
              >
                Sign up
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
