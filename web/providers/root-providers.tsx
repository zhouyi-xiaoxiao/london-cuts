"use client";

import type { PropsWithChildren } from "react";

import { DemoStoreProvider } from "@/providers/demo-store-provider";

export function RootProviders({ children }: PropsWithChildren) {
  return <DemoStoreProvider>{children}</DemoStoreProvider>;
}
