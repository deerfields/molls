self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('mallos-cache-v1').then(cache => cache.addAll([
      '/',
      '/index.html',
      '/manifest.webmanifest',
      // Add more assets as needed
    ]))
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
}); 