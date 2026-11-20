import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  UserCheck, 
  ExternalLink, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  Hash, 
  ChevronRight 
} from 'lucide-react';
import { Entry, CultivationStage } from '../types';
import { supabase } from '../lib/supabase';

interface CultivationStepperProps {
  item: Entry;
  onUpdate: () => void;
  onOpenSocraticCheck: (item: Entry) => void;
  onOpenPeerSignoff: (item: Entry) => void;
}

const STAGES: { id: CultivationStage; label: string; number: number }[] = [
  { id: 'seeded', label: 'Seeded', number: 1 },
  { id: 'studied', label: 'Studied', number: 2 },
  { id: 'applied', label: 'Applied', number: 3 },
  { id: 'cultivated', label: 'Cultivated', number: 4 },
];

export const CultivationStepper: React.FC<CultivationStepperProps> = ({
  item,
  onUpdate,
  onOpenSocraticCheck,
  onOpenPeerSignoff,
}) => {
  // Synthesis Bullets state for "Studied" stage
  const [bullets, setBullets] = useState<string[]>(['', '', '']);
  const [synthesisParagraph, setSynthesisParagraph] = useState('');
  
  // Applied State
  const [artifactUrl, setArtifactUrl] = useState('');
  const [appliedNotes, setAppliedNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStageIndex = STAGES.findIndex((s) => s.id === item.current_stage);

  // Advance to "Studied" via canonical learn.append_cultivation_event RPC
  const handleSaveStudied = async () => {
    setError(null);
    const validBullets = bullets.map((b) => b.trim()).filter(Boolean);
    const combinedNotes = synthesisParagraph.trim() 
      ? synthesisParagraph.trim() 
      : validBullets.join(' • ');

    if (combinedNotes.length < 20) {
      setError('Studied stage requires a plain-language synthesis note (at least 20 characters).');
      return;
    }

    setIsSaving(true);
    try {
      const { error: rpcErr } = await supabase.rpc('append_cultivation_event', {
        p_entry_id: item.id,
        p_stage: 'studied',
        p_synthesis_notes: combinedNotes,
        p_artifact_uri: null,
        p_attestation_kind: 'self_synthesis',
        p_payload_json: { bullets: validBullets },
      });

      if (rpcErr) throw rpcErr;
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance to Studied stage');
    } finally {
      setIsSaving(false);
    }
  };

  // Advance to "Applied" via canonical learn.append_cultivation_event RPC
  const handleSaveApplied = async () => {
    setError(null);
    if (!artifactUrl.trim() && !appliedNotes.trim()) {
      setError('Please provide either an artifact URL or applied execution notes.');
      return;
    }

    setIsSaving(true);
    try {
      const { error: rpcErr } = await supabase.rpc('append_cultivation_event', {
        p_entry_id: item.id,
        p_stage: 'applied',
        p_synthesis_notes: appliedNotes.trim() || null,
        p_artifact_uri: artifactUrl.trim() || null,
        p_attestation_kind: 'self_synthesis',
        p_payload_json: {
          artifact_url: artifactUrl.trim() || null,
          applied_notes: appliedNotes.trim() || null,
        },
      });

      if (rpcErr) throw rpcErr;
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance to Applied stage');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#141211] border border-[#262422] rounded-xl p-5 space-y-6">
      
      {/* 4-Stage Progress Header */}
      <div className="grid grid-cols-4 gap-2">
        {STAGES.map((s, idx) => {
          const isComplete = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;

          return (
            <div key={s.id} className="flex flex-col items-center text-center space-y-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                  isComplete
                    ? 'bg-burnt text-charcoal-950 font-extrabold'
                    : isCurrent
                    ? 'bg-burnt/20 border-2 border-burnt text-burnt'
                    : 'bg-[#1a1816] border border-[#262422] text-subtle'
                }`}
              >
                {isComplete ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.number}
              </div>
              <span
                className={`text-[11px] font-semibold tracking-tight ${
                  isCurrent ? 'text-burnt' : isComplete ? 'text-crisp' : 'text-subtle'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Stage Specific Panels */}
      
      {/* 1. SEEDED */}
      {item.current_stage === 'seeded' && (
        <div className="p-4 rounded-lg bg-[#0c0a09] border border-[#262422] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-burnt font-bold">Stage 1: Seeded</span>
            <span className="text-[10px] font-mono text-subtle">
              Source: [{item.source_kind.toUpperCase()}]
            </span>
          </div>
          <p className="text-xs text-subtle">
            Knowledge entry is captured in your ledger. Ready to synthesize core takeaways into plain language?
          </p>

          {/* Form to advance to Studied */}
          <div className="space-y-3 pt-2 border-t border-[#262422]">
            <label className="block text-xs font-medium text-crisp">
              Plain-Language Synthesis Bullets (Minimum 3, 20+ chars):
            </label>
            {bullets.map((b, i) => (
              <div key={i} className="flex items-center space-x-2">
                <span className="text-xs font-mono text-burnt font-bold">{i + 1}.</span>
                <input
                  type="text"
                  value={b}
                  onChange={(e) => {
                    const next = [...bullets];
                    next[i] = e.target.value;
                    setBullets(next);
                  }}
                  placeholder={`Takeaway ${i + 1} (in your own words)`}
                  className="flex-1 px-3 py-1.5 bg-[#141211] border border-[#262422] focus:border-burnt rounded-md text-xs text-crisp outline-none"
                />
                {bullets.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setBullets(bullets.filter((_, idx) => idx !== i))}
                    className="p-1 text-subtle hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {bullets.length < 5 && (
              <button
                type="button"
                onClick={() => setBullets([...bullets, ''])}
                className="text-[11px] text-cyanic hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add bullet</span>
              </button>
            )}

            <button
              onClick={handleSaveStudied}
              disabled={isSaving}
              className="mt-3 px-4 py-2 text-xs font-semibold bg-burnt hover:bg-burnt-light text-charcoal-950 rounded-lg shadow transition-colors"
            >
              {isSaving ? 'Advancing...' : 'Attest Studied (Advance to Stage 2)'}
            </button>
          </div>
        </div>
      )}

      {/* 2. STUDIED */}
      {item.current_stage === 'studied' && (
        <div className="p-4 rounded-lg bg-[#0c0a09] border border-[#262422] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-cyanic font-bold">Stage 2: Studied</span>
            <span className="text-[10px] font-mono text-subtle flex items-center">
              <Clock className="w-3 h-3 mr-1 text-cyanic" />
              Ready for Applied Proof
            </span>
          </div>

          {/* Form to advance to Applied */}
          <div className="space-y-3 pt-3 border-t border-[#262422]">
            <h4 className="text-xs font-semibold text-crisp">
              Submit Practical Applied Proof (Stage 3):
            </h4>
            <input
              type="text"
              value={artifactUrl}
              onChange={(e) => setArtifactUrl(e.target.value)}
              placeholder="Artifact / GitHub / Build URL (e.g. https://github.com/...)"
              className="w-full px-3 py-2 bg-[#141211] border border-[#262422] focus:border-burnt rounded-md text-xs text-crisp outline-none"
            />
            <textarea
              value={appliedNotes}
              onChange={(e) => setAppliedNotes(e.target.value)}
              placeholder="Or practical notes / execution reflection..."
              rows={2}
              className="w-full px-3 py-2 bg-[#141211] border border-[#262422] focus:border-burnt rounded-md text-xs text-crisp outline-none resize-none"
            />
            <button
              onClick={handleSaveApplied}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold bg-burnt hover:bg-burnt-light text-charcoal-950 rounded-lg shadow transition-colors"
            >
              {isSaving ? 'Saving...' : 'Submit Applied Proof (Advance to Stage 3)'}
            </button>
          </div>
        </div>
      )}

      {/* 3. APPLIED */}
      {item.current_stage === 'applied' && (
        <div className="p-4 rounded-lg bg-[#0c0a09] border border-[#262422] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-burnt font-bold">Stage 3: Applied</span>
            <span className="text-[10px] font-mono text-cyanic flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              Ready for Cultivation Attestation
            </span>
          </div>

          <div className="pt-3 border-t border-[#262422] space-y-3">
            <h4 className="text-xs font-semibold text-crisp">
              Final Stage: Verify Proof-of-Cultivation
            </h4>
            <p className="text-[11px] text-subtle">
              Demonstrate active mastery via Ephemeral AI Socratic Inquiry or generate a single-use Peer/Mentor sign-off invite.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => onOpenSocraticCheck(item)}
                className="p-3 rounded-lg bg-burnt/15 border border-burnt/40 hover:bg-burnt/25 text-left transition-all flex items-start space-x-2.5 group"
              >
                <Sparkles className="w-4 h-4 text-burnt shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-burnt">Ephemeral Socratic Check</div>
                  <div className="text-[10px] text-subtle mt-0.5">
                    3 conversational prompts in-memory. Zero transcript saved.
                  </div>
                </div>
              </button>

              <button
                onClick={() => onOpenPeerSignoff(item)}
                className="p-3 rounded-lg bg-cyanic/10 border border-cyanic/30 hover:bg-cyanic/20 text-left transition-all flex items-start space-x-2.5 group"
              >
                <UserCheck className="w-4 h-4 text-cyanic shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-cyanic">Peer / Mentor Sign-Off</div>
                  <div className="text-[10px] text-subtle mt-0.5">
                    Generate single-use attestation link for review.
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CULTIVATED */}
      {item.current_stage === 'cultivated' && (
        <div className="p-4 rounded-lg bg-cyanic/10 border border-cyanic/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-cyanic" />
              <span className="text-xs font-mono uppercase text-cyanic font-bold">
                Stage 4: Proof-of-Cultivation Attested
              </span>
            </div>
          </div>
          <p className="text-xs text-crisp">
            This entry has been cryptographically anchored to your immutable ledger.
          </p>
        </div>
      )}

    </div>
  );
};
