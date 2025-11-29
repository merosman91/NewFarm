// التطبيق الرئيسي
class ShamsinApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('بدء تهيئة التطبيق...');
            
            // تهيئة قاعدة البيانات أولاً
            await DatabaseManager.getDB();
            
            this.setupEventListeners();
            await this.loadDashboardData();
            this.checkLowStock();
            this.requestNotificationPermission();
            
            this.isInitialized = true;
            console.log('تم تهيئة التطبيق بنجاح');
            
        } catch (error) {
            console.error('فشل في تهيئة التطبيق:', error);
            this.showError('فشل في تحميل التطبيق. يرجى تحديث الصفحة.');
        }
    }

    setupEventListeners() {
        console.log('إعداد مستمعي الأحداث...');
        
        // التنقل
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('href').substring(1);
                this.showPage(page);
            });
        });

        // زر القائمة المتنقلة
        const navToggle = document.querySelector('.nav-toggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                document.querySelector('.nav-links').classList.toggle('active');
            });
        }

        // نماذج الدفعات
        const batchForm = document.getElementById('batchForm');
        if (batchForm) {
            batchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBatch();
            });
        }

        // إغلاق النماذج عند النقر خارجها
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'modal-overlay') {
                    this.closeModal();
                }
            });
        }

        // إغلاق النماذج بزر ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        console.log('تم إعداد مستمعي الأحداث بنجاح');
    }

    showPage(pageName) {
        if (!this.isInitialized) {
            console.warn('التطبيق غير مهيء بعد، لا يمكن تغيير الصفحة');
            return;
        }

        console.log('تحويل إلى الصفحة:', pageName);
        
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
        } else {
            console.error('الصفحة غير موجودة:', pageName);
        }

        // تنشيط رابط التنقل
        const navLink = document.querySelector(`[href="#${pageName}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }

        // إغلاق القائمة المتنقلة على الأجهزة الصغيرة
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.classList.remove('active');
        }

        this.currentPage = pageName;
        this.loadPageData(pageName);
    }

    loadPageData(pageName) {
        console.log('تحميل بيانات الصفحة:', pageName);
        
        switch(pageName) {
            case 'batches':
                if (window.BatchesManager && typeof BatchesManager.loadBatches === 'function') {
                    BatchesManager.loadBatches();
                } else {
                    console.error('BatchesManager غير متاح');
                }
                break;
            case 'finance':
                if (window.FinanceManager && typeof FinanceManager.loadFinancialData === 'function') {
                    FinanceManager.loadFinancialData();
                } else {
                    console.error('FinanceManager غير متاح');
                }
                break;
            case 'inventory':
                if (window.InventoryManager && typeof InventoryManager.loadInventory === 'function') {
                    InventoryManager.loadInventory();
                } else {
                    console.error('InventoryManager غير متاح');
                }
                break;
            case 'reports':
                if (window.ReportsManager && typeof ReportsManager.loadReports === 'function') {
                    ReportsManager.loadReports();
                } else {
                    console.error('ReportsManager غير متاح');
                }
                break;
        }
    }

    async loadDashboardData() {
        try {
            console.log('تحميل بيانات لوحة التحكم...');
            
            const db = await DatabaseManager.getDB();
            
            // الدفعات النشطة
            const batches = await DatabaseManager.getAll('batches');
            const activeBatches = batches.filter(b => b.status === 'active');
            this.updateElementText('active-batches', activeBatches.length);

            // البيانات المالية
            const transactions = await DatabaseManager.getAll('transactions');
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            const totalExpenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);

            const netProfit = totalIncome - totalExpenses;
            
            this.updateElementText('total-profit', this.formatCurrency(netProfit));
            this.updateElementText('monthly-costs', this.formatCurrency(this.getMonthlyCosts(transactions)));

            // مخزون العلف
            const inventory = await DatabaseManager.getAll('inventory');
            const feedStock = inventory
                .filter(item => item.category === 'feed')
                .reduce((sum, item) => sum + (item.quantity || 0), 0);
            
            this.updateElementText('feed-stock', `${feedStock.toLocaleString()} كجم`);

            console.log('تم تحميل بيانات لوحة التحكم بنجاح');

        } catch (error) {
            console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
        }
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
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
            const inventory = await DatabaseManager.getAll('inventory');
            
            const lowStockItems = inventory.filter(item => 
                item.quantity <= item.minimumStock
            );

            if (lowStockItems.length > 0) {
                this.showNotification(`تحذير: ${lowStockItems.length} عنصر منخفض في المخزون`);
            }
        } catch (error) {
            console.error('خطأ في فحص المخزون المنخفض:', error);
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (error) {
                console.error('خطأ في طلب إذن الإشعارات:', error);
            }
        }
    }

    showNotification(message, type = 'info') {
        console.log(`إشعار: ${message}`);
        
        // عرض toast
        this.showToast(message, type);
        
        // إشعار المتصفح
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('شمسين - تنبيه', {
                body: message,
                icon: '/icons/icon-72x72.png'
            });
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColor = type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#ff9800';
        
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            left: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            font-weight: bold;
            animation: slideIn 0.3s ease-out;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (toast.parentNode) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, 4000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // إدارة النماذج المنبثقة
    showModal(modalId) {
        console.log('فتح النموذج:', modalId);
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'flex';
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            const targetModal = document.getElementById(modalId);
            if (targetModal) {
                targetModal.style.display = 'block';
            } else {
                console.error('النموذج غير موجود:', modalId);
            }
        }
    }

    closeModal() {
        console.log('إغلاق النماذج');
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            
            // تنظيف النموذج المخصص
            const customModal = document.getElementById('custom-modal');
            if (customModal) {
                customModal.remove();
            }
        }
    }

    async saveBatch() {
        console.log('محاولة حفظ دفعة جديدة...');
        
        const batchData = {
            name: document.getElementById('batchName').value,
            startDate: document.getElementById('startDate').value,
            chicksCount: parseInt(document.getElementById('chicksCount').value),
            breedType: document.getElementById('breedType').value,
            chickPrice: parseFloat(document.getElementById('chickPrice').value),
            status: 'active'
        };

        // التحقق من البيانات
        if (!batchData.name || !batchData.startDate || !batchData.chicksCount || !batchData.chickPrice) {
            this.showError('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        try {
            await DatabaseManager.add('batches', batchData);
            this.closeModal();
            document.getElementById('batchForm').reset();
            this.showPage('batches');
            this.showSuccess('تم حفظ الدفعة بنجاح');
        } catch (error) {
            console.error('خطأ في حفظ الدفعة:', error);
            this.showError('حدث خطأ في حفظ الدفعة');
        }
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    console.log('تم تحميل DOM، بدء التطبيق...');
    window.app = new ShamsinApp();
});

// الدوال العامة للاستخدام في الملفات الأخرى
function showPage(pageName) {
    if (window.app) {
        window.app.showPage(pageName);
    } else {
        console.error('التطبيق غير مهيء بعد');
    }
}

function showModal(modalId) {
    if (window.app) {
        window.app.showModal(modalId);
    } else {
        console.error('التطبيق غير مهيء بعد');
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
    if (window.FinanceManager && typeof FinanceManager.showExpenseForm === 'function') {
        FinanceManager.showExpenseForm();
    } else {
        console.error('FinanceManager غير متاح');
        window.app?.showError('وحدة المالية غير جاهزة بعد');
    }
}

function showIncomeForm() {
    if (window.FinanceManager && typeof FinanceManager.showIncomeForm === 'function') {
        FinanceManager.showIncomeForm();
    } else {
        console.error('FinanceManager غير متاح');
        window.app?.showError('وحدة المالية غير جاهزة بعد');
    }
}

function showInventoryForm() {
    if (window.InventoryManager && typeof InventoryManager.showInventoryForm === 'function') {
        InventoryManager.showInventoryForm();
    } else {
        console.error('InventoryManager غير متاح');
        window.app?.showError('وحدة المخزون غير جاهزة بعد');
    }
}

function generateBatchReport() {
    if (window.ReportsManager && typeof ReportsManager.generateBatchReport === 'function') {
        ReportsManager.generateBatchReport();
    } else {
        console.error('ReportsManager غير متاح');
        window.app?.showError('وحدة التقارير غير جاهزة بعد');
    }
}

function generateFinancialReport() {
    if (window.ReportsManager && typeof ReportsManager.generateFinancialReport === 'function') {
        ReportsManager.generateFinancialReport();
    } else {
        console.error('ReportsManager غير متاح');
        window.app?.showError('وحدة التقارير غير جاهزة بعد');
    }
}

function generateProfitabilityReport() {
    if (window.ReportsManager && typeof ReportsManager.generateProfitabilityReport === 'function') {
        ReportsManager.generateProfitabilityReport();
    } else {
        console.error('ReportsManager غير متاح');
        window.app?.showError('وحدة التقارير غير جاهزة بعد');
    }
                }
