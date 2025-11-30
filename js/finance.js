class FinanceManager {
    static async loadFinancialData() {
        try {
            console.log('تحميل البيانات المالية...');
            const transactions = await DatabaseManager.getAll('transactions');
            this.renderFinancialSummary(transactions);
            this.renderTransactions(transactions);
            console.log('تم تحميل البيانات المالية بنجاح');
        } catch (error) {
            console.error('خطأ في تحميل البيانات المالية:', error);
        }
    }

    // ... باقي الكود بدون تغيير ...
    
    static async saveExpense() {
        const expenseData = {
            type: 'expense',
            description: document.getElementById('expenseDescription').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            category: document.getElementById('expenseCategory').value,
            date: document.getElementById('expenseDate').value
        };

        try {
            await DatabaseManager.add('transactions', expenseData);
            closeModal();
            this.loadFinancialData();
            window.app.loadDashboardData();
            window.app.showSuccess('تم إضافة المصروف بنجاح 💰');
        } catch (error) {
            console.error('Error saving expense:', error);
            window.app.showError('حدث خطأ في إضافة المصروف');
        }
    }

    static async saveIncome() {
        const incomeData = {
            type: 'income',
            description: document.getElementById('incomeDescription').value,
            amount: parseFloat(document.getElementById('incomeAmount').value),
            category: document.getElementById('incomeCategory').value,
            date: document.getElementById('incomeDate').value
        };

        try {
            await DatabaseManager.add('transactions', incomeData);
            closeModal();
            this.loadFinancialData();
            window.app.loadDashboardData();
            window.app.showSuccess('تم إضافة الإيراد بنجاح 💵');
        } catch (error) {
            console.error('Error saving income:', error);
            window.app.showError('حدث خطأ في إضافة الإيراد');
        }
    }
                                                       }

    static renderFinancialSummary(transactions) {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const netProfit = totalIncome - totalExpenses;

        document.getElementById('total-income').textContent = this.formatCurrency(totalIncome);
        document.getElementById('total-expenses').textContent = this.formatCurrency(totalExpenses);
        document.getElementById('net-profit').textContent = this.formatCurrency(netProfit);
        
        // إضافة لون للربح
        const netProfitElement = document.getElementById('net-profit');
        netProfitElement.className = `amount ${netProfit >= 0 ? 'positive' : 'negative'}`;
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' ج.س';
    }

    static renderTransactions(transactions) {
        const container = document.getElementById('finance-transactions');
        if (!container) return;

        // ترتيب المعاملات من الأحدث إلى الأقدم
        const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>لا توجد معاملات مالية</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sortedTransactions.map(transaction => `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-info">
                    <h4>${transaction.description || 'بدون وصف'}</h4>
                    <span class="transaction-date">${this.formatDate(transaction.date)}</span>
                    <span class="transaction-category">${this.getCategoryText(transaction.category)}</span>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'} ${this.formatCurrency(transaction.amount)}
                </div>
            </div>
        `).join('');
    }

    static getCategoryText(category) {
        const categories = {
            'feed': 'علف وتغذية',
            'medicine': 'أدوية ولقاحات',
            'labor': 'عمالة ورواتب',
            'maintenance': 'صيانة',
            'transport': 'نقل ووقود',
            'utilities': 'كهرباء وماء',
            'chicken_sale': 'بيع دواجن',
            'egg_sale': 'بيع بيض',
            'other_income': 'إيرادات أخرى',
            'other': 'أخرى'
        };
        return categories[category] || category;
    }

    static formatDate(dateString) {
        try {
            const date = new Date(dateString);
            // استخدام التاريخ الميلادي
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return 'تاريخ غير محدد';
        }
    }

    static showExpenseForm() {
        const modalContent = `
            <div class="modal-header">
                <h3>إضافة مصروف</h3>
                <button class="close-btn" onclick="closeModal()">×</button>
            </div>
            <form id="expenseForm" class="modal-form">
                <div class="form-group">
                    <label for="expenseDescription">الوصف</label>
                    <input type="text" id="expenseDescription" required>
                </div>
                <div class="form-group">
                    <label for="expenseAmount">المبلغ (ج.س)</label>
                    <input type="number" step="0.01" id="expenseAmount" required>
                </div>
                <div class="form-group">
                    <label for="expenseCategory">الفئة</label>
                    <select id="expenseCategory" required>
                        <option value="feed">علف وتغذية</option>
                        <option value="medicine">أدوية ولقاحات</option>
                        <option value="labor">عمالة ورواتب</option>
                        <option value="maintenance">صيانة</option>
                        <option value="transport">نقل ووقود</option>
                        <option value="utilities">كهرباء وماء</option>
                        <option value="other">أخرى</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="expenseDate">التاريخ</label>
                    <input type="date" id="expenseDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">حفظ المصروف</button>
                    <button type="button" class="btn-secondary" onclick="closeModal()">إلغاء</button>
                </div>
            </form>
        `;

        BatchesManager.showCustomModal(modalContent);
        
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExpense();
        });
    }

    

    static showIncomeForm() {
        const modalContent = `
            <div class="modal-header">
                <h3>إضافة إيراد</h3>
                <button class="close-btn" onclick="closeModal()">×</button>
            </div>
            <form id="incomeForm" class="modal-form">
                <div class="form-group">
                    <label for="incomeDescription">الوصف</label>
                    <input type="text" id="incomeDescription" required>
                </div>
                <div class="form-group">
                    <label for="incomeAmount">المبلغ (ج.س)</label>
                    <input type="number" step="0.01" id="incomeAmount" required>
                </div>
                <div class="form-group">
                    <label for="incomeCategory">الفئة</label>
                    <select id="incomeCategory" required>
                        <option value="chicken_sale">بيع دواجن</option>
                        <option value="egg_sale">بيع بيض</option>
                        <option value="other_income">إيرادات أخرى</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="incomeDate">التاريخ</label>
                    <input type="date" id="incomeDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">حفظ الإيراد</button>
                    <button type="button" class="btn-secondary" onclick="closeModal()">إلغاء</button>
                </div>
            </form>
        `;

        BatchesManager.showCustomModal(modalContent);
        
        document.getElementById('incomeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveIncome();
        });
    }

    
                }
} 
