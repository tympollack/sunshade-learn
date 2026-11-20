import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { Domain, Entry, CultivationEvent } from './types';
import { Navbar } from './components/Navbar';
import { UnauthenticatedLanding } from './components/UnauthenticatedLanding';
import { LogLearningDrawer } from './components/LogLearningDrawer';
import { DomainCard } from './components/DomainCard';
import { WhatStacksNext } from './components/WhatStacksNext';
import { TrajectoryTimeline } from './components/TrajectoryTimeline';
import { SocraticCheckModal } from './components/SocraticCheckModal';
import { PeerSignoffModal } from './components/PeerSignoffModal';
import { DeleteLedgerModal } from './components/DeleteLedgerModal';
import { ShareView } from './components/ShareView';
import { MentorSignoffView } from './components/MentorSignoffView';
import { Loader2, Plus, BookOpen } from 'lucide-react';

export const App: React.FC = () => {
  // Routing checks
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (pathname.startsWith('/share/')) {
    const token = pathname.replace('/share/', '').trim();
    return <ShareView token={token} />;
  }
  if (pathname.startsWith('/signoff/')) {
    const token = pathname.replace('/signoff/', '').trim();
    return <MentorSignoffView token={token} />;
  }

  // Auth State
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  // Ledger Data State
  const [domains, setDomains] = useState<Domain[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [events, setEvents] = useState<CultivationEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Modals & Drawers
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [socraticEntry, setSocraticEntry] = useState<Entry | null>(null);
  const [peerSignoffEntry, setPeerSignoffEntry] = useState<Entry | null>(null);

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSessionLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Ledger data from 'learn' schema
  const fetchLedgerData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [{ data: domData }, { data: entData }, { data: evData }] = await Promise.all([
        supabase.from('domains').select('*').order('created_at', { ascending: true }),
        supabase.from('entries').select('*').order('created_at', { ascending: true }),
        supabase.from('cultivation_events').select('*').order('seq_num', { ascending: true }),
      ]);

      setDomains(domData || []);
      setEntries(entData || []);
      setEvents(evData || []);
    } catch (err) {
      console.error('Error fetching ledger data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchLedgerData();
    }
  }, [user, fetchLedgerData]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center space-y-3 text-crisp">
        <Loader2 className="w-8 h-8 text-burnt animate-spin" />
        <p className="text-xs text-subtle font-mono">Synchronizing SunShade Session...</p>
      </div>
    );
  }

  // Unauthenticated Citizen Landing
  if (!user) {
    return <UnauthenticatedLanding />;
  }

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#f9f9f9] selection:bg-burnt/30 selection:text-burnt">
      
      {/* Living Print Header (Only visible when printed for physical binder) */}
      <div className="hidden print-page-header">
        <h1 className="text-2xl font-bold">Blueprint Academy — Proof-of-Cultivation Portfolio</h1>
        <p className="text-xs text-gray-600">
          Citizen ID: {user.id} • Printed: {new Date().toLocaleDateString()} • Schema: learn
        </p>
      </div>

      {/* Navbar */}
      <Navbar
        userEmail={user.email}
        onOpenLogDrawer={() => setIsLogDrawerOpen(true)}
        onOpenDeleteModal={() => setIsDeleteModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* What Stacks Next (Action recommendations) */}
        <WhatStacksNext
          items={entries}
          onOpenSocraticCheck={(entry) => setSocraticEntry(entry)}
          onOpenPeerSignoff={(entry) => setPeerSignoffEntry(entry)}
        />

        {/* 2-Column Ledger Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column: Knowledge Domains & Entries (2 Cols on lg) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between no-print">
              <h2 className="text-sm font-mono uppercase tracking-wider text-burnt font-bold">
                Knowledge Domains ({domains.length})
              </h2>
              <button
                onClick={() => setIsLogDrawerOpen(true)}
                className="text-xs text-burnt hover:text-burnt-light font-medium flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Entry</span>
              </button>
            </div>

            {dataLoading && domains.length === 0 ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 text-burnt animate-spin mx-auto mb-2" />
                <p className="text-xs text-subtle font-mono">Loading Knowledge Ledger...</p>
              </div>
            ) : domains.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#141211] border border-[#262422] text-center space-y-4 no-print">
                <div className="w-12 h-12 rounded-xl bg-burnt/15 border border-burnt/30 text-burnt flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-crisp">No Domains Seeded Yet</h3>
                <p className="text-xs text-subtle max-w-md mx-auto leading-relaxed">
                  Start your Proof-of-Cultivation progression ledger. Log an article, book, codebase, or adopt a structured curriculum track to begin Stage 1.
                </p>
                <button
                  onClick={() => setIsLogDrawerOpen(true)}
                  className="px-5 py-2.5 text-xs font-semibold bg-burnt hover:bg-burnt-light text-charcoal-950 rounded-xl shadow transition-colors inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Seed First Entry</span>
                </button>
              </div>
            ) : (
              domains.map((dom) => (
                <DomainCard
                  key={dom.id}
                  domain={dom}
                  items={entries.filter((ent) => ent.domain_id === dom.id)}
                  onUpdate={fetchLedgerData}
                  onOpenSocraticCheck={(entry) => setSocraticEntry(entry)}
                  onOpenPeerSignoff={(entry) => setPeerSignoffEntry(entry)}
                  onOpenLogDrawerForDomain={(_domainId) => setIsLogDrawerOpen(true)}
                />
              ))
            )}
          </div>

          {/* Right Column: Longitudinal Trajectory Timeline */}
          <div className="space-y-6">
            <TrajectoryTimeline events={events} />
          </div>

        </div>

      </main>

      {/* Log Learning Drawer */}
      <LogLearningDrawer
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
        domains={domains}
        onItemCreated={fetchLedgerData}
        onDomainCreated={(_newDom) => fetchLedgerData()}
      />

      {/* Ephemeral Socratic Check Modal */}
      <SocraticCheckModal
        item={socraticEntry}
        isOpen={Boolean(socraticEntry)}
        onClose={() => setSocraticEntry(null)}
        onCultivated={() => {
          setSocraticEntry(null);
          fetchLedgerData();
        }}
      />

      {/* Single-Use Peer Signoff Modal */}
      <PeerSignoffModal
        item={peerSignoffEntry}
        isOpen={Boolean(peerSignoffEntry)}
        onClose={() => setPeerSignoffEntry(null)}
      />

      {/* Hard-Delete Data Sovereignty Modal */}
      <DeleteLedgerModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={() => {
          setDomains([]);
          setEntries([]);
          setEvents([]);
        }}
      />

    </div>
  );
};
