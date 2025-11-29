class DatabaseManager {
    static dbName = 'ShamsinPoultryDB';
    static version = 2; // زيادة الإصدار
    static db = null;

    static async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error('فشل في فتح قاعدة البيانات:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('تم الاتصال بقاعدة البيانات بنجاح');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log('ترقية قاعدة البيانات إلى الإصدار:', this.version);
                const db = event.target.result;
                
                // حذف المخازن القديمة إذا وجدت
                if (db.objectStoreNames.contains('batches')) {
                    db.deleteObjectStore('batches');
                }
                if (db.objectStoreNames.contains('transactions')) {
                    db.deleteObjectStore('transactions');
                }
                if (db.objectStoreNames.contains('inventory')) {
                    db.deleteObjectStore('inventory');
                }
                if (db.objectStoreNames.contains('dailyRecords')) {
                    db.deleteObjectStore('dailyRecords');
                }

                // إنشاء المخازن الجديدة
                const batchStore = db.createObjectStore('batches', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                batchStore.createIndex('status', 'status', { unique: false });
                batchStore.createIndex('startDate', 'startDate', { unique: false });

                const transactionStore = db.createObjectStore('transactions', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                transactionStore.createIndex('type', 'type', { unique: false });
                transactionStore.createIndex('date', 'date', { unique: false });

                const inventoryStore = db.createObjectStore('inventory', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                inventoryStore.createIndex('category', 'category', { unique: false });

                const dailyStore = db.createObjectStore('dailyRecords', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                dailyStore.createIndex('batchId', 'batchId', { unique: false });
            };

            request.onblocked = () => {
                console.warn('قاعدة البيانات محظورة للترقية');
            };
        });
    }

    static async getDB() {
        if (!this.db) {
            await this.init();
        }
        return this.db;
    }

    static async add(storeName, data) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // إضافة timestamp إذا لم يكن موجوداً
                if (!data.createdAt) {
                    data.createdAt = new Date().toISOString();
                }
                
                const request = store.add(data);

                request.onsuccess = () => {
                    console.log(`تم إضافة بيانات بنجاح في ${storeName}:`, data);
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error(`خطأ في إضافة بيانات في ${storeName}:`, request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error(`خطأ في الدالة add لـ ${storeName}:`, error);
            throw error;
        }
    }

    static async getAll(storeName, index = null, query = null) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const target = index ? store.index(index) : store;
                const request = query ? target.getAll(query) : target.getAll();

                request.onsuccess = () => {
                    console.log(`تم جلب ${request.result.length} سجل من ${storeName}`);
                    resolve(request.result || []);
                };

                request.onerror = () => {
                    console.error(`خطأ في جلب البيانات من ${storeName}:`, request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error(`خطأ في الدالة getAll لـ ${storeName}:`, error);
            return [];
        }
    }

    static async get(storeName, key) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);

                request.onsuccess = () => {
                    console.log(`تم جلب سجل من ${storeName} بالمفتاح ${key}`);
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error(`خطأ في جلب السجل من ${storeName}:`, request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error(`خطأ في الدالة get لـ ${storeName}:`, error);
            return null;
        }
    }

    static async update(storeName, key, data) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // تحديث timestamp
                data.updatedAt = new Date().toISOString();
                
                const request = store.put({ ...data, id: key });

                request.onsuccess = () => {
                    console.log(`تم تحديث السجل في ${storeName} بالمفتاح ${key}`);
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error(`خطأ في تحديث السجل في ${storeName}:`, request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error(`خطأ في الدالة update لـ ${storeName}:`, error);
            throw error;
        }
    }

    static async delete(storeName, key) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);

                request.onsuccess = () => {
                    console.log(`تم حذف السجل من ${storeName} بالمفتاح ${key}`);
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error(`خطأ في حذف السجل من ${storeName}:`, request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error(`خطأ في الدالة delete لـ ${storeName}:`, error);
            throw error;
        }
    }
                }
