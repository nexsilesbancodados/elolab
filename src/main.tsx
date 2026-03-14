import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGlobalErrorTracking } from "./lib/errorTracking";
import { initWebVitals } from "./lib/webVitals";

// Initialize global error tracking and performance monitoring
initGlobalErrorTracking();
initWebVitals();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
