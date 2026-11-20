import React, { useState, useEffect } from 'react';
import { X, UserCheck, Copy, Check, Loader2, Clock, ShieldAlert } from 'lucide-react';
import { Entry } from '../types';
import { supabase } from '../lib/supabase';

interface PeerSignoffModalProps {
  item: Entry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PeerSignoffModal: React.FC<PeerSignoffModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !item) {
      setToken('');
      setError(null);
      return;
    }

    const generateToken = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Check if an active unredeemed invite already exists for this entry
        const { data: existing } = await supabase
          .from('peer_attestation_invites')
          .select('*')
          .eq('entry_id', item.id)
          .is('redeemed_at', null)
          .gt('expires_at', new Date().toISOString())
          .limit(1)
          .maybeSingle();

        if (existing) {
          setToken(existing.token);
          return;
        }

        // Insert new invite - default token is generated in PostgreSQL!
        const { data: created, error: createErr } = await supabase
          .from('peer_attestation_invites')
          .insert({
            entry_id: item.id,
            user_id: user.id,
          })
          .select()
          .single();

        if (createErr || !created) {
          throw new Error(createErr?.message || 'Failed to generate sign-off token');
        }

        setToken(created.token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error generating token');
      } finally {
        setLoading(false);
      }
    };

    generateToken();
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://learn.sunshade.icu';
  const signoffUrl = `${origin}/signoff/${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(signoffUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-[#141211] border border-[#262422] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyanic/15 border border-cyanic/30 flex items-center justify-center text-cyanic shadow-sm">
                <UserCheck className="w-5 h-5 text-cyanic" />
              </div>
              <div>
                <h3 className="text-base font-bold text-crisp">
                  Single-Use Peer/Mentor Sign-Off
                </h3>
                <p className="text-xs text-subtle font-mono">
                  {item.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-subtle hover:text-crisp rounded-lg hover:bg-[#262422]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-subtle leading-relaxed">
            Share this link with a peer, teacher, or mentor. They can inspect your synthesized takeaways and applied proof, then sign their attestation to cultivate this item.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-cyanic animate-spin" />
              <p className="text-xs text-subtle font-mono">Scaffolding single-use link...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                  Single-Use Attestation Link:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={signoffUrl}
                    className="flex-1 px-3 py-2 bg-[#0c0a09] border border-[#262422] rounded-lg text-xs font-mono text-cyanic select-all outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2 text-xs font-semibold bg-cyanic hover:bg-cyanic-light text-charcoal-950 rounded-lg flex items-center space-x-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#0c0a09] border border-[#262422] flex items-center space-x-2 text-subtle">
                  <Clock className="w-4 h-4 text-burnt shrink-0" />
                  <span>Expires in 7 days</span>
                </div>
                <div className="p-3 rounded-lg bg-[#0c0a09] border border-[#262422] flex items-center space-x-2 text-subtle">
                  <ShieldAlert className="w-4 h-4 text-cyanic shrink-0" />
                  <span>Single-use invalidation</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-subtle hover:text-crisp rounded-lg hover:bg-[#262422]"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
