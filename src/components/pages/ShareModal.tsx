'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { sharePage, unsharePage } from '@/lib/firebase/firestore';
import { Link2, Copy, Check, Globe, Lock, Pencil, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import type { Page } from '@/lib/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: Page;
  onUpdate: (updates: Partial<Page>) => void;
}

export function ShareModal({ isOpen, onClose, page, onUpdate }: ShareModalProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<'edit' | 'view'>(
    page.sharePermission || 'edit'
  );

  const shareLink = page.shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${page.shareToken}`
    : '';

  const handleEnableSharing = async () => {
    setIsSharing(true);
    try {
      const token = await sharePage(page.id, selectedPermission);
      onUpdate({ isShared: true, shareToken: token, sharePermission: selectedPermission });
      toast.success(`Page shared with ${selectedPermission === 'edit' ? 'edit' : 'view only'} access!`);
    } catch {
      toast.error('Failed to share page');
    } finally {
      setIsSharing(false);
    }
  };

  const handleUpdatePermission = async (permission: 'edit' | 'view') => {
    setSelectedPermission(permission);
    if (page.isShared) {
      // If already shared, update the permission live
      setIsSharing(true);
      try {
        const token = await sharePage(page.id, permission);
        onUpdate({ shareToken: token, sharePermission: permission });
        toast.success(`Permission updated to ${permission === 'edit' ? 'Can Edit' : 'View Only'}`);
      } catch {
        toast.error('Failed to update permission');
      } finally {
        setIsSharing(false);
      }
    }
  };

  const handleDisableSharing = async () => {
    setIsSharing(true);
    try {
      await unsharePage(page.id);
      onUpdate({ isShared: false, shareToken: null, sharedWith: [], sharePermission: 'edit' });
      toast.success('Sharing disabled');
    } catch {
      toast.error('Failed to disable sharing');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Page" size="md">
      <div className="space-y-6">
        {/* Share status header */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            {page.isShared ? (
              <div className="w-11 h-11 rounded-full bg-green-500/15 flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-500" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                <Lock className="w-5 h-5 text-[var(--text-tertiary)]" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {page.isShared
                  ? page.sharePermission === 'edit'
                    ? 'Anyone with the link can edit'
                    : 'Anyone with the link can view'
                  : 'Only you can access'}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {page.isShared
                  ? 'Friends with the link and an account can access'
                  : 'Choose a permission level and enable sharing'}
              </p>
            </div>
          </div>

          <Button
            onClick={page.isShared ? handleDisableSharing : handleEnableSharing}
            variant={page.isShared ? 'ghost' : 'primary'}
            size="sm"
            isLoading={isSharing}
          >
            {page.isShared ? 'Disable' : 'Share'}
          </Button>
        </div>

        {/* Permission selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Permission
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Can Edit */}
            <button
              onClick={() => handleUpdatePermission('edit')}
              className={cn(
                'flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all cursor-pointer',
                selectedPermission === 'edit'
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-bg)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)]'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                selectedPermission === 'edit'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
              )}>
                <Pencil className="w-4.5 h-4.5" />
              </div>
              <div className="text-center">
                <p className={cn(
                  'text-sm font-semibold',
                  selectedPermission === 'edit' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                )}>
                  Can Edit
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  View & make changes
                </p>
              </div>
            </button>

            {/* View Only */}
            <button
              onClick={() => handleUpdatePermission('view')}
              className={cn(
                'flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all cursor-pointer',
                selectedPermission === 'view'
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-bg)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)]'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                selectedPermission === 'view'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
              )}>
                <Eye className="w-4.5 h-4.5" />
              </div>
              <div className="text-center">
                <p className={cn(
                  'text-sm font-semibold',
                  selectedPermission === 'view' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                )}>
                  View Only
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  Read but no editing
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Share link */}
        {page.isShared && page.shareToken && (
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Share Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3.5 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-default)] overflow-hidden">
                <Link2 className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
                <span className="text-sm text-[var(--text-secondary)] truncate font-mono">
                  {shareLink}
                </span>
              </div>
              <Button
                onClick={handleCopyLink}
                variant="secondary"
                size="sm"
                icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3.5 rounded-xl bg-[var(--accent-bg)] border border-[var(--accent-primary)]/20">
          <p className="text-xs text-[var(--accent-primary)] leading-relaxed">
            💡 Your friends need to <strong>create an account</strong> on this app first. Once they have an account, they can open the share link to {selectedPermission === 'edit' ? 'view and edit' : 'view'} this page.
          </p>
        </div>
      </div>
    </Modal>
  );
}
