// MathLiveScript.tsx
"use client";

import { useEffect } from "react";

/**
 * A very small helper component that guarantees the MathLive script is loaded
 * exactly once, exposes `window.mathLiveReadyState` ("loading" | "ready" |
 * "failed"), registers the `<math-field>` web‑component, and emits either
 * the `mathlive-ready` or `mathlive-failed` events.
 */

declare global {
  interface Window {
    mathLiveReadyState?: "loading" | "ready" | "failed";
    MathLive?: any;
  }
}

const SCRIPT_SRC =
  "https://unpkg.com/mathlive@0.91.0/dist/mathlive.min.js"; // pin to a stable version

export default function MathLiveScript() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already loaded successfully
    if (window.mathLiveReadyState === "ready") return;

    // Already loading — nothing to do
    if (window.mathLiveReadyState === "loading") return;

    // Mark as loading
    window.mathLiveReadyState = "loading";

    /**
     * Helper to finish the setup once the script is on the page.
     */
    const finish = () => {
      try {
        if (!customElements.get("math-field") && window.MathLive) {
          customElements.define(
            "math-field",
            window.MathLive.MathfieldElement
          );
        }
        window.mathLiveReadyState = "ready";
        window.dispatchEvent(new Event("mathlive-ready"));
        console.log("[MathLiveScript] MathLive ready");
      } catch (err) {
        console.error("[MathLiveScript] Registration error:", err);
        fail();
      }
    };

    const fail = () => {
      window.mathLiveReadyState = "failed";
      window.dispatchEvent(new Event("mathlive-failed"));
      console.error("[MathLiveScript] Failed to load MathLive");
    };

    // If the script tag already exists in DOM, reuse it
    const existing = document.querySelector(
      `script[src="${SCRIPT_SRC}"]`
    ) as HTMLScriptElement | null;

    if (existing) {
      if (existing.hasAttribute("data-loaded")) {
        // Script previously loaded
        finish();
      } else {
        existing.addEventListener("load", finish);
        existing.addEventListener("error", fail);
      }
      return;
    }

    // Otherwise, create and append the script
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;

    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      finish();
    };

    script.onerror = fail;

    document.body.appendChild(script);
  }, []);

  // Renders nothing – it only manages side‑effects.
  return null;
}