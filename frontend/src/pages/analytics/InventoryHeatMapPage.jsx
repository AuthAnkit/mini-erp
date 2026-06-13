import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function InventoryHeatMapPage() {
  const [data, setData] = useState({ heatMap: [], categorySummary: [], totalProducts: 0 });

  useEffect(() => {
    api.get('/analytics/inventory-heatmap').then(res => setData(res.data));
  }, []);

  const getHeatColor = (level) => {
    switch(level) {
      case 'VERY_HIGH': return 'bg-indigo-500';
      case 'HIGH': return 'bg-indigo-400';
      case 'MEDIUM': return 'bg-indigo-300';
      case 'LOW': return 'bg-indigo-200';
      case 'VERY_LOW': return 'bg-red-300';
      default: return 'bg-red-500'; // NONE
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Inventory Heat Map</h1>
        <p className="text-gray-400">Visual intensity grid of stock distribution across all product categories.</p>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 bg-[#141720] border border-[#1e2132] rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-200 mb-4">Stock Distribution Grid</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
            {data.heatMap.map(p => (
              <div 
                key={p.productId} 
                title={`${p.productName}\nStock: ${p.onHand}\nValue: ₹${p.stockValue}`}
                className={`aspect-square rounded-md ${getHeatColor(p.heatLevel)} hover:scale-110 transition-transform cursor-pointer shadow-lg`}
                style={{ opacity: p.heatLevel === 'NONE' ? 0.8 : Math.max(0.4, p.intensity) }}
              />
            ))}
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Out of Stock</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-200 rounded-sm"></div> Low</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> High Intensity</div>
          </div>
        </div>

        <div className="w-80 space-y-4">
          {data.categorySummary.map(c => (
            <div key={c.category} className="bg-[#141720] border border-[#1e2132] rounded-xl p-4">
              <h4 className="font-bold text-gray-300">{c.category}</h4>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-500">Total Stock</span>
                <span className="text-gray-200 font-medium">{c.totalStock} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Products</span>
                <span className="text-gray-200">{c.productCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
