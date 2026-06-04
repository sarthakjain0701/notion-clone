'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils/cn';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  Bold, Italic, Underline, Strikethrough, Code, Highlighter,
  Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare,
  AlignLeft, AlignCenter, AlignRight,
  Quote, Minus, Table, Image as ImageIcon,
  Undo2, Redo2, Link as LinkIcon,
  ChevronDown, Type, Columns2,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, tooltip, children }: ToolbarButtonProps) {
  return (
    <Tooltip content={tooltip} position="bottom">
      <button
        onClick={(e) => { e.preventDefault(); onClick(); }}
        disabled={disabled}
        className={cn(
          'p-2 rounded-lg transition-all duration-100 cursor-pointer',
          'hover:bg-[var(--bg-hover)]',
          'disabled:opacity-30 disabled:cursor-not-allowed',
          isActive && 'bg-[var(--accent-bg)] text-[var(--accent-primary)]',
          !isActive && 'text-[var(--text-secondary)]'
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-[var(--border-default)] mx-2" />;
}

// Dropdown menu for grouping toolbar actions
function ToolbarDropdown({
  trigger,
  children,
  isActive,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); setOpen(!open); }}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-100 cursor-pointer',
          'hover:bg-[var(--bg-hover)]',
          isActive
            ? 'bg-[var(--accent-bg)] text-[var(--accent-primary)]'
            : 'text-[var(--text-secondary)]'
        )}
      >
        {trigger}
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-52 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-lg z-50 py-1.5 animate-fade-in-down">
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<{ closeMenu?: () => void }>, { closeMenu: () => setOpen(false) })
              : child
          )}
        </div>
      )}
    </div>
  );
}

function DropdownButton({
  onClick,
  isActive,
  icon,
  label,
  shortcut,
  closeMenu,
}: {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  closeMenu?: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
        closeMenu?.();
      }}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer',
        'hover:bg-[var(--bg-hover)]',
        isActive && 'text-[var(--accent-primary)] bg-[var(--accent-bg)]',
        !isActive && 'text-[var(--text-primary)]'
      )}
    >
      <span className="text-[var(--text-secondary)]">{icon}</span>
      <span className="text-sm flex-1">{label}</span>
      {shortcut && (
        <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded font-mono">
          {shortcut}
        </span>
      )}
    </button>
  );
}

function DropdownSep() {
  return <div className="h-px bg-[var(--border-default)] my-1" />;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  // Force re-render on every editor transaction so active states update instantly
  const [, setForceUpdate] = useState(0);
  
  useEffect(() => {
    const handler = () => setForceUpdate(n => n + 1);
    editor.on('transaction', handler);
    return () => { editor.off('transaction', handler); };
  }, [editor]);

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

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

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  // Determine current heading label for the dropdown trigger
  const getBlockLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    return 'Text';
  };

  return (
    <div className="flex items-center gap-0.5 px-4 py-2 border-b border-[var(--border-default)] bg-[var(--bg-primary)] sticky top-0 z-10 flex-wrap">
      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        tooltip="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-[18px] h-[18px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        tooltip="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-[18px] h-[18px]" />
      </ToolbarButton>

      <Separator />

      {/* Block Type Dropdown */}
      <ToolbarDropdown
        trigger={
          <span className="flex items-center gap-1.5">
            <Type className="w-4 h-4" />
            {getBlockLabel()}
          </span>
        }
        isActive={editor.isActive('heading')}
      >
        <DropdownButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={!editor.isActive('heading')}
          icon={<Type className="w-4 h-4" />}
          label="Text"
        />
        <DropdownButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={<Heading1 className="w-4 h-4" />}
          label="Heading 1"
        />
        <DropdownButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={<Heading2 className="w-4 h-4" />}
          label="Heading 2"
        />
        <DropdownButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={<Heading3 className="w-4 h-4" />}
          label="Heading 3"
        />
      </ToolbarDropdown>

      <Separator />

      {/* Core formatting — always visible */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        tooltip="Bold (Ctrl+B)"
      >
        <Bold className="w-[18px] h-[18px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        tooltip="Italic (Ctrl+I)"
      >
        <Italic className="w-[18px] h-[18px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        tooltip="Underline (Ctrl+U)"
      >
        <Underline className="w-[18px] h-[18px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        tooltip="Strikethrough"
      >
        <Strikethrough className="w-[18px] h-[18px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        tooltip="Inline Code"
      >
        <Code className="w-[18px] h-[18px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        tooltip="Highlight"
      >
        <Highlighter className="w-[18px] h-[18px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={addLink}
        isActive={editor.isActive('link')}
        tooltip="Link"
      >
        <LinkIcon className="w-[18px] h-[18px]" />
      </ToolbarButton>

      <Separator />

      {/* Lists dropdown */}
      <ToolbarDropdown
        trigger={
          <span className="flex items-center gap-1.5">
            <List className="w-4 h-4" />
            Lists
          </span>
        }
        isActive={editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')}
      >
        <DropdownButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={<List className="w-4 h-4" />}
          label="Bullet List"
        />
        <DropdownButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={<ListOrdered className="w-4 h-4" />}
          label="Numbered List"
        />
        <DropdownButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          icon={<CheckSquare className="w-4 h-4" />}
          label="Checklist"
        />
      </ToolbarDropdown>

      {/* Align dropdown */}
      <ToolbarDropdown
        trigger={
          <span className="flex items-center gap-1.5">
            <AlignLeft className="w-4 h-4" />
            Align
          </span>
        }
      >
        <DropdownButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          icon={<AlignLeft className="w-4 h-4" />}
          label="Left"
        />
        <DropdownButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          icon={<AlignCenter className="w-4 h-4" />}
          label="Center"
        />
        <DropdownButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          icon={<AlignRight className="w-4 h-4" />}
          label="Right"
        />
      </ToolbarDropdown>

      {/* Insert dropdown */}
      <ToolbarDropdown
        trigger={
          <span className="flex items-center gap-1.5">
            <Columns2 className="w-4 h-4" />
            Insert
          </span>
        }
      >
        <DropdownButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={<Quote className="w-4 h-4" />}
          label="Quote"
        />
        <DropdownButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          icon={<Code className="w-[18px] h-[18px]" />}
          label="Code Block"
        />
        <DropdownSep />
        <DropdownButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          isActive={false}
          icon={<Minus className="w-4 h-4" />}
          label="Divider"
        />
        <DropdownButton
          onClick={addTable}
          isActive={false}
          icon={<Table className="w-4 h-4" />}
          label="Table"
        />
        <DropdownButton
          onClick={addImage}
          isActive={false}
          icon={<ImageIcon className="w-4 h-4" />}
          label="Image"
        />
      </ToolbarDropdown>
    </div>
  );
}
