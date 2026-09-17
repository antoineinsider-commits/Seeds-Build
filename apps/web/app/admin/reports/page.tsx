'use client';

import {
  useEffect,
  useState,
} from 'react';
import { authFetch } from '../../../lib/auth';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1';

type Report = {
  id: string;
  targetType: 'LISTING' | 'USER';
  reason: string;
  description: string;
  status: string;
  createdAt: string;

  reporter: {
    email: string;
  };

  listing?: {
    id: string;
    title: string;
    verificationStatus: string;
  } | null;

  reportedUser?: {
    id: string;
    email: string;
    role: string;
  } | null;
};

export default function AdminReportsPage() {
  const [reports, setReports] =
    useState<Report[]>([]);

  const [status, setStatus] =
    useState('');

  const [error, setError] =
    useState('');

  async function load() {
    try {
      setError('');

      const query = status
        ? `?status=${status}`
        : '';

      const response =
        await authFetch(
          `${API_URL}/admin/reports${query}`,
        );

      const body =
        await response.json();

      if (!response.ok) {
        throw new Error(
          typeof body.message === 'string'
            ? body.message
            : 'Failed to load reports',
        );
      }

      setReports(body);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load reports',
      );
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Reports & Safety
          </h1>

          <p className="text-slate-500">
            Review reports submitted by SEEDS users.
          </p>
        </div>

        <button
          onClick={() =>
            window.location.href = '/admin'
          }
          className="border px-4 py-2 rounded-lg"
        >
          Dashboard
        </button>
      </div>

      <select
        value={status}
        onChange={(event) =>
          setStatus(event.target.value)
        }
        className="border rounded-lg px-3 py-2 mb-6"
      >
        <option value="">
          All reports
        </option>
        <option value="OPEN">
          Open
        </option>
        <option value="REVIEWING">
          Reviewing
        </option>
        <option value="RESOLVED">
          Resolved
        </option>
        <option value="DISMISSED">
          Dismissed
        </option>
      </select>

      {error && (
        <p className="text-red-600 mb-4">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="border border-slate-200 rounded-xl p-5"
          >
            <div className="flex justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {report.reason}
                </p>

                <p className="text-sm text-slate-500">
                  {report.targetType}
                  {' · '}
                  {report.status}
                </p>

                <p className="mt-2">
                  {report.description}
                </p>

                <p className="text-xs text-slate-400 mt-2">
                  Reported by{' '}
                  {report.reporter.email}
                </p>
              </div>

              <button
                onClick={() =>
                  window.location.href =
                    `/admin/reports/${report.id}`
                }
                className="bg-slate-900 text-white px-4 py-2 rounded-lg h-fit"
              >
                Review
              </button>
            </div>
          </div>
        ))}

        {!error &&
          reports.length === 0 && (
            <p className="text-slate-500">
              No reports found.
            </p>
          )}
      </div>
    </main>
  );
}