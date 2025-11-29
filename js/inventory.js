class InventoryManager {
    static async loadInventory() {
        try {
            const inventory = await DatabaseManager.getAll('inventory');
            this.renderInventory(inventory);
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    }

    static renderInventory(inventory) {
        const container = document.getElementById('inventory-list');
        
        if (!inventory || inventory.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>لا توجد عناصر في المخزون</p>
                    <button class="btn-primary" onclick="showInventoryForm()">
                        إضافة أول عنصر
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = inventory.map(item => {
            const statusClass = item.quantity <= item.minimumStock ? 'low-stock' : 'normal-stock';
            const statusText = item.quantity <= item.minimumStock ? 'منخفض' : 'طبيعي';
            
            return `
            <div class="inventory-card card ${statusClass}">
                <div class="card-header">
                    <h3>${item.name}</h3>
                    <span class="stock-status ${statusClass}">${statusText}</span>
                </div>
                <div class="card-body">
                    <div class="inventory-info">
                        <div class="info-item">
                            <span class="label">النوع:</span>
                            <span class="value">${this.getCategoryText(item.category)}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">الكمية:</span>
                            <span class="value">${item.quantity} ${item.unit}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">الحد الأدنى:</span>
                            <span class="value">${item.minimumStock} ${item.unit}</span>
                        </div>
                        ${item.expiryDate ? `
                        <div class="info-item">
                            <span class="label">تاريخ الانتهاء:</span>
                            <span class="value">${this.formatDate(item.expiryDate)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-secondary" onclick="InventoryManager.editItem(${item.id})">
                        تعديل
                    </button>
                    <button class="btn-primary" onclick="InventoryManager.updateStock(${item.id})">
                        تحديث المخزون
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    static getCategoryText(category) {
        const categories = {
            'feed': 'علف',
            'medicine': 'أدوية',
            'vaccine': 'لقاحات',
            'equipment': 'معدات',
            'other': 'أخرى'
        };
        return categories[category] || category;
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

    static showInventoryForm() {
        const modalContent = `
            <div class="modal-header">
                <h3>إضافة عنصر للمخزون</h3>
                <button class="close-btn" onclick="closeModal()">×</button>
            </div>
            <form id="inventoryForm" class="modal-form">
                <div class="form-group">
                    <label for="itemName">اسم العنصر</label>
                    <input type="text" id="itemName" required>
                </div>
                <div class="form-group">
                    <label for="itemCategory">الفئة</label>
                    <select id="itemCategory" required>
                        <option value="feed">علف</option>
                        <option value="medicine">أدوية</option>
                        <option value="vaccine">لقاحات</option>
                        <option value="equipment">معدات</option>
                        <option value="other">أخرى</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="itemQuantity">الكمية</label>
                    <input type="number" step="0.01" id="itemQuantity" required>
                </div>
                <div class="form-group">
                    <label for="itemUnit">الوحدة</label>
                    <select id="itemUnit" required>
                        <option value="كجم">كيلوجرام</option>
                        <option value="جم">جرام</option>
                        <option value="لتر">لتر</option>
                        <option value="علبة">علبة</option>
                        <option value="كيس">كيس</option>
                        <option value="عبوة">عبوة</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="minimumStock">الحد الأدنى للمخزون</label>
                    <input type="number" step="0.01" id="minimumStock" required>
                </div>
                <div class="form-group">
                    <label for="expiryDate">تاريخ الانتهاء (اختياري)</label>
                    <input type="date" id="expiryDate">
                </div>
                <div class="form-group">
                    <label for="itemNotes">ملاحظات (اختياري)</label>
                    <textarea id="itemNotes" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">حفظ العنصر</button>
                    <button type="button" class="btn-secondary" onclick="closeModal()">إلغاء</button>
                </div>
            </form>
        `;

        BatchesManager.showCustomModal(modalContent);
        
        document.getElementById('inventoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveInventoryItem();
        });
    }

    static async saveInventoryItem() {
        const itemData = {
            name: document.getElementById('itemName').value,
            category: document.getElementById('itemCategory').value,
            quantity: parseFloat(document.getElementById('itemQuantity').value),
            unit: document.getElementById('itemUnit').value,
            minimumStock: parseFloat(document.getElementById('minimumStock').value),
            expiryDate: document.getElementById('expiryDate').value || null,
            notes: document.getElementById('itemNotes').value,
            createdAt: new Date().toISOString()
        };

        try {
            await DatabaseManager.add('inventory', itemData);
            closeModal();
            this.loadInventory();
            window.app.loadDashboardData();
            window.app.showNotification('تم إضافة العنصر للمخزون بنجاح');
        } catch (error) {
            console.error('Error saving inventory item:', error);
            window.app.showNotification('حدث خطأ في إضافة العنصر');
        }
    }

    static async editItem(itemId) {
        try {
            const item = await DatabaseManager.get('inventory', itemId);
            if (!item) {
                alert('العنصر غير موجود');
                return;
            }

            const modalContent = `
                <div class="modal-header">
                    <h3>تعديل عنصر: ${item.name}</h3>
                    <button class="close-btn" onclick="closeModal()">×</button>
                </div>
                <form id="editInventoryForm" class="modal-form">
                    <div class="form-group">
                        <label for="editItemName">اسم العنصر</label>
                        <input type="text" id="editItemName" value="${item.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="editItemCategory">الفئة</label>
                        <select id="editItemCategory" required>
                            <option value="feed" ${item.category === 'feed' ? 'selected' : ''}>علف</option>
                            <option value="medicine" ${item.category === 'medicine' ? 'selected' : ''}>أدوية</option>
                            <option value="vaccine" ${item.category === 'vaccine' ? 'selected' : ''}>لقاحات</option>
                            <option value="equipment" ${item.category === 'equipment' ? 'selected' : ''}>معدات</option>
                            <option value="other" ${item.category === 'other' ? 'selected' : ''}>أخرى</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editItemQuantity">الكمية</label>
                        <input type="number" step="0.01" id="editItemQuantity" value="${item.quantity}" required>
                    </div>
                    <div class="form-group">
                        <label for="editItemUnit">الوحدة</label>
                        <select id="editItemUnit" required>
                            <option value="كجم" ${item.unit === 'كجم' ? 'selected' : ''}>كيلوجرام</option>
                            <option value="جم" ${item.unit === 'جم' ? 'selected' : ''}>جرام</option>
                            <option value="لتر" ${item.unit === 'لتر' ? 'selected' : ''}>لتر</option>
                            <option value="علبة" ${item.unit === 'علبة' ? 'selected' : ''}>علبة</option>
                            <option value="كيس" ${item.unit === 'كيس' ? 'selected' : ''}>كيس</option>
                            <option value="عبوة" ${item.unit === 'عبوة' ? 'selected' : ''}>عبوة</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editMinimumStock">الحد الأدنى للمخزون</label>
                        <input type="number" step="0.01" id="editMinimumStock" value="${item.minimumStock}" required>
                    </div>
                    <div class="form-group">
                        <label for="editExpiryDate">تاريخ الانتهاء</label>
                        <input type="date" id="editExpiryDate" value="${item.expiryDate || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editItemNotes">ملاحظات</label>
                        <textarea id="editItemNotes" rows="3">${item.notes || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">حفظ التعديلات</button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">إلغاء</button>
                    </div>
                </form>
            `;

            BatchesManager.showCustomModal(modalContent);
            
            document.getElementById('editInventoryForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateInventoryItem(itemId);
            });

        } catch (error) {
            console.error('Error editing inventory item:', error);
            alert('حدث خطأ في فتح نموذج التعديل');
        }
    }

    static async updateInventoryItem(itemId) {
        const itemData = {
            name: document.getElementById('editItemName').value,
            category: document.getElementById('editItemCategory').value,
            quantity: parseFloat(document.getElementById('editItemQuantity').value),
            unit: document.getElementById('editItemUnit').value,
            minimumStock: parseFloat(document.getElementById('editMinimumStock').value),
            expiryDate: document.getElementById('editExpiryDate').value || null,
            notes: document.getElementById('editItemNotes').value,
            updatedAt: new Date().toISOString()
        };

        try {
            await DatabaseManager.update('inventory', itemId, itemData);
            closeModal();
            this.loadInventory();
            window.app.showNotification('تم تعديل العنصر بنجاح');
        } catch (error) {
            console.error('Error updating inventory item:', error);
            alert('حدث خطأ في تعديل العنصر');
        }
    }

    static async updateStock(itemId) {
        try {
            const item = await DatabaseManager.get('inventory', itemId);
            if (!item) {
                alert('العنصر غير موجود');
                return;
            }

            const modalContent = `
                <div class="modal-header">
                    <h3>تحديث مخزون: ${item.name}</h3>
                    <button class="close-btn" onclick="closeModal()">×</button>
                </div>
                <form id="updateStockForm" class="modal-form">
                    <div class="form-group">
                        <label>الكمية الحالية: ${item.quantity} ${item.unit}</label>
                    </div>
                    <div class="form-group">
                        <label for="stockOperation">العملية</label>
                        <select id="stockOperation" required>
                            <option value="add">إضافة للمخزون</option>
                            <option value="subtract">خصم من المخزون</option>
                            <option value="set">تعيين قيمة جديدة</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="stockQuantity">الكمية</label>
                        <input type="number" step="0.01" id="stockQuantity" required>
                    </div>
                    <div class="form-group">
                        <label for="stockReason">السبب (اختياري)</label>
                        <input type="text" id="stockReason">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">تحديث المخزون</button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">إلغاء</button>
                    </div>
                </form>
            `;

            BatchesManager.showCustomModal(modalContent);
            
            document.getElementById('updateStockForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.processStockUpdate(itemId, item);
            });

        } catch (error) {
            console.error('Error updating stock:', error);
            alert('حدث خطأ في فتح نموذج تحديث المخزون');
        }
    }

    static async processStockUpdate(itemId, item) {
        const operation = document.getElementById('stockOperation').value;
        const quantity = parseFloat(document.getElementById('stockQuantity').value);
        const reason = document.getElementById('stockReason').value;

        let newQuantity = item.quantity;

        switch(operation) {
            case 'add':
                newQuantity += quantity;
                break;
            case 'subtract':
                newQuantity -= quantity;
                break;
            case 'set':
                newQuantity = quantity;
                break;
        }

        if (newQuantity < 0) {
            alert('الكمية لا يمكن أن تكون سالبة');
            return;
        }

        const updateData = {
            ...item,
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
        };

        try {
            await DatabaseManager.update('inventory', itemId, updateData);
            closeModal();
            this.loadInventory();
            window.app.showNotification('تم تحديث المخزون بنجاح');
        } catch (error) {
            console.error('Error processing stock update:', error);
            alert('حدث خطأ في تحديث المخزون');
        }
    }
                                                             }
