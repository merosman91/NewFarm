// hooks/usePoultryStore.ts
import { useState, useEffect } from 'react';

// أنواع البيانات
export type Transaction = {
  id: string;
  date: string;
  type: 'expense' | 'income';
  category: string;
  amount: number;
  notes?: string;
};

export type DailyLog = {
  date: string;
  mortality: number;
  feedConsumed: number;
  avgWeight: number;
};

export type InventoryItem = {
  id: string;
  name: string;
  type: 'feed' | 'medicine' | 'other';
  quantity: number;
  unit: string;
  minThreshold: number; // الحد الأدنى للتنبيه
};

export type Batch = {
  id: string;
  name: string;
  breed: string;
  startDate: string;
  initialCount: number;
  initialCost: number;
  isActive: boolean;
  logs: DailyLog[];
  transactions: Transaction[];
};

// جدول اللقاحات القياسي (يمكن تعديله)
const VACCINE_SCHEDULE = [
  { day: 7, name: "هيتشنر B1 + IB (تقطير/رش)", type: "فيروسي" },
  { day: 10, name: "جمبورو (متوسط الضراوة)", type: "فيروسي" },
  { day: 14, name: "جمبورو (عترة حارة)", type: "فيروسي" },
  { day: 18, name: "لاسوتا (تقطير/ماء شرب)", type: "فيروسي" },
  { day: 28, name: "استنساخ (Clone 30)", type: "فيروسي" },
];

export const usePoultryStore = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // تحميل البيانات
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBatches = localStorage.getItem('shamsin_batches');
      const storedInventory = localStorage.getItem('shamsin_inventory');
      
      if (storedBatches) setBatches(JSON.parse(storedBatches));
      if (storedInventory) setInventory(JSON.parse(storedInventory));
      
      setLoading(false);
    }
  }, []);

  // حفظ الدفعات
  const saveBatches = (newBatches: Batch[]) => {
    setBatches(newBatches);
    localStorage.setItem('shamsin_batches', JSON.stringify(newBatches));
  };

  // حفظ المخزون
  const saveInventory = (newInventory: InventoryItem[]) => {
    setInventory(newInventory);
    localStorage.setItem('shamsin_inventory', JSON.stringify(newInventory));
  };

  // عمليات الدفعات
  const addBatch = (batch: Batch) => saveBatches([...batches, batch]);
  const updateBatch = (updatedBatch: Batch) => {
    saveBatches(batches.map(b => b.id === updatedBatch.id ? updatedBatch : b));
  };
  const deleteBatch = (id: string) => saveBatches(batches.filter(b => b.id !== id));

  // عمليات المخزون
  const addInventoryItem = (item: InventoryItem) => saveInventory([...inventory, item]);
  const updateInventoryItem = (id: string, qtyChange: number) => {
    const updated = inventory.map(item => 
      item.id === id ? { ...item, quantity: item.quantity + qtyChange } : item
    );
    saveInventory(updated);
  };
  
  const deleteInventoryItem = (id: string) => {
    saveInventory(inventory.filter(i => i.id !== id));
  }

  // فحص التنبيهات (لقاحات + مخزون)
  const getAlerts = (batch: Batch | undefined) => {
    const alerts = [];

    // 1. تنبيهات المخزون
    inventory.forEach(item => {
      if (item.quantity <= item.minThreshold) {
        alerts.push({ type: 'stock', message: `نفاد وشيك: ${item.name} (المتبقي ${item.quantity} ${item.unit})` });
      }
    });

    // 2. تنبيهات اللقاحات
    if (batch && batch.isActive) {
      const ageInDays = Math.floor((new Date().getTime() - new Date(batch.startDate).getTime()) / (1000 * 3600 * 24));
      const todayVaccine = VACCINE_SCHEDULE.find(v => v.day === ageInDays);
      const tomorrowVaccine = VACCINE_SCHEDULE.find(v => v.day === ageInDays + 1);

      if (todayVaccine) alerts.push({ type: 'vaccine', message: `💉 تطعيم اليوم (عمر ${ageInDays}): ${todayVaccine.name}` });
      if (tomorrowVaccine) alerts.push({ type: 'info', message: `تجهيز لغد: ${tomorrowVaccine.name}` });
    }

    return alerts;
  };

  return { 
    batches, addBatch, updateBatch, deleteBatch, 
    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    getAlerts, loading 
  };
};
 
