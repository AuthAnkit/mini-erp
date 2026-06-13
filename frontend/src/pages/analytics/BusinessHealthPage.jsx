import { useState, useEffect } from 'react';
import api from '../../api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function BusinessHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/health-score')
      .then(res => setHealth(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 bg-[#141720] border border-[#1e2132] rounded-2xl" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-72 bg-[#141720] border border-[#1e2132] rounded-xl" />
          <div className="col-span-2 h-72 bg-[#141720] border border-[#1e2132] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!health) return null;

  const scoreColor = health.overallScore >= 80 ? 'text-emerald-400' :
                     health.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400';
  const ringColor = health.overallScore >= 80 ? 'border-emerald-500 shadow-emerald-500/20' :
                    health.overallScore >= 60 ? 'border-yellow-500 shadow-yellow-500/20' : 'border-red-500 shadow-red-500/20';
  const bgGlow = health.overallScore >= 80 ? 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30' :
                 health.overallScore >= 60 ? 'from-yellow-500/10 to-orange-500/10 border-yellow-500/30' :
                 'from-red-500/10 to-rose-500/10 border-red-500/30';

  const statusEmoji = health.overallScore >= 80 ? '💪' : health.overallScore >= 60 ? '⚠️' : '🚨';
  const historyData = (health.history || []).map((h, i) => ({ day: `Day ${i+1}`, score: h.score }));

  return (
    <div className="space-y-6">
      <div className={`bg-gradient-to-r ${bgGlow} border rounded-2xl p-6`}>
        <h1 className="text-2xl font-bold text-white mb-2">Business Health Score</h1>
        <p className="text-gray-400">Composite KPI score evaluating inventory, revenue, procurement, and operational efficiency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Ring */}
        <div className="col-span-1 bg-[#141720] border border-[#1e2132] rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className={`w-44 h-44 rounded-full border-[10px] ${ringColor} shadow-xl flex items-center justify-center mb-6 bg-[#1a1d27]`}>
            <div className="text-center">
              <span className={`text-5xl font-black ${scoreColor}`}>{health.overallScore}</span>
              <p className="text-gray-500 font-bold text-sm">/ 100</p>
            </div>
          </div>
          <div className="text-3xl mb-2">{statusEmoji}</div>
          <h2 className={`text-xl font-black uppercase tracking-widest ${scoreColor}`}>{health.healthStatus}</h2>
          <p className="text-gray-500 mt-2 text-sm">Business Health Status</p>
          <p className="text-gray-600 text-xs mt-1">as of {health.scoreDate}</p>
        </div>

        {/* KPI Grid */}
        <div className="col-span-2 bg-[#141720] border border-[#1e2132] rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-200 mb-6">Key Performance Indicators</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {Object.entries(health.components).map(([key, val]) => {
              const label = key.replace(/([A-Z])/g, ' $1').trim();
              const color = val >= 80 ? 'bg-emerald-500' : val >= 50 ? 'bg-yellow-500' : 'bg-red-500';
              const textColor = val >= 80 ? 'text-emerald-400' : val >= 50 ? 'text-yellow-400' : 'text-red-400';
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400 capitalize">{label}</span>
                    <span className={`font-bold ${textColor}`}>{val}/100</span>
                  </div>
                  <div className="w-full bg-[#0f1117] rounded-full h-2.5">
                    <div
                      className={`${color} h-2.5 rounded-full transition-all duration-700`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Score Trend */}
          {historyData.length > 1 && (
            <div className="mt-8">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Score Trend</h4>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2132" />
                    <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: '8px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-6">
        <h3 className="font-bold text-indigo-400 mb-4 flex items-center gap-2 text-lg">
          <span>💡</span> AI Recommendations
        </h3>
        <div className="space-y-3">
          {health.recommendations.split('\n').filter(Boolean).map((rec, i) => (
            <div key={i} className="flex items-start gap-3 bg-[#1a1d27] border border-[#2a2d3e] rounded-lg p-4">
              <span className="text-base flex-shrink-0">{rec.slice(0, 2)}</span>
              <p className="text-sm text-gray-300 leading-relaxed">{rec.slice(2).trim()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
