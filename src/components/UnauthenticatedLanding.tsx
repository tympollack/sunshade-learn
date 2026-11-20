import React from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  Lock, 
  FileCheck, 
  Terminal 
} from 'lucide-react';
import { getHubLoginUrl } from '../lib/supabase';

export const UnauthenticatedLanding: React.FC = () => {
  const loginUrl = getHubLoginUrl();

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#f9f9f9] flex flex-col justify-between selection:bg-burnt/30 selection:text-burnt">
      
      {/* Top Banner / Nav */}
      <header className="border-b border-[#262422] bg-[#141211]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-burnt/15 border border-burnt/40 flex items-center justify-center text-burnt shadow-sm shadow-burnt/20">
              <BookOpen className="w-5 h-5 text-burnt" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-crisp">
                Blueprint Academy
              </span>
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-cyanic/10 text-cyanic border border-cyanic/30 rounded">
                Proof-of-Cultivation
              </span>
            </div>
          </div>

          <a
            href={loginUrl}
            target="_self"
            className="px-4 py-2 text-xs font-semibold bg-burnt hover:bg-burnt-light text-charcoal-950 rounded-lg transition-all flex items-center space-x-1.5 shadow-md shadow-burnt/25"
          >
            <span>Sign in via SunShade Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        
        {/* Calm Status Pill */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1a1816] border border-[#262422] text-xs text-subtle mb-8">
          <span className="w-2 h-2 rounded-full bg-cyanic animate-pulse" />
          <span className="font-mono text-[11px] text-crisp">Citizen Tier Progression Ledger</span>
          <span className="text-[#383532]">•</span>
          <span className="text-[11px]">Zero Vanity Streaks</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-crisp max-w-2xl leading-tight">
          Verify What You Build. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-burnt via-burnt-light to-cyanic">
            Proof-of-Cultivation.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-subtle max-w-xl leading-relaxed">
          The standalone progression ledger for serious learners. Track knowledge from initial seed to 
          rigorous synthesis, practical artifact execution, and cryptographic attestation.
        </p>

        {/* Primary CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <a
            href={loginUrl}
            target="_self"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold bg-burnt hover:bg-burnt-light text-charcoal-950 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-burnt/20 hover:scale-[1.01]"
          >
            <span>Sign in via SunShade Hub</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="https://sunshade.icu"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-medium text-subtle hover:text-crisp bg-[#141211] hover:bg-[#1a1816] border border-[#262422] rounded-xl transition-all"
          >
            Learn about Ecosystem
          </a>
        </div>

        {/* 4-Stage Stepper Preview */}
        <div className="mt-20 w-full text-left">
          <h2 className="text-xs font-mono uppercase tracking-wider text-burnt mb-6 text-center">
            The 4-Stage Cultivation Discipline
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stage 1: Seeded */}
            <div className="p-4 rounded-xl bg-[#141211] border border-[#262422] relative overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-burnt/15 border border-burnt/30 text-burnt flex items-center justify-center text-xs font-mono font-bold mb-3">
                1
              </div>
              <h3 className="font-bold text-sm text-crisp">Seeded</h3>
              <p className="text-xs text-subtle mt-1.5 leading-normal">
                Capture docs, articles, books, code repos, or QR deep-links into focused domains.
              </p>
            </div>

            {/* Stage 2: Studied */}
            <div className="p-4 rounded-xl bg-[#141211] border border-[#262422] relative overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-cyanic/15 border border-cyanic/30 text-cyanic flex items-center justify-center text-xs font-mono font-bold mb-3">
                2
              </div>
              <h3 className="font-bold text-sm text-crisp">Studied</h3>
              <p className="text-xs text-subtle mt-1.5 leading-normal">
                Synthesize core mechanics into 3–5 plain-language bullets. No passive skimming.
              </p>
            </div>

            {/* Stage 3: Applied */}
            <div className="p-4 rounded-xl bg-[#141211] border border-[#262422] relative overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-burnt/15 border border-burnt/30 text-burnt flex items-center justify-center text-xs font-mono font-bold mb-3">
                3
              </div>
              <h3 className="font-bold text-sm text-crisp">Applied</h3>
              <p className="text-xs text-subtle mt-1.5 leading-normal">
                Link real artifact proof: deployed build, commit, architectural RFC, or field notes.
              </p>
            </div>

            {/* Stage 4: Cultivated */}
            <div className="p-4 rounded-xl bg-[#141211] border border-[#262422] relative overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-cyanic/15 border border-cyanic/30 text-cyanic flex items-center justify-center text-xs font-mono font-bold mb-3">
                4
              </div>
              <h3 className="font-bold text-sm text-crisp">Cultivated</h3>
              <p className="text-xs text-subtle mt-1.5 leading-normal">
                Demonstrate proficiency via ephemeral Socratic check or single-use Peer/Mentor sign-off.
              </p>
            </div>

          </div>
        </div>

        {/* Ecosystem Invariants */}
        <div className="mt-16 w-full border-t border-[#262422] pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-burnt shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-crisp uppercase font-mono tracking-wider">
                Private by Default
              </h4>
              <p className="text-xs text-subtle mt-1">
                Zero third-party trackers, ad pixels, or public minor profiles. Your ledger belongs to you.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-cyanic shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-crisp uppercase font-mono tracking-wider">
                Ephemeral AI Dialogues
              </h4>
              <p className="text-xs text-subtle mt-1">
                Socratic checks run in-memory and discard raw transcripts immediately—retaining only the attestation.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <FileCheck className="w-5 h-5 text-burnt shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-crisp uppercase font-mono tracking-wider">
                Digital Backpack
              </h4>
              <p className="text-xs text-subtle mt-1">
                Export hash-chained JSON archives or print-ready portfolios for physical binder submission.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#262422] bg-[#141211] px-6 py-6 text-xs text-subtle">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-crisp">SunShade Systems</span>
            <span>•</span>
            <span>Blueprint Academy Proof-of-Cultivation</span>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="https://sunshade.icu/eula"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-burnt transition-colors"
            >
              EULA
            </a>
            <a
              href="https://sunshade.icu/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-burnt transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://hub.sunshade.icu"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-burnt transition-colors"
            >
              SunShade Hub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};
