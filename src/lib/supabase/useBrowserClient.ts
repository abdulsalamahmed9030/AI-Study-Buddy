"use client";

import { useMemo } from "react";
import { createSupabaseBrowserClient } from "./browser";

export function useSupabase() {
  return useMemo(() => createSupabaseBrowserClient(), []);
}
