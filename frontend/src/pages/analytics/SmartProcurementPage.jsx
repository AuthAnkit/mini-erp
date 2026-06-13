import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function SmartProcurementPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecs = () => {
    setLoading(true);
    api.get('/analytics/procurement-recommendations')
      .then(res => setRecommendations(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  const approve = (id) => {
    api.post(`/analytics/procurement-recommendations/${id}/approve`)
      .then(() => fetchRecs());
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Smart Procurement Advisor</h1>
          <p className="text-gray-400">Intelligent purchase recommendations based on stock velocity.</p>
        </div>
        <button onClick={fetchRecs} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>
      
      <div className="bg-[#141720] border border-[#1e2132] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1a1d27] border-b border-[#1e2132]">
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Product</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Stock / Usage</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Stockout In</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Recommendation</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2132]">
            {recommendations.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">No active procurement recommendations. Stock levels are healthy.</td></tr>
            ) : recommendations.map(r => (
              <tr key={r.recommendationId} className="hover:bg-[#1a1d27]/50 transition-colors">
                <td className="p-4">
                  <p className="font-medium text-gray-200">{r.productName}</p>
                  <p className="text-xs text-gray-500">Vendor: {r.preferredVendor}</p>
                </td>
                <td className="p-4">
                  <p className="text-gray-300">{r.currentStock} on hand</p>
                  <p className="text-xs text-gray-500">{r.averageDailyUsage}/day avg</p>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    r.urgencyLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    r.urgencyLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    r.urgencyLevel === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {r.daysUntilStockout} days ({r.urgencyLevel})
                  </span>
                </td>
                <td className="p-4">
                  <p className="text-sm text-indigo-400 font-medium">Buy {r.recommendedQuantity} units</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">{r.reason}</p>
                </td>
                <td className="p-4">
                  <button onClick={() => approve(r.recommendationId)} className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-600/50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
