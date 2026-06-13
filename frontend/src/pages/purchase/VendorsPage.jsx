import { useEffect, useState } from 'react';
import { vendorsApi } from '../../api';
import { Card, Button, Table, Tr, Td, Modal, Input, LoadingSpinner } from '../../components/shared';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [search, setSearch] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    address: '',
    contactEmail: '',
    contactPhone: ''
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const r = await vendorsApi.getAll();
      setVendors(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedVendor(null);
    setForm({ name: '', address: '', contactEmail: '', contactPhone: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (vendor, e) => {
    e.stopPropagation();
    setSelectedVendor(vendor);
    setForm({
      name: vendor.name || '',
      address: vendor.address || '',
      contactEmail: vendor.contactEmail || '',
      contactPhone: vendor.contactPhone || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this vendor? This might affect purchase orders referencing it.')) return;
    try {
      await vendorsApi.delete(id);
      loadVendors();
    } catch (err) {
      alert('Failed to delete vendor. It may be referenced by purchase orders.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedVendor) {
        await vendorsApi.update(selectedVendor.id, form);
      } else {
        await vendorsApi.create(form);
      }
      setShowModal(false);
      loadVendors();
    } catch (err) {
      alert('Error saving vendor details.');
    }
  };

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.contactEmail?.toLowerCase().includes(search.toLowerCase()) ||
    v.contactPhone?.toLowerCase().includes(search.toLowerCase()) ||
    v.address?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">🤝 Vendor Directory</h1>
          <p className="text-gray-500 text-sm mt-1">{vendors.length} vendors registered</p>
        </div>
        <Button onClick={handleOpenCreate}>+ Add Vendor</Button>
      </div>

      <div className="mb-4">
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vendors by name, email, phone, address..."
          className="bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-gray-200
            focus:outline-none focus:border-indigo-500 w-full max-w-sm" 
        />
      </div>

      {/* Excel-style table view */}
      <Card className="overflow-hidden border border-[#2a2d3e]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse text-left">
            <thead>
              <tr className="bg-[#1e2130] border-b border-[#2a2d3e] text-gray-400">
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">ID</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Name</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Contact Email</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Contact Phone</th>
                <th className="p-3 border-r border-[#2a2d3e] font-medium text-xs uppercase tracking-wider">Address</th>
                <th className="p-3 font-medium text-xs uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="border-b border-[#2a2d3e] hover:bg-[#1a1d27]/50 transition-colors">
                  <td className="p-3 border-r border-[#2a2d3e] font-mono text-xs text-indigo-400">{v.id}</td>
                  <td className="p-3 border-r border-[#2a2d3e] font-semibold text-gray-100">{v.name}</td>
                  <td className="p-3 border-r border-[#2a2d3e] text-gray-300">{v.contactEmail || '—'}</td>
                  <td className="p-3 border-r border-[#2a2d3e] text-gray-300 font-mono text-xs">{v.contactPhone || '—'}</td>
                  <td className="p-3 border-r border-[#2a2d3e] text-gray-400 text-xs">{v.address || '—'}</td>
                  <td className="p-3 text-center flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => handleOpenEdit(v, e)} className="text-indigo-400 hover:text-indigo-300">
                      ✏️ Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => handleDelete(v.id, e)} className="text-red-500 hover:text-red-400">
                      🗑️ Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Vendor Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Vendor Name *" 
            required 
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})} 
            placeholder="e.g. Acme Wood Supply"
          />
          <Input 
            label="Contact Email" 
            type="email"
            value={form.contactEmail}
            onChange={e => setForm({...form, contactEmail: e.target.value})} 
            placeholder="e.g. contact@acmewood.com"
          />
          <Input 
            label="Contact Phone" 
            value={form.contactPhone}
            onChange={e => setForm({...form, contactPhone: e.target.value})} 
            placeholder="e.g. +91 98765 43210"
          />
          <Input 
            label="Address" 
            value={form.address}
            onChange={e => setForm({...form, address: e.target.value})} 
            placeholder="e.g. Plot No. 42, Industrial Area, Jaipur"
          />
          
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{selectedVendor ? 'Save Changes' : 'Create Vendor'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
