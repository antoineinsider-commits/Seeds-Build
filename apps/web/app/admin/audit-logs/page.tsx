'use client';

import { useEffect, useState } from 'react';

type AuditLog = {
  id: string;
  adminId: string;
  action: string;
  targetId: string;
  details: {
    previousStatus?: string;
    newStatus?: string;
    solverId?: string;
    solverCompanyName?: string | null;
  } | null;
  createdAt: string;
  admin?: {
    id: string;
    email: string;
    role: string;
  };
};

type AuditResponse = {
  items: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const API_URL =
  'https://literate-xylophone-5vvpwwj6w7j6hvg6w-4000.app.github.dev';

export default function AdminAuditLogsPage() {
  const [data, setData] =
    useState<AuditResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  async function loadAuditLogs() {
    try {
      setLoading(true);
      setError('');

      const token =
        localStorage.getItem('seeds_access_token');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });

      if (action) {
        params.set('action', action);
      }

      const response = await fetch(
        `${API_URL}/api/v1/admin/audit-logs?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const body = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        let message = `Failed to load audit logs (${response.status})`;

        if (typeof body.message === 'string') {
          message = body.message;
        } else if (Array.isArray(body.message)) {
          message = body.message.join(', ');
        } else if (
          body.message &&
          typeof body.message === 'object'
        ) {
          message =
            body.message.message ||
            JSON.stringify(body.message);
        } else if (body.error) {
          message = body.error;
        }

        throw new Error(message);
      }

      setData(body);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load audit logs',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLogs();
  }, [page, action]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function actionLabel(value: string) {
    switch (value) {
      case 'LISTING_VERIFIED':
        return 'Listing Verified';

      case 'LISTING_REJECTED':
        return 'Listing Rejected';

      case 'USER_ACTIVATED':
        return 'User Activated';

      case 'USER_DEACTIVATED':
        return 'User Deactivated';

      case 'USER_VERIFICATION_UPDATED':
        return 'User Verification Updated';

      default:
        return value;
    }
  }

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1>Admin Audit Logs</h1>

          <p>
            Review administrative actions performed
            across SEEDS.
          </p>
        </div>

        <button onClick={loadAuditLogs}>
          Refresh
        </button>
      </div>

      <div
        style={{
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <label htmlFor="action">
          Filter by action:
        </label>

        <select
          id="action"
          value={action}
          onChange={(event) => {
            setPage(1);
            setAction(event.target.value);
          }}
        >
          <option value="">All actions</option>
          <option value="LISTING_VERIFIED">
            Listing Verified
          </option>
          <option value="LISTING_REJECTED">
            Listing Rejected
          </option>
          <option value="USER_ACTIVATED">
            User Activated
          </option>
          <option value="USER_DEACTIVATED">
            User Deactivated
          </option>
          <option value="USER_VERIFICATION_UPDATED">
            User Verification Updated
          </option>
        </select>
      </div>

      {loading && <p>Loading audit logs...</p>}

      {error && (
        <div
          style={{
            padding: 16,
            marginBottom: 20,
            border: '1px solid #f00',
          }}
        >
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        data &&
        data.items.length === 0 && (
          <p>No audit logs found.</p>
        )}

      {!loading &&
        !error &&
        data &&
        data.items.length > 0 && (
          <>
            <div
              style={{
                overflowX: 'auto',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr>
                    <th align="left">Action</th>
                    <th align="left">Admin</th>
                    <th align="left">Target</th>
                    <th align="left">Previous</th>
                    <th align="left">New</th>
                    <th align="left">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {data.items.map((log) => (
                    <tr key={log.id}>
                      <td>
                        {actionLabel(log.action)}
                      </td>

                      <td>
                        {log.admin?.email ||
                          log.adminId}
                      </td>

                      <td>
                        <code>
                          {log.targetId}
                        </code>
                      </td>

                      <td>
                        {log.details
                          ?.previousStatus || '—'}
                      </td>

                      <td>
                        {log.details?.newStatus ||
                          '—'}
                      </td>

                      <td>
                        {formatDate(
                          log.createdAt,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 20,
              }}
            >
              <button
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {data.pagination.page} of{' '}
                {data.pagination.totalPages}
              </span>

              <button
                disabled={
                  page >=
                  data.pagination.totalPages
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      data.pagination.totalPages,
                      current + 1,
                    ),
                  )
                }
              >
                Next
              </button>
            </div>
          </>
        )}
    </main>
  );
}