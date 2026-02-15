import { useMeeting, calculateLineItem, OrderItem } from './MeetingContext';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Edit2, Plus, Calculator, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

// Helper to format currency
const formatCurrency = (val: number) => 
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);

export function OrderManager() {
  const { orderItems, addOrderItem, updateOrderItem, removeOrderItem } = useMeeting();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [gross, setGross] = useState('');
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [s3, setS3] = useState('');
  const [s4, setS4] = useState('');
  const [qty, setQty] = useState('1');

  // Open dialog for new item
  const openNew = () => {
    setEditingItem(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const openEdit = (item: OrderItem) => {
    setEditingItem(item);
    setCode(item.code);
    setDesc(item.description);
    setGross(item.grossPrice.toString());
    setS1(item.discounts[0] > 0 ? item.discounts[0].toString() : '');
    setS2(item.discounts[1] > 0 ? item.discounts[1].toString() : '');
    setS3(item.discounts[2] > 0 ? item.discounts[2].toString() : '');
    setS4(item.discounts[3] > 0 ? item.discounts[3].toString() : '');
    setQty(item.quantity.toString());
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setCode('');
    setDesc('');
    setGross('');
    setS1('');
    setS2('');
    setS3('');
    setS4('');
    setQty('1');
  };

  const handleSave = () => {
    const grossVal = parseFloat(gross.replace(',', '.')) || 0;
    const qtyVal = parseFloat(qty.replace(',', '.')) || 1;
    const discounts: [number, number, number, number] = [
      parseFloat(s1.replace(',', '.')) || 0,
      parseFloat(s2.replace(',', '.')) || 0,
      parseFloat(s3.replace(',', '.')) || 0,
      parseFloat(s4.replace(',', '.')) || 0,
    ];

    const newItem: OrderItem = {
      id: editingItem ? editingItem.id : (Date.now().toString(36) + Math.random().toString(36).substr(2)),
      code,
      description: desc,
      grossPrice: grossVal,
      discounts,
      quantity: qtyVal
    };

    if (editingItem) {
      updateOrderItem(editingItem.id, newItem);
    } else {
      addOrderItem(newItem);
    }
    setIsDialogOpen(false);
  };

  // Calculate live preview
  const liveNet = (() => {
    const grossVal = parseFloat(gross.replace(',', '.')) || 0;
    const qtyVal = parseFloat(qty.replace(',', '.')) || 1;
    const discounts: [number, number, number, number] = [
        parseFloat(s1.replace(',', '.')) || 0,
        parseFloat(s2.replace(',', '.')) || 0,
        parseFloat(s3.replace(',', '.')) || 0,
        parseFloat(s4.replace(',', '.')) || 0,
    ];
    return calculateLineItem({ 
        id: 'temp', 
        code, 
        description: desc, 
        grossPrice: grossVal, 
        discounts, 
        quantity: qtyVal 
    });
  })();

  const grandTotal = orderItems.reduce((acc, item) => acc + calculateLineItem(item).total, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="text-lg font-bold font-display">Totale: {formatCurrency(grandTotal)}</h3>
           <p className="text-xs text-muted-foreground">{orderItems.length} Articoli inseriti</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Aggiungi
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2 pb-4">
        {orderItems.length === 0 && (
          <div className="h-40 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            Nessun articolo
          </div>
        )}
        {orderItems.map((item) => {
          const { total, netPrice } = calculateLineItem(item);
          return (
            <Card key={item.id} className="bg-card/50 hover:bg-card transition-colors">
              <CardContent className="p-3 flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono font-bold text-sm bg-muted px-1 rounded">{item.code}</span>
                    <span className="font-medium truncate text-sm">{item.description}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div className="flex gap-2">
                       <span>Lordo: {formatCurrency(item.grossPrice)}</span>
                       {item.discounts.some(d => d > 0) && (
                         <span className="text-destructive">
                           Sconti: {item.discounts.filter(d => d > 0).map(d => `-${d}%`).join(', ')}
                         </span>
                       )}
                    </div>
                    <div className="flex gap-2 font-medium text-foreground">
                        <span>Netto: {formatCurrency(netPrice)}</span>
                        <span>x {item.quantity}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-bold text-primary">{formatCurrency(total)}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeOrderItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md w-full sm:max-w-lg p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 pb-2 bg-muted/30 border-b">
              <DialogTitle>{editingItem ? 'Modifica Articolo' : 'Nuovo Articolo'}</DialogTitle>
            </DialogHeader>
            
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Row 1: Code & Qty */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 space-y-1">
                  <Label htmlFor="code" className="text-xs text-muted-foreground">Codice Articolo</Label>
                  <Input id="code" value={code} onChange={e => setCode(e.target.value)} placeholder="es. A123" />
                </div>
                <div className="col-span-1 space-y-1">
                  <Label htmlFor="qty" className="text-xs text-muted-foreground">Q.tà</Label>
                  <Input id="qty" type="number" inputMode="decimal" value={qty} onChange={e => setQty(e.target.value)} placeholder="1" className="text-center font-bold" />
                </div>
              </div>

              {/* Row 2: Description */}
              <div className="space-y-1">
                <Label htmlFor="desc" className="text-xs text-muted-foreground">Descrizione</Label>
                <Input id="desc" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Nome prodotto" />
              </div>

              {/* Row 3: Price & Discounts */}
              <div className="space-y-2 pt-2 border-t border-dashed">
                <div className="grid grid-cols-2 gap-3 items-end">
                   <div className="space-y-1">
                     <Label htmlFor="gross" className="text-xs text-muted-foreground">Listino Lordo (€)</Label>
                     <Input id="gross" type="number" inputMode="decimal" value={gross} onChange={e => setGross(e.target.value)} placeholder="0.00" />
                   </div>
                   <div className="bg-muted/50 p-2 rounded text-right">
                     <span className="text-xs text-muted-foreground block">Netto Calcolato</span>
                     <span className="font-bold font-mono">{formatCurrency(liveNet.netPrice)}</span>
                   </div>
                </div>

                <div className="space-y-1">
                   <Label className="text-xs text-muted-foreground">Sconti % (in cascata)</Label>
                   <div className="grid grid-cols-4 gap-2">
                     <Input placeholder="S1" type="number" inputMode="decimal" value={s1} onChange={e => setS1(e.target.value)} />
                     <Input placeholder="S2" type="number" inputMode="decimal" value={s2} onChange={e => setS2(e.target.value)} />
                     <Input placeholder="S3" type="number" inputMode="decimal" value={s3} onChange={e => setS3(e.target.value)} />
                     <Input placeholder="S4" type="number" inputMode="decimal" value={s4} onChange={e => setS4(e.target.value)} />
                   </div>
                </div>
              </div>

              {/* Live Total Preview */}
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex justify-between items-center">
                 <span className="text-sm font-medium text-muted-foreground">Totale Riga</span>
                 <span className="text-xl font-bold font-display text-primary">{formatCurrency(liveNet.total)}</span>
              </div>
            </div>

            <DialogFooter className="p-4 pt-2 border-t bg-muted/30">
              <Button onClick={handleSave} className="w-full h-12 text-lg">
                {editingItem ? 'Salva Modifiche' : 'Aggiungi al Carrello'}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
