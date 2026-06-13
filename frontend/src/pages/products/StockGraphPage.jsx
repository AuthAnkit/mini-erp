import { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { productsApi } from '../../api';
import { Card, Button, Modal } from '../../components/shared';

// ── Custom Stock Node ─────────────────────────────────────────────────────────
function StockNode({ data }) {
  const { name, ref, onHandQty, reservedQty, freeToUseQty, stockStatus,
          hasBom, procurementMethod, category, simDelta } = data;

  const borderColor = simDelta < 0
    ? '#ef4444'
    : stockStatus === 'CRITICAL' ? '#ef4444'
    : stockStatus === 'LOW' ? '#f59e0b'
    : '#10b981';

  const bgColor = simDelta < 0
    ? '#1a0f0f'
    : stockStatus === 'CRITICAL' ? '#1a0f0f'
    : stockStatus === 'LOW' ? '#1a150a'
    : '#0f1a10';

  const categoryIcon = {
    'Raw Material': '🪵',
    'Sub-Assembly': '🔧',
    'Finished Good': '✅',
  }[category] || '📦';

  return (
    <div style={{ border: `2px solid ${borderColor}`, background: bgColor }}
      className="rounded-xl p-3 min-w-[160px] max-w-[200px] shadow-lg transition-all">
      <Handle type="target" position={Position.Bottom} style={{ background: borderColor }} />

      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg">{categoryIcon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-100 leading-tight truncate">{name}</p>
          <p className="text-xs text-gray-500 font-mono">{ref}</p>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">On Hand</span>
          <span className="text-gray-200 font-mono">{onHandQty}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Reserved</span>
          <span className="text-amber-400 font-mono">{reservedQty}</span>
        </div>
        <div className="flex justify-between border-t border-gray-700/50 pt-0.5 mt-0.5">
          <span className="text-gray-400 font-medium">Free</span>
          <span style={{ color: borderColor }} className="font-bold font-mono">
            {simDelta < 0 ? `${freeToUseQty} (−${Math.abs(simDelta)})` : freeToUseQty}
          </span>
        </div>
      </div>

      {hasBom && (
        <div className="mt-1.5 flex gap-1 flex-wrap">
          <span className="text-xs bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded">
            {procurementMethod === 'MANUFACTURING' ? '⚙️ MFG' : '🛒 BUY'}
          </span>
        </div>
      )}
      <Handle type="source" position={Position.Top} style={{ background: borderColor }} />
    </div>
  );
}

const nodeTypes = { stockNode: StockNode };

// ── What-If Result Panel ─────────────────────────────────────────────────────
function SimulationPanel({ result, onClose }) {
  if (!result) return null;
  return (
    <div className="bg-[#1a1d27] border border-indigo-600/50 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-indigo-300">🎯 What-If Simulation Result</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm">✕</button>
      </div>

      <div className="mb-3 p-3 bg-[#0f1117] rounded-lg">
        <p className="text-xs text-gray-400">Order: <span className="text-white font-bold">{result.orderQty}x {result.product?.name}</span></p>
        <p className="text-xs mt-1">
          Free to Use: <span className={result.freeToUseQty >= result.orderQty ? 'text-emerald-400' : 'text-red-400'}>
            {result.freeToUseQty}
          </span>
          {result.shortfall > 0 && <span className="text-red-400"> · Shortfall: {result.shortfall}</span>}
        </p>
        {result.canFulfillDirectly
          ? <p className="text-xs text-emerald-400 mt-1">✅ Can fulfill from stock directly</p>
          : <p className="text-xs text-amber-400 mt-1">⚠️ Procurement will be triggered</p>
        }
      </div>

      {result.actions?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Would Auto-Create</p>
          {result.actions.map((a, i) => (
            <div key={i} className={`p-2 rounded-lg mb-1.5 ${
              a.type === 'MANUFACTURING'
                ? 'bg-purple-900/20 border border-purple-700/30'
                : 'bg-green-900/20 border border-green-700/30'
            }`}>
              <p className="text-xs font-medium text-gray-200">
                {a.type === 'MANUFACTURING' ? '⚙️ MO' : '🏭 PO'} — {a.productName}
              </p>
              <p className="text-xs text-gray-500">{a.description}</p>
              {a.estimatedDurationMinutes && (
                <p className="text-xs text-purple-400 mt-0.5">
                  ⏱ Est. {Math.round(a.estimatedDurationMinutes / 60 * 10) / 10}h total
                </p>
              )}
              {a.vendorName && (
                <p className="text-xs text-green-400 mt-0.5">🏭 {a.vendorName}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-[#2a2d3e] pt-3">
        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Stock Impact</p>
        <div className="flex flex-col gap-1 max-h-32 overflow-auto">
          {result.stockImpact?.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{'  '.repeat(s.depth)}{s.productName}</span>
              <span className={s.shortfall > 0 ? 'text-red-400' : 'text-emerald-400'}>
                {s.shortfall > 0 ? `-${s.shortfall}` : '✓'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main StockGraph Page ──────────────────────────────────────────────────────
export default function StockGraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [simProduct, setSimProduct] = useState('');
  const [simQty, setSimQty] = useState(10);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [rawGraph, setRawGraph] = useState(null);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const [graphRes, prodRes] = await Promise.all([
        productsApi.getGraph(),
        productsApi.getAll()
      ]);
      setRawGraph(graphRes.data);
      setProducts(prodRes.data);
      buildFlow(graphRes.data, null);
    } catch (err) {
      console.error("Failed to load stock graph:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const buildFlow = (graphData, simData) => {
    const rawNodes = graphData.nodes || [];
    const rawEdges = graphData.edges || [];

    // Auto-layout: group by category
    const categories = {
      'Raw Material': { x: 0, col: 0 },
      'Sub-Assembly': { x: 250, col: 1 },
      'Finished Good': { x: 500, col: 2 },
    };
    const colCounts = { 0: 0, 1: 0, 2: 0, other: 0 };

    const flowNodes = rawNodes.map(n => {
      const cat = n.category || 'other';
      const col = categories[cat];
      const colIdx = col ? col.col : 3;
      const count = colCounts[colIdx] || 0;
      colCounts[colIdx] = count + 1;

      // Apply simulation delta if relevant
      const simImpact = simData?.stockImpact?.find(s => s.productId === n.productId);
      const simDelta = simImpact ? -simImpact.shortfall : 0;

      return {
        id: n.id,
        type: 'stockNode',
        position: { x: (colIdx * 280) + 50, y: count * 180 + 50 },
        data: { ...n, simDelta },
      };
    });

    const flowEdges = rawEdges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      labelStyle: { fill: '#a5b4fc', fontSize: 11, fontWeight: 'bold' },
      animated: true,
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  useEffect(() => { loadGraph(); }, [loadGraph]);

  const runSimulation = async () => {
    if (!simProduct) return;
    setSimLoading(true);
    try {
      const res = await productsApi.simulate(Number(simProduct), simQty);
      setSimResult(res.data);
      // Re-render graph with simulation overlay
      if (rawGraph) buildFlow(rawGraph, res.data);
    } finally {
      setSimLoading(false);
    }
  };

  const clearSimulation = () => {
    setSimResult(null);
    if (rawGraph) buildFlow(rawGraph, null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="mb-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">🕸️ Living Stock Graph</h1>
          <p className="text-gray-500 text-sm">Real-time BoM dependency visualization with live stock levels</p>
        </div>
        <Button variant="secondary" onClick={loadGraph} size="sm">↺ Refresh</Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Graph */}
        <div className="flex-1 bg-[#1a1d27] border border-[#2a2d3e] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedNode(node.data)}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background color="#2a2d3e" gap={20} />
              <Controls style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }} />
              <MiniMap
                nodeColor={n => {
                  const s = n.data?.stockStatus;
                  return s === 'CRITICAL' ? '#ef4444' : s === 'LOW' ? '#f59e0b' : '#10b981';
                }}
                style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}
              />
            </ReactFlow>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-72 flex flex-col gap-4 flex-shrink-0">
          {/* Legend */}
          <Card className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Legend</p>
            <div className="flex flex-col gap-2 text-xs">
              {[
                { color: '#10b981', label: 'Stock OK', icon: '🟢' },
                { color: '#f59e0b', label: 'Stock Low (<20%)', icon: '🟡' },
                { color: '#ef4444', label: 'Stock Critical (0)', icon: '🔴' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                  <span className="text-gray-400">{l.label}</span>
                </div>
              ))}
              <div className="border-t border-[#2a2d3e] pt-2 mt-1">
                <p className="text-gray-500">🪵 Raw Material</p>
                <p className="text-gray-500">🔧 Sub-Assembly</p>
                <p className="text-gray-500">✅ Finished Good</p>
              </div>
            </div>
          </Card>

          {/* What-If Simulator */}
          <Card className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">🎯 What-If Simulator</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Product</label>
                <select
                  value={simProduct}
                  onChange={e => setSimProduct(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select product…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Order Qty</label>
                <input
                  type="number" min="1" value={simQty}
                  onChange={e => setSimQty(Number(e.target.value))}
                  className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={runSimulation}
                  disabled={!simProduct || simLoading} className="flex-1">
                  {simLoading ? '...' : 'Simulate'}
                </Button>
                {simResult && (
                  <Button variant="secondary" size="sm" onClick={clearSimulation}>Clear</Button>
                )}
              </div>
            </div>
          </Card>

          {/* Sim Result */}
          {simResult && <SimulationPanel result={simResult} onClose={clearSimulation} />}

          {/* Selected Node Details */}
          {selectedNode && !simResult && (
            <Card className="p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Node Details</p>
                <button onClick={() => setSelectedNode(null)} className="text-gray-600 hover:text-gray-400 text-xs">✕</button>
              </div>
              <p className="text-sm font-semibold text-gray-100 mb-1">{selectedNode.name}</p>
              <p className="text-xs font-mono text-gray-500 mb-3">{selectedNode.ref}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'On Hand', val: selectedNode.onHandQty, color: 'text-gray-200' },
                  { label: 'Reserved', val: selectedNode.reservedQty, color: 'text-amber-400' },
                  { label: 'Free to Use', val: selectedNode.freeToUseQty, color: 'text-emerald-400' },
                  { label: 'Status', val: selectedNode.stockStatus, color: 'text-gray-300' },
                ].map(f => (
                  <div key={f.label} className="bg-[#0f1117] rounded-lg p-2">
                    <p className="text-gray-600">{f.label}</p>
                    <p className={`font-bold ${f.color}`}>{f.val}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setSimProduct(String(selectedNode.productId)); }}
                className="mt-3 w-full text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Run simulation for this product →
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
