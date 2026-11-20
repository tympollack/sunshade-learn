export type CultivationStage = 'seeded' | 'studied' | 'applied' | 'cultivated';

export type SourceKind =
  | 'web_url'
  | 'sunshade_docs'
  | 'book_isbn'
  | 'course_cert'
  | 'project_build'
  | 'apprenticeship'
  | 'other';

export type DomainVisibility = 'private' | 'unlisted_link' | 'public';

export type AttestationKind =
  | 'self_synthesis'
  | 'ai_conversational_check'
  | 'peer_review'
  | 'verifiable_credential';

export type CredentialCategory =
  | 'core_logic'
  | 'networking'
  | 'software'
  | 'hardware_mesh'
  | 'academic'
  | 'trades_civic'
  | 'community';

export type CredentialFormat =
  | 'w3c_vc_json'
  | 'open_badges_3'
  | 'issuer_url'
  | 'document_hash_shield'
  | 'peer_signed';

export type VerificationStatus =
  | 'self_submitted'
  | 'url_checked'
  | 'cryptographically_verified'
  | 'peer_attested'
  | 'revoked'
  | 'expired';

export interface Domain {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description?: string | null;
  visibility: DomainVisibility;
  share_token?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  domain_id: string;
  title: string;
  source_kind: SourceKind;
  source_uri?: string | null;
  source_meta: Record<string, unknown>;
  current_stage: CultivationStage;
  created_at: string;
  updated_at: string;
  domain?: Domain;
}

// Backward compatibility alias for existing component references
export type LearningItem = Entry;

export interface CultivationEvent {
  id: string;
  user_id: string;
  entry_id: string;
  seq_num: number;
  stage: CultivationStage;
  synthesis_notes?: string | null;
  artifact_uri?: string | null;
  attestation_kind: AttestationKind;
  payload_json: Record<string, unknown>;
  prev_event_hash: string;
  event_hash: string;
  signer_did?: string | null;
  event_timestamp_ms: number;
  created_at: string;
}

export interface PeerAttestationInvite {
  id: string;
  user_id: string;
  entry_id: string;
  token: string;
  expires_at: string;
  redeemed_at?: string | null;
  attestor_label?: string | null;
  attestor_note?: string | null;
  created_at: string;
  entry?: Entry;
}

export interface CredentialPathStep {
  id: string;
  path_id: string;
  step_order: number;
  title: string;
  description?: string | null;
  source_kind: SourceKind;
  source_uri?: string | null;
  source_meta: Record<string, unknown>;
  created_at: string;
}

export interface CredentialPath {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category: CredentialCategory;
  issuer_name: string;
  is_official: boolean;
  is_published: boolean;
  created_by?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  steps?: CredentialPathStep[];
}

export interface VerifiableCredential {
  id: string;
  user_id: string;
  domain_id?: string | null;
  entry_id?: string | null;
  title: string;
  issuer_name: string;
  issuer_did?: string | null;
  credential_format: CredentialFormat;
  verification_url?: string | null;
  credential_id_external?: string | null;
  evidence_sha256: string;
  raw_vc_json?: Record<string, unknown> | null;
  issued_at?: string | null;
  expires_at?: string | null;
  verification_status: VerificationStatus;
  verification_notes: Record<string, unknown>;
  verified_at?: string | null;
  visibility: 'private' | 'domain_inherited' | 'public';
  created_at: string;
  updated_at: string;
}
