import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DemandForecastPage() {
  const [forecasts, setForecasts] = useState([]);

  useEffect(() => {
    api.get('/analytics/demand-forecasts').then(res => setForecasts(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Demand Forecast Engine</h1>
        <p className="text-gray-400">AI-driven predictions for future product demand based on historical trends.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forecasts.map(f => (
          <div key={f.productId} className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-200">{f.productName}</h3>
                <p className="text-xs text-gray-500">Forecast Date: {f.forecastDate}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                f.trendDirection === 'INCREASING' ? 'bg-emerald-500/10 text-emerald-400' :
                f.trendDirection === 'DECREASING' ? 'bg-red-500/10 text-red-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                {f.trendDirection} {f.trendPercentage > 0 ? '+' : ''}{f.trendPercentage}%
              </span>
            </div>

            <div className="flex justify-between mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Predicted</p>
                <p className="text-2xl font-bold text-indigo-400">{f.predictedDemand}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Confidence</p>
                <p className="text-2xl font-bold text-gray-200">{f.confidencePercentage}%</p>
              </div>
            </div>

            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Daily', sales: f.dailyAvgSales },
                  { name: 'Weekly', sales: f.dailyAvgSales * 7 },
                  { name: 'Monthly', sales: f.monthlyAvgSales },
                  { name: 'Predicted', sales: f.predictedDemand }
                ]}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
