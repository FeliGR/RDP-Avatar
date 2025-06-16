import { useState, useEffect } from 'react';

/**
 * Hook to dynamically load Babylon.js only when needed
 * This helps reduce the initial bundle size
 */
export const useBabylonJS = () => {
  const [BABYLON, setBabylon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadBabylon = async () => {
      if (BABYLON) return; // Already loaded
      
      setIsLoading(true);
      setError(null);

      try {
        // Dynamic import of Babylon.js
        const [babylonCore] = await Promise.all([
          import('babylonjs'),
          import('babylonjs-loaders') // Still needed for loaders, but not stored
        ]);

        if (mounted) {
          setBabylon(babylonCore);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    loadBabylon();

    return () => {
      mounted = false;
    };
  }, [BABYLON]);

  return { BABYLON, isLoading, error };
};
