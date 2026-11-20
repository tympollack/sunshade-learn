import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck, CheckCircle2, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Entry } from '../types';
import { supabase } from '../lib/supabase';

interface SocraticCheckModalProps {
  item: Entry | null;
  isOpen: boolean;
  onClose: () => void;
  onCultivated: () => void;
}

export const SocraticCheckModal: React.FC<SocraticCheckModalProps> = ({
  item,
  isOpen,
  onClose,
  onCultivated,
}) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    coachingBrief: string;
    hash?: string;
  } | null>(null);

  // Initialize Socratic Inquiry when opened
  useEffect(() => {
    if (!isOpen || !item) {
      setQuestions([]);
      setAnswers(['', '', '']);
      setSuccessResult(null);
      setError(null);
      return;
    }

    const initSocraticSession = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch('/api/learn/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            action: 'start',
            itemId: item.id,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to initialize Socratic inquiry');
        }

        setQuestions(data.questions || []);
        setSessionToken(data.sessionToken || '');
        setAnswers(['', '', '']);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error starting Socratic check');
      } finally {
        setLoading(false);
      }
    };

    initSocraticSession();
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmitAnswers = async () => {
    setError(null);
    if (answers.some((a) => !a || a.trim().length < 8)) {
      setError('Please provide thoughtful answers (at least 8 characters) to all 3 prompts.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/learn/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'submit',
          itemId: item.id,
          answers,
          sessionToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ephemeral evaluation failed');
      }

      setSuccessResult({
        coachingBrief: data.coaching_brief,
        hash: data.event?.event_hash,
      });

      onCultivated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-xl bg-[#141211] border border-[#262422] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-burnt/15 border border-burnt/40 flex items-center justify-center text-burnt shadow-sm shadow-burnt/20">
                <Sparkles className="w-5 h-5 text-burnt" />
              </div>
              <div>
                <h3 className="text-base font-bold text-crisp">
                  Ephemeral Socratic Verification
                </h3>
                <p className="text-xs text-subtle font-mono">
                  Target: {item.title}
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

          {/* Privacy & Zero-Retention Notice */}
          <div className="p-3 rounded-lg bg-[#0c0a09] border border-[#262422] flex items-start space-x-2.5 text-xs text-subtle">
            <Lock className="w-4 h-4 text-cyanic shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-crisp">Zero-Retention Invariant:</span> Your raw responses are evaluated strictly in-memory and immediately discarded. Only the concise coaching attestation and event hash are recorded to the ledger.
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Success State */}
          {successResult ? (
            <div className="py-6 space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-cyanic/20 border-2 border-cyanic text-cyanic flex items-center justify-center mx-auto shadow-lg shadow-cyanic/25 animate-in zoom-in-75">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-crisp">Proof-of-Cultivation Attested!</h4>
                <p className="text-xs text-subtle mt-1 font-mono">
                  Your entry has achieved Stage 4 (Cultivated) on the ledger.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0c0a09] border border-[#262422] text-left space-y-2">
                <div className="text-[11px] font-mono uppercase text-burnt font-semibold flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Post-Session Coaching Brief:</span>
                </div>
                <p className="text-xs text-crisp leading-relaxed">
                  {successResult.coachingBrief}
                </p>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-semibold bg-burnt hover:bg-burnt-light text-charcoal-950 rounded-lg shadow-md transition-all"
              >
                Return to Progression Ledger
              </button>
            </div>
          ) : loading && questions.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-burnt animate-spin" />
              <p className="text-xs text-subtle font-mono">Formulating Socratic prompts...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {questions.map((q, idx) => (
                <div key={idx} className="space-y-2">
                  <label className="block text-xs font-semibold text-crisp leading-snug">
                    <span className="text-burnt font-mono mr-1.5">Prompt {idx + 1}:</span>
                    {q}
                  </label>
                  <textarea
                    rows={2}
                    value={answers[idx] || ''}
                    onChange={(e) => {
                      const next = [...answers];
                      next[idx] = e.target.value;
                      setAnswers(next);
                    }}
                    placeholder="Provide your synthesis or reasoning..."
                    className="w-full px-3.5 py-2.5 bg-[#0c0a09] border border-[#262422] focus:border-burnt rounded-lg text-xs text-crisp outline-none resize-none transition-colors"
                  />
                </div>
              ))}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-subtle hover:text-crisp rounded-lg hover:bg-[#262422]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAnswers}
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-semibold text-charcoal-950 bg-burnt hover:bg-burnt-light disabled:opacity-50 rounded-lg shadow-md transition-colors flex items-center space-x-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Socratic Check</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
