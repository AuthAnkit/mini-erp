import { useState, useEffect } from 'react';
import api from '../../api';

export default function ManufacturingPriorityPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    api.get('/analytics/manufacturing-priority')
      .then(res => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const priorityConfig = {
    CRITICAL: { bg: 'bg-red-500/15 border-red-500/60', badge: 'bg-red-600 text-white', ring: 'border-red-500', text: 'text-red-400', glow: 'shadow-red-500/20' },
    HIGH:     { bg: 'bg-orange-500/10 border-orange-500/40', badge: 'bg-orange-500 text-white', ring: 'border-orange-400', text: 'text-orange-400', glow: 'shadow-orange-500/10' },
    MEDIUM:   { bg: 'bg-yellow-500/5 border-yellow-500/20', badge: 'bg-yellow-500 text-black', ring: 'border-yellow-500', text: 'text-yellow-400', glow: '' },
    LOW:      { bg: 'bg-[#141720] border-[#1e2132]', badge: 'bg-blue-600 text-white', ring: 'border-gray-600', text: 'text-blue-400', glow: '' },
  };

  const counts = {
    CRITICAL: orders.filter(o => o.priorityLevel === 'CRITICAL').length,
    HIGH:     orders.filter(o => o.priorityLevel === 'HIGH').length,
    MEDIUM:   orders.filter(o => o.priorityLevel === 'MEDIUM').length,
    LOW:      orders.filter(o => o.priorityLevel === 'LOW').length,
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Manufacturing Priority Engine</h1>
          <p className="text-gray-400">AI-ranked production queue based on urgency, customer tier, and component readiness.</p>
        </div>
        <button
          onClick={fetch}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>🔄</span> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total in Queue', value: orders.length, color: 'text-gray-200', bg: 'bg-[#141720] border-[#1e2132]' },
          { label: 'Critical',       value: counts.CRITICAL, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
          { label: 'High Priority',  value: counts.HIGH,     color: 'text-orange-400', bg: 'bg-orange-500/5 border-orange-500/20' },
          { label: 'Medium / Low',   value: counts.MEDIUM + counts.LOW, color: 'text-yellow-400', bg: 'bg-yellow-500/5 border-yellow-500/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-4 text-center`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-[#141720] border border-[#1e2132] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-14 text-center">
          <div className="text-5xl mb-4">🏭</div>
          <p className="text-xl font-bold text-gray-400">No Pending Manufacturing Orders</p>
          <p className="text-gray-600 mt-2 text-sm">
            Create confirmed manufacturing orders via Sales Orders → Confirm → Create MO to see them ranked here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => {
            const cfg = priorityConfig[o.priorityLevel] || priorityConfig.LOW;
            return (
              <div key={o.orderId} className={`border rounded-xl p-5 ${cfg.bg} shadow-lg ${cfg.glow}`}>
                <div className="flex items-center gap-5">
                  {/* Rank circle */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full border-4 ${cfg.ring} flex items-center justify-center bg-[#0f1117]`}>
                    <span className={`text-2xl font-black ${cfg.text}`}>#{o.rank}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${cfg.badge}`}>
                            {o.priorityLevel}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">{o.orderRef}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-200">{o.productName}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Qty: <span className="text-gray-300 font-medium">{o.quantity}</span>
                          {' · '}
                          Value: <span className="text-emerald-400 font-medium">₹{Number(o.orderValue).toLocaleString()}</span>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-4xl font-black ${cfg.text}`}>{o.priorityScore}</p>
                        <p className="text-xs text-gray-500">priority score</p>
                      </div>
                    </div>

                    {/* Score bars */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Urgency', value: o.urgencyScore, color: 'bg-red-500' },
                        { label: 'Customer Value', value: o.customerImportance, color: 'bg-purple-500' },
                        { label: 'Components Ready', value: o.componentAvailability, color: 'bg-emerald-500' },
                      ].map(bar => (
                        <div key={bar.label}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-500">{bar.label}</span>
                            <span className="text-gray-300 font-bold">{bar.value}%</span>
                          </div>
                          <div className="w-full bg-[#0f1117] rounded-full h-2">
                            <div
                              className={`${bar.color} h-2 rounded-full transition-all duration-700`}
                              style={{ width: `${bar.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {o.reason && (
                      <p className="mt-3 text-xs text-gray-500 italic border-t border-[#1e2132] pt-2">
                        💡 {o.reason}
                      </p>
                    )}
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
