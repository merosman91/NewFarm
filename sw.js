const CACHE_NAME = 'shamsin-poultry-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/db.js',
    '/js/batches.js',
    '/js/finance.js',
    '/js/inventory.js',
    '/js/reports.js',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-144x144.png'
];

// التثبيت
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

// التفاعل مع الطلبات
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // إرجاع الملف من الكاش إذا موجود، أو طلبه من الشبكة
                return response || fetch(event.request);
            }
        )
    );
});
