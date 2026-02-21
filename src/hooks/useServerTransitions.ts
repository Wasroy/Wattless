import { useState, useCallback, useRef, useEffect } from "react";
import type { ActiveTransition } from "@/data/types";

export const useServerTransitions = () => {
  const [activeTransitions, setActiveTransitions] = useState<ActiveTransition[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Ajouter une nouvelle transition
  const addTransition = useCallback((from: string, to: string, duration: number = 2000, savings?: number) => {
    const transition: ActiveTransition = {
      from,
      to,
      timestamp: Date.now(),
      duration,
      savings,
    };

    const key = `${from}-${to}-${transition.timestamp}`;

    setActiveTransitions((prev) => {
      // Vérifier si cette transition existe déjà
      const exists = prev.some(
        (t) => t.from === from && t.to === to && Math.abs(t.timestamp - transition.timestamp) < 100
      );
      if (exists) return prev;
      return [...prev, transition];
    });

    // Retirer automatiquement après la durée
    const timeout = setTimeout(() => {
      setActiveTransitions((prev) =>
        prev.filter((t) => !(t.from === from && t.to === to && t.timestamp === transition.timestamp))
      );
      timeoutRefs.current.delete(key);
    }, duration);

    timeoutRefs.current.set(key, timeout);
  }, []);

  // Nettoyer les timeouts au démontage
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // Vérifier si un serveur est actif dans une transition
  const isServerActive = useCallback(
    (serverName: string): boolean => {
      return activeTransitions.some((t) => t.from === serverName || t.to === serverName);
    },
    [activeTransitions]
  );

  // Obtenir la transition entre deux serveurs
  const getTransition = useCallback(
    (from: string, to: string): ActiveTransition | null => {
      return (
        activeTransitions.find((t) => t.from === from && t.to === to) ||
        activeTransitions.find((t) => t.from === to && t.to === from) ||
        null
      );
    },
    [activeTransitions]
  );

  return {
    activeTransitions,
    addTransition,
    isServerActive,
    getTransition,
  };
};
