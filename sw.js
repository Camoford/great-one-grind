// sw.js
// Minimal service worker for dev stability.
// Prevents noisy CORS errors caused by trying to cache remote CDN assets (e.g., cdn.tailwindcss.com).
// This SW does not intercept fetch; it simply activates and stays out of the way.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Do NOT intercept fetch in dev. Let the browser handle network requests normally.
self.addEventListener("fetch", () => {});
