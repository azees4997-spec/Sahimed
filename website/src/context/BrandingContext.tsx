'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

interface BrandingContextType {
  logoSettings: any;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  logoSettings: null,
  isLoading: true,
});

export function BrandingProvider({
  children,
  initialLogoSettings,
}: {
  children: React.ReactNode;
  initialLogoSettings: any;
}) {
  const [logoSettings, setLogoSettings] = useState<any>(initialLogoSettings);
  const [isLoading, setIsLoading] = useState(!initialLogoSettings);

  const db = useFirestore();
  const docRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'logo') : null), [db]);
  const { data: latestSettings } = useDoc(docRef);

  useEffect(() => {
    if (latestSettings) {
      setLogoSettings(latestSettings);
      setIsLoading(false);
    }
  }, [latestSettings]);

  return (
    <BrandingContext.Provider value={{ logoSettings, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
