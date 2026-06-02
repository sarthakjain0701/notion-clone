'use client';

import React from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils/cn';
import {
  Bold, Italic, Underline, Strikethrough, Code, Highlighter, Link as LinkIcon,
} from 'lucide-react';

interface BubbleToolbarProps {
  editor: Editor;
}

function BubbleButton({
  onClick,
  isActive,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        'p-1.5 rounded transition-colors cursor-pointer',
        'hover:bg-white/10',
        isActive ? 'text-white' : 'text-white/70'
      )}
    >
      {children}
    </button>
  );
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 px-1 py-1 rounded-lg bg-[#1e1e1e] shadow-xl border border-white/10"
    >
      <BubbleButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      >
        <Bold className="w-3.5 h-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      >
        <Italic className="w-3.5 h-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
      >
        <Underline className="w-3.5 h-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
      >
        <Code className="w-3.5 h-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
      >
        <Highlighter className="w-3.5 h-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={addLink}
        isActive={editor.isActive('link')}
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </BubbleButton>
    </BubbleMenu>
  );
}
