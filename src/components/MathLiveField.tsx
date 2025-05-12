'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

// Declare the MathfieldElement type
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface MathfieldElement extends HTMLElement {
  value: string;
  setValue(value: string): void;
  executeCommand(command: string): void;
}

// Register the web component
if (typeof window !== 'undefined') {
  // Import mathlive dynamically to avoid SSR issues
  import('mathlive').then(({ MathfieldElement }) => {
    // Only register if not already registered
    if (!customElements.get('math-field')) {
      customElements.define('math-field', MathfieldElement);
    }
  }).catch(error => {
    console.error('Error loading MathLive:', error);
  });
}

interface MathLiveFieldProps {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  className?: string;
}

const MathLiveField: React.FC<MathLiveFieldProps> = ({
  value,
  onChange,
  placeholder = 'Type or click buttons to insert math',
  className = '',
}) => {
  const mathFieldRef = useRef<HTMLElement | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);

  // Initialize on client side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set up the MathField
  useEffect(() => {
    // Only run on client-side
    if (isClient && mathFieldRef.current) {
      const mathField = mathFieldRef.current as MathfieldElement;
      
      // Set initial value if provided
      if (value) {
        mathField.value = value;
      }
      
      // Configure the math field
      mathField.setAttribute('virtual-keyboard-mode', 'manual');
      mathField.setAttribute('virtual-keyboards', 'all');
      mathField.setAttribute('smart-mode', 'true');
      
      // Force light theme for the keyboard using attributes
      // Note: We need to use a more direct approach since the attribute isn't working
      mathField.setAttribute('virtual-keyboard-theme', 'light');
      mathField.setAttribute('theme', 'light');
      
      // Use any type assertion to set properties that TypeScript doesn't recognize
      (mathField as any).mathVirtualKeyboardPolicy = 'manual';
      (mathField as any).mathVirtualKeyboardTheme = 'light';
      
      // Fix spacing issues
      mathField.style.padding = '8px';
      mathField.style.lineHeight = '1.5';
      
      // Add custom CSS to fix the menu positioning and force light theme
      const style = document.createElement('style');
      style.textContent = `
        /* Force light theme for ALL keyboard elements */
        .ML__keyboard {
          background-color: white !important;
          color: black !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        
        /* Style all keyboard keys */
        .ML__keyboard-key {
          background-color: #f8fafc !important;
          color: black !important;
          border: 1px solid #e2e8f0 !important;
        }
        
        /* Hover state for keys */
        .ML__keyboard-key:hover {
          background-color: #f1f5f9 !important;
        }
        
        /* Active state for keys */
        .ML__keyboard-key:active {
          background-color: #e5e7eb !important;
        }
        
        /* Keyboard rows */
        .ML__keyboard-row {
          background-color: white !important;
        }
        
        /* Keyboard layer */
        .ML__keyboard-layer {
          background-color: white !important;
          color: black !important;
        }
        
        /* Keyboard shift keys */
        .ML__shift-key {
          background-color: #f8fafc !important;
          color: black !important;
        }
        
        /* Fix menu positioning for the three-lines button */
        .ML__popover {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          max-width: 90vw !important;
          max-height: 80vh !important;
          overflow: auto !important;
          z-index: 9999 !important;
          background-color: white !important;
          color: black !important;
        }
        
        /* Fix the menu display */
        .ML__menu {
          position: fixed !important;
          top: 40% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          max-width: 90vw !important;
          max-height: 80vh !important;
          overflow: auto !important;
          z-index: 9999 !important;
          background-color: white !important;
          color: black !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        
        /* Menu items */
        .ML__menu-item {
          background-color: white !important;
          color: black !important;
        }
        
        /* Menu item hover */
        .ML__menu-item:hover {
          background-color: #f1f5f9 !important;
        }
        
        /* Fix spacing issues */
        math-field {
          padding: 8px !important;
          line-height: 1.5 !important;
          font-size: 18px !important;
        }
        
        /* Ensure all text in the keyboard is visible */
        .ML__keyboard * {
          color: black !important;
        }
        
        /* Override any dark theme classes */
        .ML__keyboard.ML__keyboard--dark,
        .ML__keyboard-layer.ML__keyboard-layer--dark,
        .ML__keyboard-row.ML__keyboard-row--dark,
        .ML__keyboard-key.ML__keyboard-key--dark {
          background-color: white !important;
          color: black !important;
        }
      `;
      document.head.appendChild(style);
      
      // Add event listener for changes
      const handleInput = () => {
        onChange(mathField.value);
      };
      
      mathField.addEventListener('input', handleInput);
      
      // Clean up
      return () => {
        mathField.removeEventListener('input', handleInput);
        document.head.removeChild(style);
      };
    }
  }, [isClient, value, onChange]);

  // Configure MathField after it's mounted
  useEffect(() => {
    if (isClient && mathFieldRef.current) {
      // Apply configuration using attributes instead of setOptions
      const mathField = mathFieldRef.current;
      mathField.setAttribute('virtual-keyboard-mode', 'manual');
      mathField.setAttribute('virtual-keyboards', 'all');
      mathField.setAttribute('smart-mode', 'true');
      mathField.setAttribute('smart-fence', 'true');
      mathField.setAttribute('smart-superscript', 'true');
    }
  }, [isClient]);

  // Toggle virtual keyboard
  const toggleVirtualKeyboard = (e: React.MouseEvent) => {
    // Prevent the event from bubbling up and closing the dialog
    e.preventDefault();
    e.stopPropagation();
    
    if (mathFieldRef.current) {
      const mathField = mathFieldRef.current as MathfieldElement;
      
      try {
        if (showVirtualKeyboard) {
          mathField.executeCommand('hideVirtualKeyboard');
        } else {
          mathField.executeCommand('showVirtualKeyboard');
          // Focus the math field to ensure keyboard input works
          mathField.focus();
        }
        
        setShowVirtualKeyboard(!showVirtualKeyboard);
      } catch (error) {
        console.error('Error toggling keyboard:', error);
      }
    }
  };

  if (!isClient) {
    return <div className="h-[150px] border rounded-md p-3 bg-gray-50">{placeholder}</div>;
  }

  // Prevent dialog close when clicking inside the editor
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className={`mathlive-field ${className}`}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border rounded-md p-3 bg-white mb-3">
        {/* Using a div wrapper with dangerouslySetInnerHTML to avoid TypeScript errors */}
        <div
          ref={(el) => {
            if (el && !mathFieldRef.current) {
              // Create the math-field element
              const mathField = document.createElement('math-field');
              mathField.style.width = '100%';
              mathField.style.minHeight = '50px';
              mathField.style.fontSize = '16px';
              // Add spaces using LaTeX spacing command '\;' between words to prevent them from being removed
              const formattedPlaceholder = placeholder ? placeholder.replace(/ /g, '\\;') : '';
              mathField.setAttribute('placeholder', formattedPlaceholder);
              
              // Clear the div and append the math-field
              el.innerHTML = '';
              el.appendChild(mathField);
              
              // Store the reference
              mathFieldRef.current = mathField;
              
              // Initialize the math field
              if (isClient) {
                mathField.setAttribute('virtual-keyboard-mode', 'manual');
                mathField.setAttribute('virtual-keyboards', 'all');
                mathField.setAttribute('smart-mode', 'true');
                
                // Add event listener for changes
                const handleInput = () => {
                  onChange((mathField as MathfieldElement).value);
                };
                
                mathField.addEventListener('input', handleInput);
              }
            }
          }}
        />
      </div>
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleVirtualKeyboard}
          className="flex items-center gap-1"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
            <line x1="6" y1="8" x2="6" y2="8"></line>
            <line x1="10" y1="8" x2="10" y2="8"></line>
            <line x1="14" y1="8" x2="14" y2="8"></line>
            <line x1="18" y1="8" x2="18" y2="8"></line>
            <line x1="6" y1="12" x2="6" y2="12"></line>
            <line x1="10" y1="12" x2="10" y2="12"></line>
            <line x1="14" y1="12" x2="14" y2="12"></line>
            <line x1="18" y1="12" x2="18" y2="12"></line>
            <line x1="6" y1="16" x2="18" y2="16"></line>
          </svg>
          Math Keyboard
        </Button>
      </div>
    </div>
  );
};

export default MathLiveField;
