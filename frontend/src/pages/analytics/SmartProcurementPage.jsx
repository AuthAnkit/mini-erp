import { useState, useEffect } from 'react';
import api from '../../api';

export default function SmartProcurementPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRecs = () => {
    setLoading(true);
    api.get('/analytics/procurement-recommendations')
      .then(res => setRecommendations(res.data))
      .catch(() => showToast('Failed to load recommendations.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecs(); }, []);

  const approve = (id, productName) => {
    setApproving(id);
    api.post(`/analytics/procurement-recommendations/${id}/approve`)
      .then(() => {
        showToast(`✅ Purchase order approved for ${productName}!`);
        fetchRecs();
      })
      .catch(() => showToast('Failed to approve recommendation.', 'error'))
      .finally(() => setApproving(null));
  };

  const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sorted = [...recommendations].sort((a, b) => (urgencyOrder[a.urgencyLevel] ?? 99) - (urgencyOrder[b.urgencyLevel] ?? 99));

  const counts = {
    CRITICAL: recommendations.filter(r => r.urgencyLevel === 'CRITICAL').length,
    HIGH: recommendations.filter(r => r.urgencyLevel === 'HIGH').length,
    MEDIUM: recommendations.filter(r => r.urgencyLevel === 'MEDIUM').length,
    LOW: recommendations.filter(r => r.urgencyLevel === 'LOW').length,
  };

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-xl shadow-2xl text-sm font-medium border ${
          toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200' :
          'bg-red-900/90 border-red-500/50 text-red-200'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Smart Procurement Advisor</h1>
          <p className="text-gray-400">AI recommendations based on stock velocity and depletion analysis.</p>
        </div>
        <button
          onClick={fetchRecs}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>{loading ? '⏳' : '🔄'}</span>
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>

      {/* Urgency Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { level: 'CRITICAL', count: counts.CRITICAL, bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400' },
          { level: 'HIGH',     count: counts.HIGH,     bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400' },
          { level: 'MEDIUM',   count: counts.MEDIUM,   bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400' },
          { level: 'LOW',      count: counts.LOW,      bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400' },
        ].map(s => (
          <div key={s.level} className={`${s.bg} border rounded-xl p-4 text-center`}>
            <p className={`text-3xl font-black ${s.text}`}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-1">{s.level}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#141720] border border-[#1e2132] rounded-xl overflow-hidden">
        <div className="bg-[#1a1d27] border-b border-[#1e2132] px-6 py-3 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-300">{recommendations.length} Recommendations</span>
          {counts.CRITICAL > 0 && (
            <span className="text-xs text-red-400 font-bold animate-pulse">
              ⚠ {counts.CRITICAL} CRITICAL — Immediate action required!
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1e2132]">
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Product / Vendor</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Stock Status</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Stockout ETA</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Recommendation</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2132]">
              {sorted.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500">
                    ✅ All stock levels are healthy. No procurement action needed right now.
                  </td>
                </tr>
              ) : sorted.map(r => {
                const urgencyBg = r.urgencyLevel === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                  r.urgencyLevel === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                  r.urgencyLevel === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                  'bg-green-500/10 text-green-400 border-green-500/30';
                const rowBg = r.urgencyLevel === 'CRITICAL' ? 'bg-red-500/5' : '';
                return (
                  <tr key={r.recommendationId} className={`hover:bg-[#1a1d27]/60 transition-colors ${rowBg}`}>
                    <td className="p-4">
                      <p className="font-semibold text-gray-200">{r.productName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">🤝 {r.preferredVendor || 'No preferred vendor'}</p>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-gray-300 font-medium">{r.currentStock} units on hand</p>
                        <p className="text-xs text-gray-500">{r.averageDailyUsage?.toFixed(1)}/day avg usage</p>
                        <div className="mt-1.5 w-24 bg-[#0f1117] rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${r.urgencyLevel === 'CRITICAL' ? 'bg-red-500' : r.urgencyLevel === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`}
                            style={{ width: `${Math.min(r.currentStock / (r.recommendedQuantity || 1) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${urgencyBg}`}>
                        {r.daysUntilStockout} days
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{r.urgencyLevel}</p>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-sm font-bold text-indigo-400">Buy {r.recommendedQuantity} units</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.reason}</p>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => approve(r.recommendationId, r.productName)}
                        disabled={approving === r.recommendationId}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                          approving === r.recommendationId
                            ? 'bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed'
                            : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border-indigo-600/50'
                        }`}
                      >
                        {approving === r.recommendationId ? '...' : 'Approve ✓'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
