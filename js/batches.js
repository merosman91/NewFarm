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
            // استخدام التاريخ الميلادي
            return date.toLocaleDateString('ar-EG', {
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
                        <strong>سعر الكتكوت:</strong> ${batch.chickPrice ? this.formatCurrency(batch.chickPrice) : '0 ج.س'}
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
                <button class="btn-secondary" onclick="BatchesManager.shareBatch(${batch.id})">
                    📱 مشاركة
                </button>
                <button class="btn-secondary" onclick="closeModal()">
                    إغلاق
                </button>
            </div>
        `;
        
        this.showCustomModal(modalContent);
    }

    static async editBatch(batchId) {
        try {
            const batch = await DatabaseManager.get('batches', batchId);
            if (!batch) {
                alert('الدفعة غير موجودة');
                return;
            }

            const modalContent = `
                <div class="modal-header">
                    <h3>تعديل الدفعة: ${batch.name}</h3>
                    <button class="close-btn" onclick="closeModal()">×</button>
                </div>
                <form id="editBatchForm" class="modal-form">
                    <div class="form-group">
                        <label for="editBatchName">اسم الدفعة</label>
                        <input type="text" id="editBatchName" value="${batch.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="editStartDate">تاريخ البدء</label>
                        <input type="date" id="editStartDate" value="${batch.startDate || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="editChicksCount">عدد الكتاكيت</label>
                        <input type="number" id="editChicksCount" value="${batch.chicksCount || 0}" required>
                    </div>
                    <div class="form-group">
                        <label for="editBreedType">السلالة</label>
                        <select id="editBreedType" required>
                            <option value="كوب" ${batch.breedType === 'كوب' ? 'selected' : ''}>كوب</option>
                            <option value="روس" ${batch.breedType === 'روس' ? 'selected' : ''}>روس</option>
                            <option value="هبرد" ${batch.breedType === 'هبرد' ? 'selected' : ''}>هبرد</option>
                            <option value="أخرى" ${batch.breedType === 'أخرى' ? 'selected' : ''}>أخرى</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editChickPrice">سعر الكتكوت (ج.س)</label>
                        <input type="number" step="0.01" id="editChickPrice" value="${batch.chickPrice || 0}" required>
                    </div>
                    <div class="form-group">
                        <label for="editStatus">الحالة</label>
                        <select id="editStatus" required>
                            <option value="active" ${batch.status === 'active' ? 'selected' : ''}>نشط</option>
                            <option value="completed" ${batch.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                            <option value="cancelled" ${batch.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">حفظ التعديلات</button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">إلغاء</button>
                    </div>
                </form>
            `;

            this.showCustomModal(modalContent);
            
            document.getElementById('editBatchForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateBatch(batchId);
            });

        } catch (error) {
            console.error('Error editing batch:', error);
            alert('حدث خطأ في فتح نموذج التعديل');
        }
    }

    static async updateBatch(batchId) {
        const batchData = {
            name: document.getElementById('editBatchName').value,
            startDate: document.getElementById('editStartDate').value,
            chicksCount: parseInt(document.getElementById('editChicksCount').value),
            breedType: document.getElementById('editBreedType').value,
            chickPrice: parseFloat(document.getElementById('editChickPrice').value),
            status: document.getElementById('editStatus').value,
            updatedAt: new Date().toISOString()
        };

        try {
            await DatabaseManager.update('batches', batchId, batchData);
            closeModal();
            this.loadBatches();
            window.app.showNotification('تم تعديل الدفعة بنجاح');
        } catch (error) {
            console.error('Error updating batch:', error);
            alert('حدث خطأ في تعديل الدفعة');
        }
    }

    static async shareBatch(batchId) {
        try {
            const batch = await DatabaseManager.get('batches', batchId);
            if (!batch) {
                alert('الدفعة غير موجودة');
                return;
            }

            const message = `🐔 دفعة دواجن - ${batch.name}
            
السلالة: ${batch.breedType}
عدد الكتاكيت: ${batch.chicksCount?.toLocaleString() || '0'}
تاريخ البدء: ${this.formatDate(batch.startDate)}
العمر: ${this.calculateAge(batch.startDate)} يوم
الحالة: ${this.getStatusText(batch.status)}

---
نظام شمسين لإدارة مزارع الدواجن`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
            
            window.open(whatsappUrl, '_blank');
            
        } catch (error) {
            console.error('Error sharing batch:', error);
            alert('حدث خطأ في المشاركة');
        }
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' ج.س';
    }

    static showCustomModal(content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const customModal = document.getElementById('custom-modal');
        
        if (customModal) {
            customModal.innerHTML = content;
        } else {
            const modal = document.createElement('div');
            modal.id = 'custom-modal';
            modal.className = 'modal';
            modal.innerHTML = content;
            modalOverlay.appendChild(modal);
        }
        
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
        }
