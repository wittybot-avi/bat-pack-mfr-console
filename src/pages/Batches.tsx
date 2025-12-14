import React, { useEffect, useState } from 'react';
import { batchService } from '../services/api';
import { Batch, BatchStatus } from '../domain/types';
import { Button, Input, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Card, CardContent } from '../components/ui/design-system';
import { Plus, Search, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '../lib/store';

// Mock dialog component for simplicity in this file
const SimpleDialog = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-[500px] shadow-xl">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        {children}
        <Button variant="ghost" onClick={onClose} className="absolute top-2 right-2">X</Button>
      </div>
    </div>
  );
};

const createBatchSchema = z.object({
  batchNumber: z.string().min(3, "Batch number required"),
  sku: z.string().min(1, "SKU required"),
  quantity: z.number().min(1, "Quantity must be > 0"),
});

export default function Batches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { addNotification } = useAppStore();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(createBatchSchema)
  });

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    const data = await batchService.getBatches();
    setBatches(data);
  };

  const onSubmit = async (data: any) => {
    try {
      await batchService.createBatch(data);
      addNotification({ title: "Success", message: "Batch created successfully", type: "success" });
      setIsCreateOpen(false);
      reset();
      loadBatches();
    } catch (e) {
      addNotification({ title: "Error", message: "Failed to create batch", type: "error" });
    }
  };

  const getStatusVariant = (status: BatchStatus) => {
    switch (status) {
      case BatchStatus.COMPLETED: return 'success';
      case BatchStatus.IN_PRODUCTION: return 'default'; // primary
      case BatchStatus.QA_PENDING: return 'warning';
      case BatchStatus.RELEASED: return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manufacturing Batches</h2>
          <p className="text-muted-foreground">Manage production lots, BOMs, and status.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Batch
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center py-4 px-4 gap-2 border-b">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter batches..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch #</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Produced / Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                  <TableCell>{batch.sku}</TableCell>
                  <TableCell>{new Date(batch.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(batch.produced / batch.quantity) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{batch.produced}/{batch.quantity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(batch.status)}>{batch.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <SimpleDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)}
        title="Create New Batch"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Batch Number</label>
            <Input {...register('batchNumber')} placeholder="e.g. B-2024-001" />
            {errors.batchNumber && <p className="text-xs text-red-500">{errors.batchNumber.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">SKU Config</label>
            <Input {...register('sku')} placeholder="e.g. VV360-LFP-48V" />
            {errors.sku && <p className="text-xs text-red-500">{errors.sku.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Quantity</label>
            <Input type="number" {...register('quantity', { valueAsNumber: true })} />
            {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message as string}</p>}
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Create Production Order</Button>
          </div>
        </form>
      </SimpleDialog>
    </div>
  );
}