import React, { useState, useEffect } from 'react';
import { Clock, Hash } from 'lucide-react';
import { CultivationEvent, Domain, Entry } from '../types';

interface TrajectoryTimelineProps {
  events: CultivationEvent[];
  domains?: Domain[];
  entries?: Entry[];
}

export const TrajectoryTimeline: React.FC<TrajectoryTimelineProps> = ({
  events,
  domains = [],
  entries = [],
}) => {
  const [selectedDomainId, setSelectedDomainId] = useState<string>('all');

  // Reset domain filter if the selected domain was removed or the ledger was purged
  useEffect(() => {
    if (selectedDomainId !== 'all' && !domains.some((d) => d.id === selectedDomainId)) {
      setSelectedDomainId('all');
    }
  }, [domains, selectedDomainId]);

  const activeDomain =
    selectedDomainId !== 'all' ? domains.find((d) => d.id === selectedDomainId) : undefined;
  const effectiveDomainId = activeDomain ? selectedDomainId : 'all';

  const entryMap = new Map(entries.map((e) => [e.id, e]));
  const filteredEvents =
    effectiveDomainId === 'all'
      ? events
      : events.filter((ev) => entryMap.get(ev.entry_id)?.domain_id === effectiveDomainId);

  // Sort strictly descending by seq_num for reverse-chronological trajectory
  const sorted = [...filteredEvents].sort((a, b) => b.seq_num - a.seq_num);

  return (
    <div className="bg-[#141211] border border-[#262422] rounded-xl p-5 space-y-4 shadow-sm print-card">
      <div className="flex flex-col space-y-2.5 border-b border-[#262422] pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyanic" />
            <h3 className="text-sm font-bold text-crisp print-card-title">
              Longitudinal Trajectory Timeline
              {activeDomain ? ` (${activeDomain.title})` : ''}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-subtle">
            {filteredEvents.length} sequenced events
          </span>
        </div>

        {domains.length > 0 && (
          <div className="no-print">
            <select
              aria-label="Filter trajectory by domain"
              value={effectiveDomainId}
              onChange={(e) => setSelectedDomainId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0c0a09] border border-[#262422] focus:border-burnt rounded-lg text-xs text-crisp outline-none"
            >
              <option value="all">All Knowledge Domains ({events.length})</option>
              {domains.map((dom) => (
                <option key={dom.id} value={dom.id}>
                  {dom.title} ({dom.slug})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="py-6 text-center text-xs text-subtle font-mono">
          No timeline events recorded yet.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#262422]">
          {sorted.map((ev) => {
            const stageColor = {
              seeded: 'text-subtle border-[#262422] bg-[#1a1816]',
              studied: 'text-cyanic border-cyanic/40 bg-cyanic/15',
              applied: 'text-burnt border-burnt/40 bg-burnt/15',
              cultivated: 'text-crisp border-cyanic bg-cyanic',
            }[ev.stage];

            return (
              <div key={ev.id} className="relative group">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 top-1 w-3 h-3 rounded-full border ${stageColor} transition-transform group-hover:scale-125`}
                />

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#0c0a09] border border-[#262422] text-subtle">
                      #{ev.seq_num} • {ev.stage}
                    </span>
                    <span className="text-xs font-semibold text-crisp truncate max-w-[200px]">
                      {ev.attestation_kind}
                    </span>
                    <span className="text-[10px] text-subtle ml-auto font-mono">
                      {new Date(ev.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {ev.synthesis_notes && (
                    <p className="text-xs text-subtle whitespace-pre-line leading-relaxed">
                      {ev.synthesis_notes}
                    </p>
                  )}

                  {/* Hash Chain Footprint */}
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-subtle pt-0.5">
                    <span className="flex items-center">
                      <Hash className="w-3 h-3 mr-0.5 text-burnt" />
                      <span className="truncate max-w-[120px] select-all">{ev.event_hash}</span>
                    </span>
                    <span>←</span>
                    <span className="truncate max-w-[100px] text-[#524e4a]">{ev.prev_event_hash}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
