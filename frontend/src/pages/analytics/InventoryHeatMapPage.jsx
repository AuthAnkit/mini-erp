import { useState, useEffect } from 'react';
import api from '../../api';

export default function InventoryHeatMapPage() {
  const [data, setData] = useState({ heatMap: [], categorySummary: [], totalProducts: 0, criticalCount: 0 });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    api.get('/analytics/inventory-heatmap')
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', ...new Set(data.heatMap.map(p => p.category).filter(Boolean))];
  const filtered = filterCategory === 'ALL' ? data.heatMap : data.heatMap.filter(p => p.category === filterCategory);

  const getHeatColor = (level) => ({
    VERY_HIGH: '#4f46e5',
    HIGH:      '#6366f1',
    MEDIUM:    '#818cf8',
    LOW:       '#a5b4fc',
    VERY_LOW:  '#f59e0b',
    NONE:      '#ef4444',
  }[level] || '#374151');

  const getLevelLabel = (level) => ({
    VERY_HIGH: 'Very High',
    HIGH:      'High',
    MEDIUM:    'Medium',
    LOW:       'Low',
    VERY_LOW:  'Very Low',
    NONE:      'Out of Stock',
  }[level] || level);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Inventory Heat Map</h1>
        <p className="text-gray-400">Visual intensity grid showing stock distribution — hover any block for product details.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: data.totalProducts, color: 'text-gray-200', bg: 'bg-[#141720]' },
          { label: 'Critical (Out of Stock)', value: data.criticalCount || data.heatMap.filter(p => p.heatLevel === 'NONE').length, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
          { label: 'Very Low Stock', value: data.heatMap.filter(p => p.heatLevel === 'VERY_LOW').length, color: 'text-yellow-400', bg: 'bg-yellow-500/5 border-yellow-500/20' },
          { label: 'Healthy Stock', value: data.heatMap.filter(p => ['HIGH', 'VERY_HIGH'].includes(p.heatLevel)).length, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-[#1e2132] rounded-xl p-4 text-center`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-[#141720] border border-[#1e2132] text-gray-400 hover:text-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Heat Map Grid */}
        <div className="flex-1 bg-[#141720] border border-[#1e2132] rounded-xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-gray-200">
              Stock Intensity Grid
              <span className="ml-2 text-xs text-gray-500 font-normal">({filtered.length} products)</span>
            </h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
              {Array(24).fill(0).map((_, i) => (
                <div key={i} className="aspect-square rounded-md bg-[#1a1d27] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 gap-2">
              {filtered.map(p => (
                <div
                  key={p.productId}
                  onClick={() => setSelected(selected?.productId === p.productId ? null : p)}
                  title={`${p.productName}\nStock: ${p.onHand}\nValue: ₹${p.stockValue}`}
                  className={`aspect-square rounded-lg cursor-pointer transition-all duration-200 hover:scale-125 hover:z-10 relative shadow-lg ${
                    selected?.productId === p.productId ? 'ring-2 ring-white scale-110 z-10' : ''
                  }`}
                  style={{
                    backgroundColor: getHeatColor(p.heatLevel),
                    opacity: p.heatLevel === 'NONE' ? 0.9 : Math.max(0.35, p.intensity || 0.5),
                  }}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-8 flex items-center gap-4 flex-wrap text-xs text-gray-500">
            {[
              { level: 'NONE', label: 'Out of Stock' },
              { level: 'VERY_LOW', label: 'Very Low' },
              { level: 'LOW', label: 'Low' },
              { level: 'MEDIUM', label: 'Medium' },
              { level: 'HIGH', label: 'High' },
              { level: 'VERY_HIGH', label: 'Very High' },
            ].map(l => (
              <div key={l.level} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getHeatColor(l.level) }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 flex flex-col gap-4">
          {/* Selected product detail */}
          {selected ? (
            <div className="bg-[#141720] border-2 rounded-xl p-5" style={{ borderColor: getHeatColor(selected.heatLevel) }}>
              <h4 className="font-bold text-gray-200 text-base mb-4">{selected.productName}</h4>
              <div className="space-y-3">
                {[
                  { label: 'Category', value: selected.category || '—' },
                  { label: 'Stock Level', value: `${selected.heatLevel} (${getLevelLabel(selected.heatLevel)})`, color: getHeatColor(selected.heatLevel) },
                  { label: 'On Hand', value: `${selected.onHand} units` },
                  { label: 'Stock Value', value: `₹${selected.stockValue.toLocaleString()}` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{r.label}</span>
                    <span className="font-medium" style={r.color ? { color: r.color } : { color: '#e5e7eb' }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelected(null)} className="w-full mt-4 text-xs text-gray-500 hover:text-gray-300 text-center">
                Click elsewhere to dismiss
              </button>
            </div>
          ) : (
            <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 text-center text-gray-600 text-sm">
              Click any block to see product details
            </div>
          )}

          {/* Category Breakdown */}
          <div className="bg-[#141720] border border-[#1e2132] rounded-xl p-5 flex-1">
            <h4 className="font-bold text-gray-300 mb-4 text-sm uppercase tracking-wider">By Category</h4>
            <div className="space-y-3">
              {data.categorySummary.map(c => {
                const pct = data.totalProducts > 0 ? Math.round((c.productCount / data.totalProducts) * 100) : 0;
                return (
                  <div key={c.category} className="cursor-pointer" onClick={() => setFilterCategory(c.category)}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{c.category}</span>
                      <span className="text-gray-300 font-medium">{c.productCount} products</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#0f1117] rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{c.totalStock} units</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
