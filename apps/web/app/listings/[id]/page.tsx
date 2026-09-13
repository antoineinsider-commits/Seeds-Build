'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getAccessToken, isLoggedIn } from '../../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  problemItSolves: string;
  priceMin: number;
  priceMax: number | null;
  pricingModel: string;
  solver: {
    companyName: string;
    rating: number;
    bio: string;
  };
}

interface MyProblem {
  id: string;
  title: string;
}

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [myProblems, setMyProblems] = useState<MyProblem[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`${API_URL}/listings/${listingId}`);
        if (!res.ok) throw new Error(`Listing not found (${res.status})`);
        setListing(await res.json());
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [listingId]);

  useEffect(() => {
    if (!isLoggedIn()) return;
    async function fetchMyProblems() {
      const res = await fetch(`${API_URL}/problems/mine`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyProblems(data);
        if (data.length > 0) setSelectedProblemId(data[0].id);
      }
    }
    fetchMyProblems();
  }, []);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);

    if (!isLoggedIn()) {
      window.location.href = '/login';
      return;
    }
    if (!selectedProblemId) {
      setSendError('You need at least one submitted problem to send a contact request.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          problemId: selectedProblemId,
          listingId,
          message,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message?.message || body.message || `Request failed (${res.status})`);
      }

      setSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-slate-500">Loading...</div>;
  }

  if (loadError || !listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {loadError || 'Listing not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{listing.title}</h1>
      <p className="text-sm text-slate-500 mb-6">
        By {listing.solver.companyName} &middot; {listing.solver.rating} rating
      </p>

      <p className="text-slate-700 mb-4">{listing.description}</p>
      <p className="text-slate-600 text-sm mb-8">{listing.problemItSolves}</p>

      <div className="border-t border-slate-200 pt-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Contact this solver</h2>

        {sent ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg p-4">
            Your request has been sent. The solver will respond soon.
          </div>
        ) : !isLoggedIn() ? (
          <div className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg p-4">
            You need to log in to contact a solver.
          </div>
        ) : myProblems.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg p-4">
            You need to submit a problem before contacting a solver.
          </div>
        ) : (
          <form onSubmit={handleContact} className="space-y-4">
            {sendError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {sendError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Which of your problems is this about?
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg p-3 text-sm"
                value={selectedProblemId}
                onChange={(e) => setSelectedProblemId(e.target.value)}
              >
                {myProblems.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea
                rows={4}
                required
                minLength={10}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm"
                placeholder="Tell the solver what you're looking for..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="bg-emerald-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
