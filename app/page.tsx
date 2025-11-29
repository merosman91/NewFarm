
'use client';
import React, { useState, useEffect } from 'react';
import { usePoultryStore, Batch, DailyLog, Transaction } from '@/hooks/usePoultryStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, TrendingUp, AlertCircle, DollarSign, Calendar, Activity, Package } from 'lucide-react';

export default function Home() {
  const { batches, addBatch, updateBatch, deleteBatch, loading } = usePoultryStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // States for forms
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);
  const [newBatchData, setNewBatchData] = useState({ name: '', breed: '', count: '', cost: '' });
  
  // Helper to get current batch
  const currentBatch = batches.find(b => b.id === selectedBatchId) || batches[0];

  useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  // --- Calculations ---
  const calculateStats = (batch: Batch) => {
    if (!batch) return { currentCount: 0, mortalityRate: 0, totalFeed: 0, totalExpenses: 0, fcr: 0 };
    
    const totalMortality = batch.logs.reduce((sum, log) => sum + log.mortality, 0);
    const currentCount = batch.initialCount - totalMortality;
    const mortalityRate = ((totalMortality / batch.initialCount) * 100).toFixed(2);
    const totalFeed = batch.logs.reduce((sum, log) => sum + log.feedConsumed, 0);
    
    const expenses = batch.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const income = batch.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    // Initial birds cost
    const birdsCost = batch.initialCount * batch.initialCost;
    const totalCost = expenses + birdsCost;

    // FCR Calculation (Simplified)
    const latestWeight = batch.logs.length > 0 ? batch.logs[batch.logs.length - 1].avgWeight / 1000 : 0; // kg
    const totalBiomass = currentCount * latestWeight;
    const fcr = totalBiomass > 0 ? (totalFeed / totalBiomass).toFixed(2) : '0';

    return { currentCount, mortalityRate, totalFeed, totalCost, income, fcr, latestWeight };
  };

  const stats = calculateStats(currentBatch);

  // --- Handlers ---
  const handleCreateBatch = () => {
    const newBatch: Batch = {
      id: Date.now().toString(),
      name: newBatchData.name || `دفعة ${new Date().toLocaleDateString()}`,
      breed: newBatchData.breed,
      startDate: new Date().toISOString(),
      initialCount: Number(newBatchData.count),
      initialCost: Number(newBatchData.cost),
      isActive: true,
      logs: [],
      transactions: []
    };
    addBatch(newBatch);
    setShowNewBatchForm(false);
    setSelectedBatchId(newBatch.id);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    if (!currentBatch) return;

    const newLog: DailyLog = {
      date: new Date().toISOString(),
      mortality: Number(formData.get('mortality')),
      feedConsumed: Number(formData.get('feed')),
      avgWeight: Number(formData.get('weight')),
    };

    const updatedBatch = { ...currentBatch, logs: [...currentBatch.logs, newLog] };
    updateBatch(updatedBatch);
    form.reset();
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    if (!currentBatch) return;

    const newTrans: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: formData.get('type') as 'expense' | 'income',
      category: formData.get('category') as string,
      amount: Number(formData.get('amount')),
      notes: formData.get('notes') as string,
    };

    const updatedBatch = { ...currentBatch, transactions: [...currentBatch.transactions, newTrans] };
    updateBatch(updatedBatch);
    form.reset();
  };

  if (loading) return <div className="flex h-screen items-center justify-center">جاري تحميل شمسين...</div>;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-amber-500 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp size={24} /> شمسين
          </h1>
          <select 
            className="text-gray-800 p-1 rounded text-sm"
            value={selectedBatchId || ''}
            onChange={(e) => setSelectedBatchId(e.target.value)}
          >
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={() => setShowNewBatchForm(true)} className="bg-white text-amber-600 p-1 rounded-full"><Plus size={20}/></button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 max-w-2xl">
        
        {/* Empty State */}
        {batches.length === 0 && !showNewBatchForm && (
           <div className="text-center mt-20">
             <Package size={64} className="mx-auto text-gray-300 mb-4"/>
             <h2 className="text-xl font-bold text-gray-600">ابدأ دورتك الأولى</h2>
             <p className="text-gray-400 mb-6">لا توجد بيانات حالياً. أنشئ دفعة جديدة للبدء.</p>
             <button onClick={() => setShowNewBatchForm(true)} className="bg-amber-500 text-white px-6 py-2 rounded-lg font-bold">إنشاء دفعة جديدة</button>
           </div>
        )}

        {/* New Batch Modal/Form */}
        {showNewBatchForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">إضافة دفعة جديدة</h2>
              <div className="space-y-3">
                <input placeholder="اسم الدفعة" className="w-full p-2 border rounded" onChange={e => setNewBatchData({...newBatchData, name: e.target.value})} />
                <input placeholder="السلالة (مثلاً: كوب، روس)" className="w-full p-2 border rounded" onChange={e => setNewBatchData({...newBatchData, breed: e.target.value})} />
                <div className="flex gap-2">
                    <input type="number" placeholder="العدد" className="w-full p-2 border rounded" onChange={e => setNewBatchData({...newBatchData, count: e.target.value})} />
                    <input type="number" placeholder="سعر الكتكوت" className="w-full p-2 border rounded" onChange={e => setNewBatchData({...newBatchData, cost: e.target.value})} />
                </div>
                <div className="flex gap-2 mt-4">
                    <button onClick={handleCreateBatch} className="flex-1 bg-amber-500 text-white py-2 rounded">حفظ</button>
                    <button onClick={() => setShowNewBatchForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded">إلغاء</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentBatch && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">العدد الحالي</p>
                <p className="text-xl font-bold text-amber-600">{stats.currentCount}</p>
                <span className="text-[10px] text-red-500">نفق {currentBatch.initialCount - stats.currentCount}</span>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">العمر (يوم)</p>
                <p className="text-xl font-bold text-blue-600">
                  {Math.floor((new Date().getTime() - new Date(currentBatch.startDate).getTime()) / (1000 * 3600 * 24))}
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">معامل التحويل FCR</p>
                <p className="text-xl font-bold text-green-600">{stats.fcr}</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">صافي الربح التقريبي</p>
                <p className={`text-lg font-bold ${stats.income - stats.totalCost >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {(stats.income - stats.totalCost).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Add Daily Log */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <h3 className="font-bold mb-3 text-gray-700 flex items-center gap-2"><Activity size={18}/> التسجيل اليومي</h3>
                  <form onSubmit={handleAddLog} className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs text-gray-500">علف (كجم)</label>
                            <input name="feed" type="number" step="0.1" required className="w-full p-2 border rounded bg-gray-50" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">وزن (جرام)</label>
                            <input name="weight" type="number" required className="w-full p-2 border rounded bg-gray-50" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">نفوق (عدد)</label>
                            <input name="mortality" type="number" required className="w-full p-2 border rounded bg-gray-50" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm">حفظ السجل اليومي</button>
                  </form>
                </div>

                {/* Weight Chart */}
                <div className="bg-white p-4 rounded-xl shadow-sm h-64">
                   <h3 className="text-sm font-bold text-gray-500 mb-2">منحنى نمو الوزن</h3>
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={currentBatch.logs}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(str) => new Date(str).getDate().toString()} />
                        <YAxis />
                        <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
                        <Line type="monotone" dataKey="avgWeight" stroke="#f59e0b" strokeWidth={2} name="الوزن (جم)" />
                     </LineChart>
                   </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Financial View */}
            {activeTab === 'financial' && (
              <div className="bg-white p-4 rounded-xl shadow-sm">
                 <h3 className="font-bold mb-4 text-gray-700 flex items-center gap-2"><DollarSign size={18}/> المعاملات المالية</h3>
                 
                 <form onSubmit={handleAddTransaction} className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <select name="type" className="p-2 border rounded">
                            <option value="expense">مصروف (دفع)</option>
                            <option value="income">إيراد (قبض)</option>
                        </select>
                        <input name="amount" type="number" placeholder="المبلغ" required className="p-2 border rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <select name="category" className="p-2 border rounded">
                            <option value="علف">علف وتغذية</option>
                            <option value="أدوية">أدوية ولقاحات</option>
                            <option value="عمالة">عمالة</option>
                            <option value="صيانة">صيانة</option>
                            <option value="بيع">بيع دواجن</option>
                            <option value="اخرى">أخرى</option>
                        </select>
                        <input name="notes" placeholder="ملاحظات" className="p-2 border rounded" />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold">إضافة عملية</button>
                 </form>

                 <div className="space-y-2 max-h-80 overflow-y-auto">
                    {currentBatch.transactions.slice().reverse().map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 border-b last:border-0">
                            <div>
                                <p className="font-bold text-gray-700">{t.category}</p>
                                <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                            </div>
                            <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                {t.type === 'income' ? '+' : '-'} {t.amount}
                            </span>
                        </div>
                    ))}
                 </div>
              </div>
            )}
            
            {/* Reports View */}
            {activeTab === 'reports' && (
                <div className="bg-white p-6 rounded-xl text-center space-y-4">
                    <div className="border p-4 rounded bg-gray-50 text-right">
                        <h3 className="font-bold text-lg mb-2">{currentBatch.name}</h3>
                        <p>تاريخ البدء: {new Date(currentBatch.startDate).toLocaleDateString()}</p>
                        <p>إجمالي المصروفات: {stats.totalCost.toLocaleString()}</p>
                        <p>إجمالي الإيرادات: {stats.income.toLocaleString()}</p>
                        <hr className="my-2"/>
                        <p className="font-bold text-xl">الربح: {(stats.income - stats.totalCost).toLocaleString()}</p>
                    </div>
                    <button onClick={() => window.print()} className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold">📄 طباعة تقرير PDF</button>
                </div>
            )}

          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-20">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center text-xs ${activeTab === 'dashboard' ? 'text-amber-600' : 'text-gray-400'}`}>
            <Activity size={24} /> <span>المتابعة</span>
        </button>
        <button onClick={() => setActiveTab('financial')} className={`flex flex-col items-center text-xs ${activeTab === 'financial' ? 'text-amber-600' : 'text-gray-400'}`}>
            <DollarSign size={24} /> <span>المالية</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center text-xs ${activeTab === 'reports' ? 'text-amber-600' : 'text-gray-400'}`}>
            <Calendar size={24} /> <span>التقارير</span>
        </button>
      </nav>
    </div>
  );
}
