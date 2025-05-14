"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import MathLiveField from './MathLiveField'; // Ensure this path is correct
import { Node, mergeAttributes } from '@tiptap/core';
import {
  Bold as IconBold,
  Italic as IconItalic,
  Underline as IconUnderline,
  List as IconList,
  ListOrdered as IconListOrdered,
  Sigma as IconSigma,
} from 'lucide-react';
import { renderMathInNode } from '@/utils/mathlive';

declare global {
  interface Window {
    mathLiveReadyState?: 'loading' | 'ready' | 'failed';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MathLive?: any;
  }
}

/** Utility: tells us if MathLive is fully ready */
const isMathLiveReady = () =>
  typeof window !== "undefined" &&
  window.mathLiveReadyState === "ready" &&
  window.MathLive &&
  typeof window.MathLive.renderMathInElement === "function";

// --- MathNode & renderMathInNode (from your previous version, ensure correctness) ---
// Placed renderMathInNode outside component to be a standalone helper
// Helper: turn the <span data-type="math"> into a rendered, readonly <math-field>

const MathNode = Node.create({
  name: 'math',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() { return { latex: { default: '' } }; },
  parseHTML() { return [{ tag: 'span[data-type="math"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-type': 'math', 'data-latex': HTMLAttributes.latex, class: 'math-inline',
      contentEditable: 'false', style: 'background: #f3f4f6; border: 1px solid #d1d5db; padding: 10px 14px; border-radius: 3px; cursor: pointer; margin-right: 0.5em; font-size: 1.15em; display: inline-flex; align-items: center;',
    }), HTMLAttributes.latex];
  },
  addNodeView() {
    return ({ node, editor: currentEditor, getPos }) => {
      const dom = document.createElement('span');
      dom.setAttribute('data-type', 'math');
      dom.setAttribute('data-latex', node.attrs.latex);
      dom.className = 'math-inline math-node-view';
      dom.contentEditable = 'false';
      dom.style.background = '#f3f4f6';
      dom.style.border = '1px solid #d1d5db';
      dom.style.padding = '10px 14px';
      dom.style.borderRadius = '3px';
      dom.style.cursor = 'pointer';
      dom.style.marginRight = '0.5em';
      dom.style.fontSize = '1.15em';
      dom.style.display = 'inline-flex';
      dom.style.alignItems = 'center';
      dom.textContent = node.attrs.latex;

      const attemptRender = () => {
        if (typeof window !== 'undefined' && window.mathLiveReadyState === 'ready' && window.MathLive) {
           renderMathInNode(dom);
        }
      };
      setTimeout(attemptRender, 50);

      dom.addEventListener('dblclick', () => {
        const editorOptions = (currentEditor.options as unknown) as Record<string, unknown>;
        if (typeof editorOptions.onEditMath === 'function') {
          (editorOptions.onEditMath as (latex: string, pos: (() => number)) => void)(node.attrs.latex, getPos as (() => number));
        }
      });
      return { dom, destroy: () => {} };
    };
  },
});

// Removed CustomParagraph extension and import

export type TipTapEditorProps = {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  className?: string;
};

const TipTapEditor: React.FC<TipTapEditorProps> = ({  
  value = '',  
  onChange,  
  placeholder = 'Enter description here.',
  className = '',
}) => {
  const [mathDialogOpen, setMathDialogOpen] = useState(false);
  const [mathExpression, setMathExpression] = useState('');
  const [editMathPos, setEditMathPos] = useState<number | null>(null);
  
  const [mathLiveReady, setMathLiveReady] = useState<boolean>(() => isMathLiveReady());

  // React to global MathLive events
  useEffect(() => {
    if (isMathLiveReady()) setMathLiveReady(true);

    const readyHandler = () => setMathLiveReady(true);
    const failHandler  = () => setMathLiveReady(false);

    window.addEventListener("mathlive-ready", readyHandler);
    window.addEventListener("mathlive-failed", failHandler);
    return () => {
      window.removeEventListener("mathlive-ready", readyHandler);
      window.removeEventListener("mathlive-failed", failHandler);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }), // Removed paragraph: false and CustomParagraph
      Underline,
      Placeholder.configure({
        placeholder,
        emptyNodeClass: 'text-gray-400 italic',
      }),
      MathNode.extend({
        addOptions() {
          return { ...this.parent?.(),
            onEditMath: (latex: string, pos: number) => {
              setMathExpression(latex); setEditMathPos(pos); setMathDialogOpen(true);
            },
          };
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor: currentEditor }) => {
      if (onChange) onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `w-full min-h-[200px] pt-2 pb-4 px-[15px] focus:outline-none prose prose-sm max-w-none ${className}`,
      },
    },
    immediatelyRender: false,
  });
  
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false); // false to not emit update initially
    }
  }, [value, editor]);

  useEffect(() => {
    if (mathLiveReady && editor?.view && editor.isEditable) {
      console.log('[TipTapEditor] Rendering all math nodes (view update/ready).');
      setTimeout(() => {
        editor.view.dom.querySelectorAll('span.math-inline[data-type="math"]').forEach((node) => {
          renderMathInNode(node as HTMLElement);
        });
      }, 100);
    }
  }, [mathLiveReady, editor?.state, editor?.isEditable]); // editor.state includes content

  const setBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const setItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const setUnderline = useCallback(() => editor?.chain().focus().toggleUnderline().run(), [editor]);
  const setBulletList = useCallback(() => {
    if (!editor) return;
    const { state } = editor;
    const isDocEmpty = state.doc.content.size === 2; // just an empty paragraph
    if (isDocEmpty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph' }],
            },
          ],
        })
        .run();
    } else {
      editor.chain().focus().toggleBulletList().run();
    }
  }, [editor]);
  const setOrderedList = useCallback(() => {
    if (!editor) return;
    const { state } = editor;
    const isDocEmpty = state.doc.content.size === 2;
    if (isDocEmpty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph' }],
            },
          ],
        })
        .run();
    } else {
      editor.chain().focus().toggleOrderedList().run();
    }
  }, [editor]);
  const insertMath = useCallback(() => { if (!editor) return; setMathExpression(''); setEditMathPos(null); setMathDialogOpen(true); }, [editor]);

  const handleInsertMath = useCallback(() => {
    if (!mathExpression.trim() || !editor) return;
    editor.chain().focus();
    const contentToInsert = { type: 'math', attrs: { latex: mathExpression } };
    if (editMathPos !== null && typeof editMathPos === 'number') {
      // For updating, find the node's actual current start and end positions
      // This is safer than relying on a potentially stale `editMathPos` directly for node length.
      // A common way: select the node, then replace.
      // TipTap's setNodeSelection selects the node at the given position.
      editor.chain().setNodeSelection(editMathPos).deleteSelection().insertContentAt(editMathPos, contentToInsert).run();

      // Re-render just-inserted math node in ~ next tick
      setTimeout(() => {
        const dom = editor.view.dom as HTMLElement;
        dom.querySelectorAll('span.math-inline').forEach(n => renderMathInNode(n as HTMLElement));
      }, 30);
    } else {
      editor.chain().insertContent(contentToInsert).run();

      // Re-render just-inserted math node in ~ next tick
      setTimeout(() => {
        const dom = editor.view.dom as HTMLElement;
        dom.querySelectorAll('span.math-inline').forEach(n => renderMathInNode(n as HTMLElement));
      }, 30);
    }
    setMathDialogOpen(false); setMathExpression(''); setEditMathPos(null);
  }, [editor, mathExpression, editMathPos]);

  if (!editor || !mathLiveReady) {
    return <div className="p-4 text-center text-gray-400">Loading math editor… (Editor: {editor ? 'Yes' : 'No'}, MathLive: {mathLiveReady ? 'Yes' : 'No'})</div>;
  }

  const isActive = (name: string) => editor?.isActive(name);

  return (
    <div>
      <div className="mt-3 mb-4 flex flex-wrap items-center gap-2 px-1.5 items-center">
        <button
          type="button"
          onClick={setBold}
          title="Bold"
          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 font-bold ${isActive('bold') ? 'bg-gray-200' : ''}`}
        >
          <IconBold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={setItalic}
          title="Italic"
          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 italic ${isActive('italic') ? 'bg-gray-200' : ''}`}
        >
          <IconItalic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={setUnderline}
          title="Underline"
          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 underline ${isActive('underline') ? 'bg-gray-200' : ''}`}
        >
          <IconUnderline className="w-4 h-4" />
        </button>
        <span className="w-px h-5 bg-gray-300 mx-1"></span>
        {/* BULLET LIST */}
        <button
          type="button"
          onClick={setBulletList}
          title="Bulleted List"
          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 ${
            isActive('bulletList') ? 'bg-gray-200' : ''
          }`}
        >
          <IconList className="w-4 h-4" />
        </button>

        {/* ORDERED LIST */}
        <button
          type="button"
          onClick={setOrderedList}
          title="Numbered List"
          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 ${
            isActive('orderedList') ? 'bg-gray-200' : ''
          }`}
        >
          <IconListOrdered className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-gray-300 mx-1"></span>
        <button
          type="button"
          onClick={insertMath}
          title="Insert Math"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-lg font-serif"
        >
          <IconSigma className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
      <Dialog open={mathDialogOpen} onOpenChange={setMathDialogOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogTitle>{editMathPos !== null ? 'Edit Math Expression' : 'Insert Math Expression'}</DialogTitle>
          <DialogDescription>Enter your mathematical expression using LaTeX syntax</DialogDescription>
          {/* This is Ln 330 from the error image */}
          <MathLiveField
            value={mathExpression}
            onChange={setMathExpression}
            placeholder="e.g. x^2 + 3x + 2"
            className="mb-4"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button className="px-4 py-2 border rounded-md" onClick={() => setMathDialogOpen(false)}>Cancel</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={handleInsertMath}>
              {editMathPos !== null ? 'Update' : 'Insert'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TipTapEditor;