import React, { useState, useEffect } from 'react';
import { X, BookOpen, Link, FolderPlus, Globe, Code, FileText, CheckCircle2, Award, Sparkles, Loader2 } from 'lucide-react';
import { Domain, SourceKind, CredentialPath } from '../types';
import { supabase } from '../lib/supabase';

interface LogLearningDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  domains: Domain[];
  onItemCreated: () => void;
  onDomainCreated: (newDomain: Domain) => void;
}

export const LogLearningDrawer: React.FC<LogLearningDrawerProps> = ({
  isOpen,
  onClose,
  domains,
  onItemCreated,
  onDomainCreated,
}) => {
  const [tab, setTab] = useState<'custom' | 'paths'>('custom');
  
  // Custom Entry State
  const [title, setTitle] = useState('');
  const [sourceKind, setSourceKind] = useState<SourceKind>('web_url');
  const [sourceUri, setSourceUri] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [isCreatingNewDomain, setIsCreatingNewDomain] = useState(false);
  const [newDomainTitle, setNewDomainTitle] = useState('');
  const [newDomainSlug, setNewDomainSlug] = useState('');
  const [newDomainDesc, setNewDomainDesc] = useState('');
  const [sourceMetadata, setSourceMetadata] = useState<Record<string, unknown>>({});
  
  // Seeded Paths State
  const [paths, setPaths] = useState<CredentialPath[]>([]);
  const [pathsLoading, setPathsLoading] = useState(false);
  const [adoptingSlug, setAdoptingSlug] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse deep-link query parameters on mount & load credential paths
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sourceParam = params.get('source');
    const slugParam = params.get('slug');
    const shaParam = params.get('sha');
    const urlParam = params.get('url');
    const titleParam = params.get('title');
    const domainParam = params.get('domain');

    if (sourceParam === 'docs' || slugParam || shaParam) {
      setSourceKind('sunshade_docs');
      const docSlug = slugParam || 'sunshade-docs';
      setTitle(titleParam || `Documentation: ${docSlug}`);
      setSourceUri(urlParam || `https://docs.sunshade.icu/${docSlug}`);
      setSourceMetadata({
        source: 'docs',
        slug: slugParam,
        sha: shaParam,
        deep_linked: true,
      });
    } else if (urlParam) {
      setSourceUri(urlParam);
      if (titleParam) setTitle(titleParam);
    }

    if (domainParam) {
      const match = domains.find(d => d.slug.toLowerCase() === domainParam.toLowerCase() || d.title.toLowerCase() === domainParam.toLowerCase());
      if (match) {
        setSelectedDomainId(match.id);
      } else {
        setIsCreatingNewDomain(true);
        setNewDomainTitle(domainParam);
        setNewDomainSlug(domainParam.toLowerCase().replace(/[^a-z0-9]/g, '-'));
      }
    } else if (domains.length > 0 && !selectedDomainId) {
      setSelectedDomainId(domains[0].id);
    }
  }, [domains]);

  // Load Seeded Credential Paths when tab switched
  useEffect(() => {
    if (tab === 'paths' && paths.length === 0) {
      setPathsLoading(true);
      supabase
        .from('credential_paths')
        .select('*')
        .eq('is_published', true)
        .order('is_official', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setPaths(data as CredentialPath[]);
          }
          setPathsLoading(false);
        });
    }
  }, [tab, paths.length]);

  if (!isOpen) return null;

  // Adopt Seeded Credential Path via learn.adopt_credential_path RPC
  const handleAdoptPath = async (slug: string) => {
    setAdoptingSlug(slug);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('adopt_credential_path', {
        p_path_slug: slug,
      });

      if (rpcErr) throw rpcErr;
      onItemCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adopt credential path');
    } finally {
      setAdoptingSlug(null);
    }
  };

  // Submit custom learning entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let domainId = selectedDomainId;

      // Create new domain if requested
      if (isCreatingNewDomain || !domainId) {
        if (!newDomainTitle.trim()) {
          throw new Error('Domain title is required');
        }
        const slug = newDomainSlug.trim() || newDomainTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        const { data: newDom, error: domErr } = await supabase
          .from('domains')
          .insert({
            user_id: user.id,
            slug,
            title: newDomainTitle.trim(),
            description: newDomainDesc.trim() || null,
            visibility: 'private', // Default to private per SunShade privacy law
          })
          .select()
          .single();

        if (domErr || !newDom) {
          throw new Error(domErr?.message || 'Failed to create domain');
        }

        domainId = newDom.id;
        onDomainCreated(newDom);
      }

      // Insert new learning entry
      const { data: newEntry, error: entErr } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          domain_id: domainId,
          title: title.trim(),
          source_kind: sourceKind,
          source_uri: sourceUri.trim() || null,
          source_meta: sourceMetadata,
          current_stage: 'seeded',
        })
        .select()
        .single();

      if (entErr || !newEntry) {
        throw new Error(entErr?.message || 'Failed to log learning entry');
      }

      // Append initial seeded cultivation event via atomic RPC
      const { error: evErr } = await supabase.rpc('append_cultivation_event', {
        p_entry_id: newEntry.id,
        p_stage: 'seeded',
        p_synthesis_notes: 'Initial knowledge seed captured into ledger.',
        p_artifact_uri: sourceUri.trim() || null,
        p_attestation_kind: 'self_synthesis',
        p_payload_json: {
          source_kind: sourceKind,
          source_meta: sourceMetadata,
        },
      });

      if (evErr) {
        console.warn('Initial event logging notice:', evErr.message);
      }

      // Reset form
      setTitle('');
      setSourceUri('');
      setIsCreatingNewDomain(false);
      setNewDomainTitle('');
      setNewDomainSlug('');
      setNewDomainDesc('');
      onItemCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md bg-[#141211] border-l border-[#262422] shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-[#262422] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-burnt/15 border border-burnt/30 flex items-center justify-center text-burnt">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-crisp">Log Learning</h2>
                <p className="text-xs text-subtle font-mono">Stage 1: Seed Knowledge</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-subtle hover:text-crisp rounded-lg hover:bg-[#262422]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="px-6 pt-3 flex space-x-2 border-b border-[#262422]">
            <button
              onClick={() => setTab('custom')}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                tab === 'custom'
                  ? 'border-burnt text-burnt'
                  : 'border-transparent text-subtle hover:text-crisp'
              }`}
            >
              Custom Entry
            </button>
            <button
              onClick={() => setTab('paths')}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1 ${
                tab === 'paths'
                  ? 'border-cyanic text-cyanic'
                  : 'border-transparent text-subtle hover:text-crisp'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Adopt Seeded Track</span>
            </button>
          </div>

          {/* Form or Paths Catalog */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {error}
              </div>
            )}

            {tab === 'paths' ? (
              <div className="space-y-4">
                <p className="text-xs text-subtle leading-relaxed">
                  Adopt an official curriculum track. Clones structured modules directly into a private learning domain on your ledger.
                </p>

                {pathsLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 text-cyanic animate-spin mx-auto mb-2" />
                    <span className="text-xs text-subtle font-mono">Loading Tracks...</span>
                  </div>
                ) : (
                  paths.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-[#0c0a09] border border-[#262422] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase bg-cyanic/10 text-cyanic px-1.5 py-0.5 rounded border border-cyanic/30 font-semibold">
                          {p.category}
                        </span>
                        <span className="text-[10px] text-subtle font-mono">{p.issuer_name}</span>
                      </div>
                      <h4 className="text-xs font-bold text-crisp">{p.title}</h4>
                      {p.description && (
                        <p className="text-[11px] text-subtle leading-normal">{p.description}</p>
                      )}
                      <button
                        onClick={() => handleAdoptPath(p.slug)}
                        disabled={adoptingSlug === p.slug}
                        className="mt-2 w-full py-1.5 px-3 text-xs font-semibold bg-burnt hover:bg-burnt-light disabled:opacity-50 text-charcoal-950 rounded-lg transition-colors flex items-center justify-center space-x-1"
                      >
                        {adoptingSlug === p.slug ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Adopting...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Adopt Track</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Deep link badge if detected */}
                {Boolean(sourceMetadata.deep_linked) && (
                  <div className="p-3 rounded-lg bg-cyanic/10 border border-cyanic/30 text-xs text-cyanic flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Deep-link detected from SunShade Docs (SHA verification attached).</span>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                    Entry Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Distributed Consensus in Raft"
                    className="w-full px-3.5 py-2.5 bg-[#0c0a09] border border-[#262422] focus:border-burnt rounded-lg text-sm text-crisp placeholder-subtle/50 outline-none transition-colors"
                  />
                </div>

                {/* Domain Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-subtle uppercase tracking-wider">
                      Knowledge Domain *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewDomain(!isCreatingNewDomain)}
                      className="text-xs text-burnt hover:text-burnt-light font-medium flex items-center space-x-1"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>{isCreatingNewDomain ? 'Pick Existing' : '+ New Domain'}</span>
                    </button>
                  </div>

                  {isCreatingNewDomain ? (
                    <div className="space-y-2 p-3 bg-[#0c0a09] border border-[#262422] rounded-lg">
                      <input
                        type="text"
                        required
                        value={newDomainTitle}
                        onChange={(e) => {
                          setNewDomainTitle(e.target.value);
                          if (!newDomainSlug) {
                            setNewDomainSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                          }
                        }}
                        placeholder="Domain Title (e.g. Distributed Systems)"
                        className="w-full px-3 py-2 bg-[#141211] border border-[#262422] focus:border-burnt rounded-md text-xs text-crisp placeholder-subtle/50 outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={newDomainSlug}
                        onChange={(e) => setNewDomainSlug(e.target.value)}
                        placeholder="Domain Slug (e.g. distributed-systems)"
                        className="w-full px-3 py-2 bg-[#141211] border border-[#262422] focus:border-burnt rounded-md text-xs font-mono text-crisp placeholder-subtle/50 outline-none"
                      />
                      <input
                        type="text"
                        value={newDomainDesc}
                        onChange={(e) => setNewDomainDesc(e.target.value)}
                        placeholder="Short description (optional)"
                        className="w-full px-3 py-2 bg-[#141211] border border-[#262422] focus:border-burnt rounded-md text-xs text-crisp placeholder-subtle/50 outline-none"
                      />
                    </div>
                  ) : (
                    <select
                      value={selectedDomainId}
                      onChange={(e) => setSelectedDomainId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0c0a09] border border-[#262422] focus:border-burnt rounded-lg text-sm text-crisp outline-none"
                    >
                      {domains.length === 0 && (
                        <option value="">No domains found — create one</option>
                      )}
                      {domains.map((dom) => (
                        <option key={dom.id} value={dom.id}>
                          {dom.title} ({dom.slug})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Source Kind */}
                <div>
                  <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                    Source Kind
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'web_url', label: 'Web URL', icon: Globe },
                      { id: 'sunshade_docs', label: 'Docs / QR', icon: FileText },
                      { id: 'book_isbn', label: 'Book / ISBN', icon: BookOpen },
                      { id: 'project_build', label: 'Project Build', icon: Code },
                      { id: 'course_cert', label: 'Course / Cert', icon: Link },
                      { id: 'apprenticeship', label: 'Civic / Mesh', icon: Code },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSourceKind(id as SourceKind)}
                        className={`p-2.5 rounded-lg border text-xs flex flex-col items-center justify-center space-y-1 transition-all ${
                          sourceKind === id
                            ? 'bg-burnt/15 border-burnt text-burnt font-semibold'
                            : 'bg-[#0c0a09] border-[#262422] text-subtle hover:text-crisp hover:bg-[#1a1816]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source URI */}
                <div>
                  <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                    Source URI or Reference
                  </label>
                  <input
                    type="text"
                    value={sourceUri}
                    onChange={(e) => setSourceUri(e.target.value)}
                    placeholder="https://... or ISBN / Chapter"
                    className="w-full px-3.5 py-2.5 bg-[#0c0a09] border border-[#262422] focus:border-burnt rounded-lg text-sm text-crisp placeholder-subtle/50 outline-none transition-colors"
                  />
                </div>
              </form>
            )}
          </div>

          {/* Footer Actions */}
          {tab === 'custom' && (
            <div className="p-6 border-t border-[#262422] bg-[#141211] flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-subtle hover:text-crisp rounded-lg hover:bg-[#262422]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-charcoal-950 bg-burnt hover:bg-burnt-light disabled:opacity-50 rounded-lg shadow-md transition-colors"
              >
                {isSubmitting ? 'Seeding...' : 'Seed Entry'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
