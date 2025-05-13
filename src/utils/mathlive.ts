export function renderMathInNode(node: HTMLElement) {
  if (!node) return;
  const latex = node.getAttribute('data-latex') ?? '';
  console.log('renderMathInNode called. MathLive:', !!window.MathLive, 'customElements:', !!customElements.get('math-field'));
  
  // Always set the neutral style for the parent span
  node.style.background = '#f3f4f6';
  node.style.border = '1px solid #d1d5db';
  node.style.padding = '2px 4px';
  node.style.borderRadius = '3px';
  node.style.cursor = 'pointer';

  if (
    typeof window === 'undefined' ||
    !window.MathLive ||
    !customElements.get('math-field')
  ) {
    node.textContent = latex;
    return;
  }
  if (node.firstElementChild?.tagName?.toLowerCase() === 'math-field') return;
  const mf = document.createElement('math-field') as HTMLElement & {
    value: string;
    setOptions?: (opts: Record<string, unknown>) => void;
  };
  mf.value = latex;
  mf.setAttribute('readonly', 'true');
  mf.setAttribute('virtual-keyboard-mode', 'off');
  mf.setAttribute('style', 'border:none;padding:0;background:none;');
  (mf as any).setOptions?.({ readOnly: true, virtualKeyboardMode: 'off' });
  node.textContent = '';
  node.appendChild(mf);
  console.log('Appended math-field:', mf, 'to', node);
} 