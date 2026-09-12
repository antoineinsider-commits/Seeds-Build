'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface SolutionListing {
  id: string;
  title: string;
  solutionType: string;
  description: string;
  pricingModel: string;
  priceMin: number;
  rating: number;
  isFeatured: boolean;
  solver: {
    companyName: string;
    rating: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function BrowseListingsPage() {
  const [listings, setListings] = useState<SolutionListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch(`${API_URL}/listings`);
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }
        const data = await res.json();
        setListings(data);
      } catch (err) {
        console.error('Failed to load listings:', err);
        setError('Could not load listings. Is the API running?');
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  const filtered = filterType === 'ALL'
    ? listings
    : listings.filter((l) => l.solutionType === filterType);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Explore Solutions</h1>
          <p className="text-slate-600 mt-1">Vetted software, experts, and services ready to resolve your problem.</p>
        </div>
        <a
          href="/problems/new"
          className="bg-emerald-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition"
        >
          Post a Problem
        </a>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3">
        {['ALL', 'EXISTING_SOFTWARE', 'DONE_FOR_YOU_SERVICE', 'EXPERT_CONSULTANT'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              filterType === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          No listings found{filterType !== 'ALL' ? ' in this category' : ''}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.solutionType.replace(/_/g, ' ')}
                  </span>
                  {item.isFeatured && <Badge variant="featured">FEATURED</Badge>}
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h2>
                <p className="text-slate-600 text-sm line-clamp-2 mb-4">{item.description}</p>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-500">By {item.solver.companyName}</span>
                  <span className="text-xs font-medium text-amber-600">★ {item.solver.rating}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block">Starting at</span>
                    <span className="text-lg font-bold text-slate-900">${item.priceMin}</span>
                  </div>
                  <a
                    href={`/listings/${item.id}`}
                    className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800"
                  >
                    Contact Solver
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
