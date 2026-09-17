'use client';

import {
  useEffect,
  useState,
} from 'react';
import { useParams } from 'next/navigation';
import { authFetch } from '../../../../lib/auth';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1';

export default function AdminReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] =
    useState<any>(null);

  const [note, setNote] =
    useState('');

  const [error, setError] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  async function load() {
    try {
      const response =
        await authFetch(
          `${API_URL}/admin/reports/${reportId}`,
        );

      const body =
        await response.json();

      if (!response.ok) {
        throw new Error(
          typeof body.message === 'string'
            ? body.message
            : 'Failed to load report',
        );
      }

      setReport(body);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load report',
      );
    }
  }

  useEffect(() => {
    if (reportId) {
      load();
    }
  }, [reportId]);

  async function closeReport(
    status: 'RESOLVED' | 'DISMISSED',
  ) {
    if (note.trim().length < 3) {
      setError(
        'Enter a resolution note first.',
      );
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response =
        await authFetch(
          `${API_URL}/admin/reports/${reportId}/resolve`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              status,
              resolutionNote: note,
            }),
          },
        );

      const body =
        await response.json();

      if (!response.ok) {
        throw new Error(
          typeof body.message === 'string'
            ? body.message
            : 'Failed to update report',
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update report',
      );
    } finally {
      setSaving(false);
    }
  }

  if (!report) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        {error || 'Loading...'}
      </main>
    );
  }

  const closed =
    report.status === 'RESOLVED' ||
    report.status === 'DISMISSED';

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <button
        onClick={() =>
          window.location.href =
            '/admin/reports'
        }
        className="text-sm mb-6"
      >
        ← Reports
      </button>

      <h1 className="text-2xl font-bold mb-2">
        Report Review
      </h1>

      <p className="text-slate-500 mb-6">
        {report.reason}
        {' · '}
        {report.status}
      </p>

      <div className="border rounded-xl p-5 space-y-4">
        <div>
          <strong>Description</strong>
          <p>{report.description}</p>
        </div>

        <div>
          <strong>Reporter</strong>
          <p>{report.reporter.email}</p>
        </div>

        {report.listing && (
          <div>
            <strong>Listing</strong>
            <p>{report.listing.title}</p>
          </div>
        )}

        {report.reportedUser && (
          <div>
            <strong>Reported user</strong>
            <p>
              {report.reportedUser.email}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 mt-4">
          {error}
        </p>
      )}

      {!closed ? (
        <div className="mt-6">
          <label className="block font-medium mb-2">
            Resolution note
          </label>

          <textarea
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            className="w-full border rounded-lg p-3 min-h-32"
          />

          <div className="flex gap-3 mt-4">
            <button
              disabled={saving}
              onClick={() =>
                closeReport('RESOLVED')
              }
              className="bg-slate-900 text-white px-4 py-2 rounded-lg"
            >
              Resolve
            </button>

            <button
              disabled={saving}
              onClick={() =>
                closeReport('DISMISSED')
              }
              className="border px-4 py-2 rounded-lg"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <strong>Resolution</strong>
          <p>{report.resolutionNote}</p>
        </div>
      )}
    </main>
  );
}