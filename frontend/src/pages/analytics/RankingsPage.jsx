import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function RankingsPage() {
  const [data, setData] = useState({ topCustomers: [], topProducts: [] });

  useEffect(() => {
    api.get('/analytics/rankings').then(res => setData(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Business Rankings</h1>
        <p className="text-gray-400">Top performing customers and products by revenue generated.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2"><span>👥</span> Top Customers</h2>
          <div className="space-y-4">
            {data.topCustomers.map(c => (
              <div key={c.customerId} className="flex items-center gap-4 bg-[#1a1d27] border border-[#2a2d3e] p-4 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
                  #{c.rank}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-200">{c.customerName}</h3>
                  <p className="text-xs text-gray-500">{c.orderCount} orders • Tier: {c.tier}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-400">₹{c.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{c.revenueShare}% share</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2"><span>📦</span> Top Products</h2>
          <div className="space-y-4">
            {data.topProducts.map(p => (
              <div key={p.productId} className="flex items-center gap-4 bg-[#1a1d27] border border-[#2a2d3e] p-4 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-white shadow-lg">
                  #{p.rank}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-200">{p.productName}</h3>
                  <p className="text-xs text-gray-500">{p.totalQtySold} sold • Stock: {p.currentStock}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">₹{p.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{p.revenueShare}% share</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
