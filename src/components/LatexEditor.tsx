'use client';

import React, { useState, useRef, useEffect } from 'react';
import FormattingToolbar from './FormattingToolbar';
import { Textarea } from '@/components/ui/textarea';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  previewMode?: boolean;
}

const LatexEditor: React.FC<LatexEditorProps> = ({
  value,
  onChange,
  placeholder = '',
  label = 'Description',
  required = false,
  className = '',
  previewMode = false
}) => {
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTextAtCursor = (textBefore: string, textAfter: string = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = 
      value.substring(0, start) + 
      textBefore + 
      selectedText + 
      textAfter + 
      value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after the operation
    const newCursorPos = start + textBefore.length + selectedText.length;
    setCursorPosition(newCursorPos);
  };

  useEffect(() => {
    if (cursorPosition !== null && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      setCursorPosition(null);
    }
  }, [cursorPosition, value]);

  const handleBoldClick = () => insertTextAtCursor('**', '**');
  const handleItalicClick = () => insertTextAtCursor('*', '*');
  const handleUnderlineClick = () => insertTextAtCursor('<u>', '</u>');
  const handleLinkClick = () => insertTextAtCursor('[', '](url)');
  const handleLatexClick = () => insertTextAtCursor('$', '$');
  const handleBulletListClick = () => insertTextAtCursor('- ');
  const handleNumberedListClick = () => insertTextAtCursor('1. ');
  const handleSuperscriptClick = () => insertTextAtCursor('<sup>', '</sup>');
  const handleSubscriptClick = () => insertTextAtCursor('<sub>', '</sub>');

  return (
    <div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-gray-700 font-medium">{label}{required && <span className="text-red-500">*</span>}</label>
          {previewMode && (
            <div className="text-sm text-gray-500">
              Preview mode
            </div>
          )}
        </div>
        
        {!previewMode ? (
          <>
            <FormattingToolbar 
              onBoldClick={handleBoldClick}
              onItalicClick={handleItalicClick}
              onUnderlineClick={handleUnderlineClick}
              onLinkClick={handleLinkClick}
              onLatexClick={handleLatexClick}
              onBulletListClick={handleBulletListClick}
              onNumberedListClick={handleNumberedListClick}
              onSuperscriptClick={handleSuperscriptClick}
              onSubscriptClick={handleSubscriptClick}
            />
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="mt-2 min-h-[100px] border-0 focus-visible:ring-0 p-0 resize-none"
            />
          </>
        ) : (
          <div className="mt-2 min-h-[100px] prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {value}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default LatexEditor;
