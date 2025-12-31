import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cellService } from '../services/cellService';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../components/ui/design-system';
import { ArrowLeft, Save } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function CreateCellLot() {
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    lotCode: '',
    supplierName: '',
    supplierLotNo: '',
    chemistry: 'LFP',
    formFactor: 'Prismatic',
    capacityAh: 100,
    quantityReceived: 0,
    receivedDate: new Date().toISOString().split('T')[0],
    prefix: 'C'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newLot = await cellService.createLot({
        ...form,
        serialPolicy: { prefix: form.prefix, scheme: 'SEQUENTIAL' }
      });
      addNotification({ title: 'Lot Created', message: `${newLot.lotCode} registered.`, type: 'success' });
      navigate(`/cells/${newLot.id}`);
    } catch (err) {
      addNotification({ title: 'Error', message: 'Failed to create lot.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cells')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Register Cell Shipment</h2>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Lot Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Internal Lot Code</label>
                <Input value={form.lotCode} onChange={e => setForm({...form, lotCode: e.target.value})} placeholder="e.g. CATL-24-001" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Received Date</label>
                <Input type="date" value={form.receivedDate} onChange={e => setForm({...form, receivedDate: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier Name</label>
                <Input value={form.supplierName} onChange={e => setForm({...form, supplierName: e.target.value})} placeholder="e.g. CATL" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier Lot #</label>
                <Input value={form.supplierLotNo} onChange={e => setForm({...form, supplierLotNo: e.target.value})} placeholder="As per packing list" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chemistry</label>
                <select className="w-full h-10 p-2 border rounded bg-background" value={form.chemistry} onChange={e => setForm({...form, chemistry: e.target.value})}>
                  <option value="LFP">LFP</option>
                  <option value="NMC">NMC</option>
                  <option value="LTO">LTO</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Form Factor</label>
                <select className="w-full h-10 p-2 border rounded bg-background" value={form.formFactor} onChange={e => setForm({...form, formFactor: e.target.value})}>
                  <option value="Prismatic">Prismatic</option>
                  <option value="Cylindrical">Cylindrical</option>
                  <option value="Pouch">Pouch</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Capacity (Ah)</label>
                <Input type="number" value={form.capacityAh} onChange={e => setForm({...form, capacityAh: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity Received</label>
                <Input type="number" value={form.quantityReceived} onChange={e => setForm({...form, quantityReceived: Number(e.target.value)})} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Serial Prefix</label>
                <Input value={form.prefix} onChange={e => setForm({...form, prefix: e.target.value.toUpperCase()})} placeholder="e.g. C" maxLength={3} />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Register Shipment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}