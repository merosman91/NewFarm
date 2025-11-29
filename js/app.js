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
        this.requestNotificationPermission();
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

        // إغلاق النماذج عند النقر خارجها
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.closeModal();
            }
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
        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // تنشيط رابط التنقل
        const navLink = document.querySelector(`[href="#${pageName}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }

        // إغلاق القائمة المتنقلة على الأجهزة الصغيرة
        document.querySelector('.nav-links').classList.remove('active');

        this.currentPage = pageName;
        this.loadPageData(pageName);
    }

    loadPageData(pageName) {
        switch(pageName) {
            case 'batches':
                if (typeof BatchesManager !== 'undefined') {
                    BatchesManager.loadBatches();
                }
                break;
            case 'finance':
                if (typeof FinanceManager !== 'undefined') {
                    FinanceManager.loadFinancialData();
                }
                break;
            case 'inventory':
                if (typeof InventoryManager !== 'undefined') {
                    InventoryManager.loadInventory();
                }
                break;
            case 'reports':
                if (typeof ReportsManager !== 'undefined') {
                    ReportsManager.loadReports();
                }
                break;
        }
    }

    async loadDashboardData() {
        try {
            const db = await DatabaseManager.getDB();
            
            // الدفعات النشطة
            const batches = await db.getAll('batches');
            const activeBatches = batches.filter(b => b.status === 'active');
            document.getElementById('active-batches').textContent = activeBatches.length;

            // البيانات المالية
            const transactions = await db.getAll('transactions');
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            const totalExpenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);

            const netProfit = totalIncome - totalExpenses;
            
            document.getElementById('total-profit').textContent = 
                `${this.formatCurrency(netProfit)}`;

            document.getElementById('monthly-costs').textContent = 
                `${this.formatCurrency(this.getMonthlyCosts(transactions))}`;

            // مخزون العلف
            const inventory = await db.getAll('inventory');
            const feedStock = inventory
                .filter(item => item.category === 'feed')
                .reduce((sum, item) => sum + (item.quantity || 0), 0);
            
            document.getElementById('feed-stock').textContent = 
                `${feedStock.toLocaleString()} كجم`;

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
                try {
                    const transactionDate = new Date(t.date);
                    return transactionDate.getMonth() === currentMonth && 
                           transactionDate.getFullYear() === currentYear;
                } catch {
                    return false;
                }
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' ج.س';
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

    async requestNotificationPermission() {
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                console.log('Notification permission:', permission);
            } catch (error) {
                console.error('Error requesting notification permission:', error);
            }
        }
    }

    showNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('شمسين - تنبيه', {
                body: message,
                icon: '/icons/icon-72x72.png'
            });
        }
        
        // عرض تنبيه في الصفحة أيضاً
        this.showToast(message);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--warning-color);
            color: #000;
            padding: 1rem;
            border-radius: 5px;
            box-shadow: var(--shadow);
            z-index: 3000;
            max-width: 300px;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 5000);
    }

    // إدارة النماذج المنبثقة
    showModal(modalId) {
        document.getElementById('modal-overlay').style.display = 'flex';
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        const targetModal = document.getElementById(modalId);
        if (targetModal) {
            targetModal.style.display = 'block';
        }
    }

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

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
        if (!batchData.name || !batchData.startDate || !batchData.chicksCount || !batchData.chickPrice) {
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
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShamsinApp();
});

// الدوال العامة للاستخدام في الملفات الأخرى
function showPage(pageName) {
    if (window.app) {
        window.app.showPage(pageName);
    }
}

function showModal(modalId) {
    if (window.app) {
        window.app.showModal(modalId);
    }
}

function closeModal() {
    if (window.app) {
        window.app.closeModal();
    }
}

function showBatchForm() {
    showModal('batch-form');
}

function showExpenseForm() {
    if (typeof FinanceManager !== 'undefined') {
        FinanceManager.showExpenseForm();
    } else {
        alert('وحدة المالية غير محملة');
    }
}

function showIncomeForm() {
    if (typeof FinanceManager !== 'undefined') {
        FinanceManager.showIncomeForm();
    } else {
        alert('وحدة المالية غير محملة');
    }
}

function showInventoryForm() {
    if (typeof InventoryManager !== 'undefined') {
        InventoryManager.showInventoryForm();
    } else {
        alert('وحدة المخزون غير محملة');
    }
}

function generateBatchReport() {
    if (typeof ReportsManager !== 'undefined') {
        ReportsManager.generateBatchReport();
    } else {
        alert('وحدة التقارير غير محملة');
    }
}

function generateFinancialReport() {
    if (typeof ReportsManager !== 'undefined') {
        ReportsManager.generateFinancialReport();
    } else {
        alert('وحدة التقارير غير محملة');
    }
}

function generateProfitabilityReport() {
    if (typeof ReportsManager !== 'undefined') {
        ReportsManager.generateProfitabilityReport();
    } else {
        alert('وحدة التقارير غير محملة');
    }
                                  }
