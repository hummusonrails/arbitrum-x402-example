"use client";

import { useEffect, useState } from "react";

// Guards wagmi-dependent UI against SSR hydration mismatches (server has no wallet).
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
