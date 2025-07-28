// src/hooks/useAgeAdaptation.ts
import { useMemo } from 'react';

export type InterfaceMode = 'child' | 'teen' | 'adult';

export interface AgeAdaptation {
  mode: InterfaceMode;
  fontSize: {
    small: number;
    medium: number;
    large: number;
  };
  touchTargetSize: number;
  animationSpeed: 'slow' | 'normal' | 'fast';
  colorContrast: 'normal' | 'high';
  simplificationLevel: 'low' | 'medium' | 'high';
}

const childAdaptation: AgeAdaptation = {
  mode: 'child',
  fontSize: { small: 16, medium: 20, large: 28 },
  touchTargetSize: 48,
  animationSpeed: 'slow',
  colorContrast: 'high',
  simplificationLevel: 'high',
};

const teenAdaptation: AgeAdaptation = {
  mode: 'teen',
  fontSize: { small: 14, medium: 18, large: 24 },
  touchTargetSize: 40,
  animationSpeed: 'normal',
  colorContrast: 'normal',
  simplificationLevel: 'medium',
};

const adultAdaptation: AgeAdaptation = {
  mode: 'adult',
  fontSize: { small: 12, medium: 16, large: 20 },
  touchTargetSize: 32,
  animationSpeed: 'fast',
  colorContrast: 'normal',
  simplificationLevel: 'low',
};

export const useAgeAdaptation = (age: number): AgeAdaptation => {
  const adaptation = useMemo(() => {
    if (age <= 9) {
      return childAdaptation;
    }
    if (age <= 16) {
      return teenAdaptation;
    }
    return adultAdaptation;
  }, [age]);

  return adaptation;
};