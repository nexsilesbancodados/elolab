import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGlobalErrorTracking } from "./lib/errorTracking";
import { initWebVitals } from "./lib/webVitals";

const CACHE_RESET_PARAM = "cache_reset";
const CACHE_RESET_DONE = "elolab-cache-reset-done";

const clearLegacyCaches = async () => {
  if (!("caches" in window)) return;

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
};

const unregisterServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
};

const bootstrapApp = async () => {
  const url = new URL(window.location.href);
  const alreadyReset =
    sessionStorage.getItem(CACHE_RESET_DONE) === "1" ||
    url.searchParams.get(CACHE_RESET_PARAM) === "1";

  if (!alreadyReset) {
    await Promise.all([clearLegacyCaches(), unregisterServiceWorkers()]);
    sessionStorage.setItem(CACHE_RESET_DONE, "1");
    url.searchParams.set(CACHE_RESET_PARAM, "1");
    window.location.replace(url.toString());
    return;
  }

  if (url.searchParams.has(CACHE_RESET_PARAM)) {
    url.searchParams.delete(CACHE_RESET_PARAM);
    const sanitizedSearch = url.searchParams.toString();
    const nextUrl = `${url.pathname}${sanitizedSearch ? `?${sanitizedSearch}` : ""}${url.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }

  // Initialize global error tracking and performance monitoring
  initGlobalErrorTracking();
  initWebVitals();

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

void bootstrapApp();
