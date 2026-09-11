import React from 'react';

// STUB HOME PAGE — headline/CTA copy is specified in
// MASTER_AI_BUILD_PROMPT.md / PRD Section 24 ("Home Page Messaging").
// Replace with the full Play-Store-style discovery + hero section.
export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">
        You bring the problem. SEEDS helps you find the solution.
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Describe what you are struggling with. SEEDS matches you with tools,
        experts, services, knowledge, and custom builders that can help.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/problems/new"
          className="bg-emerald-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-emerald-700"
        >
          I have a problem
        </a>
        <a
          href="/listings"
          className="bg-slate-100 text-slate-800 font-medium px-6 py-3 rounded-lg hover:bg-slate-200"
        >
          I can solve problems
        </a>
      </div>
    </main>
  );
}
