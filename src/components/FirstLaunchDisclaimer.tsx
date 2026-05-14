"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { getSettings, updateSettings } from "@/lib/store";

interface FirstLaunchDisclaimerProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function FirstLaunchDisclaimer({
  forceOpen = false,
  onClose,
}: FirstLaunchDisclaimerProps) {
  const [visible, setVisible] = useState(false);

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

  const handleAccept = useCallback(() => {
    updateSettings({ disclaimerAccepted: true });
    setVisible(false);
    onClose?.();
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-white/10 bg-[#131820] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">
            Avertissement important
          </h2>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-white/70">
          <p>
            Ce service affiche des D-ATIS reçus via le réseau communautaire
            ACARS (airframes.io). Les données peuvent être obsolètes,
            incomplètes ou erronées.
          </p>
          <p className="font-semibold text-white">
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
            onClick={handleAccept}
            className="w-full rounded-md bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-400"
          >
            J&apos;ai compris et j&apos;accepte
          </button>
        </div>
      </div>
    </div>
  );
}
