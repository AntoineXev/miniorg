'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isTauri, isWeb } from '@/lib/platform';

interface PlatformContextValue {
  isTauri: boolean;
  isWeb: boolean;
  isReady: boolean;
}

const PlatformContext = createContext<PlatformContextValue>({
  isTauri: false,
  isWeb: true,
  isReady: false,
});

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within PlatformProvider');
  }
  return context;
};

interface PlatformProviderProps {
  children: ReactNode;
}

/**
 * Provider qui détecte la plateforme (Tauri vs Web) et applique les classes CSS appropriées
 * 
 * Ajoute automatiquement :
 * - `platform-tauri` sur le body si l'app tourne sur Tauri
 * - `platform-web` sur le body si l'app tourne sur le Web
 * - `platform-ready` une fois la détection terminée
 */
export function PlatformProvider({ children }: PlatformProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [platformState, setPlatformState] = useState({
    isTauri: false,
    isWeb: true,
  });

  useEffect(() => {
    // Détection côté client uniquement
    const tauriDetected = isTauri();
    const webDetected = isWeb();

    setPlatformState({
      isTauri: tauriDetected,
      isWeb: webDetected,
    });

    // Appliquer les classes CSS sur le body
    if (typeof document !== 'undefined') {
      const body = document.body;
      
      // Retirer les anciennes classes si présentes
      body.classList.remove('platform-tauri', 'platform-web', 'platform-ready');
      
      // Ajouter la classe appropriée
      if (tauriDetected) {
        body.classList.add('platform-tauri');
      } else {
        body.classList.add('platform-web');
      }
      
      // Marquer comme prêt
      body.classList.add('platform-ready');
      setIsReady(true);
    }
  }, []);

  return (
    <PlatformContext.Provider
      value={{
        isTauri: platformState.isTauri,
        isWeb: platformState.isWeb,
        isReady,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}
