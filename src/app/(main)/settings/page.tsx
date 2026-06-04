'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { updateUserProfile } from '@/lib/firebase/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Mail, Palette, Shield, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, firebaseUser, signOut } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user || !displayName.trim()) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { displayName: displayName.trim() });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 5vw, 2rem)' }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ marginBottom: '2rem' }}>
          Settings
        </h1>

        {/* Profile Section */}
        <section
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]"
          style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
            <User className="w-5 h-5 text-[var(--text-secondary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Profile</h2>
          </div>

          <div className="flex items-center gap-4" style={{ marginBottom: '1.5rem' }}>
            <Avatar name={user?.displayName || 'User'} size="lg" src={user?.photoURL} />
            <div>
              <p className="font-medium text-[var(--text-primary)]">{user?.displayName || 'User'}</p>
              <p className="text-sm text-[var(--text-tertiary)]">{firebaseUser?.email}</p>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              placeholder="Your name"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Email"
              value={firebaseUser?.email || ''}
              disabled
              icon={<Mail className="w-4 h-4" />}
            />
          </div>

          <Button onClick={handleSaveProfile} isLoading={isSaving}>
            Save Changes
          </Button>
        </section>

        {/* Appearance Section */}
        <section
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]"
          style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
            <Palette className="w-5 h-5 text-[var(--text-secondary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Appearance</h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)]" style={{ marginBottom: '0.75rem' }}>
            Toggle between light and dark mode using the theme switch in the sidebar or header.
          </p>
        </section>

        {/* Account Section */}
        <section
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]"
          style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
            <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Account</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Sign out</p>
              <p className="text-xs text-[var(--text-tertiary)]">Sign out of your account on this device</p>
            </div>
            <Button variant="ghost" onClick={handleSignOut} icon={<LogOut className="w-4 h-4" />}>
              Sign out
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
