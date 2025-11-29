// إدارة قاعدة البيانات
class DatabaseManager {
    static dbName = 'ShamsinPoultryDB';
    static version = 1;
    static db = null;

    static async getDB() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // جدول الدفعات
                if (!db.objectStoreNames.contains('batches')) {
                    const batchStore = db.createObjectStore('batches', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    batchStore.createIndex('status', 'status', { unique: false });
                    batchStore.createIndex('startDate', 'startDate', { unique: false });
                }

                // جدول المعاملات المالية
                if (!db.objectStoreNames.contains('transactions')) {
                    const transactionStore = db.createObjectStore('transactions', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    transactionStore.createIndex('type', 'type', { unique: false });
                    transactionStore.createIndex('date', 'date', { unique: false });
                    transactionStore.createIndex('category', 'category', { unique: false });
                }

                // جدول المخزون
                if (!db.objectStoreNames.contains('inventory')) {
                    const inventoryStore = db.createObjectStore('inventory', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    inventoryStore.createIndex('category', 'category', { unique: false });
                    inventoryStore.createIndex('quantity', 'quantity', { unique: false });
                }

                // جدول التسجيلات اليومية
                if (!db.objectStoreNames.contains('dailyRecords')) {
                    const dailyStore = db.createObjectStore('dailyRecords', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    dailyStore.createIndex('batchId', 'batchId', { unique: false });
                    dailyStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }

    static async add(storeName, data) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async getAll(storeName, index = null, query = null) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const target = index ? store.index(index) : store;
            const request = query ? target.getAll(query) : target.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async get(storeName, key) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async update(storeName, key, data) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ ...data, id: key });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async delete(storeName, key) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
                      } 
