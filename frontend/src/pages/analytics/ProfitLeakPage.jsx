import { useState, useEffect } from 'react';
import api from '../../api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProfitLeakPage() {
  const [data, setData] = useState({ totalLeaks: 0, totalMonthlyImpact: 0, leaks: [], byType: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/profit-leaks')
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const PIE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#8b5cf6'];

  const pieData = Object.entries(data.byType || {}).map(([type, count], i) => ({
    name: type.replace(/_/g, ' ').toLowerCase(),
    value: count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const leakTypeIcon = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('dead')) return '💀';
    if (t.includes('holding')) return '📦';
    if (t.includes('price')) return '💰';
    if (t.includes('overstock')) return '⚠️';
    return '💸';
  };

  const sortedLeaks = [...(data.leaks || [])].sort(
    (a, b) => b.estimatedMonthlyImpact - a.estimatedMonthlyImpact
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Profit Leak Detector</h1>
        <p className="text-gray-400">Identify hidden profit drains — dead inventory, holding costs, and price erosion.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-40 bg-[#141720] border border-[#1e2132] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Est. Monthly Loss</p>
              <p className="text-4xl font-black text-red-400">₹{data.totalMonthlyImpact.toLocaleString()}</p>
            </div>
            <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-6 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Active Leaks</p>
              <p className="text-4xl font-black text-orange-400">{data.totalLeaks}</p>
            </div>
            <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-6 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Avg. Leak Impact</p>
              <p className="text-4xl font-black text-yellow-400">
                ₹{data.totalLeaks > 0 ? Math.round(data.totalMonthlyImpact / data.totalLeaks).toLocaleString() : 0}
              </p>
            </div>
          </div>

          {data.leaks.length === 0 ? (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-xl font-bold text-emerald-400">No Profit Leaks Found!</p>
              <p className="text-gray-500 mt-2">Your business is operating at peak efficiency.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie chart */}
              {pieData.length > 0 && (
                <div className="col-span-1 bg-[#141720] border border-[#1e2132] rounded-xl p-6 flex flex-col">
                  <h3 className="font-bold text-gray-200 mb-4">Leaks by Type</h3>
                  <div className="flex-1 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: '8px', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-gray-400 capitalize">{d.name}</span>
                        </div>
                        <span className="text-gray-300 font-bold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leak list */}
              <div className="col-span-2 space-y-4">
                {sortedLeaks.map(l => (
                  <div key={l.leakId} className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 hover:border-rose-500/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-rose-500/20 text-2xl">
                        {leakTypeIcon(l.leakType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="px-2 py-0.5 bg-[#1a1d27] border border-[#2a2d3e] rounded text-xs text-rose-400 font-bold uppercase">
                              {l.leakType?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="font-black text-rose-400 text-lg">
                              ₹{l.estimatedMonthlyImpact.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600">/month</p>
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm leading-relaxed mb-3">{l.description}</p>

                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-3 flex items-start gap-2">
                          <span className="text-base flex-shrink-0">💡</span>
                          <p className="text-sm text-indigo-300 font-medium leading-relaxed">{l.recommendedAction}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
