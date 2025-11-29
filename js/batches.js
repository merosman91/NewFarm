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
        
        if (!batches || batches.length === 0) {
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

        container.innerHTML = batches.map(batch => {
            // التحقق من وجود البيانات
            const batchName = batch.name || 'بدون اسم';
            const breedType = batch.breedType || 'غير محدد';
            const chicksCount = batch.chicksCount ? batch.chicksCount.toLocaleString() : '0';
            const startDate = batch.startDate ? this.formatDate(batch.startDate) : 'غير محدد';
            const age = batch.startDate ? this.calculateAge(batch.startDate) : '0';
            
            return `
            <div class="batch-card card">
                <div class="card-header">
                    <h3>${batchName}</h3>
                    <span class="status-badge ${batch.status || 'active'}">
                        ${this.getStatusText(batch.status)}
                    </span>
                </div>
                <div class="card-body">
                    <div class="batch-info">
                        <div class="info-item">
                            <span class="label">السلالة:</span>
                            <span class="value">${breedType}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">عدد الكتاكيت:</span>
                            <span class="value">${chicksCount}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">تاريخ البدء:</span>
                            <span class="value">${startDate}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">العمر:</span>
                            <span class="value">${age} يوم</span>
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
            `;
        }).join('');
    }

    static getStatusText(status) {
        const statusMap = {
            'active': 'نشط',
            'completed': 'مكتمل',
            'cancelled': 'ملغي'
        };
        return statusMap[status] || 'نشط';
    }

    static formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return 'تاريخ غير صالح';
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

    static async saveBatch(batchData) {
        try {
            await DatabaseManager.add('batches', batchData);
            await this.loadBatches();
            window.app.loadDashboardData();
        } catch (error) {
            console.error('Error saving batch:', error);
            throw error;
        }
    }

    static async viewBatch(batchId) {
        try {
            const batch = await DatabaseManager.get('batches', batchId);
            if (batch) {
                this.showBatchDetails(batch);
            } else {
                alert('الدفعة غير موجودة');
            }
        } catch (error) {
            console.error('Error viewing batch:', error);
            alert('حدث خطأ في عرض التفاصيل');
        }
    }

    static showBatchDetails(batch) {
        const modalContent = `
            <div class="modal-header">
                <h3>تفاصيل الدفعة: ${batch.name || 'بدون اسم'}</h3>
                <button class="close-btn" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>اسم الدفعة:</strong> ${batch.name || 'غير محدد'}
                    </div>
                    <div class="detail-item">
                        <strong>تاريخ البدء:</strong> ${this.formatDate(batch.startDate)}
                    </div>
                    <div class="detail-item">
                        <strong>عدد الكتاكيت:</strong> ${batch.chicksCount ? batch.chicksCount.toLocaleString() : '0'}
                    </div>
                    <div class="detail-item">
                        <strong>السلالة:</strong> ${batch.breedType || 'غير محدد'}
                    </div>
                    <div class="detail-item">
                        <strong>سعر الكتكوت:</strong> ${batch.chickPrice ? this.formatCurrency(batch.chickPrice) : '0'}
                    </div>
                    <div class="detail-item">
                        <strong>العمر:</strong> ${this.calculateAge(batch.startDate)} يوم
                    </div>
                    <div class="detail-item">
                        <strong>الحالة:</strong> ${this.getStatusText(batch.status)}
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-primary" onclick="BatchesManager.editBatch(${batch.id})">
                    تعديل
                </button>
                <button class="btn-secondary" onclick="closeModal()">
                    إغلاق
                </button>
            </div>
        `;
        
        this.showCustomModal(modalContent);
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SD', {
            style: 'currency',
            currency: 'SDG'
        }).format(amount);
    }

    static showCustomModal(content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const existingModal = document.getElementById('custom-modal');
        
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'custom-modal';
        modal.className = 'modal';
        modal.innerHTML = content;
        
        modalOverlay.appendChild(modal);
        modalOverlay.style.display = 'flex';
    }

    static async addDailyRecord(batchId) {
        try {
            const batch = await DatabaseManager.get('batches', batchId);
            if (!batch) {
                alert('الدفعة غير موجودة');
                return;
            }

            const modalContent = `
                <div class="modal-header">
                    <h3>تسجيل يومي - ${batch.name}</h3>
                    <button class="close-btn" onclick="closeModal()">×</button>
                </div>
                <form id="dailyRecordForm" class="modal-form">
                    <input type="hidden" name="batchId" value="${batchId}">
                    <div class="form-group">
                        <label for="recordDate">التاريخ</label>
                        <input type="date" id="recordDate" name="recordDate" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label for="feedConsumed">العلف المستهلك (كجم)</label>
                        <input type="number" step="0.1" id="feedConsumed" name="feedConsumed" required>
                    </div>
                    <div class="form-group">
                        <label for="averageWeight">متوسط الوزن (كجم)</label>
                        <input type="number" step="0.01" id="averageWeight" name="averageWeight" required>
                    </div>
                    <div class="form-group">
                        <label for="mortality">عدد النفوق</label>
                        <input type="number" id="mortality" name="mortality" value="0" required>
                    </div>
                    <div class="form-group">
                        <label for="notes">ملاحظات</label>
                        <textarea id="notes" name="notes" rows="3"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">حفظ التسجيل</button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">إلغاء</button>
                    </div>
                </form>
            `;

            this.showCustomModal(modalContent);
            
            // إضافة مستمع للنموذج
            document.getElementById('dailyRecordForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDailyRecord(batchId);
            });

        } catch (error) {
            console.error('Error adding daily record:', error);
            alert('حدث خطأ في فتح نموذج التسجيل اليومي');
        }
    }

    static async saveDailyRecord(batchId) {
        const formData = new FormData(document.getElementById('dailyRecordForm'));
        const recordData = {
            batchId: batchId,
            date: formData.get('recordDate'),
            feedConsumed: parseFloat(formData.get('feedConsumed')),
            averageWeight: parseFloat(formData.get('averageWeight')),
            mortality: parseInt(formData.get('mortality')),
            notes: formData.get('notes'),
            createdAt: new Date().toISOString()
        };

        try {
            await DatabaseManager.add('dailyRecords', recordData);
            closeModal();
            window.app.showNotification('تم حفظ التسجيل اليومي بنجاح');
        } catch (error) {
            console.error('Error saving daily record:', error);
            alert('حدث خطأ في حفظ التسجيل اليومي');
        }
    }

    static async editBatch(batchId) {
        // تنفيذ تعديل الدفعة
        console.log('Editing batch:', batchId);
    }
                }
