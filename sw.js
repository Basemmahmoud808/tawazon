/* ═══════════════════════════════════════════════════════════════════════════
   توازن — Service Worker
   يتيح العمل بدون إنترنت ويخزن الموارد الأساسية في الـ Cache
   ═══════════════════════════════════════════════════════════════════════════ */

const CACHE_NAME = "tawazon-v2";

// الموارد الأساسية التي يجب تخزينها فوراً عند التثبيت
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// ─── Install: تخزين الموارد الأساسية ─────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch(() => {
        // لا نوقف التثبيت لو فشل تحميل بعض الموارد
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate: حذف الـ Cache القديمة ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: استراتيجية Network First مع Fallback للـ Cache ──────────────────
self.addEventListener("fetch", (event) => {
  // نتجاهل طلبات غير GET أو طلبات الـ APIs الخارجية
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // نتجاهل Firebase وطلبات الـ APIs الخارجية — لا نخزنها
  if (
    url.hostname.includes("firebaseapp.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("ipify.org") ||
    url.hostname.includes("ipapi.co") ||
    url.hostname.includes("aladhan.com") ||
    url.hostname.includes("framerusercontent.com")
  ) {
    return;
  }

  event.respondWith(
    // Network First: نحاول الشبكة أولاً
    fetch(event.request)
      .then((response) => {
        // نخزن الاستجابة الناجحة في الـ Cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // إذا فشلت الشبكة، نرجع من الـ Cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // للتنقل بين الصفحات، نرجع index.html كـ SPA fallback
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return new Response("غير متاح offline", { status: 503 });
        });
      })
  );
});
