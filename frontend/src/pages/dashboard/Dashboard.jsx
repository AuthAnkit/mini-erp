import { useEffect, useState } from 'react';
import { dashboardApi } from '../../api';
import { StatCard, Card, Badge, LoadingSpinner } from '../../components/shared';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    dashboardApi.get().then(r => setData(r.data)).finally(() => setLoading(false));
    const interval = setInterval(() => {
      dashboardApi.get().then(r => setData(r.data));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Operations Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {user?.name} · Live data refreshes every 10s
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Sales Orders" value={data?.totalSO ?? 0}
          sub={`${data?.pendingSO} pending · ${data?.delayedSO} delayed`}
          color="indigo" icon="🛒" />
        <StatCard label="Purchase Orders" value={data?.totalPO ?? 0}
          sub={`${data?.pendingPO} pending`} color="green" icon="🏭" />
        <StatCard label="Active MOs" value={data?.activeMO ?? 0}
          sub="In progress / confirmed" color="purple" icon="⚙️" />
        <StatCard label="Stock Alerts" value={(data?.criticalStockCount ?? 0) + (data?.lowStockCount ?? 0)}
          sub={`${data?.criticalStockCount} critical · ${data?.lowStockCount} low`}
          color={data?.criticalStockCount > 0 ? 'red' : 'yellow'} icon="⚠️" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stock Overview Chart */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">📊 Stock Overview</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.stockSummary ?? []} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }}
                angle={-25} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: '8px', fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="onHand" name="On Hand" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="reserved" name="Reserved" fill="#7c3aed" radius={[4,4,0,0]} />
              <Bar dataKey="freeToUse" name="Free to Use" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Actions */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">⚡ Quick Actions</h2>
          <div className="flex flex-col gap-2">
            {[
              { label: 'New Sales Order', path: '/sales', icon: '🛒', color: 'border-indigo-700/40 hover:bg-indigo-900/20' },
              { label: 'New Purchase Order', path: '/purchase', icon: '🏭', color: 'border-green-700/40 hover:bg-green-900/20' },
              { label: 'New Mfg. Order', path: '/manufacturing', icon: '⚙️', color: 'border-purple-700/40 hover:bg-purple-900/20' },
              { label: 'Manage Products', path: '/products', icon: '📦', color: 'border-amber-700/40 hover:bg-amber-900/20' },
              { label: 'Stock Graph', path: '/stock-graph', icon: '🕸️', color: 'border-pink-700/40 hover:bg-pink-900/20' },
            ].map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                className={`flex items-center gap-3 p-3 rounded-lg border ${a.color}
                  border-[#2a2d3e] transition-all text-left`}>
                <span>{a.icon}</span>
                <span className="text-sm text-gray-300">{a.label}</span>
                <span className="ml-auto text-gray-600">→</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent SOs */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">🛒 Recent Sales Orders</h2>
          {data?.recentSOs?.length === 0 ? (
            <p className="text-gray-600 text-sm">No sales orders yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data?.recentSOs?.map((so, i) => (
                <div key={i} onClick={() => navigate('/sales')}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1e2130] cursor-pointer transition-colors">
                  <div>
                    <p className="text-sm font-mono text-indigo-300">{so.ref}</p>
                    <p className="text-xs text-gray-500">{so.customer}</p>
                  </div>
                  <Badge status={so.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active MOs + Bottleneck */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">⚙️ Active Manufacturing</h2>
          {data?.activeMOs?.length === 0 ? (
            <p className="text-gray-600 text-sm">No active manufacturing orders.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data?.activeMOs?.map((mo, i) => (
                <div key={i} onClick={() => navigate('/manufacturing')}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1e2130] cursor-pointer transition-colors">
                  <div>
                    <p className="text-sm font-mono text-purple-300">{mo.ref}</p>
                    <p className="text-xs text-gray-500">{mo.product} × {mo.qty}</p>
                  </div>
                  <Badge status={mo.status} />
                </div>
              ))}
            </div>
          )}

          {data?.bottlenecks?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#2a2d3e]">
              <p className="text-xs text-gray-500 mb-2">🔍 Bottleneck Alerts</p>
              {data.bottlenecks.filter(b => b.isBottleneck).map((b, i) => (
                <div key={i} className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-2 mb-1">
                  <p className="text-xs text-amber-300 font-medium">{b.workCenter}</p>
                  <p className="text-xs text-gray-500">
                    Avg {b.avgActual}min vs expected {b.avgExpected}min — {b.efficiencyPct}% efficiency
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
