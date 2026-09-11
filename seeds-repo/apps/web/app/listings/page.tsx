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
  solverName: string;
}

export default function BrowseListingsPage() {
  const [listings, setListings] = useState<SolutionListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    // Simulated fetch from API backend
    setTimeout(() => {
      setListings([
        {
          id: '1',
          title: 'Inventory Sync Automation for Local Restaurants',
          solutionType: 'DONE_FOR_YOU_SERVICE',
          description: 'Connect POS directly to supplier portals to auto-order stock before weekends.',
          pricingModel: 'Fixed',
          priceMin: 499,
          rating: 4.9,
          isFeatured: true,
          solverName: 'Apex Automation Studio',
        },
        {
          id: '2',
          title: 'SaaS POS & Kitchen Execution System',
          solutionType: 'EXISTING_SOFTWARE',
          description: 'Cloud-native kitchen display software with real-time ticket routing.',
          pricingModel: 'Subscription',
          priceMin: 79,
          rating: 4.7,
          isFeatured: false,
          solverName: 'KitchenPulse Systems',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filtered = filterType === 'ALL' 
    ? listings 
    : listings.filter(l => l.solutionType === filterType);

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

      {/* Filter Tabs */}
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

      {/* Grid UI */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl" />
          ))}
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
                  <span className="text-xs text-slate-500">By {item.solverName}</span>
                  <span className="text-xs font-medium text-amber-600">★ {item.rating}</span>
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
