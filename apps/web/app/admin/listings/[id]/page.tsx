'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { authFetch } from '../../../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ListingForModeration {
  id: string;
  title: string;
  solutionType: string;
  problemItSolves: string;
  targetCustomer: string;
  description: string;
  pricingModel: string;
  priceMin: number;
  priceMax: number | null;
  deliveryTimeDays: number;
  category: string;
  tags: string[];
  verificationStatus: string;
  createdAt: string;
  solver: {
    id: string;
    companyName: string;
    bio: string;
    rating: number;
    verificationStatus: string;
  };
}

export default function AdminListingReviewPage() {
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<ListingForModeration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);
  const [result, setResult] = useState<'VERIFIED' | 'REJECTED' | null>(null);

  async function fetchListing() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/admin/listings/${listingId}`);
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          throw new Error('You need an Admin account to view this page.');
        }
        if (res.status === 404) {
          throw new Error('Listing not found.');
        }
        throw new Error(`Failed to load listing (${res.status})`);
      }
      setListing(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchListing();
  }, [listingId]);

  const handleDecision = async (status: 'VERIFIED' | 'REJECTED') => {
    const confirmed = window.confirm(
      status === 'VERIFIED'
        ? 'Approve this listing? It will immediately become publicly visible in Browse Solutions.'
        : 'Reject this listing? The solver will need to submit a new one — this cannot be undone here.',
    );
    if (!confirmed) return;

    setActionError(null);
    setActioning(true);
    try {
      const res = await authFetch(`${API_URL}/admin/listings/${listingId}/verification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message?.message || body.message || `Action failed (${res.status})`);
      }
      setResult(status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-12 text-slate-500">Loading...</div>;
  }

  if (error || !listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error || 'Listing not found'}
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Listing {result === 'VERIFIED' ? 'approved' : 'rejected'}
        </h1>
        <p className="text-slate-600 mb-6">
          {result === 'VERIFIED'
            ? 'This listing is now live in Browse Solutions.'
            : 'This listing has been rejected and will not appear publicly.'}
        </p>
        <button
          onClick={() => (window.location.href = '/admin/listings')}
          className="bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-800"
        >
          Back to pending listings
        </button>
      </div>
    );
  }

  const alreadyDecided = listing.verificationStatus !== 'PENDING';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-6">
        <span
          className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
            listing.verificationStatus === 'PENDING'
              ? 'text-amber-600 bg-amber-50'
              : listing.verificationStatus === 'VERIFIED'
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-red-700 bg-red-50'
          }`}
        >
          {listing.verificationStatus}
        </span>
        <span className="text-xs text-slate-400">
          Submitted {new Date(listing.createdAt).toLocaleDateString()}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">{listing.title}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {listing.solutionType.replace(/_/g, ' ')} &middot; {listing.category}
      </p>

      <div className="space-y-4 mb-8">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Problem it solves</h2>
          <p className="text-slate-600 text-sm">{listing.problemItSolves}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Target customer</h2>
          <p className="text-slate-600 text-sm">{listing.targetCustomer}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Description</h2>
          <p className="text-slate-600 text-sm">{listing.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Pricing</h2>
            <p className="text-slate-600 text-sm">
              {listing.pricingModel} &middot; ${listing.priceMin}
              {listing.priceMax ? `–$${listing.priceMax}` : '+'}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Delivery</h2>
            <p className="text-slate-600 text-sm">{listing.deliveryTimeDays} days</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6 mb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Solver</h2>
        <p className="text-slate-900 font-medium">{listing.solver.companyName}</p>
        <p className="text-sm text-slate-500 mb-1">
          Solver verification: {listing.solver.verificationStatus} &middot; Rating: {listing.solver.rating}
        </p>
        <p className="text-slate-600 text-sm">{listing.solver.bio}</p>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {actionError}
        </div>
      )}

      {alreadyDecided ? (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg p-4">
          This listing has already been {listing.verificationStatus.toLowerCase()} and cannot be
          reviewed again here.
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => handleDecision('VERIFIED')}
            disabled={actioning}
            className="bg-emerald-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {actioning ? 'Working...' : 'Approve'}
          </button>
          <button
            onClick={() => handleDecision('REJECTED')}
            disabled={actioning}
            className="bg-red-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {actioning ? 'Working...' : 'Reject'}
          </button>
        </div>
      )}
    </div>
  );
}
