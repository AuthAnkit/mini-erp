import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function BusinessHealthPage() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get('/analytics/health-score').then(res => setHealth(res.data));
  }, []);

  if (!health) return <div className="p-10 text-center text-gray-500">Loading health score...</div>;

  const scoreColor = health.overallScore >= 80 ? 'text-emerald-400' :
                     health.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400';
  const bgRing = health.overallScore >= 80 ? 'border-emerald-500' :
                 health.overallScore >= 60 ? 'border-yellow-500' : 'border-red-500';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Business Health Score</h1>
        <p className="text-gray-400">Composite KPI evaluating inventory, revenue, and operational efficiency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-[#141720] border border-[#1e2132] rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className={`w-40 h-40 rounded-full border-8 ${bgRing} flex items-center justify-center mb-6 bg-[#1a1d27] shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
            <div className="text-center">
              <span className={`text-5xl font-black ${scoreColor}`}>{health.overallScore}</span>
              <p className="text-gray-500 font-bold text-sm">/ 100</p>
            </div>
          </div>
          <h2 className={`text-2xl font-bold uppercase tracking-wider ${scoreColor}`}>{health.healthStatus}</h2>
          <p className="text-gray-500 mt-2">Overall Business Status</p>
        </div>

        <div className="col-span-2 bg-[#141720] border border-[#1e2132] rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-200 mb-6">Key Performance Indicators</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {Object.entries(health.components).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="text-gray-200 font-bold">{val}/100</span>
                </div>
                <div className="w-full bg-[#1a1d27] rounded-full h-2">
                  <div className={`h-2 rounded-full ${val >= 80 ? 'bg-emerald-500' : val >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${val}%`}}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-[#1a1d27] rounded-xl p-5 border border-[#2a2d3e]">
            <h4 className="font-bold text-indigo-400 mb-3 flex items-center gap-2"><span>💡</span> AI Recommendations</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              {health.recommendations.split('\n').map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
