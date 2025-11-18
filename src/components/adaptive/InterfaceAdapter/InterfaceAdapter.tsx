// src/components/adaptive/InterfaceAdapter/InterfaceAdapter.tsx
import React, { createContext, useContext } from 'react';
import { useAgeAdaptation, AgeAdaptation } from '../../../hooks/useAgeAdaptation';

const AdaptationContext = createContext<AgeAdaptation | null>(null);

export const useAdaptation = () => {
  const context = useContext(AdaptationContext);
  if (!context) {
    throw new Error('useAdaptation must be used within an InterfaceAdapter');
  }
  return context;
};

interface InterfaceAdapterProps {
  userAge: number;
  children: React.ReactNode;
}

export const InterfaceAdapter: React.FC<InterfaceAdapterProps> = ({ userAge, children }) => {
  const adaptation = useAgeAdaptation(userAge);

  return (
    <AdaptationContext.Provider value={adaptation}>
      {children}
    </AdaptationContext.Provider>
  );
};