import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Download, 
  Printer, 
  Trash2, 
  LogOut, 
  ShieldCheck, 
  FileText, 
  FileCode,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  userEmail?: string;
  onOpenLogDrawer: () => void;
  onOpenDeleteModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userEmail,
  onOpenLogDrawer,
  onOpenDeleteModal,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'markdown') => {
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`/api/learn/export?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Export failed. Please ensure you are authenticated.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'markdown' 
        ? 'learn-portfolio.md' 
        : 'learn-digital-backpack.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0c0a09]/90 backdrop-blur-md border-b border-[#262422] no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-burnt/15 border border-burnt/40 flex items-center justify-center text-burnt shadow-sm shadow-burnt/20">
            <BookOpen className="w-5 h-5 text-burnt" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-crisp">
                Blueprint Academy
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-cyanic/10 text-cyanic border border-cyanic/30 rounded">
                Proof-of-Cultivation
              </span>
            </div>
            <p className="text-xs text-subtle font-mono hidden sm:block">
              Citizen Progression Ledger
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Print Binder Button */}
          <button
            onClick={() => window.print()}
            title="Print Living Binder"
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-subtle hover:text-crisp bg-[#1a1816] hover:bg-[#262422] border border-[#262422] rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-subtle" />
            <span className="hidden md:inline">Print Binder</span>
          </button>

          {/* Export Digital Backpack */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="px-3 py-1.5 text-xs font-medium text-subtle hover:text-crisp bg-[#1a1816] hover:bg-[#262422] border border-[#262422] rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-burnt" />
              <span className="hidden sm:inline">Export Backpack</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showExportMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-xl bg-[#141211] border border-[#262422] shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <div className="px-3 py-2 border-b border-[#262422]">
                  <p className="text-[11px] font-mono text-burnt flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Citizen Tier Sovereignty
                  </p>
                  <p className="text-[10px] text-subtle mt-0.5">
                    Hash-chained cryptographic export
                  </p>
                </div>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-3 py-2 text-xs text-crisp hover:bg-[#262422] flex items-center space-x-2"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyanic" />
                  <div>
                    <div className="font-medium">JSON Archive</div>
                    <div className="text-[10px] text-subtle">Hash-chained backpack verification</div>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('markdown')}
                  className="w-full text-left px-3 py-2 text-xs text-crisp hover:bg-[#262422] flex items-center space-x-2"
                >
                  <FileText className="w-3.5 h-3.5 text-burnt" />
                  <div>
                    <div className="font-medium">Markdown Portfolio</div>
                    <div className="text-[10px] text-subtle">Print-ready portfolio documentation</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Primary Action: Log Learning */}
          <button
            onClick={onOpenLogDrawer}
            className="px-3 sm:px-4 py-1.5 text-xs font-semibold text-charcoal-950 bg-burnt hover:bg-burnt-light rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm shadow-burnt/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Learning</span>
          </button>

          {/* User profile & hard-delete ledger */}
          <div className="h-6 w-px bg-[#262422] mx-1" />

          <button
            onClick={onOpenDeleteModal}
            title="Erase Ledger (Data Sovereignty)"
            className="p-1.5 text-subtle hover:text-red-400 hover:bg-red-950/20 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 text-subtle hover:text-crisp hover:bg-[#262422] rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
