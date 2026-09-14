'use client';

import { useEffect, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type PendingListing = {
  id: string;
  title: string;
  description: string;
  price: number | string;
  verificationStatus: string;
  createdAt: string;
  solver?: {
    companyName: string | null;
    rating: number | null;
    verificationStatus: string;
  };
};

type AuthTokens = {
  accessToken?: string;
};

function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const possibleKeys = [
    'accessToken',
    'access_token',
    'seeds_access_token',
    'tokens',
  ];

  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);

    if (!value) continue;

    try {
      const parsed = JSON.parse(value) as AuthTokens;

      if (parsed.accessToken) {
        return parsed.accessToken;
      }
    } catch {
      return value;
    }
  }

  return null;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadPendingListings = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const token = getAccessToken();

      if (!token) {
        throw new Error('You are not logged in.');
      }

      const response = await fetch(
        `${API_URL}/admin/listings/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));

        throw new Error(
          body.message ||
            `Failed to load pending listings (${response.status})`,
        );
      }

      const data = await response.json();

      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load pending listings',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingListings();
  }, []);

  const updateVerification = async (
    listingId: string,
    status: 'VERIFIED' | 'REJECTED',
  ) => {
    setActionId(listingId);
    setError(null);
    setMessage(null);

    try {
      const token = getAccessToken();

      if (!token) {
        throw new Error('You are not logged in.');
      }

      const response = await fetch(
        `${API_URL}/admin/listings/${listingId}/verification`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));

        throw new Error(
          body.message ||
            `Failed to update listing (${response.status})`,
        );
      }

      setListings((current) =>
        current.filter((listing) => listing.id !== listingId),
      );

      setMessage(
        status === 'VERIFIED'
          ? 'Listing verified successfully.'
          : 'Listing rejected successfully.',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update listing',
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-emerald-600 mb-1">
              SEEDS ADMIN
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Listing Moderation
            </h1>

            <p className="text-slate-600 mt-2">
              Review and approve solver listings before they appear
              publicly.
            </p>
          </div>

          <button
            onClick={loadPendingListings}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {message}
          </div>
        )}

        {!loading && !error && (
          <div className="mb-6">
            <div className="inline-flex items-center rounded-full bg-white border border-slate-200 px-4 py-2">
              <span className="font-semibold text-slate-900">
                {listings.length}
              </span>

              <span className="ml-2 text-slate-600">
                pending listing
                {listings.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
            Loading pending listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="text-4xl mb-4">✓</div>

            <h2 className="text-xl font-semibold text-slate-900">
              No pending listings
            </h2>

            <p className="text-slate-500 mt-2">
              All submitted listings have been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {listings.map((listing) => {
              const isProcessing = actionId === listing.id;

              return (
                <article
                  key={listing.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                            PENDING
                          </span>

                          <span className="text-xs text-slate-400">
                            ID: {listing.id}
                          </span>
                        </div>

                        <h2 className="text-xl font-bold text-slate-900">
                          {listing.title}
                        </h2>

                        <p className="text-slate-600 mt-3 whitespace-pre-wrap">
                          {listing.description}
                        </p>

                        <div className="grid sm:grid-cols-3 gap-4 mt-6">
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide">
                              Price
                            </p>

                            <p className="font-semibold text-slate-900 mt-1">
                              {String(listing.price)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide">
                              Solver
                            </p>

                            <p className="font-semibold text-slate-900 mt-1">
                              {listing.solver?.companyName ||
                                'Unnamed solver'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide">
                              Solver verification
                            </p>

                            <p className="font-semibold text-slate-900 mt-1">
                              {listing.solver?.verificationStatus ||
                                'UNKNOWN'}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 mt-5">
                          Submitted{' '}
                          {new Date(
                            listing.createdAt,
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex lg:flex-col gap-3 lg:w-36">
                        <button
                          disabled={isProcessing}
                          onClick={() =>
                            updateVerification(
                              listing.id,
                              'VERIFIED',
                            )
                          }
                          className="flex-1 lg:w-full px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isProcessing
                            ? 'Processing...'
                            : 'Verify'}
                        </button>

                        <button
                          disabled={isProcessing}
                          onClick={() =>
                            updateVerification(
                              listing.id,
                              'REJECTED',
                            )
                          }
                          className="flex-1 lg:w-full px-4 py-2.5 rounded-lg border border-red-300 text-red-700 font-semibold hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}