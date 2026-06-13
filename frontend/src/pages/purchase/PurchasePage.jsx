import { useEffect, useState } from 'react';
import { purchaseApi, vendorsApi, productsApi, auditApi } from '../../api';
import { Card, Button, Badge, Table, Tr, Td, Modal, Input, Select, LoadingSpinner } from '../../components/shared';

export default function PurchasePage() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [receiveMode, setReceiveMode] = useState(false);
  const [receipts, setReceipts] = useState({});
  const [form, setForm] = useState({ vendorId: '', scheduleDate: '', notes: '', lines: [] });

  useEffect(() => {
    load();
    vendorsApi.getAll().then(r => setVendors(r.data)).catch(() => {});
    productsApi.getAll().then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await purchaseApi.getAll();
      setOrders(r.data.sort((a,b) => new Date(b.creationDate) - new Date(a.creationDate)));
    } catch (err) {
      console.error("Failed to load POs:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = async (o) => {
    try {
      const r = await purchaseApi.getById(o.id);
      setSelected(r.data);
    } catch (err) {
      console.error('Error fetching PO details:', err);
    }
    try {
      const h = await auditApi.getRecordHistory('PurchaseOrder', o.id);
      setAuditHistory(h.data);
    } catch (_) {
      setAuditHistory([]);
    }
    setReceiveMode(false);
    setReceipts({});
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { productId: '', orderedQty: '', costPrice: '' }] });
  const removeLine = (i) => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });
  const updateLine = (i, f, v) => {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [f]: v };
    if (f === 'productId') {
      const p = products.find(p => String(p.id) === String(v));
      if (p) lines[i].costPrice = p.costPrice;
    }
    setForm({ ...form, lines });
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      // Format numeric properties properly so the Spring Boot backend parses them correctly
      const payload = {
        vendorId: Number(form.vendorId),
        scheduleDate: form.scheduleDate,
        notes: form.notes,
        lines: form.lines.map(l => ({
          productId: Number(l.productId),
          orderedQty: Number(l.orderedQty),
          costPrice: Number(l.costPrice)
        }))
      };
      await purchaseApi.create(payload);
      setShowCreate(false);
      setForm({ vendorId: '', scheduleDate: '', notes: '', lines: [] });
      load();
    } catch (err) {
      console.error("Failed to create PO:", err);
      alert(err.response?.data?.error || "Error creating Purchase Order. Verify all fields are valid.");
    }
  };

  const confirm = async () => {
    try {
      await purchaseApi.confirm(selected.id);
      const r = await purchaseApi.getById(selected.id);
      setSelected(r.data);
      load();
    } catch (err) {
      console.error(err);
      alert("Error confirming PO");
    }
  };

  const receive = async () => {
    try {
      const r = {};
      Object.entries(receipts).forEach(([k, v]) => { if (v > 0) r[k] = v; });
      await purchaseApi.receive(selected.id, { receipts: r });
      const res = await purchaseApi.getById(selected.id);
      setSelected(res.data);
      setReceiveMode(false);
      load();
    } catch (err) {
      console.error(err);
      alert("Error recording receipt");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">🏭 Purchase Orders</h1>
          <p className="text-gray-500 text-sm">{orders.length} orders total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Purchase Order</Button>
      </div>

      {/* Excel-style table view */}
      <Card className="overflow-hidden border border-[#2a2d3e]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse text-left">
            <thead>
              <tr className="bg-[#1e2130] border-b border-[#2a2d3e] text-gray-400">
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Ref</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Vendor</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Created</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Schedule</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider text-center">Lines</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Triggered By</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider text-center">Status</th>
                <th className="p-3 font-medium text-xs uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id} onClick={() => selectOrder(o)} className="border-b border-[#2a2d3e] hover:bg-[#1a1d27]/50 cursor-pointer transition-colors">
                    <td className="p-3 border-r border-[#2a2d3e] font-mono text-xs text-green-300">{o.ref}</td>
                    <td className="p-3 border-r border-[#2a2d3e] font-semibold text-gray-100">{o.vendor?.name}</td>
                    <td className="p-3 border-r border-[#2a2d3e] text-gray-400 text-xs">{new Date(o.creationDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 border-r border-[#2a2d3e] text-gray-400 text-xs">{o.scheduleDate || '—'}</td>
                    <td className="p-3 border-r border-[#2a2d3e] text-center text-gray-300 font-mono">{o.lines?.length}</td>
                    <td className="p-3 border-r border-[#2a2d3e] text-xs">
                      {o.triggeredBySoId ? (
                        <span className="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded border border-amber-700/30">
                          Auto (SO-{o.triggeredBySoId})
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 bg-[#0f1117] px-2 py-0.5 rounded border border-gray-800">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="p-3 border-r border-[#2a2d3e] text-center">
                      <Badge status={o.status} />
                    </td>
                    <td className="p-3 text-center">
                      <button className="text-green-400 hover:text-green-300 text-xs font-semibold">View →</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PO Detail */}
      <Modal open={!!selected} onClose={() => setSelected(null)}
        title={selected ? `${selected.ref} — ${selected.vendor?.name}` : ''} width="max-w-4xl">
        {selected && (
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Badge status={selected.status} />
                {selected.triggeredBySoId && (
                  <span className="text-xs bg-amber-900/30 text-amber-300 border border-amber-700/40 px-2 py-0.5 rounded">
                    Auto-created for SO-{selected.triggeredBySoId}
                  </span>
                )}
              </div>

              <table className="w-full text-xs mb-4">
                <thead>
                  <tr className="border-b border-[#2a2d3e] text-gray-500">
                    <th className="text-left py-2">Product</th>
                    <th className="text-right py-2">Ordered</th>
                    <th className="text-right py-2">Received</th>
                    <th className="text-right py-2">Cost Price</th>
                    {receiveMode && <th className="text-right py-2">Receive Qty</th>}
                  </tr>
                </thead>
                <tbody>
                  {selected.lines?.map(line => (
                    <tr key={line.id} className="border-b border-[#1e2130]">
                      <td className="py-2 text-gray-200">{line.product?.name}</td>
                      <td className="py-2 text-right text-gray-300">{line.orderedQty}</td>
                      <td className="py-2 text-right text-emerald-400">{line.receivedQty}</td>
                      <td className="py-2 text-right text-gray-300">₹{line.costPrice}</td>
                      {receiveMode && (
                        <td className="py-2 text-right">
                          <input type="number" min="0" max={line.orderedQty - line.receivedQty}
                            value={receipts[line.id] ?? 0}
                            onChange={e => setReceipts({...receipts, [line.id]: Number(e.target.value)})}
                            className="w-16 bg-[#0f1117] border border-green-600 rounded px-2 py-1 text-right" />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex gap-2">
                {selected.status === 'DRAFT' && (
                  <Button variant="success" onClick={confirm}>✓ Confirm PO</Button>
                )}
                {(selected.status === 'CONFIRMED' || selected.status === 'PARTIALLY_RECEIVED') && !receiveMode && (
                  <Button variant="primary" onClick={() => setReceiveMode(true)}>📥 Record Receipt</Button>
                )}
                {receiveMode && (
                  <>
                    <Button variant="success" onClick={receive}>✓ Confirm Receipt</Button>
                    <Button variant="secondary" onClick={() => setReceiveMode(false)}>Cancel</Button>
                  </>
                )}
                {selected.status !== 'CANCELLED' && selected.status !== 'FULLY_RECEIVED' && (
                  <Button variant="danger" onClick={async () => {
                    try {
                      await purchaseApi.cancel(selected.id);
                      const r = await purchaseApi.getById(selected.id);
                      setSelected(r.data);
                      load();
                    } catch (err) {
                      alert(err.response?.data?.error || 'Error cancelling PO.');
                    }
                  }}>✕ Cancel</Button>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">📋 History</h3>
              <div className="flex flex-col gap-2 max-h-80 overflow-auto">
                {auditHistory.map((log, i) => (
                  <div key={i} className="bg-[#0f1117] rounded-lg p-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium text-green-300">{log.action}</span>
                      <span className="text-xs text-gray-600">
                        {new Date(log.dateTime).toLocaleTimeString('en-IN', {timeStyle:'short'})}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create PO Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Purchase Order">
        <form onSubmit={create} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Vendor *" required value={form.vendorId}
              onChange={e => setForm({...form, vendorId: e.target.value})}>
              <option value="">Select vendor…</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
            <Input label="Scheduled Date" type="date" value={form.scheduleDate}
              onChange={e => setForm({...form, scheduleDate: e.target.value})} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">Order Lines</label>
              <button type="button" onClick={addLine} className="text-xs text-green-400">+ Add Line</button>
            </div>
            {form.lines.map((line, i) => (
              <div key={i} className="grid grid-cols-7 gap-2 mb-2 items-center">
                <select value={line.productId} onChange={e => updateLine(i, 'productId', e.target.value)}
                  className="col-span-3 bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500">
                  <option value="">Product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" placeholder="Qty" min="1" value={line.orderedQty}
                  onChange={e => updateLine(i, 'orderedQty', e.target.value)}
                  className="col-span-1 bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500" />
                <input type="number" placeholder="Cost/unit" value={line.costPrice}
                  onChange={e => updateLine(i, 'costPrice', e.target.value)}
                  className="col-span-2 bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500" />
                <button type="button" onClick={() => removeLine(i)}
                  className="col-span-1 text-red-500 hover:text-red-400 text-lg">✕</button>
              </div>
            ))}
            {form.lines.length === 0 && (
              <p className="text-xs text-gray-600 py-2 text-center border border-dashed border-[#2a2d3e] rounded-lg">
                Click "+ Add Line" to add products
              </p>
            )}
          </div>
          <Input label="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={!form.vendorId || form.lines.length === 0}>Create PO</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
