import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  ExternalLink, 
  Loader2, 
  AlertTriangle, 
  ShieldCheck 
} from 'lucide-react';
import { Entry } from '../types';
import { supabase } from '../lib/supabase';

interface MentorSignoffViewProps {
  token: string;
}

export const MentorSignoffView: React.FC<MentorSignoffViewProps> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [invalidToken, setInvalidToken] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerNotes, setSignerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSignoffData = async () => {
      setLoading(true);
      setInvalidToken(false);
      try {
        const { data: so, error: soErr } = await supabase
          .from('peer_attestation_invites')
          .select('*, entry:entries(*)')
          .eq('token', token)
          .is('redeemed_at', null)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (soErr || !so || !so.entry) {
          setInvalidToken(true);
          return;
        }

        setEntry(so.entry as Entry);
      } catch {
        setInvalidToken(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSignoffData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      setError('Your name or role is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Call canonical learn.redeem_peer_attestation RPC
      const { data, error: rpcErr } = await supabase.rpc('redeem_peer_attestation', {
        p_token: token,
        p_attestor_label: signerName.trim(),
        p_attestor_note: signerNotes.trim() || null,
      });

      if (rpcErr || !data) {
        throw new Error(rpcErr?.message || 'Failed to submit attestation');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting signoff');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center space-y-3 text-crisp">
        <Loader2 className="w-8 h-8 text-cyanic animate-spin" />
        <p className="text-xs text-subtle font-mono">Loading Attestation Request...</p>
      </div>
    );
  }

  if (invalidToken || !entry) {
    return (
      <div className="min-h-screen bg-[#0c0a09] text-crisp flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#141211] border border-[#262422] flex items-center justify-center text-burnt mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sign-Off Link Expired or Invalid</h1>
        <p className="text-xs text-subtle max-w-md mt-2 leading-relaxed">
          This single-use peer/mentor attestation link has either already been used or expired.
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

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#f9f9f9] flex flex-col justify-between selection:bg-burnt/30 selection:text-burnt">
      
      {/* Header */}
      <header className="border-b border-[#262422] bg-[#141211]/90 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyanic/15 border border-cyanic/30 flex items-center justify-center text-cyanic">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-crisp">Blueprint Academy</span>
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-cyanic/10 text-cyanic border border-cyanic/30 rounded">
                Mentor Sign-Off
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        {success ? (
          <div className="p-8 rounded-2xl bg-[#141211] border border-cyanic/40 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-full bg-cyanic/20 text-cyanic flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-crisp">Attestation Recorded!</h2>
            <p className="text-xs text-subtle max-w-md mx-auto leading-relaxed">
              Thank you, <span className="text-crisp font-semibold">{signerName}</span>. Your attestation has been cryptographically recorded to the learner's Proof-of-Cultivation progression ledger.
            </p>
            <p className="text-[11px] font-mono text-cyanic">
              Status: Stage 4 (Cultivated) Validated
            </p>
          </div>
        ) : (
          <div className="bg-[#141211] border border-[#262422] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            
            <div>
              <span className="text-[10px] font-mono uppercase text-burnt font-bold">
                Proof Review Request
              </span>
              <h1 className="text-2xl font-bold text-crisp mt-1">
                {entry.title}
              </h1>
              {entry.source_uri && (
                <div className="mt-2 flex items-center space-x-1.5 text-xs text-cyanic">
                  <span className="text-subtle">Source:</span>
                  <a
                    href={entry.source_uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center space-x-1"
                  >
                    <span>{entry.source_uri}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Sign-Off Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-[#262422]">
              {error && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                  Your Name or Role *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Lead Architect Sarah, or Peer Code Reviewer"
                  className="w-full px-3.5 py-2.5 bg-[#0c0a09] border border-[#262422] focus:border-cyanic rounded-lg text-xs text-crisp outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                  Attestation Feedback or Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={signerNotes}
                  onChange={(e) => setSignerNotes(e.target.value)}
                  placeholder="e.g. Reviewed architecture; demonstrated solid understanding of consensus invariants."
                  className="w-full px-3.5 py-2.5 bg-[#0c0a09] border border-[#262422] focus:border-cyanic rounded-lg text-xs text-crisp outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-xs font-semibold bg-cyanic hover:bg-cyanic-light text-charcoal-950 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Attesting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Attest Proof-of-Cultivation</span>
                  </>
                )}
              </button>
            </form>

          </div>
        )}
      </main>

      <footer className="border-t border-[#262422] bg-[#141211] px-6 py-4 text-center text-xs text-subtle font-mono">
        SunShade Systems Blueprint Academy • Single-Use Peer Handshake
      </footer>

    </div>
  );
};
