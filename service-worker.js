// sw/service-worker/activate_event.ts
async function activate_event(event) {
  console.log("activate_event...", serviceWorker_sharedVars.appVersion_);
}

// sw/service-worker/fetch_event.ts
async function fetch_event(fetchEvent) {
  return fetchEvent.respondWith(fetchHelper(fetchEvent));
}
async function fetchHelper(fetchEvent) {
  const mainCache = await caches.open(serviceWorker_sharedVars.mainCacheName);
  const response = await mainCache.match(fetchEvent.request, {});
  if (response)
    return response;
  return fetch(fetchEvent.request);
}

// sw/service-worker/install_event.ts
var serviceWorker = self;
async function install_event(event) {
  console.log("install...", serviceWorker_sharedVars.appVersion_);
  return event.waitUntil(cacheAll());
}
async function cacheAll() {
  serviceWorker.skipWaiting();
}

// sw/service-worker/message_event.ts
async function message_event(event) {
  console.log("message");
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
    return;
  }
  if (event.data.action === "getVersion") {
    event.source?.postMessage({ action: "getVersion", payload: serviceWorker_sharedVars.appVersion_ });
    return;
  }
}

// sw/service-worker/index.ts
var serviceWorker2 = self;

class serviceWorker_sharedVars {
  static appVersion_ = 1;
  static allNecessaryFiles_replacer = ["allNecessaryFiles_replacer"];
  static mainCacheName = "AzCacheStorage";
  static mainCacheName_onWait = this.mainCacheName + "_onWait";
}
serviceWorker2.addEventListener("install", install_event);
serviceWorker2.addEventListener("activate", activate_event);
serviceWorker2.addEventListener("message", message_event);
serviceWorker2.addEventListener("fetch", fetch_event);
 {
  serviceWorker_sharedVars
};
