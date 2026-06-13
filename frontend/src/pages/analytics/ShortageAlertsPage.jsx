import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ShortageAlertsPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api.get('/analytics/shortage-alerts').then(res => setAlerts(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Component Shortage Detection</h1>
        <p className="text-gray-400">Proactively scan active manufacturing orders for missing components before production starts.</p>
      </div>

      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-10 text-center text-gray-500">
            No component shortages detected for active manufacturing orders.
          </div>
        ) : alerts.map(a => (
          <div key={a.alertId} className={`bg-[#141720] border ${a.canBlockProduction ? 'border-red-500/50' : 'border-[#1e2132]'} rounded-xl p-5 flex items-center justify-between`}>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  a.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                  a.severity === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-white'
                }`}>
                  {a.severity}
                </span>
                <span className="text-sm font-medium text-gray-400">{a.moRef}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-200">Missing {a.shortageQuantity}x {a.componentName}</h3>
              <p className="text-sm text-gray-500 mt-1">Available: {a.availableQuantity} / Required: {a.requiredQuantity}</p>
            </div>
            
            <div className="text-right">
              {a.canBlockProduction && (
                <div className="text-red-400 text-sm font-bold flex items-center gap-1 mb-2">
                  <span>⛔</span> PRODUCTION BLOCKED
                </div>
              )}
              <button className="text-indigo-400 text-sm hover:underline">Create Purchase Order →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
