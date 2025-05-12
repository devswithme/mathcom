'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import MathLiveField from './MathLiveField';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';
import 'katex/dist/katex.min.css';

// Define the MathfieldElement type if not already defined
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

// Define MathfieldElement interface
interface MathfieldElement extends HTMLElement {
  value: string;
  setValue(value: string): void;
  executeCommand(command: string): void;
}

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
  const [isClient, setIsClient] = useState(false);
  const [mathDialogOpen, setMathDialogOpen] = useState(false);
  const [mathExpression, setMathExpression] = useState('');
  const [editorContent, setEditorContent] = useState(value);

  
  // Register the MathLive web component on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
      
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
  }, []);
  
  // Set up client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Load KaTeX if needed
    if (typeof window !== 'undefined' && !(window as any).katex) {
      const katexScript = document.createElement('script');
      katexScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
      katexScript.integrity = 'sha384-cpW21h6RZv/phavutF+AuVYrr+dA8xD9zs6FwLpaCct6O9ctzYFfFr4dgmgccOTx';
      katexScript.crossOrigin = 'anonymous';
      document.head.appendChild(katexScript);
    }
  }, []);
  
  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && isClient) {
      if (value) {
        editorRef.current.innerHTML = value;
      } else {
        editorRef.current.innerHTML = '';
      }
      renderMathInEditor();
    }
  }, [isClient, value]);
  
  // Update content when value prop changes from outside
  useEffect(() => {
    if (editorRef.current && isClient && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value || '';
      renderMathInEditor();
    }
  }, [isClient, value]);
  
  // Render math expressions in the editor
  const renderMathInEditor = useCallback(() => {
    if (editorRef.current && typeof window !== 'undefined' && (window as any).katex) {
      try {
        // Find all math expressions ($$...$$) and render them
        const mathElements = editorRef.current.querySelectorAll('.math-expression');
        mathElements.forEach(element => {
          const latex = element.getAttribute('data-latex');
          if (latex) {
            try {
              (window as any).katex.render(latex, element, {
                throwOnError: false
              });
            } catch (err) {
              console.error('KaTeX render error:', err);
            }
          }
        });
      } catch (error) {
        console.error('Error rendering math expressions:', error);
      }
    }
  }, []);
  
  // Handle editor content changes
  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setEditorContent(html);
      onChange(html);
    }
  }, [onChange]);
  
  // Insert math expression
  const insertMathExpression = useCallback(() => {
    if (!mathExpression.trim() || !editorRef.current) return;
    
    try {
      // Create a non-editable span for the math expression
      const span = document.createElement('span');
      span.className = 'math-expression';
      span.contentEditable = 'false';
      span.setAttribute('data-latex', mathExpression);
      
      // Render the math using KaTeX if available
      if (typeof window !== 'undefined' && (window as any).katex) {
        try {
          (window as any).katex.render(mathExpression, span, {
            throwOnError: false
          });
        } catch (err) {
          // Fallback if KaTeX rendering fails
          span.textContent = `$$${mathExpression}$$`;
        }
      } else {
        // Fallback if KaTeX is not loaded
        span.textContent = `$$${mathExpression}$$`;
      }
      
      // Insert at cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          range.deleteContents();
          range.insertNode(span);
          
          // Add a space after the math expression
          const textNode = document.createTextNode(' ');
          range.setStartAfter(span);
          range.insertNode(textNode);
          
          // Move cursor after the inserted space
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
          
          editorRef.current.focus();
        } else {
          editorRef.current.appendChild(span);
          editorRef.current.appendChild(document.createTextNode(' '));
        }
      } else {
        editorRef.current.appendChild(span);
        editorRef.current.appendChild(document.createTextNode(' '));
      }
      
      // Update the content
      handleContentChange();
    } catch (error) {
      console.error('Error inserting math expression:', error);
    }
    
    // Close the dialog and reset
    setMathDialogOpen(false);
    setMathExpression('');
  }, [mathExpression, handleContentChange]);
  
  // Open math dialog
  const openMathDialog = useCallback(() => {
    setMathDialogOpen(true);
  }, []);
  
  // Formatting functions
  const execCommand = useCallback((command: string, value: string = '') => {
    if (editorRef.current) {
      // Focus the editor first
      editorRef.current.focus();
      
      // Execute the command
      document.execCommand(command, false, value);
      
      // Update content
      handleContentChange();
    }
  }, [handleContentChange]);
  
  const handleBoldClick = useCallback(() => execCommand('bold'), [execCommand]);
  const handleItalicClick = useCallback(() => execCommand('italic'), [execCommand]);
  const handleUnderlineClick = useCallback(() => execCommand('underline'), [execCommand]);
  const handleBulletListClick = useCallback(() => execCommand('insertUnorderedList'), [execCommand]);
  const handleNumberedListClick = useCallback(() => execCommand('insertOrderedList'), [execCommand]);
  


  // Math dialog component
  const MathDialog = () => {
    return (
      <Dialog open={mathDialogOpen} onOpenChange={setMathDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Insert Math Expression</DialogTitle>
          <DialogDescription>
            Enter your mathematical expression using LaTeX syntax
          </DialogDescription>
          <MathLiveField
            value={mathExpression}
            onChange={setMathExpression}
            placeholder="e.g. x^2 + 3x + 2"
            className="mb-4"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-4 py-2 border rounded-md"
              onClick={() => {
                setMathDialogOpen(false);
                setMathExpression('');
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              onClick={insertMathExpression}
            >
              Insert
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (!isClient) {
    return <div className="border rounded-md p-3 min-h-[200px]">{placeholder}</div>;
  }

  return (
    <div className={`wysiwyg-editor ${className}`}>
      <div className="border-b border-gray-200 pb-2 mb-2 flex items-center space-x-2">
        <button 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
          onClick={handleBoldClick}
          title="Bold"
        >
          <Bold className="h-5 w-5" />
        </button>
        <button 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
          onClick={handleItalicClick}
          title="Italic"
        >
          <Italic className="h-5 w-5" />
        </button>
        <button 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
          onClick={handleUnderlineClick}
          title="Underline"
        >
          <Underline className="h-5 w-5" />
        </button>
        <button 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
          onClick={handleBulletListClick}
          title="Bulleted List"
        >
          <List className="h-5 w-5" />
        </button>
        <button 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
          onClick={handleNumberedListClick}
          title="Numbered List"
        >
          <ListOrdered className="h-5 w-5" />
        </button>
        <button 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-lg font-serif"
          onClick={openMathDialog}
          title="Insert Math Expression"
        >
          Σ
        </button>
      </div>
      
      {/* Single Unified Editor View */}
      <div 
        ref={editorRef}
        className="w-full min-h-[200px] p-3 border rounded-md overflow-auto focus:outline-none focus:ring-1 focus:ring-blue-500 prose prose-sm max-w-none editor-container"
        contentEditable={true}
        onInput={handleContentChange}
        onBlur={handleContentChange}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
        dir="ltr"
        style={{
          position: 'relative',
          direction: 'ltr',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          unicodeBidi: 'isolate',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      />
      
      {/* Add CSS for placeholder and math expressions */}
      <style jsx global>{`
        .editor-container:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          position: absolute;
          pointer-events: none;
        }
        
        .editor-container .math-expression {
          display: inline-block;
          margin: 0 2px;
          padding: 2px 4px;
          background-color: #f0f4f8;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
        }
      `}</style>
      

      
      <MathDialog />
    </div>
  );
};

export default QuillEditor;