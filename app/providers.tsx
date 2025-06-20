'use client';

import { AppContextProvider } from '@/context/AppContext';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return <AppContextProvider>{children}</AppContextProvider>;
}
