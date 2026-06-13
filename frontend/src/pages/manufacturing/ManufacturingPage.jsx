import { useEffect, useState } from 'react';
import { mfgApi, productsApi, usersApi, auditApi } from '../../api';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner } from '../../components/shared';

export default function ManufacturingPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [woDuration, setWoDuration] = useState({});
  const [form, setForm] = useState({ finishedProductId: '', quantity: '', scheduleDate: '', assigneeId: '', notes: '' });

  useEffect(() => {
    load();
    productsApi.getAll().then(r => setProducts(r.data)).catch(() => {});
    usersApi.getAll().then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await mfgApi.getAll();
      setOrders(r.data.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)));
    } catch (err) {
      console.error('Failed to load manufacturing orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = async (o) => {
    try {
      const r = await mfgApi.getById(o.id);
      setSelected(r.data);
      const h = await auditApi.getRecordHistory('ManufacturingOrder', o.id);
      setAuditHistory(h.data);
    } catch (err) {
      console.error('Failed to load MO details:', err);
      setAuditHistory([]);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        finishedProductId: Number(form.finishedProductId),
        quantity: Number(form.quantity),
        scheduleDate: form.scheduleDate || null,
        assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
        notes: form.notes || ''
      };
      await mfgApi.create(payload);
      setShowCreate(false);
      setForm({ finishedProductId: '', quantity: '', scheduleDate: '', assigneeId: '', notes: '' });
      load();
    } catch (err) {
      console.error('Failed to create MO:', err);
      alert(err.response?.data?.error || 'Error creating Manufacturing Order. Check product has a Bill of Materials.');
    }
  };

  const action = async (fn, ...args) => {
    try {
      await fn(...args);
      const r = await mfgApi.getById(selected.id);
      setSelected(r.data);
      try {
        const h = await auditApi.getRecordHistory('ManufacturingOrder', selected.id);
        setAuditHistory(h.data);
      } catch (_) { /* ignore audit errors */ }
      load();
    } catch (err) {
      console.error('MO action failed:', err);
      alert(err.response?.data?.error || 'Action failed. Check stock availability and order status.');
    }
  };

  const completeWorkOrder = (woId) => {
    const dur = woDuration[woId] || 0;
    return action(mfgApi.completeWorkOrder, selected.id, woId, { realDurationMinutes: dur });
  };

  const finishedProducts = products.filter(p =>
    p.bomComponents?.length > 0 || p.category === 'Finished Good' || p.category === 'Sub-Assembly'
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">⚙️ Manufacturing Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} orders total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New MO</Button>
      </div>

      <Card className="overflow-hidden border border-[#2a2d3e]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse text-left">
            <thead>
              <tr className="bg-[#1e2130] border-b border-[#2a2d3e] text-gray-400">
                <th className="p-3 border-r border-[#2a2d3e] text-xs font-medium uppercase tracking-wider">Ref</th>
                <th className="p-3 border-r border-[#2a2d3e] text-xs font-medium uppercase tracking-wider">Product</th>
                <th className="p-3 border-r border-[#2a2d3e] text-xs font-medium uppercase tracking-wider text-center">Qty</th>
                <th className="p-3 border-r border-[#2a2d3e] text-xs font-medium uppercase tracking-wider">Created</th>
                <th className="p-3 border-r border-[#2a2d3e] text-xs font-medium uppercase tracking-wider">Assignee</th>
                <th className="p-3 border-r border-[#2a2d3e] text-xs font-medium uppercase tracking-wider">Source</th>
                <th className="p-3 border-r border-[#2a2d3e] text-xs font-medium uppercase tracking-wider text-center">Status</th>
                <th className="p-3 text-xs font-medium uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">No manufacturing orders yet.</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} onClick={() => selectOrder(o)}
                  className="border-b border-[#2a2d3e] hover:bg-[#1a1d27]/50 cursor-pointer transition-colors">
                  <td className="p-3 border-r border-[#2a2d3e] font-mono text-xs text-purple-300">{o.ref}</td>
                  <td className="p-3 border-r border-[#2a2d3e] font-semibold text-gray-100">{o.finishedProduct?.name}</td>
                  <td className="p-3 border-r border-[#2a2d3e] text-center text-gray-200 font-bold">{o.quantity}</td>
                  <td className="p-3 border-r border-[#2a2d3e] text-gray-400 text-xs">{new Date(o.creationDate).toLocaleDateString('en-IN')}</td>
                  <td className="p-3 border-r border-[#2a2d3e] text-gray-400 text-xs">{o.assignee?.name || '—'}</td>
                  <td className="p-3 border-r border-[#2a2d3e]">
                    {o.triggeredBySoId
                      ? <span className="text-xs text-amber-400">Auto (SO)</span>
                      : <span className="text-xs text-gray-600">Manual</span>}
                  </td>
                  <td className="p-3 border-r border-[#2a2d3e] text-center"><Badge status={o.status} /></td>
                  <td className="p-3 text-center"><button className="text-purple-400 hover:text-purple-300 text-xs font-semibold">View →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MO Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)}
        title={selected ? `${selected.ref} — ${selected.finishedProduct?.name}` : ''} width="max-w-5xl">
        {selected && (
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge status={selected.status} />
                <span className="text-sm text-gray-300">
                  Produce <strong>{selected.quantity}x</strong> {selected.finishedProduct?.name}
                </span>
                {selected.triggeredBySoId && (
                  <span className="text-xs bg-amber-900/30 text-amber-300 px-2 py-0.5 rounded border border-amber-700/40">
                    Auto-created from SO
                  </span>
                )}
              </div>

              {/* Components */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">🔩 Components Required</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2a2d3e] text-gray-500">
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">To Consume</th>
                      <th className="text-right py-2">Consumed</th>
                      <th className="text-right py-2">Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.components?.map(c => (
                      <tr key={c.id} className="border-b border-[#1e2130]">
                        <td className="py-2 text-gray-200">{c.product?.name}</td>
                        <td className="py-2 text-right text-gray-300">{c.toConsumeQty}</td>
                        <td className="py-2 text-right text-emerald-400">{c.consumedQty}</td>
                        <td className="py-2 text-right"><Badge status={c.availability} /></td>
                      </tr>
                    ))}
                    {(!selected.components || selected.components.length === 0) && (
                      <tr><td colSpan={4} className="py-3 text-center text-gray-600 text-xs">No components (no BoM defined)</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Work Orders */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">🔨 Work Orders</h3>
                <div className="flex flex-col gap-2">
                  {selected.workOrders?.map(wo => (
                    <div key={wo.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                      wo.status === 'DONE' ? 'border-emerald-800/40 bg-emerald-900/10' :
                      wo.status === 'IN_PROGRESS' ? 'border-purple-800/40 bg-purple-900/10 animate-pulse' :
                      'border-[#2a2d3e] bg-[#0f1117]'
                    }`}>
                      <div>
                        <p className="text-sm font-medium text-gray-200">{wo.operation}</p>
                        <p className="text-xs text-gray-500">
                          {wo.workCenter} · Expected: {wo.expectedDurationMinutes}min
                          {wo.realDurationMinutes && ` · Actual: ${wo.realDurationMinutes}min`}
                          {wo.realDurationMinutes && wo.realDurationMinutes > wo.expectedDurationMinutes && (
                            <span className="text-amber-400"> ⚠️ {Math.round((wo.realDurationMinutes / wo.expectedDurationMinutes - 1) * 100)}% over</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={wo.status} />
                        {wo.status === 'IN_PROGRESS' && (
                          <div className="flex items-center gap-2">
                            <input type="number" placeholder="Actual mins" min="1"
                              value={woDuration[wo.id] || ''}
                              onChange={e => setWoDuration({ ...woDuration, [wo.id]: Number(e.target.value) })}
                              className="w-24 bg-[#0f1117] border border-purple-600 rounded px-2 py-1 text-xs text-gray-200" />
                            <Button size="sm" variant="success" onClick={() => completeWorkOrder(wo.id)}
                              disabled={!woDuration[wo.id]}>
                              ✓ Done
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!selected.workOrders || selected.workOrders.length === 0) && (
                    <p className="text-xs text-gray-600 text-center py-2">No work orders defined in BoM operations.</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {selected.status === 'DRAFT' && (
                  <Button variant="success" onClick={() => action(mfgApi.confirm, selected.id)}>✓ Confirm MO</Button>
                )}
                {selected.status === 'CONFIRMED' && (
                  <Button variant="primary" onClick={() => action(mfgApi.start, selected.id)}>▶ Start Production</Button>
                )}
                {(selected.status === 'IN_PROGRESS' || selected.status === 'CONFIRMED') && (
                  <Button variant="success" onClick={() => action(mfgApi.produce, selected.id)}>🏭 Mark as Produced</Button>
                )}
                {selected.status !== 'DONE' && selected.status !== 'CANCELLED' && (
                  <Button variant="danger" onClick={() => action(mfgApi.cancel, selected.id)}>✕ Cancel</Button>
                )}
              </div>
            </div>

            {/* Audit Trail */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">📋 History</h3>
              <div className="flex flex-col gap-2 max-h-96 overflow-auto">
                {auditHistory.length === 0
                  ? <p className="text-xs text-gray-600">No history yet.</p>
                  : auditHistory.map((log, i) => (
                    <div key={i} className="bg-[#0f1117] rounded-lg p-2">
                      <div className="flex justify-between">
                        <span className="text-xs font-medium text-purple-300">{log.action}</span>
                        <span className="text-xs text-gray-600">
                          {new Date(log.dateTime).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                        </span>
                      </div>
                      {log.fieldChanged && (
                        <p className="text-xs text-gray-500">{log.fieldChanged}: {log.oldValue} → {log.newValue}</p>
                      )}
                      <p className="text-xs text-gray-600">{log.details}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create MO Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Manufacturing Order">
        <form onSubmit={create} className="flex flex-col gap-4">
          <Select label="Finished Product *" required value={form.finishedProductId}
            onChange={e => setForm({ ...form, finishedProductId: e.target.value })}>
            <option value="">Select product…</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.ref})</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity *" type="number" min="1" required value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })} />
            <Input label="Schedule Date" type="date" value={form.scheduleDate}
              onChange={e => setForm({ ...form, scheduleDate: e.target.value })} />
          </div>
          <Select label="Assignee" value={form.assigneeId}
            onChange={e => setForm({ ...form, assigneeId: e.target.value })}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </Select>
          <Input label="Notes" value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })} />
          <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-lg p-3">
            <p className="text-xs text-indigo-300">
              ℹ️ Components and work orders will be auto-loaded from the product's Bill of Materials
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={!form.finishedProductId || !form.quantity}>Create MO</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
