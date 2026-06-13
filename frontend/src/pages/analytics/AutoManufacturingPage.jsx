import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AutoManufacturingPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);

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
        alert(`Triggered ${res.data.length} manufacturing orders!`);
        fetchRules();
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Auto Manufacturing Rules</h1>
          <p className="text-gray-400">Automate MO creation based on stock thresholds and BoM dependencies.</p>
        </div>
        <button onClick={trigger} disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <span>⚡</span> {loading ? 'Running...' : 'Trigger Auto-Run Now'}
        </button>
      </div>

      <div className="bg-[#141720] border border-[#1e2132] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1a1d27] border-b border-[#1e2132]">
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Product</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Current Stock</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Trigger Level</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Mfg Qty</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2132]">
            {rules.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">No auto-manufacturing rules configured.</td></tr>
            ) : rules.map(r => (
              <tr key={r.ruleId} className="hover:bg-[#1a1d27]/50 transition-colors">
                <td className="p-4 font-medium text-gray-200">{r.productName}</td>
                <td className="p-4">
                  <span className={r.triggered ? 'text-red-400 font-bold' : 'text-gray-300'}>
                    {r.currentStock}
                  </span>
                </td>
                <td className="p-4 text-gray-300">&lt; {r.triggerStockLevel}</td>
                <td className="p-4 text-gray-300">Produce {r.manufacturingQuantity}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${r.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {r.isActive ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
