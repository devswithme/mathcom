'use client';

import React from 'react';
import { Bold, Italic, Underline, Link, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormattingToolbarProps {
  onBoldClick: () => void;
  onItalicClick: () => void;
  onUnderlineClick: () => void;
  onLatexClick: () => void;
  onLinkClick: () => void;
  onBulletListClick: () => void;
  onNumberedListClick: () => void;
  onSuperscriptClick: () => void;
  onSubscriptClick: () => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  onBoldClick,
  onItalicClick,
  onUnderlineClick,
  onLatexClick,
  onLinkClick,
  onBulletListClick,
  onNumberedListClick,
  onSuperscriptClick,
  onSubscriptClick
}) => {
  return (
    <div className="flex items-center space-x-2 text-gray-500 flex-wrap">
      <button
        onClick={onBoldClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Bold"
      >
        <Bold className="h-5 w-5" />
      </button>
      <button
        onClick={onItalicClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Italic"
      >
        <Italic className="h-5 w-5" />
      </button>
      <button
        onClick={onUnderlineClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Underline"
      >
        <Underline className="h-5 w-5" />
      </button>
      <button
        onClick={onLatexClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors font-serif font-bold"
        title="Math Symbols (LaTeX)"
      >
        Σ
      </button>
      <button
        onClick={onLinkClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Link"
      >
        <Link className="h-5 w-5" />
      </button>
      <button
        onClick={onBulletListClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Bullet List"
      >
        <List className="h-5 w-5" />
      </button>
      <button
        onClick={onNumberedListClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Numbered List"
      >
        <ListOrdered className="h-5 w-5" />
      </button>
      <button
        onClick={onSuperscriptClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors font-serif"
        title="Superscript"
      >
        x²
      </button>
      <button
        onClick={onSubscriptClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors font-serif"
        title="Subscript"
      >
        x₂
      </button>
    </div>
  );
};

export default FormattingToolbar;
