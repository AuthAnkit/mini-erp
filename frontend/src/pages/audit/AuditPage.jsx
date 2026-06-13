import { useEffect, useState } from 'react';
import { auditApi } from '../../api';
import { Card, Table, Tr, Td, LoadingSpinner } from '../../components/shared';

const moduleColors = {
  SALES: 'text-blue-300 bg-blue-900/30',
  PURCHASE: 'text-green-300 bg-green-900/30',
  MANUFACTURING: 'text-purple-300 bg-purple-900/30',
  INVENTORY: 'text-amber-300 bg-amber-900/30',
  PRODUCT: 'text-pink-300 bg-pink-900/30',
};

const actionColors = {
  CREATED: 'text-emerald-400',
  CONFIRMED: 'text-blue-400',
  DELIVERED: 'text-emerald-400',
  RECEIVED: 'text-emerald-400',
  DONE: 'text-emerald-400',
  CANCELLED: 'text-red-400',
  AUTO_CREATED: 'text-amber-400',
  STOCK_IN: 'text-emerald-400',
  STOCK_OUT: 'text-red-400',
  UPDATED: 'text-indigo-400',
  BOM_UPDATED: 'text-indigo-400',
  STARTED: 'text-purple-400',
  WORK_ORDER_DONE: 'text-purple-400',
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState({ module: '', action: '' });

  useEffect(() => {
    load();
  }, [page]);

  const load = async () => {
    setLoading(true);
    const r = await auditApi.getAll(page, 50);
    setLogs(r.data.content || r.data);
    setTotalPages(r.data.totalPages || 1);
    setLoading(false);
  };

  const filtered = logs.filter(l =>
    (!filter.module || l.module === filter.module) &&
    (!filter.action || l.action.includes(filter.action.toUpperCase()))
  );

  const modules = [...new Set(logs.map(l => l.module))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">📋 Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Full traceability — every change recorded</p>
        </div>
        <button onClick={load}
          className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-700/40 rounded-lg px-3 py-2">
          ↺ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={filter.module} onChange={e => setFilter({...filter, module: e.target.value})}
          className="bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500">
          <option value="">All Modules</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input value={filter.action} onChange={e => setFilter({...filter, action: e.target.value})}
          placeholder="Filter by action…"
          className="bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 w-48" />
        <div className="flex items-center gap-2 ml-auto text-xs text-gray-500">
          Showing {filtered.length} of {logs.length} entries
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <Card>
          <Table headers={['Time', 'User', 'Module', 'Record', 'Action', 'Field', 'Old Value', 'New Value', 'Details']}>
            {filtered.map((log, i) => (
              <Tr key={i}>
                <Td>
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(log.dateTime).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs text-gray-300">{log.userName || 'System'}</span>
                </Td>
                <Td>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${moduleColors[log.module] || 'text-gray-400 bg-gray-800'}`}>
                    {log.module}
                  </span>
                </Td>
                <Td>
                  <div>
                    <span className="text-xs text-gray-400">{log.recordType}</span>
                    {log.recordRef && (
                      <span className="text-xs font-mono text-indigo-400 ml-1">{log.recordRef}</span>
                    )}
                  </div>
                </Td>
                <Td>
                  <span className={`text-xs font-semibold ${actionColors[log.action] || 'text-gray-400'}`}>
                    {log.action}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs text-gray-500">{log.fieldChanged || '—'}</span>
                </Td>
                <Td>
                  <span className="text-xs text-red-400 font-mono max-w-[100px] truncate block">
                    {log.oldValue || '—'}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs text-emerald-400 font-mono max-w-[100px] truncate block">
                    {log.newValue || '—'}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs text-gray-500 max-w-[180px] truncate block" title={log.details}>
                    {log.details || '—'}
                  </span>
                </Td>
              </Tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-600">
                  No audit logs yet. Start using the system!
                </td>
              </tr>
            )}
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="px-3 py-1.5 bg-[#1a1d27] border border-[#2a2d3e] rounded-lg text-sm text-gray-300
              disabled:opacity-40 hover:border-indigo-600 transition-colors">
            ← Prev
          </button>
          <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1}
            className="px-3 py-1.5 bg-[#1a1d27] border border-[#2a2d3e] rounded-lg text-sm text-gray-300
              disabled:opacity-40 hover:border-indigo-600 transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
