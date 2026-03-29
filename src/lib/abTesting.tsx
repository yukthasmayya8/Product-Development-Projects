import React, { useState, useEffect } from 'react';

type Variant = 'A' | 'B';

interface ABTestProps {
  experimentId: string;
  variants: {
    A: React.ReactNode;
    B: React.ReactNode;
  };
}

export function useABTest(experimentId: string): Variant {
  const [variant, setVariant] = useState<Variant>('A');

  useEffect(() => {
    const stored = localStorage.getItem(`ab_test_${experimentId}`);
    if (stored === 'A' || stored === 'B') {
      setVariant(stored as Variant);
    } else {
      const selected = Math.random() < 0.5 ? 'A' : 'B';
      localStorage.setItem(`ab_test_${experimentId}`, selected);
      setVariant(selected);
    }
  }, [experimentId]);

  return variant;
}

export const getVariant = (experimentId: string, variants: Variant[] = ['A', 'B']): Variant => {
  if (typeof window === 'undefined') return variants[0];
  const stored = localStorage.getItem(`ab_test_${experimentId}`);
  if (stored === 'A' || stored === 'B') {
    return stored as Variant;
  }
  const selected = Math.random() < 0.5 ? 'A' : 'B';
  localStorage.setItem(`ab_test_${experimentId}`, selected);
  return selected;
};

export const ABTest = ({ experimentId, variants }: ABTestProps) => {
  const variant = useABTest(experimentId);
  return <>{variants[variant]}</>;
};
