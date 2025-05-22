// public/service-worker.js
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Optional: Caching assets during installation
  // event.waitUntil(
  //   caches.open('tradeflow-cache-v1').then(cache => {
  //     return cache.addAll([
  //       // '/', // Example: Cache the main page if it's static
  //       // Add other assets to cache here if needed
  //     ]);
  //   })
  // );
  self.skipWaiting(); // Ensures the new service worker activates immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Optional: Clean up old caches
  // event.waitUntil(
  //   caches.keys().then(cacheNames => {
  //     return Promise.all(
  //       cacheNames.map(cacheName => {
  //         if (cacheName !== 'tradeflow-cache-v1') { // Replace with your current cache name
  //           return caches.delete(cacheName);
  //         }
  //       })
  //     );
  //   })
  // );
  return self.clients.claim(); // Allows the activated service worker to take control of the page immediately
});

self.addEventListener('fetch', (event) => {
  // This is a basic pass-through fetch handler.
  // You can implement caching strategies here if needed.
  // For example, cache-first, network-first, or stale-while-revalidate.
  // console.log('Service Worker: Fetching', event.request.url);
  // event.respondWith(fetch(event.request)); // Default behavior: fetch from network
});

// This event listener is for handling push notifications from a server.
// The current app uses client-side `registration.showNotification`,
// so this 'push' event won't be triggered by that mechanism.
// It's included for completeness if server-side push is added later.
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');
  const data = event.data ? event.data.json() : { 
    title: 'TradeFlow Alert', 
    body: 'You have a new notification.', 
    icon: '/favicon.ico' // Path to a default icon
  };
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge, // Optional: URL of an image for the badge
    // ... other notification options
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
