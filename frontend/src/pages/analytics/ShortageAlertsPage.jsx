import { useState, useEffect } from 'react';
import api from '../../api';

export default function ShortageAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/shortage-alerts')
      .then(res => setAlerts(res.data))
      .finally(() => setLoading(false));
  }, []);

  const critical = alerts.filter(a => a.severity === 'CRITICAL');
  const high = alerts.filter(a => a.severity === 'HIGH');
  const medium = alerts.filter(a => a.severity === 'MEDIUM');

  const severityConfig = {
    CRITICAL: { bg: 'bg-red-500/10 border-red-500/50', badge: 'bg-red-600 text-white', text: 'text-red-400', icon: '⛔' },
    HIGH:     { bg: 'bg-orange-500/10 border-orange-500/40', badge: 'bg-orange-500 text-white', text: 'text-orange-400', icon: '🔴' },
    MEDIUM:   { bg: 'bg-yellow-500/10 border-yellow-500/30', badge: 'bg-yellow-500 text-black', text: 'text-yellow-400', icon: '🟡' },
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Component Shortage Detection</h1>
        <p className="text-gray-400">Proactively detect missing materials before production starts and avoid blocked manufacturing orders.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Alerts', value: alerts.length, color: 'text-gray-200', bg: 'bg-[#141720] border-[#1e2132]' },
          { label: 'Critical', value: critical.length, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
          { label: 'High', value: high.length, color: 'text-orange-400', bg: 'bg-orange-500/5 border-orange-500/20' },
          { label: 'Medium', value: medium.length, color: 'text-yellow-400', bg: 'bg-yellow-500/5 border-yellow-500/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-4 text-center`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-[#141720] border border-[#1e2132] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-14 text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-xl font-bold text-emerald-400">No Shortages Detected!</p>
          <p className="text-gray-500 mt-2">All active manufacturing orders have sufficient component stock.</p>
          <p className="text-gray-600 text-sm mt-2">Create manufacturing orders and run this check again to detect component gaps.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Critical first */}
          {['CRITICAL', 'HIGH', 'MEDIUM'].map(sev => {
            const sevAlerts = alerts.filter(a => a.severity === sev);
            if (sevAlerts.length === 0) return null;
            const cfg = severityConfig[sev];
            return (
              <div key={sev}>
                <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${cfg.text}`}>
                  {cfg.icon} {sev} ({sevAlerts.length})
                </h3>
                <div className="space-y-3">
                  {sevAlerts.map(a => (
                    <div key={a.alertId} className={`border rounded-xl p-5 ${cfg.bg}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${cfg.badge}`}>
                              {a.severity}
                            </span>
                            <span className="text-sm text-gray-400 font-medium">{a.moRef}</span>
                          </div>

                          <h3 className="text-lg font-bold text-gray-200 mb-1">
                            🔧 {a.componentName}
                          </h3>

                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <span className="text-gray-500">Required: </span>
                              <span className="font-bold text-gray-200">{a.requiredQuantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Available: </span>
                              <span className="font-bold text-emerald-400">{a.availableQuantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Shortage: </span>
                              <span className={`font-black ${cfg.text}`}>{a.shortageQuantity}</span>
                            </div>
                          </div>

                          {/* Gap bar */}
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 bg-[#0f1117] rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full"
                                style={{ width: `${Math.min((a.availableQuantity / a.requiredQuantity) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {Math.round((a.availableQuantity / a.requiredQuantity) * 100)}% covered
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0 text-right">
                          {a.canBlockProduction && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                              <p className="text-red-400 text-xs font-black flex items-center gap-1 justify-end">
                                <span>⛔</span> PRODUCTION BLOCKED
                              </p>
                            </div>
                          )}
                          <button
                            className="text-xs text-indigo-400 border border-indigo-500/30 rounded-lg px-3 py-2 hover:bg-indigo-500/10 transition-colors"
                          >
                            Create PO →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
