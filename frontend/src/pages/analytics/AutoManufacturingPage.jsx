import { useState, useEffect } from 'react';
import api from '../../api';

export default function AutoManufacturingPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRules = () => {
    api.get('/analytics/auto-manufacturing/rules').then(res => setRules(res.data));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const trigger = () => {
    setLoading(true);
    api.post('/analytics/auto-manufacturing/trigger')
      .then(res => {
        fetchRules();
        if (res.data.length > 0) {
          showToast(`⚡ Triggered ${res.data.length} manufacturing order(s) automatically!`, 'success');
        } else {
          showToast('✅ No rules triggered — all stock levels are above thresholds.', 'info');
        }
      })
      .catch(() => showToast('Failed to trigger auto-manufacturing.', 'error'))
      .finally(() => setLoading(false));
  };

  const triggered = rules.filter(r => r.triggered);
  const active = rules.filter(r => r.isActive);

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-xl shadow-2xl text-sm font-medium border animate-in ${
          toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200' :
          toast.type === 'info' ? 'bg-blue-900/90 border-blue-500/50 text-blue-200' :
          'bg-red-900/90 border-red-500/50 text-red-200'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Auto Manufacturing Rules</h1>
          <p className="text-gray-400">Automate MO creation based on stock thresholds — zero manual intervention needed.</p>
        </div>
        <button
          onClick={trigger}
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>⚡</span>
          {loading ? 'Running...' : 'Trigger Auto-Run Now'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-gray-200">{rules.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Rules</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-emerald-400">{active.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active Rules</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-red-400">{triggered.length}</p>
          <p className="text-xs text-gray-500 mt-1">Below Threshold</p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-[#141720] border border-[#1e2132] rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1a1d27] border-b border-[#1e2132]">
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Product</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Current Stock</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Trigger When Below</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Auto-Produce Qty</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Stock Level</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2132]">
            {rules.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-10 text-center text-gray-500">
                  No auto-manufacturing rules configured. Use the API to add rules.
                </td>
              </tr>
            ) : rules.map(r => {
              const pct = r.triggerStockLevel > 0 ? Math.min((r.currentStock / (r.triggerStockLevel * 3)) * 100, 100) : 100;
              return (
                <tr key={r.ruleId} className="hover:bg-[#1a1d27]/50 transition-colors">
                  <td className="p-4 font-medium text-gray-200">{r.productName}</td>
                  <td className="p-4">
                    <span className={`text-lg font-bold ${r.triggered ? 'text-red-400' : 'text-gray-200'}`}>
                      {r.currentStock}
                      {r.triggered && <span className="ml-2 text-xs font-normal text-red-400 animate-pulse">⚠ LOW</span>}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">&lt; {r.triggerStockLevel} units</td>
                  <td className="p-4">
                    <span className="bg-teal-500/10 text-teal-400 px-2 py-1 rounded text-sm font-medium">
                      +{r.manufacturingQuantity} units
                    </span>
                  </td>
                  <td className="p-4 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#0f1117] rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${pct < 30 ? 'bg-red-500' : pct < 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(pct)}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>
                      {r.isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
