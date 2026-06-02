'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { searchPages } from '@/lib/firebase/firestore';
import { PageCard } from '@/components/pages/PageCard';
import { Input } from '@/components/ui/Input';
import { Search as SearchIcon } from 'lucide-react';
import type { Page } from '@/lib/types';

export default function SearchPage() {
  const { workspace } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Page[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!workspace || !q.trim()) { setResults([]); setSearched(false); return; }
    const r = await searchPages(workspace.id, q);
    setResults(r);
    setSearched(true);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">🔍 Search</h1>
        <Input
          placeholder="Search pages by title or content..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          icon={<SearchIcon className="w-4 h-4" />}
          className="mb-8"
        />
        {searched && results.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-tertiary)] py-8">No results found for &quot;{query}&quot;</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {results.map((page) => <PageCard key={page.id} page={page} />)}
          </div>
        )}
      </div>
    </div>
  );
}
