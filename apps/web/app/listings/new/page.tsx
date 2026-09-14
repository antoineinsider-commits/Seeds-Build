'use client';

import React, { useState } from 'react';
import { isLoggedIn, authFetch } from '../../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const SOLUTION_TYPES = [
  'EXISTING_SOFTWARE',
  'EXPERT_CONSULTANT',
  'KNOWLEDGE_PRODUCT',
  'DONE_FOR_YOU_SERVICE',
  'CUSTOM_BUILD',
];

export default function CreateListingPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    solutionType: 'DONE_FOR_YOU_SERVICE',
    problemItSolves: '',
    targetCustomer: '',
    description: '',
    pricingModel: 'Fixed',
    priceMin: 500,
    priceMax: 2000,
    deliveryTimeDays: 14,
    category: 'Software & Technology',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLoggedIn()) {
      window.location.href = '/login';
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(`${API_URL}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
  const body = await res.json().catch(() => ({}));

  let msg = `Creation failed (${res.status})`;

  if (Array.isArray(body.message)) {
    msg = body.message.join(', ');
  } else if (typeof body.message === 'string') {
    msg = body.message;
  } else if (body.message && typeof body.message === 'object') {
    msg = Object.entries(body.message)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(', ')}`;
        }

        return `${key}: ${String(value)}`;
      })
      .join(' | ');
  } else if (typeof body.error === 'string') {
    msg = body.error;
  }

  throw new Error(msg);
}

      const created = await res.json();
      setCreatedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (createdId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Listing created!</h1>
        <p className="text-slate-600 mb-1">
          It's saved with status <strong>PENDING</strong> and won't show up in Browse Solutions
          until it's verified.
        </p>
        <p className="text-xs text-slate-400 mt-4">Listing ID: {createdId}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Create a Listing</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input
            type="text"
            required
            className="w-full border border-slate-300 rounded-lg p-3 text-sm"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Solution Type</label>
          <select
            className="w-full border border-slate-300 rounded-lg p-3 text-sm"
            value={formData.solutionType}
            onChange={(e) => setFormData({ ...formData, solutionType: e.target.value })}
          >
            {SOLUTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            What problem does this solve?
          </label>
          <textarea
            rows={2}
            required
            className="w-full border border-slate-300 rounded-lg p-3 text-sm"
            value={formData.problemItSolves}
            onChange={(e) => setFormData({ ...formData, problemItSolves: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target customer</label>
          <input
            type="text"
            required
            className="w-full border border-slate-300 rounded-lg p-3 text-sm"
            value={formData.targetCustomer}
            onChange={(e) => setFormData({ ...formData, targetCustomer: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            rows={4}
            required
            className="w-full border border-slate-300 rounded-lg p-3 text-sm"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Min Price ($)</label>
            <input
              type="number"
              required
              className="w-full border border-slate-300 rounded-lg p-3 text-sm"
              value={formData.priceMin}
              onChange={(e) => setFormData({ ...formData, priceMin: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Price ($)</label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded-lg p-3 text-sm"
              value={formData.priceMax}
              onChange={(e) => setFormData({ ...formData, priceMax: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Delivery time (days)
          </label>
          <input
            type="number"
            required
            className="w-full border border-slate-300 rounded-lg p-3 text-sm"
            value={formData.deliveryTimeDays}
            onChange={(e) => setFormData({ ...formData, deliveryTimeDays: Number(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <input
            type="text"
            required
            className="w-full border border-slate-300 rounded-lg p-3 text-sm"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}
