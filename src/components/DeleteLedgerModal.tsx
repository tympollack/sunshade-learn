import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DeleteLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteLedgerModal: React.FC<DeleteLedgerModalProps> = ({
  isOpen,
  onClose,
  onDeleted,
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmInput !== 'DELETE_MY_LEDGER') {
      setError('Confirmation phrase does not match.');
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/learn/ledger', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ confirm: 'DELETE_MY_LEDGER' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to hard-delete ledger');
      }

      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting ledger');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-[#141211] border border-red-900/60 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800 text-red-400 flex items-center justify-center shadow-sm">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-crisp">
                  Erase Progression Ledger
                </h3>
                <p className="text-xs text-red-400 font-mono">
                  Permanent Data Sovereignty Hard-Delete
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

          <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-900/50 flex items-start space-x-2.5 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This action will permanently purge all your domains, seeded items, synthesized takeaways, applied proofs, and hash-chained events from the database. This cannot be undone.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-subtle">
              Type <span className="font-mono text-red-400 select-all font-bold">DELETE_MY_LEDGER</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="DELETE_MY_LEDGER"
              className="w-full px-3.5 py-2.5 bg-[#0c0a09] border border-[#262422] focus:border-red-600 rounded-lg text-xs font-mono text-crisp outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-subtle hover:text-crisp rounded-lg hover:bg-[#262422]"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting || confirmInput !== 'DELETE_MY_LEDGER'}
              className="px-5 py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-lg shadow-md transition-colors flex items-center space-x-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Purging...</span>
                </>
              ) : (
                <span>Hard-Delete My Ledger</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
