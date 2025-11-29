// التطبيق الرئيسي
class ShamsinApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.checkLowStock();
    }

    setupEventListeners() {
        // التنقل
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('href').substring(1);
                this.showPage(page);
            });
        });

        // زر القائمة المتنقلة
        document.querySelector('.nav-toggle').addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('active');
        });

        // نماذج الدفعات
        document.getElementById('batchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBatch();
        });
    }

    showPage(pageName) {
        // إخفاء جميع الصفحات
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // إلغاء تنشيط جميع روابط التنقل
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // إظهار الصفحة المطلوبة
        document.getElementById(pageName).classList.add('active');
        
        // تنشيط رابط التنقل
        document.querySelector(`[href="#${pageName}"]`).classList.add('active');

        // إغلاق القائمة المتنقلة على الأجهزة الصغيرة
        document.querySelector('.nav-links').classList.remove('active');

        this.currentPage = pageName;
        this.loadPageData(pageName);
    }

    loadPageData(pageName) {
        switch(pageName) {
            case 'batches':
                BatchesManager.loadBatches();
                break;
            case 'finance':
                FinanceManager.loadFinancialData();
                break;
            case 'inventory':
                InventoryManager.loadInventory();
                break;
            case 'reports':
                ReportsManager.loadReports();
                break;
        }
    }

    async loadDashboardData() {
        try {
            const db = await DatabaseManager.getDB();
            
            // الدفعات النشطة
            const activeBatches = await db.getAll('batches');
            document.getElementById('active-batches').textContent = 
                activeBatches.filter(b => b.status === 'active').length;

            // البيانات المالية
            const transactions = await db.getAll('transactions');
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const totalExpenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            document.getElementById('total-profit').textContent = 
                `${(totalIncome - totalExpenses).toLocaleString()} ر.س`;

            document.getElementById('monthly-costs').textContent = 
                `${this.getMonthlyCosts(transactions).toLocaleString()} ر.س`;

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    getMonthlyCosts(transactions) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return transactions
            .filter(t => t.type === 'expense')
            .filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === currentMonth && 
                       transactionDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    async checkLowStock() {
        try {
            const db = await DatabaseManager.getDB();
            const inventory = await db.getAll('inventory');
            
            const lowStockItems = inventory.filter(item => 
                item.quantity <= item.minimumStock
            );

            if (lowStockItems.length > 0) {
                this.showNotification(`تحذير: ${lowStockItems.length} عنصر منخفض في المخزون`);
            }
        } catch (error) {
            console.error('Error checking low stock:', error);
        }
    }

    showNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('شمسين - تنبيه', {
                body: message,
                icon: '/icons/icon-72x72.png'
            });
        }
    }

    // إدارة النماذج المنبثقة
    showModal(modalId) {
        document.getElementById('modal-overlay').style.display = 'flex';
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.getElementById(modalId).style.display = 'block';
    }

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    async saveBatch() {
    // في دالة saveBatch - تصحيح أخذ البيانات
async saveBatch() {
    const batchData = {
        name: document.getElementById('batchName').value,
        startDate: document.getElementById('startDate').value,
        chicksCount: parseInt(document.getElementById('chicksCount').value),
        breedType: document.getElementById('breedType').value,
        chickPrice: parseFloat(document.getElementById('chickPrice').value),
        status: 'active',
        createdAt: new Date().toISOString()
    };

    // التحقق من البيانات
    if (!batchData.name || !batchData.startDate || !batchData.chicksCount) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    try {
        await BatchesManager.saveBatch(batchData);
        this.closeModal();
        document.getElementById('batchForm').reset();
        this.showPage('batches');
        this.showNotification('تم حفظ الدفعة بنجاح');
    } catch (error) {
        console.error('Error saving batch:', error);
        alert('حدث خطأ في حفظ الدفعة');
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShamsinApp();
});

// الدوال العامة للاستخدام في الملفات الأخرى
function showPage(pageName) {
    window.app.showPage(pageName);
}

function showModal(modalId) {
    window.app.showModal(modalId);
}

function closeModal() {
    window.app.closeModal();
}

function showBatchForm() {
    showModal('batch-form');
}
