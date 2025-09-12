// sw.js
const CACHE_NAME = "nec-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/login.html",
  "/styles.css",
  "/main.js",
  "/scripts.js",
  "/nec.png",
  "/nec-191.png",
  "/nec-192 copy.png",
  "/nec-193.png",
  "/nec-194.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Bypass Firebase API requests
  if (
    url.includes("firestore.googleapis.com") ||
    url.includes("identitytoolkit.googleapis.com")
  ) {
    return; // let these requests go directly to network
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          // fallback if offline
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }
        })
      );
    })
  );
});
