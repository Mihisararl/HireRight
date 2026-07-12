import React, { createContext, useContext, useMemo, useState } from 'react';

const PublicNavContext = createContext(null);

export function PublicNavProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const value = useMemo(
    () => ({
      sidebarOpen,
      openSidebar: () => setSidebarOpen(true),
      closeSidebar: () => setSidebarOpen(false),
      toggleSidebar: () => setSidebarOpen((open) => !open),
    }),
    [sidebarOpen]
  );

  return (
    <PublicNavContext.Provider value={value}>
      {children}
    </PublicNavContext.Provider>
  );
}

export function usePublicNav() {
  const context = useContext(PublicNavContext);
  if (!context) {
    throw new Error('usePublicNav must be used within PublicNavProvider');
  }
  return context;
}
