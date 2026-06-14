import { useState, useEffect } from 'react';
import api from '../../api';

export default function DeadStockPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('value'); // 'value' | 'days'

  useEffect(() => {
    api.get('/analytics/dead-stock')
      .then(res => setAlerts(res.data))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...alerts].sort((a, b) =>
    sort === 'value'
      ? b.inventoryValue - a.inventoryValue
      : b.daysSinceLastSale - a.daysSinceLastSale
  );

  const totalLocked = alerts.reduce((s, a) => s + Number(a.inventoryValue), 0);

  const getActionColor = (action) => {
    if (!action) return 'text-gray-400';
    const lower = action.toLowerCase();
    if (lower.includes('discount') || lower.includes('clearance')) return 'text-yellow-400';
    if (lower.includes('scrap') || lower.includes('write')) return 'text-red-400';
    if (lower.includes('bundle')) return 'text-blue-400';
    return 'text-indigo-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-600/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Dead Stock Detector</h1>
        <p className="text-gray-400">Identify products with zero sales velocity and free up capital locked in idle inventory.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 text-center">
          <p className="text-3xl font-black text-red-400">{alerts.length}</p>
          <p className="text-xs text-gray-500 mt-1">Dead Stock Products</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 text-center">
          <p className="text-3xl font-black text-red-400">₹{totalLocked.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-gray-500 mt-1">Total Capital Locked</p>
        </div>
        <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 text-center">
          <p className="text-3xl font-black text-gray-400">
            {alerts.length > 0 ? Math.round(alerts.reduce((s, a) => s + a.daysSinceLastSale, 0) / alerts.length) : 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Avg Days Idle</p>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Sort by:</span>
        {[
          { key: 'value', label: 'Locked Value' },
          { key: 'days',  label: 'Days Idle' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sort === s.key ? 'bg-indigo-600 text-white' : 'bg-[#141720] border border-[#1e2132] text-gray-400 hover:text-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-56 bg-[#141720] border border-[#1e2132] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-xl font-bold text-emerald-400">No Dead Stock Detected!</p>
          <p className="text-gray-500 mt-2">All inventory is actively moving. Your stock management is excellent.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map(a => {
            const severity = a.daysSinceLastSale > 90 ? 'CRITICAL' : a.daysSinceLastSale > 60 ? 'HIGH' : 'MEDIUM';
            const severityStyle = severity === 'CRITICAL' ? 'border-red-500/60 bg-red-500/5' :
                                  severity === 'HIGH' ? 'border-orange-500/50' : 'border-[#1e2132]';
            return (
              <div key={a.alertId} className={`bg-[#141720] border ${severityStyle} rounded-xl overflow-hidden group relative`}>
                {/* Severity badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                    severity === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-black'
                  }`}>
                    {severity}
                  </span>
                </div>

                <div className="p-6">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">💀</div>
                  <h3 className="text-lg font-bold text-gray-200 mb-1 pr-16">{a.productName}</h3>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-[#0f1117] rounded-full h-1.5">
                      <div className="bg-red-500 h-1.5 rounded-full w-full" />
                    </div>
                    <span className="text-xs text-red-400 font-bold flex-shrink-0">{a.daysSinceLastSale}d idle</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-[#1a1d27] rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Locked Value</p>
                      <p className="text-lg font-black text-red-400">₹{Number(a.inventoryValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-[#1a1d27] rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Qty in Stock</p>
                      <p className="text-lg font-black text-gray-300">{a.currentOnHandQty}</p>
                    </div>
                  </div>

                  <div className="bg-[#0f1117] rounded-lg p-3 border border-[#2a2d3e]">
                    <p className="text-xs text-gray-600 mb-1">🤖 AI Recommendation:</p>
                    <p className={`text-sm font-medium leading-relaxed ${getActionColor(a.recommendedAction)}`}>
                      {a.recommendedAction}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
