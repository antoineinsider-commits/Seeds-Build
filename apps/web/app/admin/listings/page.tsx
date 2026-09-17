'use client';

import React, { useState, useEffect } from 'react';
import { authFetch } from '../../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface PendingListing {
  id: string;
  title: string;
  category: string;
  priceMin: number;
  priceMax: number | null;
  createdAt: string;
  solver: {
    companyName: string;
    rating: number;
    verificationStatus: string;
  };
}

export default function AdminPendingListingsPage() {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPending() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/admin/listings/pending`);
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          throw new Error('You need an Admin account to view this page.');
        }
        throw new Error(`Failed to load pending listings (${res.status})`);
      }
      setListings(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending listings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPending();
  }, []);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-slate-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Pending Listings
        </h1>

        <span className="text-sm text-slate-500">
          {listings.length} awaiting review
        </span>
      </div>

      <button
        onClick={() => (window.location.href = '/admin/audit-logs')}
        className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800"
      >
        Audit Logs
      </button>
    </div>

      {listings.length === 0 ? (
        <p className="text-slate-500">No listings are currently pending review.</p>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="border border-slate-200 rounded-xl p-5 flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    PENDING
                  </span>
                  <span className="text-xs text-slate-400">
                    Submitted {new Date(listing.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="font-semibold text-slate-900">{listing.title}</h2>
                <p className="text-sm text-slate-500">
                  {listing.category} &middot; By {listing.solver.companyName} &middot; ${listing.priceMin}
                  {listing.priceMax ? `–$${listing.priceMax}` : '+'}
                </p>
              </div>
              <button
                onClick={() => (window.location.href = `/admin/listings/${listing.id}`)}
                className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800"
              >
                Review
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
