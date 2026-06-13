import { useEffect, useState } from 'react';
import { salesApi, customersApi, productsApi, usersApi, auditApi } from '../../api';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner } from '../../components/shared';

export default function SalesPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [deliveryMode, setDeliveryMode] = useState(false);
  const [deliveries, setDeliveries] = useState({});
  const [form, setForm] = useState({ customerId: '', scheduleDate: '', notes: '', lines: [] });

  useEffect(() => {
    load();
    customersApi.getAll().then(r => setCustomers(r.data)).catch(() => {});
    productsApi.getAll().then(r => setProducts(r.data)).catch(() => {});
    usersApi.getAll().catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await salesApi.getAll();
      setOrders(r.data.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)));
    } catch (err) {
      console.error('Failed to load sales orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = async (o) => {
    try {
      const r = await salesApi.getById(o.id);
      setSelected(r.data);
      const h = await auditApi.getRecordHistory('SalesOrder', o.id);
      setAuditHistory(h.data);
    } catch (err) {
      console.error('Failed to load order details:', err);
      setAuditHistory([]);
    }
    setDeliveryMode(false);
    setDeliveries({});
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { productId: '', orderedQty: '', salesPrice: '' }] });
  const removeLine = (i) => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });

  const updateLine = (i, f, v) => {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [f]: v };
    if (f === 'productId') {
      const p = products.find(p => String(p.id) === String(v));
      if (p) lines[i].salesPrice = p.salesPrice;
    }
    setForm({ ...form, lines });
  };

  const createOrder = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customerId: Number(form.customerId),
        scheduleDate: form.scheduleDate || null,
        notes: form.notes || '',
        lines: form.lines.map(l => ({
          productId: Number(l.productId),
          orderedQty: Number(l.orderedQty),
          salesPrice: Number(l.salesPrice)
        }))
      };
      await salesApi.create(payload);
      setShowCreate(false);
      setForm({ customerId: '', scheduleDate: '', notes: '', lines: [] });
      load();
    } catch (err) {
      console.error('Failed to create SO:', err);
      alert(err.response?.data?.error || 'Error creating Sales Order. Check that all fields are valid.');
    }
  };

  const confirmOrder = async () => {
    try {
      await salesApi.confirm(selected.id);
      const r = await salesApi.getById(selected.id);
      setSelected(r.data);
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error confirming order.');
    }
  };

  const deliver = async () => {
    try {
      const d = {};
      Object.entries(deliveries).forEach(([k, v]) => { if (v > 0) d[k] = Number(v); });
      await salesApi.deliver(selected.id, { deliveries: d });
      const r = await salesApi.getById(selected.id);
      setSelected(r.data);
      setDeliveryMode(false);
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error recording delivery. Check stock availability.');
    }
  };

  const cancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await salesApi.cancel(selected.id);
      const r = await salesApi.getById(selected.id);
      setSelected(r.data);
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error cancelling order.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">🛒 Sales Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} orders total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Sales Order</Button>
      </div>

      {/* Excel-style table */}
      <Card className="overflow-hidden border border-[#2a2d3e]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse text-left">
            <thead>
              <tr className="bg-[#1e2130] border-b border-[#2a2d3e] text-gray-400">
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Ref</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Customer</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Created</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Schedule</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider text-center">Lines</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider text-center">Status</th>
                <th className="p-3 font-medium text-xs uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No sales orders yet. Create your first!</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} onClick={() => selectOrder(o)} className="border-b border-[#2a2d3e] hover:bg-[#1a1d27]/50 cursor-pointer transition-colors">
                  <td className="p-3 border-r border-[#2a2d3e] font-mono text-xs text-indigo-300">{o.ref}</td>
                  <td className="p-3 border-r border-[#2a2d3e] font-semibold text-gray-100">{o.customer?.name}</td>
                  <td className="p-3 border-r border-[#2a2d3e] text-gray-400 text-xs">{new Date(o.creationDate).toLocaleDateString('en-IN')}</td>
                  <td className="p-3 border-r border-[#2a2d3e] text-gray-400 text-xs">{o.scheduleDate || '—'}</td>
                  <td className="p-3 border-r border-[#2a2d3e] text-center text-gray-300 font-mono">{o.lines?.length}</td>
                  <td className="p-3 border-r border-[#2a2d3e] text-center"><Badge status={o.status} /></td>
                  <td className="p-3 text-center"><button className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold">View →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)}
        title={selected ? `${selected.ref} — ${selected.customer?.name}` : ''} width="max-w-4xl">
        {selected && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Badge status={selected.status} />
                <span className="text-xs text-gray-500">Created {new Date(selected.creationDate).toLocaleString('en-IN')}</span>
                {selected.scheduleDate && <span className="text-xs text-gray-500">· Schedule: {selected.scheduleDate}</span>}
              </div>

              {/* Lines */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Order Lines</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2a2d3e] text-gray-500">
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Ordered</th>
                      <th className="text-right py-2">Delivered</th>
                      <th className="text-right py-2">Price/Unit</th>
                      <th className="text-right py-2">Subtotal</th>
                      {deliveryMode && <th className="text-right py-2">Deliver Qty</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines?.map(line => (
                      <tr key={line.id} className="border-b border-[#1e2130]">
                        <td className="py-2 text-gray-200">{line.product?.name}</td>
                        <td className="py-2 text-right text-gray-300">{line.orderedQty}</td>
                        <td className="py-2 text-right text-emerald-400">{line.deliveredQty}</td>
                        <td className="py-2 text-right text-gray-300">₹{line.salesPrice}</td>
                        <td className="py-2 text-right text-indigo-300 font-semibold">₹{(line.orderedQty * line.salesPrice).toFixed(2)}</td>
                        {deliveryMode && (
                          <td className="py-2 text-right">
                            <input type="number" min="0" max={line.orderedQty - line.deliveredQty}
                              value={deliveries[line.id] ?? 0}
                              onChange={e => setDeliveries({ ...deliveries, [line.id]: Number(e.target.value) })}
                              className="w-16 bg-[#0f1117] border border-indigo-600 rounded px-2 py-1 text-right text-gray-200" />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mb-5 p-3 bg-[#0f1117] rounded-lg border border-[#2a2d3e]">
                <span className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Order Total</span>
                <span className="text-2xl font-bold text-indigo-400">
                  ₹{selected.lines?.reduce((sum, l) => sum + (l.orderedQty * l.salesPrice), 0).toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {selected.status === 'DRAFT' && (
                  <Button variant="success" onClick={confirmOrder}>✓ Confirm Order</Button>
                )}
                {(selected.status === 'CONFIRMED' || selected.status === 'PARTIALLY_DELIVERED') && !deliveryMode && (
                  <Button variant="primary" onClick={() => setDeliveryMode(true)}>📦 Record Delivery</Button>
                )}
                {deliveryMode && (
                  <>
                    <Button variant="success" onClick={deliver}>✓ Confirm Delivery</Button>
                    <Button variant="secondary" onClick={() => setDeliveryMode(false)}>Cancel</Button>
                  </>
                )}
                {selected.status !== 'CANCELLED' && selected.status !== 'FULLY_DELIVERED' && (
                  <Button variant="danger" onClick={cancelOrder}>✕ Cancel Order</Button>
                )}
              </div>

              {selected.notes && (
                <div className="mt-3 p-3 bg-[#0f1117] rounded-lg">
                  <p className="text-xs text-gray-500">Notes: {selected.notes}</p>
                </div>
              )}
            </div>

            {/* Audit Trail */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">📋 History</h3>
              <div className="flex flex-col gap-2 max-h-80 overflow-auto">
                {auditHistory.length === 0
                  ? <p className="text-xs text-gray-600">No history yet.</p>
                  : auditHistory.map((log, i) => (
                    <div key={i} className="bg-[#0f1117] rounded-lg p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-indigo-300">{log.action}</span>
                        <span className="text-xs text-gray-600">
                          {new Date(log.dateTime).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                        </span>
                      </div>
                      {log.fieldChanged && (
                        <p className="text-xs text-gray-500 mt-0.5">{log.fieldChanged}: {log.oldValue} → {log.newValue}</p>
                      )}
                      <p className="text-xs text-gray-600">{log.details}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Order Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Sales Order">
        <form onSubmit={createOrder} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Customer *" required value={form.customerId}
              onChange={e => setForm({ ...form, customerId: e.target.value })}>
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Scheduled Date" type="date" value={form.scheduleDate}
              onChange={e => setForm({ ...form, scheduleDate: e.target.value })} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Order Lines</label>
              <button type="button" onClick={addLine}
                className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-700/40 rounded px-2 py-1">
                + Add Line
              </button>
            </div>
            {form.lines.length === 0 && (
              <p className="text-xs text-gray-600 py-2 text-center border border-dashed border-[#2a2d3e] rounded-lg">
                Click "+ Add Line" to add products
              </p>
            )}
            {form.lines.map((line, i) => (
              <div key={i} className="grid grid-cols-7 gap-2 mb-2 items-center">
                <select value={line.productId} onChange={e => updateLine(i, 'productId', e.target.value)}
                  className="col-span-3 bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500">
                  <option value="">Product…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Free: {(p.freeToUseQty ?? (p.onHandQty - p.reservedQty))})
                    </option>
                  ))}
                </select>
                <input type="number" placeholder="Qty" min="1" value={line.orderedQty}
                  onChange={e => updateLine(i, 'orderedQty', e.target.value)}
                  className="col-span-1 bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500" />
                <input type="number" placeholder="Price ₹" value={line.salesPrice}
                  onChange={e => updateLine(i, 'salesPrice', e.target.value)}
                  className="col-span-2 bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500" />
                <button type="button" onClick={() => removeLine(i)}
                  className="col-span-1 text-red-500 hover:text-red-400 text-lg">✕</button>
              </div>
            ))}
          </div>

          <Input label="Notes" value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" />

          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={!form.customerId || form.lines.length === 0}>Create Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
