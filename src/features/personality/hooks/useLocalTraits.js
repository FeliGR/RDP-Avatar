import { useEffect, useState } from "react";

const useLocalTraits = (contextTraits) => {
  const [localTraits, setLocalTraits] = useState({});
  useEffect(() => {
    if (contextTraits) {
      setLocalTraits(contextTraits);
    }
  }, [contextTraits]);
  const updateLocalTrait = (trait, value) => {
    setLocalTraits((prev) => ({
      ...prev,
      [trait]: typeof value === "number" ? value : parseInt(value, 10),
    }));
  };
  return [localTraits, updateLocalTrait];
};

export default useLocalTraits;
