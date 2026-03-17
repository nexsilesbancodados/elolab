import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGlobalErrorTracking } from "./lib/errorTracking";
import { initWebVitals } from "./lib/webVitals";

const CACHE_RESET_PARAM = "cache_reset";
const CACHE_BUILD_KEY = "elolab-build-id";
const APP_BUILD_ID =
  (globalThis as typeof globalThis & { __APP_BUILD_ID__?: string }).__APP_BUILD_ID__ ??
  "dev-build";

const getStoredBuildId = () => {
  try {
    return localStorage.getItem(CACHE_BUILD_KEY) ?? sessionStorage.getItem(CACHE_BUILD_KEY);
  } catch {
    return sessionStorage.getItem(CACHE_BUILD_KEY);
  }
};

const persistBuildId = (buildId: string) => {
  try {
    localStorage.setItem(CACHE_BUILD_KEY, buildId);
  } catch {
    // Ignore storage restrictions and keep a session fallback
  }

  sessionStorage.setItem(CACHE_BUILD_KEY, buildId);
};

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
  const resetParamActive = url.searchParams.get(CACHE_RESET_PARAM) === "1";
  const storedBuildId = getStoredBuildId();
  const shouldResetForBuild = storedBuildId !== APP_BUILD_ID && !resetParamActive;

  if (shouldResetForBuild) {
    await Promise.all([clearLegacyCaches(), unregisterServiceWorkers()]);
    persistBuildId(APP_BUILD_ID);
    url.searchParams.set(CACHE_RESET_PARAM, "1");
    window.location.replace(url.toString());
    return;
  }

  if (resetParamActive) {
    url.searchParams.delete(CACHE_RESET_PARAM);
    const sanitizedSearch = url.searchParams.toString();
    const nextUrl = `${url.pathname}${sanitizedSearch ? `?${sanitizedSearch}` : ""}${url.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }

  if (storedBuildId !== APP_BUILD_ID) {
    persistBuildId(APP_BUILD_ID);
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
