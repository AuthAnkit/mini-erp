import { useState, useEffect } from 'react';
import api from '../../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function RankingsPage() {
  const [data, setData] = useState({ topCustomers: [], topProducts: [], totalRevenue: 0, totalCustomers: 0, totalProducts: 0 });
  const [view, setView] = useState('customers'); // 'customers' or 'products'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/rankings')
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const COLORS = ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'];
  const PRODUCT_COLORS = ['#34d399', '#10b981', '#059669', '#047857', '#065f46'];

  const customerChartData = data.topCustomers.map(c => ({
    name: c.customerName.split(' ')[0],
    revenue: c.totalRevenue,
    share: c.revenueShare
  }));

  const productChartData = data.topProducts.map(p => ({
    name: p.productName.split(' ').slice(0, 2).join(' '),
    revenue: p.totalRevenue,
    qty: p.totalQtySold
  }));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Business Rankings</h1>
        <p className="text-gray-400">Top performing customers and products ranked by revenue contribution.</p>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-2xl font-black text-indigo-400">₹{(data.totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Active Customers</p>
          <p className="text-2xl font-black text-gray-200">{data.totalCustomers || 0}</p>
        </div>
        <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Products Sold</p>
          <p className="text-2xl font-black text-gray-200">{data.totalProducts || 0}</p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex gap-2">
        <button onClick={() => setView('customers')} className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${view === 'customers' ? 'bg-indigo-600 text-white' : 'bg-[#141720] border border-[#1e2132] text-gray-400 hover:text-gray-200'}`}>
          👥 Top Customers
        </button>
        <button onClick={() => setView('products')} className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${view === 'products' ? 'bg-emerald-600 text-white' : 'bg-[#141720] border border-[#1e2132] text-gray-400 hover:text-gray-200'}`}>
          📦 Top Products
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="col-span-3 h-72 bg-[#141720] border border-[#1e2132] rounded-xl animate-pulse" />
          <div className="col-span-2 h-72 bg-[#141720] border border-[#1e2132] rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* List */}
          <div className="col-span-3 bg-[#141720] border border-[#1e2132] rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-200 mb-5">
              {view === 'customers' ? '👥 Top Customers' : '📦 Top Products'}
            </h2>
            <div className="space-y-3">
              {(view === 'customers' ? data.topCustomers : data.topProducts).map((item, i) => {
                const isCustomer = view === 'customers';
                const colors = isCustomer ? COLORS : PRODUCT_COLORS;
                const revenue = item.totalRevenue;
                const subtitle = isCustomer
                  ? `${item.orderCount} orders · Tier: ${item.tier}`
                  : `${item.totalQtySold} units sold · Stock: ${item.currentStock}`;
                return (
                  <div key={isCustomer ? item.customerId : item.productId} className="flex items-center gap-4 bg-[#1a1d27] border border-[#2a2d3e] p-4 rounded-xl hover:border-indigo-500/30 transition-colors">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg shadow-lg flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${colors[i] || '#6366f1'}, ${colors[Math.min(i+1, colors.length-1)] || '#4f46e5'})` }}
                    >
                      #{item.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-200 truncate">{isCustomer ? item.customerName : item.productName}</h3>
                      <p className="text-xs text-gray-500">{subtitle}</p>
                      <div className="mt-2 w-full bg-[#0f1117] rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${item.revenueShare}%`, backgroundColor: colors[i] || '#6366f1' }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-lg" style={{ color: colors[i] || '#6366f1' }}>
                        ₹{revenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{item.revenueShare}% of total</p>
                    </div>
                  </div>
                );
              })}
              {(view === 'customers' ? data.topCustomers : data.topProducts).length === 0 && (
                <div className="text-center py-12 text-gray-500">No data available yet.</div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="col-span-2 bg-[#141720] border border-[#1e2132] rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Revenue Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view === 'customers' ? customerChartData : productChartData} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={70} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: '8px', fontSize: '11px' }}
                    formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {(view === 'customers' ? customerChartData : productChartData).map((_, i) => (
                      <Cell key={i} fill={view === 'customers' ? COLORS[i] : PRODUCT_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
