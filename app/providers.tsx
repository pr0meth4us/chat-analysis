'use client';

import { AppContextProvider } from '@/context/AppContext';
import React from "react";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return <AppContextProvider>{children}</AppContextProvider>;
}
