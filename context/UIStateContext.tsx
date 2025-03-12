import React, { createContext, useContext, useState, ReactNode } from 'react';

type UIStateContextType = {
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
};

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export function UIStateProvider({ children }: { children: ReactNode }) {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  const setTabBarVisible = (visible: boolean) => {
    setIsTabBarVisible(visible);
  };

  return (
    <UIStateContext.Provider value={{ isTabBarVisible, setTabBarVisible }}>
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
} 