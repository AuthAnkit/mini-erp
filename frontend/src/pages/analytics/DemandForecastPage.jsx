import { useState, useEffect } from 'react';
import api from '../../api';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

export default function DemandForecastPage() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    api.get('/analytics/demand-forecasts')
      .then(res => setForecasts(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? forecasts
    : forecasts.filter(f => f.trendDirection === filter);

  const stats = {
    total: forecasts.length,
    increasing: forecasts.filter(f => f.trendDirection === 'INCREASING').length,
    decreasing: forecasts.filter(f => f.trendDirection === 'DECREASING').length,
    stable: forecasts.filter(f => f.trendDirection === 'STABLE').length,
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Demand Forecast Engine</h1>
        <p className="text-gray-400">AI-driven predictions for future product demand based on historical sales trends.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats.total, color: 'text-gray-200', bg: 'bg-[#141720]' },
          { label: 'Demand Rising ↑', value: stats.increasing, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
          { label: 'Demand Falling ↓', value: stats.decreasing, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
          { label: 'Stable →', value: stats.stable, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-[#1e2132] rounded-xl p-4 text-center`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['ALL', 'INCREASING', 'STABLE', 'DECREASING'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-[#141720] border border-[#1e2132] text-gray-400 hover:text-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((f, index) => {
            const gradientId = `demandGradient_${f.productId}_${index}`;
            return (
              <div key={f.productId} className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 shadow-lg hover:border-indigo-500/40 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-base font-semibold text-gray-200 truncate">{f.productName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{f.forecastDate}</p>
                  </div>
                  <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${
                    f.trendDirection === 'INCREASING' ? 'bg-emerald-500/15 text-emerald-400' :
                    f.trendDirection === 'DECREASING' ? 'bg-red-500/15 text-red-400' :
                    'bg-blue-500/15 text-blue-400'
                  }`}>
                    {f.trendDirection === 'INCREASING' ? '↑' : f.trendDirection === 'DECREASING' ? '↓' : '→'}{' '}
                    {f.trendPercentage > 0 ? '+' : ''}{f.trendPercentage}%
                  </span>
                </div>

                <div className="flex justify-between mb-5">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Predicted Demand</p>
                    <p className="text-2xl font-black text-indigo-400">{f.predictedDemand}</p>
                    <p className="text-xs text-gray-500">units next month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">AI Confidence</p>
                    <p className="text-2xl font-black text-gray-200">{f.confidencePercentage}%</p>
                    <div className="w-16 h-1.5 bg-[#1a1d27] rounded-full mt-1 ml-auto">
                      <div
                        className={`h-1.5 rounded-full ${f.confidencePercentage >= 75 ? 'bg-emerald-500' : f.confidencePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${f.confidencePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Daily Avg', sales: Math.round(f.dailyAvgSales) },
                      { name: 'Weekly', sales: Math.round(f.dailyAvgSales * 7) },
                      { name: 'Monthly', sales: Math.round(f.monthlyAvgSales) },
                      { name: 'Forecast', sales: f.predictedDemand }
                    ]}>
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: '8px', fontSize: '11px' }}
                        labelStyle={{ color: '#9ca3af' }}
                        itemStyle={{ color: '#a5b4fc' }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill={`url(#${gradientId})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 pt-3 border-t border-[#1e2132] flex justify-between text-xs text-gray-500">
                  <span>Avg daily: <span className="text-gray-300 font-medium">{f.dailyAvgSales.toFixed(1)}</span></span>
                  <span>Avg monthly: <span className="text-gray-300 font-medium">{f.monthlyAvgSales.toFixed(1)}</span></span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-500">
              No forecasts match the selected filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
