'use client';

import React from 'react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { TabProvider } from '@/lib/context/TabContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TabProvider>
          {children}
        </TabProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
