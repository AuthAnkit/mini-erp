import { useState, useEffect } from 'react';
import { customersApi, auditApi } from '../../api';
import { Card, Button, Input, Modal } from '../../components/shared';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);

  const loadData = () => {
    setLoading(true);
    customersApi.getAll().then(r => {
      setCustomers(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      customersApi.update(editId, form).then(() => {
        loadData();
        setShowModal(false);
      });
    } else {
      customersApi.create(form).then(() => {
        loadData();
        setShowModal(false);
      });
    }
  };

  const openNew = () => {
    setForm({ name: '', email: '', phone: '', address: '' });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' });
    setEditId(c.id);
    setShowModal(true);
  };

  const deleteCustomer = (id) => {
    if(confirm("Are you sure you want to delete this customer?")) {
      customersApi.delete(id).then(loadData).catch(err => {
        alert("Cannot delete customer, might be linked to sales orders.");
      });
    }
  };

  const viewCustomer = (c) => {
    setSelected(c);
    auditApi.getEntityLogs('Customer', c.id)
      .then(r => setAuditHistory(r.data))
      .catch(() => setAuditHistory([]));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">👥 Customers</h1>
          <p className="text-gray-500 text-sm">Manage customer directory and details</p>
        </div>
        <Button onClick={openNew}>+ New Customer</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading customers...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1d27] border-b border-[#2a2d3e]">
                <th className="p-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Name</th>
                <th className="p-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Email</th>
                <th className="p-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Phone</th>
                <th className="p-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Address</th>
                <th className="p-3 font-medium text-xs text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No customers found.</td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className="border-b border-[#2a2d3e] hover:bg-[#1a1d27]/50 transition-colors">
                  <td className="p-3 font-semibold text-gray-200">
                    <button onClick={() => viewCustomer(c)} className="hover:text-indigo-400 transition-colors">
                      {c.name}
                    </button>
                  </td>
                  <td className="p-3 text-sm text-gray-400">{c.email || '-'}</td>
                  <td className="p-3 text-sm text-gray-400">{c.phone || '-'}</td>
                  <td className="p-3 text-sm text-gray-400">{c.address || '-'}</td>
                  <td className="p-3 text-right">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(c)} className="mr-2">Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => deleteCustomer(c.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Customer" : "New Customer"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Name *" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <Input label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* View Customer Details Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Customer: ${selected.name}` : ''} width="max-w-3xl">
        {selected && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500 w-24 inline-block">Email:</span> <span className="text-gray-200">{selected.email || '-'}</span></p>
                <p><span className="text-gray-500 w-24 inline-block">Phone:</span> <span className="text-gray-200">{selected.phone || '-'}</span></p>
                <p><span className="text-gray-500 w-24 inline-block">Address:</span> <span className="text-gray-200">{selected.address || '-'}</span></p>
              </div>
            </div>

            {/* Audit Trail */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">📋 History</h3>
              <div className="flex flex-col gap-2 max-h-80 overflow-auto pr-2">
                {auditHistory.length === 0 ? (
                  <p className="text-xs text-gray-600">No history yet.</p>
                ) : auditHistory.map((log, i) => (
                  <div key={i} className="bg-[#0f1117] rounded-lg p-3 border border-[#2a2d3e]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{log.action}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.dateTime).toLocaleString('en-IN', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {log.fieldChanged && (
                      <p className="text-xs text-gray-300 mb-1">
                        <span className="text-gray-500">{log.fieldChanged}:</span> {log.oldValue || 'none'} <span className="text-gray-500">→</span> {log.newValue || 'none'}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 bg-[#1a1d27] p-1.5 rounded mt-1">{log.details}</p>
                    <p className="text-[10px] text-gray-600 mt-1 text-right">by User {log.userId || 'System'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
