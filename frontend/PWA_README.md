# PWA & Mobile Optimization Guide

## Enabling Full PWA Support

1. **Install dependencies (after npm is available):**
   ```sh
   npm install vite-plugin-pwa --save-dev
   ```
2. **Vite Config:**
   - Ensure `vite.config.ts` includes `vite-plugin-pwa` with manifest and Workbox settings.
3. **Manifest:**
   - `manifest.webmanifest` should include name, icons, orientation, display, shortcuts, etc.
4. **Service Worker:**
   - Use `vite-plugin-pwa` for auto-generation, or place a custom `sw.js` in `public/` for basic offline support.
5. **Testing:**
   - Use Chrome DevTools > Lighthouse to test installability and offline support.
   - Test on real devices and emulators.

## Manual Service Worker (Basic Example)
Create `public/sw.js`:
```js
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
```

## Mobile UX Best Practices
- Use Tailwind responsive classes (`sm:`, `md:`, `lg:`) for all layouts.
- Ensure all buttons, cards, and inputs are at least 40px tall for touch.
- Use `overflow-x-auto` for wide tables/charts.
- Add `touch-action: manipulation;` to `body` or global CSS.
- Test all flows on mobile and tablet.

## After npm is available
- Run `npm install`
- Rebuild Docker image or run locally
- Full PWA and offline support will be enabled 