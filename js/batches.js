// إدارة الدفعات
class BatchesManager {
    static async loadBatches() {
        try {
            const batches = await DatabaseManager.getAll('batches');
            this.renderBatches(batches);
        } catch (error) {
            console.error('Error loading batches:', error);
        }
    }

    static renderBatches(batches) {
        const container = document.getElementById('batches-list');
        
        if (batches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>لا توجد دفعات حالياً</p>
                    <button class="btn-primary" onclick="showBatchForm()">
                        إنشاء أول دفعة
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = batches.map(batch => `
            <div class="batch-card card">
                <div class="card-header">
                    <h3>${batch.name}</h3>
                    <span class="status-badge ${batch.status}">${this.getStatusText(batch.status)}</span>
                </div>
                <div class="card-body">
                    <div class="batch-info">
                        <div class="info-item">
                            <span class="label">السلالة:</span>
                            <span class="value">${batch.breedType}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">عدد الكتاكيت:</span>
                            <span class="value">${batch.chicksCount.toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">تاريخ البدء:</span>
                            <span class="value">${this.formatDate(batch.startDate)}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">العمر:</span>
                            <span class="value">${this.calculateAge(batch.startDate)} يوم</span>
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-secondary" onclick="BatchesManager.viewBatch(${batch.id})">
                        التفاصيل
                    </button>
                    <button class="btn-primary" onclick="BatchesManager.addDailyRecord(${batch.id})">
                        تسجيل يومي
                    </button>
                </div>
            </div>
        `).join('');
    }

    static getStatusText(status) {
        const statusMap = {
            'active': 'نشط',
            'completed': 'مكتمل',
            'cancelled': 'ملغي'
        };
        return statusMap[status] || status;
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA');
    }

    static calculateAge(startDate) {
        const start = new Date(startDate);
        const today = new Date();
        const diffTime = Math.abs(today - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    static async saveBatch(batchData) {
        await DatabaseManager.add('batches', batchData);
        await this.loadBatches();
        window.app.loadDashboardData();
    }

    static async viewBatch(batchId) {
        // تنفيذ عرض تفاصيل الدفعة
        console.log('Viewing batch:', batchId);
    }

    static async addDailyRecord(batchId) {
        // تنفيذ إضافة تسجيل يومي
        console.log('Adding daily record for batch:', batchId);
    }
}
