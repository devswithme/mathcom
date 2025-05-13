"use client";

import React, { useEffect, useRef } from 'react';

/**
 * Ensure the <math-field> custom element is registered once MathLive is on window.
 * If MathLive isn't available yet, we listen for the `mathlive-ready` event that
 * MathLiveScript dispatches and register it then.
 */
function registerMathField() {
  if (typeof window !== 'undefined' &&
      window.MathLive &&
      !customElements.get('math-field')) {
    customElements.define('math-field', window.MathLive.MathfieldElement);
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
  interface Window {
    MathLive?: any;
    mathLiveReady?: boolean;
  }
}

interface MathLiveFieldProps {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  className?: string;
}

const MathLiveField: React.FC<MathLiveFieldProps> = ({ value, onChange, placeholder = '', className = '' }) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    registerMathField();                 // <‑‑ NEW

    if (!ref.current) return;
    const el = ref.current;
    if (window.MathLive && el.value !== value) {
      el.value = value;
    }
    const handleInput = () => onChange(el.value);
    el.addEventListener('input', handleInput);
    return () => el.removeEventListener('input', handleInput);
  }, [value, onChange]);

  useEffect(() => {
    if (!ref.current || !window.MathLive) return;
    // Optionally, you can set options here
  }, []);

  return (
    <>
      {/* @ts-expect-error – custom element defined via global augmentation */}
      <math-field
        ref={ref}
        value={value}
        placeholder={placeholder}
        className={className}
        style={{ width: '100%', minHeight: '1.5em', fontSize: '1em' }}
      />
    </>
  );
};

export default MathLiveField;