'use client';

import React, { useState, useEffect } from 'react';
import { getAccessToken, isLoggedIn } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface InboxRequest {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  problem: { title: string; description: string };
  listing: { title: string };
}

const NEXT_ACTIONS: Record<string, { label: string; nextStatus: string; style: string }[]> = {
  PENDING: [
    { label: 'Accept', nextStatus: 'ACCEPTED', style: 'bg-emerald-600 text-white hover:bg-emerald-700' },
    { label: 'Decline', nextStatus: 'DECLINED', style: 'bg-slate-200 text-slate-700 hover:bg-slate-300' },
  ],
  ACCEPTED: [
    { label: 'Mark Completed', nextStatus: 'COMPLETED', style: 'bg-emerald-600 text-white hover:bg-emerald-700' },
    { label: 'Cancel', nextStatus: 'CANCELLED', style: 'bg-slate-200 text-slate-700 hover:bg-slate-300' },
  ],
};

export default function InboxPage() {
  const [requests, setRequests] = useState<InboxRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchInbox() {
    if (!isLoggedIn()) {
      setError('You need to log in as a solver to view your inbox.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/requests/inbox`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Only registered Solver accounts have an inbox.');
        }
        if (res.status === 401) {
          throw new Error('Your session expired. Please log in again.');
        }
        throw new Error(`Failed to load inbox (${res.status})`);
      }
      setRequests(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleStatusChange = async (id: string, nextStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_URL}/requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message?.message || body.message || 'Update failed');
      }
      await fetchInbox();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-slate-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Your Inbox</h1>

      {requests.length === 0 ? (
        <p className="text-slate-500">No requests yet.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="border border-slate-200 rounded-xl p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {r.status}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-1">
                About your listing: <strong>{r.listing.title}</strong>
              </p>
              <p className="text-sm text-slate-500 mb-3">
                Problem: <strong>{r.problem.title}</strong> — {r.problem.description}
              </p>
              <p className="text-slate-700 mb-4">{r.message}</p>

              {(NEXT_ACTIONS[r.status] || []).length > 0 && (
                <div className="flex gap-2">
                  {NEXT_ACTIONS[r.status].map((action) => (
                    <button
                      key={action.nextStatus}
                      disabled={updatingId === r.id}
                      onClick={() => handleStatusChange(r.id, action.nextStatus)}
                      className={`text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 ${action.style}`}
                    >
                      {updatingId === r.id ? '...' : action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
