import { useState, useEffect } from 'react';

// تعريف أنواع البيانات
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
  mortality: number; // نفوق
  feedConsumed: number; // علف بالكيلو
  avgWeight: number; // وزن بالجرام
};

export type Batch = {
  id: string;
  name: string;
  breed: string;
  startDate: string;
  initialCount: number;
  initialCost: number; // سعر الكتكوت
  isActive: boolean;
  logs: DailyLog[];
  transactions: Transaction[];
};

export const usePoultryStore = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // تحميل البيانات عند البدء
  useEffect(() => {
    const stored = localStorage.getItem('shamsin_data');
    if (stored) {
      setBatches(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  // حفظ البيانات عند أي تغيير
  const saveBatches = (newBatches: Batch[]) => {
    setBatches(newBatches);
    localStorage.setItem('shamsin_data', JSON.stringify(newBatches));
  };

  const addBatch = (batch: Batch) => {
    saveBatches([...batches, batch]);
  };

  const updateBatch = (updatedBatch: Batch) => {
    const newBatches = batches.map(b => b.id === updatedBatch.id ? updatedBatch : b);
    saveBatches(newBatches);
  };

  const deleteBatch = (id: string) => {
     saveBatches(batches.filter(b => b.id !== id));
  }

  return { batches, addBatch, updateBatch, deleteBatch, loading };
};
