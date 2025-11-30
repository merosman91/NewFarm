class ReportsManager {
    static async loadReports() {
        // يمكن إضافة أي تهيئة مبدئية للتقارير هنا
    }

    static async generateBatchReport() {
        try {
            const batches = await DatabaseManager.getAll('batches');
            const dailyRecords = await DatabaseManager.getAll('dailyRecords');
            
            if (batches.length === 0) {
                window.app.showError('لا توجد دفعات لعمل تقرير');
                return;
            }

            let reportContent = `# تقرير الدفعات - نظام شمسين\n\n`;
            reportContent += `تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}\n\n`;

            batches.forEach(batch => {
                const batchRecords = dailyRecords.filter(record => record.batchId === batch.id);
                const totalMortality = batchRecords.reduce((sum, record) => sum + (record.mortality || 0), 0);
                const currentChicks = batch.chicksCount - totalMortality;

                reportContent += `## دفعة: ${batch.name}\n`;
                reportContent += `- السلالة: ${batch.breedType}\n`;
                reportContent += `- عدد الكتاكيت: ${batch.chicksCount.toLocaleString()}\n`;
                reportContent += `- العدد الحالي: ${currentChicks.toLocaleString()}\n`;
                reportContent += `- إجمالي النفوق: ${totalMortality}\n`;
                reportContent += `- العمر: ${this.calculateAge(batch.startDate)} يوم\n`;
                reportContent += `- الحالة: ${this.getStatusText(batch.status)}\n\n`;
            });

            this.downloadReport(reportContent, 'تقرير-الدفعات.txt');
            window.app.success('تم إنشاء تقرير الدفعات بنجاح');

        } catch (error) {
            console.error('Error generating batch report:', error);
            window.app.showError('حدث خطأ في إنشاء التقرير');
        }
    }

    static async generateFinancialReport() {
        try {
            const transactions = await DatabaseManager.getAll('transactions');
            
            if (transactions.length === 0) {
                alert('لا توجد معاملات مالية لعمل تقرير');
                return;
            }

            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            const totalExpenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);

            const netProfit = totalIncome - totalExpenses;
            const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

            let reportContent = `# التقرير المالي - نظام شمسين\n\n`;
            reportContent += `تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}\n\n`;

            reportContent += `## الملخص المالي\n`;
            reportContent += `- إجمالي الإيرادات: ${this.formatCurrency(totalIncome)}\n`;
            reportContent += `- إجمالي المصروفات: ${this.formatCurrency(totalExpenses)}\n`;
            reportContent += `- صافي الربح: ${this.formatCurrency(netProfit)}\n`;
            reportContent += `- هامش الربح: ${profitMargin.toFixed(2)}%\n\n`;

            reportContent += `## تفاصيل المعاملات\n\n`;

            // الإيرادات
            reportContent += `### الإيرادات\n`;
            const incomes = transactions.filter(t => t.type === 'income');
            incomes.forEach(income => {
                reportContent += `- ${income.description}: ${this.formatCurrency(income.amount)} (${this.formatDate(income.date)})\n`;
            });

            // المصروفات
            reportContent += `\n### المصروفات\n`;
            const expenses = transactions.filter(t => t.type === 'expense');
            expenses.forEach(expense => {
                reportContent += `- ${expense.description}: ${this.formatCurrency(expense.amount)} (${this.formatDate(expense.date)})\n`;
            });

            this.downloadReport(reportContent, 'التقرير-المالي.txt');
            window.app.Success('تم إنشاء التقرير المالي بنجاح');

        } catch (error) {
            console.error('Error generating financial report:', error);
            window.app.showError('حدث خطأ في إنشاء التقرير');
        }
    }

    static async generateProfitabilityReport() {
        try {
            const batches = await DatabaseManager.getAll('batches');
            const transactions = await DatabaseManager.getAll('transactions');
            
            if (batches.length === 0) {
                alert('لا توجد دفعات لعمل تحليل الربحية');
                return;
            }

            let reportContent = `# تحليل الربحية - نظام شمسين\n\n`;
            reportContent += `تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}\n\n`;

            batches.forEach(batch => {
                const batchTransactions = transactions.filter(t => 
                    t.description && t.description.includes(batch.name)
                );

                const batchIncome = batchTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const batchExpenses = batchTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const batchProfit = batchIncome - batchExpenses;
                const costPerChicken = batch.chicksCount > 0 ? batchExpenses / batch.chicksCount : 0;

                reportContent += `## دفعة: ${batch.name}\n`;
                reportContent += `- إيرادات الدفعة: ${this.formatCurrency(batchIncome)}\n`;
                reportContent += `- مصروفات الدفعة: ${this.formatCurrency(batchExpenses)}\n`;
                reportContent += `- ربح الدفعة: ${this.formatCurrency(batchProfit)}\n`;
                reportContent += `- تكلفة الدجاجة: ${this.formatCurrency(costPerChicken)}\n`;
                reportContent += `- هامش الربح: ${batchIncome > 0 ? ((batchProfit / batchIncome) * 100).toFixed(2) : 0}%\n\n`;
            });

            this.downloadReport(reportContent, 'تحليل-الربحية.txt');
            window.app.Success('تم إنشاء تحليل الربحية بنجاح');

        } catch (error) {
            console.error('Error generating profitability report:', error);
            window.app.showError('حدث خطأ في إنشاء التقرير');
        }
    }

    static downloadReport(content, filename) {
        const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' ج.س';
    }

    static formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return 'غير محدد';
        }
    }

    static calculateAge(startDate) {
        try {
            const start = new Date(startDate);
            const today = new Date();
            const diffTime = Math.abs(today - start);
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            return 0;
        }
    }

    static getStatusText(status) {
        const statusMap = {
            'active': 'نشط',
            'completed': 'مكتمل',
            'cancelled': 'ملغي'
        };
        return statusMap[status] || 'نشط';
    }

    static shareReport(type) {
        let message = '';
        
        switch(type) {
            case 'financial':
                message = '📊 التقرير المالي لنظام شمسين\n';
                message += 'للعرض التفصيلي، يرجى فحص التطبيق\n';
                message += '---\nنظام شمسين لإدارة مزارع الدواجن';
                break;
            case 'batches':
                message = '🐔 تقرير الدفعات لنظام شمسين\n';
                message += 'لمشاهدة التفاصيل الكاملة، افتح التطبيق\n';
                message += '---\nنظام شمسين لإدارة مزارع الدواجن';
                break;
            default:
                message = '📱 تقرير من نظام شمسين\n';
                message += 'إدارة مزارع الدواجن باحترافية\n';
                message += '---\nنظام شمسين المتكامل';
        }

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    }
}
