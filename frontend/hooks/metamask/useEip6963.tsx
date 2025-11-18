"use client";

import { useEffect, useState } from "react";

type EIP6963ProviderDetail = {
  info: { uuid: string; name: string; icon?: string; rdns?: string };
  provider: any;
};

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<EIP6963ProviderDetail>;
  }
}

export function useEip6963() {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const providerDetails: EIP6963ProviderDetail[] = [];

    function onAnnouncement(event: WindowEventMap["eip6963:announceProvider"]) {
      providerDetails.push(event.detail);
      setProviders([...providerDetails]);
    }

    window.addEventListener("eip6963:announceProvider", onAnnouncement);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnouncement);
    };
  }, []);

  return { providers, error } as const;
}


