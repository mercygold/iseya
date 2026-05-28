"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  platforms: string[];
  userChoice: Promise<BeforeInstallPromptChoice>;
  prompt: () => Promise<void>;
}

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const canRegisterServiceWorker =
      window.location.protocol === "https:" || window.location.hostname === "localhost";

    if (canRegisterServiceWorker) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability should fail quietly rather than interrupt the public page.
      });
    }
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setVisible(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function installApp() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible || !deferredPrompt) return null;

  return (
    <aside
      aria-label="Install ISEYA app"
      className="fixed inset-x-4 bottom-4 z-[65] mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgb(0_14_47_/_0.14)] sm:flex sm:items-center sm:justify-between sm:gap-5"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
          Install ISEYA
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Add ISEYA to your home screen for faster access to your career workspace.
        </p>
      </div>
      <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)]"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={() => void installApp()}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)]"
        >
          Install
        </button>
      </div>
    </aside>
  );
}
