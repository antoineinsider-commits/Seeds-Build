'use client';

import {
  useEffect,
  useState,
} from 'react';
import { authFetch } from '../lib/auth';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1';

type Dashboard = {
  users: {
    total: number;
    active: number;
    inactive: number;
    seekers: number;
    solvers: number;
  };

  listings: {
    pending: number;
    verified: number;
  };

  reports: {
    open: number;
  };

  recentActivity: Array<{
    id: string;
    action: string;
    targetId: string;
    createdAt: string;
    admin: {
      id: string;
      email: string;
    };
  }>;
};

export default function AdminDashboard() {
  const [data, setData] =
    useState<Dashboard | null>(null);

  const [error, setError] =
    useState('');

  useEffect(() => {
    async function load() {
      try {
        const response =
          await authFetch(
            `${API_URL}/admin/dashboard`,
          );

        const body =
          await response.json();

        if (!response.ok) {
          throw new Error(
            typeof body.message === 'string'
              ? body.message
              : 'Failed to load dashboard',
          );
        }

        setData(body);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard',
        );
      }
    }

    load();
  }, []);

  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-12">
        <p className="text-red-600">
          {error}
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-12">
        Loading dashboard...
      </main>
    );
  }

  const cards = [
    ['Total Users', data.users.total],
    ['Active Users', data.users.active],
    ['Seekers', data.users.seekers],
    ['Solvers', data.users.solvers],
    [
      'Pending Listings',
      data.listings.pending,
    ],
    [
      'Verified Listings',
      data.listings.verified,
    ],
    ['Open Reports', data.reports.open],
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            SEEDS Admin
          </h1>

          <p className="text-slate-500">
            Platform operations dashboard
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() =>
            window.location.href =
              '/admin/listings'
          }
          className="bg-slate-900 text-white px-4 py-2 rounded-lg"
        >
          Listing Moderation
        </button>

        <button
          onClick={() =>
            window.location.href =
              '/admin/reports'
          }
          className="border border-slate-300 px-4 py-2 rounded-lg"
        >
          Reports
        </button>

        <button
          onClick={() =>
            window.location.href =
              '/admin/audit-logs'
          }
          className="border border-slate-300 px-4 py-2 rounded-lg"
        >
          Audit Logs
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map(([label, value]) => (
          <div
            key={String(label)}
            className="border border-slate-200 rounded-xl p-5"
          >
            <p className="text-sm text-slate-500">
              {label}
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-2">
              {value}
            </p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">
        Recent Admin Activity
      </h2>

      <div className="space-y-3">
        {data.recentActivity.length === 0 ? (
          <p className="text-slate-500">
            No administrative activity yet.
          </p>
        ) : (
          data.recentActivity.map(
            (activity) => (
              <div
                key={activity.id}
                className="border border-slate-200 rounded-lg p-4"
              >
                <strong>
                  {activity.action}
                </strong>

                <p className="text-sm text-slate-500">
                  {activity.admin.email}
                  {' · '}
                  {new Date(
                    activity.createdAt,
                  ).toLocaleString()}
                </p>
              </div>
            ),
          )
        )}
      </div>
    </main>
  );
}