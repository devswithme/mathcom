'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'quill/dist/quill.snow.css';
import 'katex/dist/katex.min.css';
// Import KaTeX directly to ensure it's available
import katex from 'katex';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import MathLiveField from './MathLiveField';

// Add KaTeX to window type
declare global {
  interface Window {
    katex: any;
  }
}

// Make KaTeX globally available for Quill
if (typeof window !== 'undefined') {
  window.katex = katex;
}

// Custom styles to fix Quill UI issues
const quillStyles = `
  /* Remove borders from container */
  .ql-container {
    border: none !important;
    font-family: inherit;
  }
  
  /* Adjust editor padding */
  .ql-editor {
    padding: 12px 15px;
    min-height: 200px;
  }
  
  /* Clean up toolbar appearance */
  .ql-toolbar.ql-snow {
    border: none !important;
    padding: 8px 0;
    display: flex;
    align-items: center;
  }
  
  /* Remove the extra line/border */
  .quill-editor-container .ql-snow.ql-toolbar + .ql-snow.ql-container {
    border: none;
  }
  
  /* Better spacing and alignment for toolbar buttons */
  .ql-toolbar.ql-snow .ql-formats {
    display: inline-flex !important;
    align-items: center;
    margin-right: 20px;
    vertical-align: middle;
  }
  
  /* Make all buttons the same size and properly centered */
  .ql-toolbar.ql-snow button {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    float: none;
    margin: 0 5px;
  }
  
  /* Fix button SVG alignment */
  .ql-toolbar.ql-snow button svg {
    float: none;
    margin: 0 auto;
    width: 24px;
    height: 24px;
  }
  
  /* Formula icon styling */
  .ql-formula-icon {
    font-family: serif;
    font-weight: bold;
    display: inline-block;
    vertical-align: middle;
    line-height: 1;
    font-size: 24px;
  }
  
  /* Fix superscript and subscript alignment */
  .ql-toolbar.ql-snow .ql-script {
    vertical-align: middle;
  }
  
  /* Fix list button alignment */
  .ql-toolbar.ql-snow .ql-list {
    vertical-align: middle;
  }
  
  /* Make sure all icons are centered in their buttons */
  .ql-toolbar.ql-snow .ql-picker {
    display: inline-flex;
    align-items: center;
    height: 28px;
  }
`;

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = 'Provide more details about your question',
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [mathDialogOpen, setMathDialogOpen] = useState(false);
  const [mathExpression, setMathExpression] = useState('');

  // Initialize Quill on client-side only
  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined' && editorRef.current && !quillRef.current) {
      // First make KaTeX available globally
      window.katex = katex;
      
      // Import Quill
      import('quill').then((QuillModule) => {
        const Quill = QuillModule.default;
        
        try {
          // Simple approach: just register a custom handler for formulas
          Quill.register('modules/formula', function() { return {}; }, true);
          
          // Use a simple object for the formula format
          const formulaFormat = {
            blotName: 'formula',
            tagName: 'span',
            className: 'ql-formula',
            
            create: function(value: string) {
              const node = document.createElement(this.tagName);
              node.classList.add(this.className);
              node.setAttribute('data-value', value);
              
              try {
                window.katex.render(value, node, { throwOnError: false });
              } catch (e) {
                console.error('KaTeX error:', e);
                node.textContent = value;
              }
              
              return node;
            },
            
            value: function(node: HTMLElement) {
              return node.getAttribute('data-value');
            }
          };
          
          // Register the formula format
          Quill.register('formats/formula', formulaFormat, true);
        } catch (error) {
          console.error('Error registering formula module:', error);
        }
        
        // Define custom icons
        const icons = Quill.import('ui/icons') as Record<string, string>;
        
        // Image icon
        icons['image'] = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ql-image-icon"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
        
        // Sigma icon for math editor
        icons['matheditor'] = '<span style="font-size: 18px; line-height: 1; display: inline-block; font-family: serif;">Σ</span>';
        
        // Define custom toolbar options
        const toolbarOptions = [
          ['bold', 'italic', 'underline'],
          ['matheditor', 'image'],
          [{ 'list': 'bullet' }, { 'list': 'ordered' }],
        ];

        // Initialize Quill editor
        if (editorRef.current) {
          // Create the Quill editor
          quillRef.current = new Quill(editorRef.current, {
            modules: {
              toolbar: {
                container: toolbarOptions,
                handlers: {
                  // Image upload handler
                  image: function() {
                    // Create a file input element
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();
                    
                    // When a file is selected
                    input.onchange = () => {
                      if (input.files && input.files[0]) {
                        const file = input.files[0];
                        
                        // Simple client-side preview (you would typically upload to server here)
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const imageUrl = e.target?.result as string;
                          // Insert the image into the editor
                          const quill = quillRef.current;
                          const range = quill.getSelection(true);
                          quill.insertEmbed(range.index, 'image', imageUrl);
                          quill.setSelection(range.index + 1);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                  },
                  
                  // Math editor handler (Sigma button)
                  matheditor: function() {
                    // Open the math editor dialog
                    setMathDialogOpen(true);
                    
                    // Get current selection to insert math at this position later
                    const quill = quillRef.current;
                    const range = quill.getSelection(true);
                    
                    // Store the range in a ref to use it when inserting the math expression
                    quillRef.current.lastSelection = range;
                  },
                  
                  // Math formula handlers
                  fraction: function() {
                    const quill = quillRef.current;
                    const range = quill.getSelection(true);
                    quill.insertText(range.index, '\\frac{numerator}{denominator}');
                    quill.setSelection(range.index + 7, 9); // Select 'numerator' for easy replacement
                  },
                  
                  root: function() {
                    const quill = quillRef.current;
                    const range = quill.getSelection(true);
                    quill.insertText(range.index, '\\sqrt{x}');
                    quill.setSelection(range.index + 6, 1); // Select 'x' for easy replacement
                  },
                  
                  integral: function() {
                    const quill = quillRef.current;
                    const range = quill.getSelection(true);
                    quill.insertText(range.index, '\\int_{a}^{b} f(x) dx');
                    quill.setSelection(range.index + 6, 1); // Select 'a' for easy replacement
                  },
                  
                  sum: function() {
                    const quill = quillRef.current;
                    const range = quill.getSelection(true);
                    quill.insertText(range.index, '\\sum_{i=1}^{n} x_i');
                    quill.setSelection(range.index + 6, 3); // Select 'i=1' for easy replacement
                  },
                  
                  derivative: function() {
                    const quill = quillRef.current;
                    const range = quill.getSelection(true);
                    quill.insertText(range.index, '\\frac{d}{dx}f(x)');
                    quill.setSelection(range.index + 10, 3); // Select 'f(x)' for easy replacement
                  }
                }
              },
              formula: true, // Enable formula module (KaTeX)
            },
            placeholder: placeholder,
            theme: 'snow',
          });

          // Set initial content
          if (value) {
            quillRef.current.root.innerHTML = value;
          }

          // Handle content change
          quillRef.current.on('text-change', () => {
            const html = quillRef.current.root.innerHTML;
            onChange(html);
          });
        }
      });
    }

    // Cleanup function
    return () => {
      if (quillRef.current) {
        quillRef.current.off('text-change');
      }
    };
  }, []);

  // Update Quill content when value prop changes
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  // Handle inserting math expression from the dialog
  const handleInsertMath = () => {
    if (quillRef.current && mathExpression) {
      try {
        // Get the stored selection
        const range = quillRef.current.lastSelection || quillRef.current.getSelection(true);
        
        if (range) {
          // First, ensure the math expression is properly formatted
          let cleanExpression = mathExpression.trim();
          
          // Render the math expression using KaTeX
          const renderedMath = katex.renderToString(cleanExpression, {
            displayMode: false,
            throwOnError: false,
            output: 'html'
          });
          
          // Create a unique ID for this formula
          const formulaId = 'formula-' + Date.now();
          
          // Insert the rendered HTML with proper styling
          quillRef.current.clipboard.dangerouslyPasteHTML(
            range.index,
            `<span 
              class="ql-formula" 
              id="${formulaId}" 
              data-value="${cleanExpression.replace(/"/g, '&quot;')}" 
              contenteditable="false"
            >${renderedMath}</span>`,
            'api'
          );
          
          // Add a space after the formula for better editing
          quillRef.current.insertText(range.index + 1, ' ', 'api');
          
          // Move cursor after the inserted formula
          quillRef.current.setSelection(range.index + 2);
          
          // Force a re-render of KaTeX elements
          setTimeout(() => {
            const formulaElement = document.getElementById(formulaId);
            if (formulaElement) {
              const value = formulaElement.getAttribute('data-value');
              if (value) {
                try {
                  const html = katex.renderToString(value, {
                    displayMode: false,
                    throwOnError: false
                  });
                  formulaElement.innerHTML = html;
                } catch (e) {
                  console.error('Error re-rendering formula:', e);
                }
              }
            }
          }, 10);
          
          console.log('Successfully inserted math expression');
        } else {
          console.warn('No selection range found');
          // Insert at the end if no selection
          const length = quillRef.current.getLength();
          const cleanExpression = mathExpression.trim();
          const renderedMath = katex.renderToString(cleanExpression, {
            displayMode: false,
            throwOnError: false
          });
          
          const formulaId = 'formula-' + Date.now();
          
          quillRef.current.clipboard.dangerouslyPasteHTML(
            length - 1,
            `<span 
              class="ql-formula" 
              id="${formulaId}" 
              data-value="${cleanExpression.replace(/"/g, '&quot;')}" 
              contenteditable="false"
            >${renderedMath}</span>`,
            'api'
          );
          quillRef.current.insertText(length, ' ', 'api');
          quillRef.current.setSelection(length + 1);
        }
      } catch (error) {
        console.error('Error inserting math expression:', error);
        // Fallback: insert as text with delimiters to indicate it's math
        const range = quillRef.current.getSelection(true);
        if (range) {
          quillRef.current.insertText(range.index, ' $' + mathExpression + '$ ', 'user');
          quillRef.current.setSelection(range.index + mathExpression.length + 4);
        }
      }
      
      // Close the dialog
      setMathDialogOpen(false);
      // Reset the math expression
      setMathExpression('');
    }
  };

  return (
    <div className={`quill-editor-container ${className}`}>
      {/* Add custom styles */}
      <style dangerouslySetInnerHTML={{ __html: quillStyles }} />
      {!isClient ? (
        <div className="quill-placeholder">{placeholder}</div>
      ) : null}
      <div ref={editorRef} />
      
      {/* Math Editor Dialog */}
      <Dialog open={mathDialogOpen} onOpenChange={setMathDialogOpen}>
        <DialogContent 
          className="sm:max-w-[600px]"
          onPointerDownOutside={(e) => {
            // Prevent closing the dialog when clicking on the virtual keyboard
            // Check if the click target is part of the ML__keyboard class
            const target = e.target as HTMLElement;
            if (target.closest('.ML__keyboard')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Math Expression Editor</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {/* MathLive visual editor */}
            <MathLiveField
              value={mathExpression}
              onChange={setMathExpression}
              placeholder="Type or use the virtual keyboard"
              className="min-h-[150px]"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setMathDialogOpen(false)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInsertMath}
              onMouseDown={(e) => e.stopPropagation()}
            >
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuillEditor;
