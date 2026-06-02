'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils/cn';
import {
  Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare,
  Code, Quote, Minus, Table, Image as ImageIcon,
  Type,
} from 'lucide-react';

interface SlashCommandMenuProps {
  editor: Editor;
}

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
}

const commands: CommandItem[] = [
  {
    title: 'Text',
    description: 'Just start writing with plain text.',
    icon: <Type className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Big section heading.',
    icon: <Heading1 className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading.',
    icon: <Heading2 className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading.',
    icon: <Heading3 className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list.',
    icon: <List className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Create a list with numbers.',
    icon: <ListOrdered className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Checklist',
    description: 'Track tasks with a to-do list.',
    icon: <CheckSquare className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: 'Code Block',
    description: 'Capture a code snippet.',
    icon: <Code className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Quote',
    description: 'Capture a quote.',
    icon: <Quote className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Divider',
    description: 'Visually divide blocks.',
    icon: <Minus className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Table',
    description: 'Add a simple table.',
    icon: <Table className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Image',
    description: 'Embed an image from a URL.',
    icon: <ImageIcon className="w-4 h-4" />,
    command: (editor) => {
      const url = window.prompt('Enter image URL:');
      if (url) editor.chain().focus().setImage({ src: url }).run();
    },
  },
];

export function SlashCommandMenu({ editor }: SlashCommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSlash = useCallback(() => {
    const { state } = editor;
    const { from } = state.selection;
    const textBefore = state.doc.textBetween(Math.max(0, from - 1), from);

    if (textBefore === '/') {
      // Get cursor position
      const coords = editor.view.coordsAtPos(from);
      const editorRect = editor.view.dom.getBoundingClientRect();
      
      setPosition({
        top: coords.bottom - editorRect.top + 8,
        left: coords.left - editorRect.left,
      });
      setIsOpen(true);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [editor]);

  useEffect(() => {
    editor.on('update', handleSlash);
    return () => {
      editor.off('update', handleSlash);
    };
  }, [editor, handleSlash]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          selectCommand(filteredCommands[selectedIndex]);
        }
        return;
      }

      // Track search input
      if (e.key === 'Backspace') {
        if (search.length === 0) {
          setIsOpen(false);
        } else {
          setSearch((prev) => prev.slice(0, -1));
        }
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setSearch((prev) => prev + e.key);
        setSelectedIndex(0);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, search, selectedIndex, filteredCommands]);

  const selectCommand = (command: CommandItem) => {
    // Delete the "/" character
    const { state } = editor;
    const { from } = state.selection;
    editor
      .chain()
      .focus()
      .deleteRange({ from: from - 1 - search.length, to: from })
      .run();

    command.command(editor);
    setIsOpen(false);
  };

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className={cn(
        'absolute z-50 w-72 max-h-80 overflow-y-auto',
        'bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl',
        'shadow-xl animate-fade-in-up py-1'
      )}
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
        Basic blocks
      </div>
      {filteredCommands.map((command, index) => (
        <button
          key={command.title}
          onClick={() => selectCommand(command)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer',
            index === selectedIndex
              ? 'bg-[var(--bg-hover)]'
              : 'hover:bg-[var(--bg-hover)]'
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-secondary)]">
            {command.icon}
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">{command.title}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{command.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
