import React, { useState } from 'react';
import { 
  Folder, 
  Lock, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Plus
} from 'lucide-react';
import { Domain, Entry } from '../types';
import { supabase } from '../lib/supabase';
import { CultivationStepper } from './CultivationStepper';

interface DomainCardProps {
  domain: Domain;
  items: Entry[];
  onUpdate: () => void;
  onOpenSocraticCheck: (item: Entry) => void;
  onOpenPeerSignoff: (item: Entry) => void;
  onOpenLogDrawerForDomain: (domainId: string) => void;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  domain,
  items,
  onUpdate,
  onOpenSocraticCheck,
  onOpenPeerSignoff,
  onOpenLogDrawerForDomain,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);

  // Stage counts
  const seededCount = items.filter((i) => i.current_stage === 'seeded').length;
  const studiedCount = items.filter((i) => i.current_stage === 'studied').length;
  const appliedCount = items.filter((i) => i.current_stage === 'applied').length;
  const cultivatedCount = items.filter((i) => i.current_stage === 'cultivated').length;

  // Most recent synthesis / update date & Next Step cue
  const mostRecentDate = items.length > 0
    ? new Date(
        Math.max(...items.map((i) => new Date(i.updated_at || i.created_at).getTime()))
      ).toLocaleDateString()
    : null;

  const nextStepCue =
    items.length === 0
      ? 'Next Step: Seed your first learning entry in this domain'
      : appliedCount > 0
      ? `Next Step: Complete Conversational Check on ${appliedCount} applied ${appliedCount === 1 ? 'entry' : 'entries'}`
      : studiedCount > 0
      ? `Next Step: Attach applied artifact proof to ${studiedCount} studied ${studiedCount === 1 ? 'entry' : 'entries'}`
      : seededCount > 0
      ? `Next Step: Synthesize plain-language notes for ${seededCount} seeded ${seededCount === 1 ? 'entry' : 'entries'}`
      : 'All entries in this domain are Cultivated';

  const isPrivate = domain.visibility === 'private';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://learn.sunshade.icu';
  const shareUrl = domain.share_token ? `${origin}/share/${domain.share_token}` : '';

  const handleTogglePrivacy = async () => {
    setIsTogglingPrivacy(true);
    try {
      // Toggle visibility between 'private' and 'unlisted_link'
      // PostgreSQL trigger learn.sync_domain_share_token automatically creates or clears share_token!
      const nextVisibility = isPrivate ? 'unlisted_link' : 'private';

      const { error } = await supabase
        .from('domains')
        .update({
          visibility: nextVisibility,
        })
        .eq('id', domain.id);

      if (error) throw error;
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update visibility');
    } finally {
      setIsTogglingPrivacy(false);
    }
  };

  const handleCopyShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#141211] border border-[#262422] rounded-xl overflow-hidden shadow-sm transition-all print-card">
      
      {/* Domain Header */}
      <div className="p-5 border-b border-[#262422] flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-burnt/15 border border-burnt/30 flex items-center justify-center text-burnt shrink-0 mt-0.5">
            <Folder className="w-5 h-5 text-burnt" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base text-crisp print-card-title">
                {domain.title}
              </h3>
              <span className="text-xs font-mono text-subtle">
                ({domain.slug})
              </span>
              {isPrivate ? (
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[#1a1816] text-subtle border border-[#262422] rounded flex items-center space-x-1 no-print">
                  <Lock className="w-2.5 h-2.5 mr-0.5" />
                  <span>Private</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyanic/10 text-cyanic border border-cyanic/30 rounded flex items-center space-x-1 no-print">
                  <Share2 className="w-2.5 h-2.5 mr-0.5" />
                  <span>Unlisted</span>
                </span>
              )}
            </div>

            {domain.description && (
              <p className="text-xs text-subtle mt-1 leading-normal">
                {domain.description}
              </p>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-subtle">
              <span className="text-burnt font-semibold">{nextStepCue}</span>
              {mostRecentDate && (
                <span>• Latest activity: {mostRecentDate}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stage Counters & Actions */}
        <div className="flex items-center space-x-3 self-end md:self-center">
          
          {/* Stage Count Pills */}
          <div className="flex items-center space-x-1 text-[11px] font-mono">
            <span className="px-2 py-1 rounded bg-[#0c0a09] border border-[#262422] text-subtle" title="Seeded">
              🌱 {seededCount}
            </span>
            <span className="px-2 py-1 rounded bg-[#0c0a09] border border-[#262422] text-subtle" title="Studied">
              📖 {studiedCount}
            </span>
            <span className="px-2 py-1 rounded bg-[#0c0a09] border border-[#262422] text-burnt" title="Applied">
              🛠️ {appliedCount}
            </span>
            <span className="px-2 py-1 rounded bg-cyanic/15 border border-cyanic/30 text-cyanic font-bold" title="Cultivated">
              💎 {cultivatedCount}
            </span>
          </div>

          {/* Privacy Toggle (Screen Only) */}
          <div className="no-print flex items-center space-x-2">
            <button
              onClick={handleTogglePrivacy}
              disabled={isTogglingPrivacy}
              title={isPrivate ? 'Make Unlisted (Shareable)' : 'Make Private'}
              className="p-1.5 text-xs text-subtle hover:text-crisp bg-[#1a1816] border border-[#262422] rounded-lg transition-colors flex items-center space-x-1"
            >
              {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5 text-cyanic" />}
            </button>

            {!isPrivate && shareUrl && (
              <button
                onClick={handleCopyShareLink}
                title="Copy Unlisted Share Link"
                className="px-2.5 py-1 text-xs text-cyanic bg-cyanic/10 border border-cyanic/30 hover:bg-cyanic/20 rounded-lg transition-colors flex items-center space-x-1"
              >
                {copied ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>
            )}

            <button
              onClick={() => onOpenLogDrawerForDomain(domain.id)}
              title="Add entry to this domain"
              className="p-1.5 text-xs text-burnt hover:bg-burnt/15 border border-burnt/30 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-subtle hover:text-crisp rounded-lg hover:bg-[#262422]"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

        </div>

      </div>

      {/* Domain Entries Body */}
      {expanded && (
        <div className="p-5 space-y-4 bg-[#0c0a09]/50">
          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-subtle font-mono">
              No entries in this domain yet. Click "+" to seed knowledge.
            </div>
          ) : (
            items.map((entry) => (
              <CultivationStepper
                key={entry.id}
                item={entry}
                onUpdate={onUpdate}
                onOpenSocraticCheck={onOpenSocraticCheck}
                onOpenPeerSignoff={onOpenPeerSignoff}
              />
            ))
          )}
        </div>
      )}

    </div>
  );
};
