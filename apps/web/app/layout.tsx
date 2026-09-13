import React from 'react';
import './globals.css';
import Nav from '../components/Nav';

export const metadata = {
  title: 'SEEDS — You bring the problem. SEEDS helps you find the solution.',
  description:
    'A problem-first marketplace connecting people and businesses with problems to people and businesses with solutions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
