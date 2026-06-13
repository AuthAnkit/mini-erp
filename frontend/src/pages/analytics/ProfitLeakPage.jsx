import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ProfitLeakPage() {
  const [data, setData] = useState({ totalLeaks: 0, totalMonthlyImpact: 0, leaks: [], byType: {} });

  useEffect(() => {
    api.get('/analytics/profit-leaks').then(res => setData(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Profit Leak Detector</h1>
        <p className="text-gray-400">Identify hidden losses such as dead stock, inventory holding costs, and price erosion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-6">
            <h3 className="text-gray-500 uppercase tracking-wider text-xs mb-2">Est. Monthly Impact</h3>
            <p className="text-4xl font-black text-rose-400">₹{data.totalMonthlyImpact.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-2">Across {data.totalLeaks} active leaks</p>
          </div>
          
          <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-6">
            <h3 className="font-bold text-gray-200 mb-4">Leaks by Category</h3>
            <div className="space-y-3">
              {Object.entries(data.byType || {}).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400 capitalize">{type.replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="bg-[#1a1d27] border border-[#2a2d3e] px-2 py-1 rounded text-xs font-bold text-gray-200">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          {data.leaks.map(l => (
            <div key={l.leakId} className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 flex gap-4">
              <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center flex-shrink-0 border border-rose-500/20">
                <span className="text-xl">💸</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 bg-[#1a1d27] border border-[#2a2d3e] rounded text-xs text-rose-400 font-bold uppercase">
                    {l.leakType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-rose-400 font-bold">Loss: ₹{l.estimatedMonthlyImpact.toLocaleString()}/mo</span>
                </div>
                <p className="text-gray-300 font-medium mb-3">{l.description}</p>
                <div className="bg-[#1a1d27] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Action Required:</p>
                  <p className="text-sm text-indigo-400 font-medium">{l.recommendedAction}</p>
                </div>
              </div>
            </div>
          ))}
          {data.leaks.length === 0 && (
            <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-10 text-center text-gray-500">
              No profit leaks detected. Your business is highly optimized.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
