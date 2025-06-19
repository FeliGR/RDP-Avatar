import { useState, useEffect } from "react";

export const useBabylonJS = () => {
  const [BABYLON, setBabylon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadBabylon = async () => {
      if (BABYLON) return;
      setIsLoading(true);
      setError(null);
      try {
        const [babylonCore] = await Promise.all([import("babylonjs"), import("babylonjs-loaders")]);
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
