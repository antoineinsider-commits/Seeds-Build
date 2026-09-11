import React from 'react';
import './globals.css';

export const metadata = {
  title: 'SEEDS — You bring the problem. SEEDS helps you find the solution.',
  description:
    'A problem-first marketplace connecting people and businesses with problems to people and businesses with solutions.',
};

// STUB LAYOUT — nav/footer and auth-aware header still need to be built
// per MASTER_AI_BUILD_PROMPT.md Section 2 (frontend product direction).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
