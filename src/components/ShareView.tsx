import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  ExternalLink, 
  Printer, 
  Loader2, 
  Hash, 
  Award,
  CheckCircle2 
} from 'lucide-react';
import { Domain, Entry, CultivationEvent, VerifiableCredential } from '../types';
import { supabase } from '../lib/supabase';

interface ShareViewProps {
  token: string;
}

interface SharedDomainBundle {
  domain: Domain;
  entries: Entry[];
  events: CultivationEvent[];
  credentials: VerifiableCredential[];
  chain_verified: boolean;
}

export const ShareView: React.FC<ShareViewProps> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bundle, setBundle] = useState<SharedDomainBundle | null>(null);

  useEffect(() => {
    const fetchSharedDomain = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        // Invoke canonical learn.get_shared_domain RPC
        // Returns null for private or nonexistent domains
        const { data, error } = await supabase.rpc('get_shared_domain', {
          p_share_token: token,
        });

        if (error || !data) {
          setNotFound(true);
          return;
        }

        setBundle(data as SharedDomainBundle);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedDomain();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center space-y-3 text-crisp">
        <Loader2 className="w-8 h-8 text-burnt animate-spin" />
        <p className="text-xs text-subtle font-mono">Verifying Proof-of-Cultivation Ledger...</p>
      </div>
    );
  }

  // 404 state for private or nonexistent tokens
  if (notFound || !bundle || !bundle.domain) {
    return (
      <div className="min-h-screen bg-[#0c0a09] text-crisp flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#141211] border border-[#262422] flex items-center justify-center text-burnt mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">404 — Ledger Domain Private or Not Found</h1>
        <p className="text-xs text-subtle max-w-md mt-2 leading-relaxed">
          This learning domain is either set to Private (the citizen default) or does not exist. 
          Proof-of-Cultivation ledgers require explicit unlisted sharing by their owner.
        </p>
        <a
          href="/"
          className="mt-6 px-4 py-2 text-xs font-semibold bg-burnt text-charcoal-950 rounded-lg hover:bg-burnt-light transition-colors"
        >
          Go to Blueprint Academy
        </a>
      </div>
    );
  }

  const { domain, entries, credentials, chain_verified, events } = bundle;

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#f9f9f9] selection:bg-burnt/30 selection:text-burnt">
      
      {/* Top Header */}
      <header className="border-b border-[#262422] bg-[#141211]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30 no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-burnt/15 border border-burnt/40 flex items-center justify-center text-burnt">
              <BookOpen className="w-5 h-5 text-burnt" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-crisp">
                Blueprint Academy
              </span>
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-cyanic/10 text-cyanic border border-cyanic/30 rounded">
                Verified Ledger
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-medium text-subtle hover:text-crisp bg-[#1a1816] hover:bg-[#262422] border border-[#262422] rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-subtle" />
              <span>Print Portfolio</span>
            </button>
            <a
              href="/"
              className="px-3 py-1.5 text-xs font-semibold bg-burnt hover:bg-burnt-light text-charcoal-950 rounded-lg transition-colors"
            >
              Enter Academy
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        
        {/* Domain Title & Verification Badge */}
        <div className="p-6 rounded-2xl bg-[#141211] border border-[#262422] space-y-4 print-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-burnt tracking-wider font-bold">
                Knowledge Domain: {domain.slug}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-crisp tracking-tight mt-1 print-card-title">
                {domain.title}
              </h1>
              {domain.description && (
                <p className="text-sm text-subtle mt-1.5 max-w-2xl leading-relaxed">
                  {domain.description}
                </p>
              )}
            </div>

            {/* Cryptographic Verification Badge */}
            <div
              className={`p-3 rounded-xl border flex items-center space-x-2.5 shrink-0 self-start sm:self-center ${
                chain_verified
                  ? 'bg-cyanic/10 border-cyanic/40 text-cyanic'
                  : 'bg-red-950/20 border-red-800 text-red-400'
              }`}
            >
              {chain_verified ? (
                <ShieldCheck className="w-5 h-5 text-cyanic shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div className="text-left font-mono">
                <div className="text-xs font-bold">
                  {chain_verified ? 'Cryptographically Verified' : 'Chain Tamper Detected'}
                </div>
                <div className="text-[10px] text-subtle">
                  {events?.length || 0} events chained via SHA-256
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verifiable Credentials if present */}
        {credentials && credentials.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-cyanic font-bold flex items-center space-x-1.5">
              <Award className="w-4 h-4" />
              <span>Verifiable Credentials ({credentials.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {credentials.map((vc) => (
                <div key={vc.id} className="p-4 rounded-xl bg-[#141211] border border-cyanic/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase bg-cyanic/15 text-cyanic px-2 py-0.5 rounded border border-cyanic/30 font-semibold">
                      {vc.verification_status}
                    </span>
                    {vc.issuer_name && (
                      <span className="text-[11px] text-subtle font-mono">{vc.issuer_name}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-crisp">{vc.title}</h3>
                  <div className="text-[10px] font-mono text-subtle flex items-center space-x-1">
                    <Hash className="w-3 h-3 text-burnt shrink-0" />
                    <span className="truncate">{vc.evidence_sha256}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progression Entries List */}
        <div className="space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-burnt font-bold">
            Cultivated Ledger Entries ({entries.length})
          </h2>

          {entries.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#141211] border border-[#262422] text-center text-xs text-subtle font-mono">
              No entries in this domain ledger.
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-5 rounded-xl bg-[#141211] border border-[#262422] space-y-3 print-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        entry.current_stage === 'cultivated'
                          ? 'bg-cyanic/20 text-cyanic border border-cyanic/40'
                          : 'bg-[#1a1816] text-subtle border border-[#262422]'
                      }`}
                    >
                      {entry.current_stage}
                    </span>
                    <h3 className="text-sm font-bold text-crisp print-card-title">
                      {entry.title}
                    </h3>
                  </div>

                  {entry.source_uri && (
                    <a
                      href={entry.source_uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-burnt hover:underline flex items-center space-x-1 self-start sm:self-auto"
                    >
                      <span>Source [{entry.source_kind.toUpperCase()}]</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </main>

    </div>
  );
};
