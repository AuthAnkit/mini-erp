import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function DeadStockPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api.get('/analytics/dead-stock').then(res => setAlerts(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-700/30 to-gray-900/30 border border-gray-600/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Dead Stock Analysis</h1>
        <p className="text-gray-400">Identify products with zero sales velocity to free up locked capital.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alerts.length === 0 ? (
          <div className="col-span-full text-center p-10 text-gray-500 bg-[#141720] rounded-xl border border-[#1e2132]">
            No dead stock detected. All inventory is moving efficiently.
          </div>
        ) : alerts.map(a => (
          <div key={a.alertId} className="bg-[#141720] border border-[#1e2132] rounded-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-3xl opacity-20 group-hover:opacity-100 transition-opacity">💀</span>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-200 mb-1 pr-8">{a.productName}</h3>
              <p className="text-sm text-red-400 font-medium mb-4">{a.daysSinceLastSale} days since last sale</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Locked Value</p>
                  <p className="text-xl font-bold text-gray-200">₹{a.inventoryValue}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stock Qty</p>
                  <p className="text-xl font-bold text-gray-200">{a.currentOnHandQty}</p>
                </div>
              </div>
              
              <div className="bg-[#1a1d27] rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">AI Recommendation:</p>
                <p className="text-sm font-medium text-indigo-400">{a.recommendedAction}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
