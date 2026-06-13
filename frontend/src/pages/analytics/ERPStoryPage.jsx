import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ERPStoryPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('DAILY');

  const fetchStories = () => {
    api.get('/analytics/stories').then(res => setStories(res.data));
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const generate = () => {
    setLoading(true);
    api.post('/analytics/stories/generate', { periodType: period })
      .then(() => fetchStories())
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">ERP Business Story</h1>
          <p className="text-gray-400">Natural-language summaries of your business performance.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={period} onChange={e => setPeriod(e.target.value)}
            className="bg-[#1a1d27] border border-[#2a2d3e] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="DAILY">Daily Story</option>
            <option value="WEEKLY">Weekly Story</option>
            <option value="MONTHLY">Monthly Story</option>
          </select>
          <button onClick={generate} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            {loading ? 'Generating...' : 'Generate New'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stories.map(s => (
          <div key={s.id} className="bg-[#141720] border border-[#1e2132] rounded-xl overflow-hidden flex flex-col">
            <div className="bg-[#1a1d27] border-b border-[#1e2132] px-6 py-4 flex justify-between items-center">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                s.periodType === 'MONTHLY' ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                s.periodType === 'WEEKLY' ? 'bg-violet-500/20 text-violet-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {s.periodType} UPDATE
              </span>
              <span className="text-sm text-gray-500">{s.storyDate}</span>
            </div>
            
            <div className="p-6 flex-1">
              <div className="prose prose-invert max-w-none text-gray-300">
                {/* Parse simple markdown (bold text) */}
                <div dangerouslySetInnerHTML={{ 
                  __html: s.storyContent.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\n/g, '<br/>')
                }} />
              </div>
            </div>

            <div className="bg-[#1a1d27]/50 border-t border-[#1e2132] p-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Revenue</p>
                <p className="font-bold text-emerald-400">₹{s.revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Orders</p>
                <p className="font-bold text-gray-200">{s.ordersReceived}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Growth</p>
                <p className={`font-bold ${s.revenueChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.revenueChange > 0 ? '+' : ''}{s.revenueChange.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        ))}
        {stories.length === 0 && (
          <div className="col-span-full p-10 text-center text-gray-500">
            No stories generated yet. Click "Generate New" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
