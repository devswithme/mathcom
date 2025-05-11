'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface MathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MathEditor: React.FC<MathEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter your math expression here',
  className = '',
}) => {
  const [content, setContent] = useState(value);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Update the preview when content changes
  useEffect(() => {
    if (showPreview && previewRef.current) {
      try {
        katex.render(content, previewRef.current, {
          throwOnError: false,
          displayMode: true
        });
      } catch (e) {
        previewRef.current.textContent = 'Error rendering math expression';
      }
    }
  }, [content, showPreview]);

  // Handle content changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  // Insert template at cursor position
  const insertTemplate = (template: string, cursorOffset: number = 0) => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      const newContent = 
        content.substring(0, start) + 
        template + 
        content.substring(end);
      
      setContent(newContent);
      onChange(newContent);
      
      // Set cursor position after insertion
      const newPosition = start + template.length + cursorOffset;
      setCursorPosition(newPosition);
      
      // Focus and set cursor position
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          editorRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  // Template buttons
  const templates = [
    { label: 'Fraction', template: '\\frac{a}{b}', cursorOffset: -4 },
    { label: 'Square Root', template: '\\sqrt{x}', cursorOffset: -2 },
    { label: 'Power', template: 'x^{n}', cursorOffset: -2 },
    { label: 'Subscript', template: 'x_{i}', cursorOffset: -2 },
    { label: 'Integral', template: '\\int_{a}^{b} f(x) \\, dx', cursorOffset: -14 },
    { label: 'Sum', template: '\\sum_{i=1}^{n} x_i', cursorOffset: -4 },
    { label: 'Product', template: '\\prod_{i=1}^{n} x_i', cursorOffset: -4 },
    { label: 'Limit', template: '\\lim_{x \\to a} f(x)', cursorOffset: -6 },
  ];

  // Symbol buttons
  const symbols = [
    { label: 'α', template: '\\alpha' },
    { label: 'β', template: '\\beta' },
    { label: 'γ', template: '\\gamma' },
    { label: 'π', template: '\\pi' },
    { label: '≤', template: '\\leq' },
    { label: '≥', template: '\\geq' },
    { label: '≠', template: '\\neq' },
    { label: '∞', template: '\\infty' },
  ];

  return (
    <div className={`math-editor ${className}`}>
      {/* Template buttons */}
      <div className="template-buttons flex flex-wrap gap-2 mb-2">
        {templates.map((item, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => insertTemplate(item.template, item.cursorOffset)}
            className="px-2 py-1 h-auto"
          >
            {item.label}
          </Button>
        ))}
      </div>
      
      {/* Symbol buttons */}
      <div className="symbol-buttons flex flex-wrap gap-2 mb-2">
        {symbols.map((item, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => insertTemplate(item.template)}
            className="px-2 py-1 h-auto min-w-[32px]"
          >
            {item.label}
          </Button>
        ))}
      </div>
      
      {/* Editor */}
      <div className="editor-container border rounded-md">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full p-3 min-h-[150px] font-mono resize-y"
        />
      </div>
      
      {/* Preview toggle */}
      <div className="flex justify-between mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
        <div className="text-xs text-gray-500">
          Use LaTeX syntax for math expressions
        </div>
      </div>
      
      {/* Preview */}
      {showPreview && (
        <div className="preview mt-4 p-4 border rounded-md bg-gray-50">
          <div ref={previewRef} className="katex-preview"></div>
        </div>
      )}
    </div>
  );
};

export default MathEditor;
