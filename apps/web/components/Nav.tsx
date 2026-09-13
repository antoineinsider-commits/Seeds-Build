'use client';

import React from 'react';

export const Nav: React.FC = () => {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="text-lg font-bold text-slate-900 tracking-tight">
          SEEDS
        </a>

        <div className="flex items-center gap-6">
          <a
            href="/listings"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            Browse Solutions
          </a>
          <a
            href="/problems/new"
            className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
          >
            Post a Problem
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Nav;