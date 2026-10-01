"use client";

import { useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";

/** Shared motion tokens so every section moves with the same feel. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
/** Critically damped: settles fast with no overshoot. */
export const SPRING = { type: "spring", stiffness: 220, damping: 30 } as const;


const noopSubscribe = () => () => {};

/** True after hydration; false on the server and the first client render. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/**
 * framer's useReducedMotion() is null on the server and true/false on the
 * client's first render. Only trust it after hydration so the server and
 * client render the same tree.
 */
export function useCalm() {
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  return hydrated && Boolean(reduce);
}
