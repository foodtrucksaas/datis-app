"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { getSettings, updateSettings } from "@/lib/store";

interface FirstLaunchDisclaimerProps {
  /** Force-open even if already accepted (for re-reading from banner click) */
  forceOpen?: boolean;
  onClose?: () => void;
}

export function FirstLaunchDisclaimer({
  forceOpen = false,
  onClose,
}: FirstLaunchDisclaimerProps) {
  const [visible, setVisible] = useState(false);
  const [canAccept, setCanAccept] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (forceOpen) {
      setVisible(true);
    } else {
      const settings = getSettings();
      if (!settings.disclaimerAccepted) {
        setVisible(true);
      }
    }
  }, [forceOpen]);

  useEffect(() => {
    if (!visible) return;

    setCanAccept(false);
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanAccept(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleAccept = useCallback(() => {
    if (!canAccept) return;
    updateSettings({ disclaimerAccepted: true });
    setVisible(false);
    onClose?.();
  }, [canAccept, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0 text-[var(--warning-text)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Avertissement important
          </h2>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            Ce service affiche des D-ATIS reçus via le réseau communautaire
            ACARS (airframes.io). Les données peuvent être obsolètes,
            incomplètes ou erronées.
          </p>
          <p className="font-semibold text-[var(--text-primary)]">
            Ce service ne doit jamais être utilisé en cadre opérationnel.
          </p>
          <p>
            Il ne remplace pas le D-ATIS officiel reçu en cockpit, l&apos;ATIS
            voix VHF, ni les briefings de votre compagnie. Pour la préparation
            de vol et la conduite de vol, consultez exclusivement les sources
            officielles.
          </p>
        </div>

        <div className="mt-6">
          <button
            disabled={!canAccept}
            onClick={handleAccept}
            className="w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors
              disabled:cursor-not-allowed disabled:bg-[var(--surface-elevated)] disabled:text-[var(--text-muted)]
              enabled:bg-[var(--accent)] enabled:text-[var(--bg)] enabled:hover:bg-[var(--accent-dim)]"
          >
            {canAccept
              ? "J'ai compris et j'accepte"
              : `J'ai compris et j'accepte (${countdown}s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
