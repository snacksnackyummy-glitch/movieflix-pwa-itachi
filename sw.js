const CACHE_NAME = 'movieflix-cache-v1.1';
const API_CACHE_NAME = 'movieflix-api-cache-v1.1';

// App Shell - Zaroori files jo offline available honi chahiye
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.plyr.io/3.7.8/plyr.css',
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
  'https://cdn.plyr.io/3.7.8/plyr.js',
  'https://cdn.jsdelivr.net/npm/hls.js@latest',
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js'
  // Yahan aap apne app ka logo ya koi default image bhi daal sakte hain
];

// Install event: Service worker install hone par cache create hota hai
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened core cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event: Purane cache ko delete karta hai
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Har network request ko intercept karta hai
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Google Sheets API ke liye: Network first, then cache
  if (requestUrl.hostname === 'sheets.googleapis.com') {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(cache => {
        return fetch(event.request)
          .then(response => {
            // Agar response sahi hai, to cache mein daal do
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Agar network fail ho jaye, to cache se response do
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // Baaki sabhi requests ke liye: Cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Agar cache mein response hai, to wahi return kar do
        if (response) {
          return response;
        }
        // Agar nahi hai, to network se fetch karo
        return fetch(event.request).then(
          (response) => {
            // Response ko cache mein daalne se pehle check karlo
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});