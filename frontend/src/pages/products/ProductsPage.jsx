import { useEffect, useState } from 'react';
import { productsApi, vendorsApi } from '../../api';
import { Card, Button, Badge, Table, Tr, Td, Modal, Input, Select, LoadingSpinner, EmptyState } from '../../components/shared';
import { auditApi } from '../../api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    name: '', ref: '', category: 'Finished Good', description: '',
    salesPrice: '', costPrice: '', onHandQty: '0',
    procureOnDemand: false, procurementMethod: '', vendorId: ''
  });
  const [compForm, setCompForm] = useState({ componentId: '', quantity: '', uom: 'Units' });

  useEffect(() => {
    load();
    vendorsApi.getAll().then(r => setVendors(r.data));
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await productsApi.getAll();
      setProducts(r.data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = async (p) => {
    setSelected(p);
    try {
      const h = await auditApi.getRecordHistory('Product', p.id);
      setAuditHistory(h.data);
    } catch (err) {
      console.error('Could not load audit history:', err);
      setAuditHistory([]);
    }
  };

  const createProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        ref: form.ref || null,
        category: form.category,
        description: form.description || '',
        salesPrice: Number(form.salesPrice),
        costPrice: Number(form.costPrice),
        onHandQty: Number(form.onHandQty || 0),
        procureOnDemand: Boolean(form.procureOnDemand),
        procurementMethod: form.procureOnDemand ? form.procurementMethod || null : null,
        vendorId: form.procureOnDemand && form.procurementMethod === 'PURCHASE' && form.vendorId ? Number(form.vendorId) : null
      };
      await productsApi.create(payload);
      setShowCreate(false);
      setForm({ name: '', ref: '', category: 'Finished Good', description: '',
        salesPrice: '', costPrice: '', onHandQty: '0', procureOnDemand: false, procurementMethod: '', vendorId: '' });
      load();
    } catch (err) {
      console.error("Failed to create product:", err);
      alert(err.response?.data?.error || "Error creating product. Please verify pricing and quantities are valid numbers.");
    }
  };

  const addComponent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        componentId: Number(compForm.componentId),
        quantity: Number(compForm.quantity),
        uom: compForm.uom || 'Units'
      };
      await productsApi.addComponent(selected.id, payload);
      const r = await productsApi.getById(selected.id);
      setSelected(r.data);
      setCompForm({ componentId: '', quantity: '', uom: 'Units' });
      load();
    } catch (err) {
      console.error('Failed to add component:', err);
      alert(err.response?.data?.error || 'Error adding component. Circular dependencies are not allowed.');
    }
  };

  const removeComponent = async (cid) => {
    try {
      await productsApi.removeComponent(selected.id, cid);
      const r = await productsApi.getById(selected.id);
      setSelected(r.data);
      load();
    } catch (err) {
      console.error('Failed to remove component:', err);
      alert(err.response?.data?.error || 'Error removing component.');
    }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.ref?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['Finished Good', 'Sub-Assembly', 'Raw Material', 'Consumable'];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">📦 Products & BoM</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products · Click to manage BoM</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Product</Button>
      </div>

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, ref, or category…"
          className="bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-gray-200
            focus:outline-none focus:border-indigo-500 w-full max-w-sm" />
      </div>

      {/* Excel-style table view */}
      <Card className="overflow-hidden border border-[#2a2d3e]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse text-left">
            <thead>
              <tr className="bg-[#1e2130] border-b border-[#2a2d3e] text-gray-400">
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Ref</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Name</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Category</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider text-right">On Hand</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider text-right">Reserved</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider text-right">Free to Use</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider text-center">Status</th>
                <th className="p-3 font-medium text-xs uppercase tracking-wider">Procurement</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} onClick={() => selectProduct(p)} className="border-b border-[#2a2d3e] hover:bg-[#1a1d27]/50 cursor-pointer transition-colors">
                    <td className="p-3 border-r border-[#2a2d3e] font-mono text-xs text-indigo-400">{p.ref}</td>
                    <td className="p-3 border-r border-[#2a2d3e] font-semibold text-gray-100">{p.name}</td>
                    <td className="p-3 border-r border-[#2a2d3e] text-gray-400 text-xs">{p.category}</td>
                    <td className="p-3 border-r border-[#2a2d3e] text-right text-gray-300 font-mono">{p.onHandQty}</td>
                    <td className="p-3 border-r border-[#2a2d3e] text-right text-amber-400 font-mono">{p.reservedQty}</td>
                    <td className={`p-3 border-r border-[#2a2d3e] text-right font-mono font-medium ${
                      (p.freeToUseQty ?? (p.onHandQty - p.reservedQty)) <= 0 ? 'text-red-400 font-bold' : 'text-emerald-400'
                    }`}>
                      {p.freeToUseQty ?? (p.onHandQty - p.reservedQty)}
                    </td>
                    <td className="p-3 border-r border-[#2a2d3e] text-center">
                      <Badge status={p.stockStatus || 'OK'} />
                    </td>
                    <td className="p-3">
                      {p.procureOnDemand ? (
                        <span className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/30">
                          {p.procurementMethod || 'MTO'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 bg-[#0f1117] px-2 py-0.5 rounded border border-gray-800">
                          Manual
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Product Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)}
        title={selected ? `${selected.ref} — ${selected.name}` : ''} width="max-w-4xl">
        {selected && (
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Info + BoM */}
            <div>
              {/* Stock info */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'On Hand', val: selected.onHandQty, color: 'text-gray-200' },
                  { label: 'Reserved', val: selected.reservedQty, color: 'text-amber-400' },
                  { label: 'Free to Use', val: selected.freeToUseQty ?? (selected.onHandQty - selected.reservedQty), color: 'text-emerald-400' },
                ].map(f => (
                  <div key={f.label} className="bg-[#0f1117] rounded-lg p-3">
                    <p className="text-xs text-gray-500">{f.label}</p>
                    <p className={`text-2xl font-bold ${f.color}`}>{f.val}</p>
                  </div>
                ))}
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#0f1117] rounded-lg p-3">
                  <p className="text-xs text-gray-500">Sales Price</p>
                  <p className="text-lg font-semibold text-gray-200">₹{selected.salesPrice}</p>
                </div>
                <div className="bg-[#0f1117] rounded-lg p-3">
                  <p className="text-xs text-gray-500">Cost Price</p>
                  <p className="text-lg font-semibold text-gray-200">₹{selected.costPrice}</p>
                </div>
              </div>

              {/* BoM Components */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">📐 Bill of Materials</h3>
                {selected.bomComponents?.length === 0 ? (
                  <p className="text-xs text-gray-600">No components defined yet.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {selected.bomComponents?.map(bc => (
                      <div key={bc.id} className="flex items-center justify-between
                        bg-[#0f1117] rounded-lg px-3 py-2">
                        <div>
                          <span className="text-xs text-gray-200 font-medium">
                            {bc.componentProduct?.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2 font-mono">
                            {bc.componentProduct?.ref}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-indigo-300 font-bold">×{bc.quantity} {bc.uom}</span>
                          <button onClick={() => removeComponent(bc.componentProduct.id)}
                            className="text-red-600 hover:text-red-400 text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Component */}
              <form onSubmit={addComponent} className="border border-[#2a2d3e] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Add Component</p>
                <div className="flex flex-col gap-2">
                  <select value={compForm.componentId}
                    onChange={e => setCompForm({...compForm, componentId: e.target.value})}
                    className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500">
                    <option value="">Select component…</option>
                    {products.filter(p => p.id !== selected.id).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.ref})</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Qty" step="0.1" min="0.1"
                      value={compForm.quantity}
                      onChange={e => setCompForm({...compForm, quantity: e.target.value})}
                      className="flex-1 bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500" />
                    <input placeholder="UoM" value={compForm.uom}
                      onChange={e => setCompForm({...compForm, uom: e.target.value})}
                      className="w-20 bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-2 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <Button type="submit" size="sm" disabled={!compForm.componentId || !compForm.quantity}>
                    + Add Component
                  </Button>
                </div>
              </form>
            </div>

            {/* Right: Audit Trail */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">📋 Audit Trail</h3>
              <div className="flex flex-col gap-2 max-h-[500px] overflow-auto">
                {auditHistory.length === 0 ? (
                  <p className="text-xs text-gray-600">No history yet.</p>
                ) : auditHistory.map((log, i) => (
                  <div key={i} className="bg-[#0f1117] rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-indigo-300">{log.action}</span>
                      <span className="text-xs text-gray-600">
                        {new Date(log.dateTime).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' })}
                      </span>
                    </div>
                    {log.fieldChanged && (
                      <p className="text-xs text-gray-500">
                        {log.fieldChanged}: <span className="text-red-400">{log.oldValue || '—'}</span>
                        {' → '}
                        <span className="text-emerald-400">{log.newValue || '—'}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-600">{log.details}</p>
                    <p className="text-xs text-gray-700">by {log.userName}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Product Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Product">
        <form onSubmit={createProduct} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Product Name *" required value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} />
            <Input label="Reference (auto if blank)" value={form.ref}
              onChange={e => setForm({...form, ref: e.target.value})} placeholder="PRD-00001" />
          </div>
          <Select label="Category" value={form.category}
            onChange={e => setForm({...form, category: e.target.value})}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </Select>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Sales Price (₹) *" type="number" required value={form.salesPrice}
              onChange={e => setForm({...form, salesPrice: e.target.value})} />
            <Input label="Cost Price (₹) *" type="number" required value={form.costPrice}
              onChange={e => setForm({...form, costPrice: e.target.value})} />
            <Input label="Initial Stock" type="number" value={form.onHandQty}
              onChange={e => setForm({...form, onHandQty: e.target.value})} />
          </div>
          <div className="border border-[#2a2d3e] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Procurement Setup</p>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="pod" checked={form.procureOnDemand}
                onChange={e => setForm({...form, procureOnDemand: e.target.checked})} />
              <label htmlFor="pod" className="text-sm text-gray-300">Procure On Demand (MTO)</label>
            </div>
            {form.procureOnDemand && (
              <div className="grid grid-cols-2 gap-3">
                <Select label="Method" value={form.procurementMethod}
                  onChange={e => setForm({...form, procurementMethod: e.target.value})}>
                  <option value="">Select…</option>
                  <option value="PURCHASE">Purchase</option>
                  <option value="MANUFACTURING">Manufacturing</option>
                </Select>
                {form.procurementMethod === 'PURCHASE' && (
                  <Select label="Vendor" value={form.vendorId}
                    onChange={e => setForm({...form, vendorId: e.target.value})}>
                    <option value="">Select vendor…</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </Select>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit">Create Product</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
