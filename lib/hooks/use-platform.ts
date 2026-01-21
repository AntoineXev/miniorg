'use client';

import { usePlatform as usePlatformContext } from '@/providers/platform-provider';

/**
 * Hook pour accéder aux informations de plateforme
 * 
 * @example
 * ```tsx
 * const { isTauri, isWeb, isReady } = usePlatform();
 * 
 * if (isTauri) {
 *   // Code spécifique à Tauri
 * }
 * ```
 */
export const usePlatform = () => {
  return usePlatformContext();
};
