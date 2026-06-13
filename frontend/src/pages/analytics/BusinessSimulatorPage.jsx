import { useState, useEffect } from 'react';
import api from '../../api';

export default function BusinessSimulatorPage() {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [scenarioType, setScenarioType] = useState('PRICE_CHANGE');
  const [percentChange, setPercentChange] = useState(10);

  const fetchSimulations = () => {
    api.get('/analytics/simulations').then(res => setSimulations(res.data));
  };

  useEffect(() => {
    fetchSimulations();
  }, []);

  const runSimulation = (e) => {
    e.preventDefault();
    setLoading(true);
    api.post('/analytics/simulations', {
      scenarioType,
      parameters: { percentChange }
    })
    .then(() => fetchSimulations())
    .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Business Simulator</h1>
        <p className="text-gray-400">Run "What-If" scenarios to predict the impact of market changes on your profitability.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 bg-[#141720] border border-[#1e2132] rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-200 mb-6">New Scenario</h2>
          <form onSubmit={runSimulation} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Scenario Type</label>
              <select 
                value={scenarioType} onChange={e => setScenarioType(e.target.value)}
                className="w-full bg-[#1a1d27] border border-[#2a2d3e] text-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="PRICE_CHANGE">Price Change (Across all products)</option>
                <option value="DEMAND_SHOCK">Demand Shock (Market boom/crash)</option>
                <option value="COST_INCREASE">Supplier Cost Increase</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Percentage Impact (%)</label>
              <input 
                type="number" 
                value={percentChange} onChange={e => setPercentChange(Number(e.target.value))}
                className="w-full bg-[#1a1d27] border border-[#2a2d3e] text-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. 10 or -15"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors mt-4">
              {loading ? 'Simulating...' : 'Run Simulation'}
            </button>
          </form>
        </div>

        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-200 mb-2">Recent Simulations</h2>
          {simulations.length === 0 ? (
            <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-10 text-center text-gray-500">
              No simulations run yet.
            </div>
          ) : simulations.map(s => (
            <div key={s.id} className="bg-[#141720] border border-[#1e2132] rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-200 text-lg">{s.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{s.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  s.estimatedImpact > 0 ? 'bg-emerald-500/20 text-emerald-400' : 
                  s.estimatedImpact < 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {s.estimatedImpact > 0 ? '+' : ''}₹{s.estimatedImpact.toLocaleString()}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">Proj. Revenue</p>
                  <p className="font-bold text-gray-200">₹{s.projectedRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">Proj. Costs</p>
                  <p className="font-bold text-gray-200">₹{s.projectedCosts.toLocaleString()}</p>
                </div>
                <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">Proj. Profit</p>
                  <p className="font-bold text-indigo-400">₹{s.projectedProfit.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 flex gap-3 items-start">
                <span className="text-xl">🤖</span>
                <p className="text-sm text-indigo-300 leading-relaxed">{s.aiInsights}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
