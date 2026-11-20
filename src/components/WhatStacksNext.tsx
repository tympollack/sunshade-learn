import React from 'react';
import { Sparkles, Layers, CheckCircle2 } from 'lucide-react';
import { Entry } from '../types';

interface WhatStacksNextProps {
  items: Entry[];
  onOpenSocraticCheck: (item: Entry) => void;
  onOpenPeerSignoff: (item: Entry) => void;
}

export const WhatStacksNext: React.FC<WhatStacksNextProps> = ({
  items,
  onOpenSocraticCheck,
  onOpenPeerSignoff,
}) => {
  const readyForCultivation = items.filter((i) => i.current_stage === 'applied');
  const readyForApplied = items.filter((i) => i.current_stage === 'studied');
  const readyForStudy = items.filter((i) => i.current_stage === 'seeded');

  const pendingCount = readyForCultivation.length + readyForApplied.length + readyForStudy.length;

  if (pendingCount === 0) {
    return (
      <div className="bg-[#141211] border border-[#262422] rounded-xl p-6 text-center space-y-2 no-print">
        <div className="w-10 h-10 rounded-full bg-cyanic/10 text-cyanic flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-crisp">All Seeded Entries Cultivated</h3>
        <p className="text-xs text-subtle max-w-sm mx-auto">
          Every entry in your ledger has achieved verified Proof-of-Cultivation. Seed a new domain or curriculum track to continue progression.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#141211] border border-[#262422] rounded-xl p-5 space-y-4 no-print shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-burnt" />
          <h3 className="text-sm font-bold text-crisp">What Stacks Next</h3>
        </div>
        <span className="text-[11px] font-mono text-subtle">
          {pendingCount} actionable entries
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Ready to Cultivate */}
        {readyForCultivation.slice(0, 2).map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-lg bg-[#0c0a09] border border-cyanic/40 space-y-2.5 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-mono uppercase bg-cyanic/10 text-cyanic px-1.5 py-0.5 rounded border border-cyanic/30 font-semibold">
                Ready for Cultivation
              </span>
              <h4 className="text-xs font-bold text-crisp mt-1.5 line-clamp-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-subtle mt-0.5">
                Applied proof verified. Run Socratic check to finalize.
              </p>
            </div>

            <button
              onClick={() => onOpenSocraticCheck(item)}
              className="w-full py-1.5 px-2.5 text-xs font-semibold bg-cyanic hover:bg-cyanic-light text-charcoal-950 rounded-md transition-colors flex items-center justify-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Socratic Check</span>
            </button>
          </div>
        ))}

        {/* Ready for Applied Proof */}
        {readyForApplied.slice(0, 2).map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-lg bg-[#0c0a09] border border-[#262422] hover:border-burnt/50 space-y-2.5 flex flex-col justify-between transition-colors"
          >
            <div>
              <span className="text-[10px] font-mono uppercase bg-burnt/10 text-burnt px-1.5 py-0.5 rounded border border-burnt/30 font-semibold">
                Requires Applied Proof
              </span>
              <h4 className="text-xs font-bold text-crisp mt-1.5 line-clamp-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-subtle mt-0.5">
                Synthesis documented. Link a repository or execution artifact.
              </p>
            </div>

            <div className="text-[11px] font-mono text-subtle flex items-center justify-between">
              <span>Studied</span>
              <span className="text-burnt">Stage 2 ➔ 3</span>
            </div>
          </div>
        ))}

        {/* Ready for Study / Synthesis */}
        {readyForStudy.slice(0, 2).map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-lg bg-[#0c0a09] border border-[#262422] space-y-2.5 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-mono uppercase bg-[#1a1816] text-subtle px-1.5 py-0.5 rounded border border-[#262422] font-semibold">
                Seeded (Needs Study)
              </span>
              <h4 className="text-xs font-bold text-crisp mt-1.5 line-clamp-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-subtle mt-0.5">
                Formulate 3–5 plain-language bullets to complete study.
              </p>
            </div>

            <div className="text-[11px] font-mono text-subtle flex items-center justify-between">
              <span className="truncate max-w-[120px]">{item.source_kind}</span>
              <span className="text-subtle">Stage 1 ➔ 2</span>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};
