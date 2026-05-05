'use client';

import { useState, useEffect } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps';

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setIsLoaded(true))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Google Maps の読み込みに失敗しました');
      });
  }, []);

  return { isLoaded, error };
}
