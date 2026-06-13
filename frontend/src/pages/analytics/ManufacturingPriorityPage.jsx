import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ManufacturingPriorityPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/manufacturing/priority')
      .then(res => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Manufacturing Priority Engine</h1>
        <p className="text-gray-400">AI-ranked production schedule based on urgency, customer tier, and order value.</p>
      </div>

      <div className="grid gap-4">
        {orders.map(o => (
          <div key={o.orderId} className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 flex items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-full border-4 border-[#1e2132] flex items-center justify-center bg-[#1a1d27]">
              <span className="text-2xl font-bold text-gray-300">#{o.rank}</span>
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-200">{o.orderRef} — {o.productName}</h3>
                  <p className="text-sm text-gray-500">Qty: {o.quantity} • Value: ₹{o.orderValue}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    o.priorityLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    o.priorityLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {o.priorityLevel} ({o.priorityScore}/100)
                  </span>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Urgency</span>
                    <span className="text-gray-300">{o.urgencyScore}%</span>
                  </div>
                  <div className="w-full bg-[#1a1d27] rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{width: `${o.urgencyScore}%`}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Customer Value</span>
                    <span className="text-gray-300">{o.customerImportance}%</span>
                  </div>
                  <div className="w-full bg-[#1a1d27] rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${o.customerImportance}%`}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Components Ready</span>
                    <span className="text-gray-300">{o.componentAvailability}%</span>
                  </div>
                  <div className="w-full bg-[#1a1d27] rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${o.componentAvailability}%`}}></div></div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && !loading && (
          <div className="text-center p-10 text-gray-500">No pending manufacturing orders to rank.</div>
        )}
      </div>
    </div>
  );
}
