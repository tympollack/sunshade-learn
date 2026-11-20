import type { 
  Domain, 
  Entry, 
  CultivationEvent, 
  PeerAttestationInvite, 
  VerifiableCredential,
  CredentialPath 
} from '../src/types';

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  APP_ID?: string;
  APP_NAME?: string;
  INTERNAL_HEALTH_TOKEN?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export type {
  Domain,
  Entry,
  CultivationEvent,
  PeerAttestationInvite,
  VerifiableCredential,
  CredentialPath
};
