import type {
  Availability,
  Candidate,
  Cause,
  Impact,
  Match,
  Message,
  Opportunity,
  OrgDraft,
  OrgSummary,
  Role,
  Session,
  SwipeResult,
  VolunteerProfile,
} from '../types';

/**
 * Everything the screens need. Two implementations:
 *  - demo: in-device, seeded with example entities (to show the app without a backend)
 *  - supabase: real accounts, real-time chat, row-level security
 */
export interface DataApi {
  mode: 'demo' | 'supabase';

  // auth
  getSession(): Promise<Session | null>;
  onSessionChange(cb: (s: Session | null) => void): () => void;
  sendLoginCode(email: string): Promise<void>;
  verifyLoginCode(email: string, code: string): Promise<Session>;
  setRole(role: Role): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;

  // volunteer
  getVolunteerProfile(): Promise<VolunteerProfile | null>;
  saveVolunteerProfile(p: VolunteerProfile): Promise<void>;
  listFeed(f: { causes: Cause[]; availability: Availability }): Promise<Opportunity[]>;
  swipe(opportunityId: string, liked: boolean): Promise<SwipeResult>;
  listMatches(): Promise<Match[]>;
  getImpact(): Promise<Impact>;

  // org
  getMyOrg(): Promise<OrgSummary | null>;
  createOrg(d: OrgDraft): Promise<OrgSummary>;
  listCandidates(): Promise<Candidate[]>;
  decideCandidate(matchId: string, accept: boolean): Promise<void>;
  listOrgMatches(): Promise<Candidate[]>;

  // shared: chat between a volunteer and an org, only after an accepted match
  getMatchTitle(matchId: string): Promise<{ title: string; subtitle: string; status: string; meetingConfirmed: boolean; exactAddress: string | null }>;
  listMessages(matchId: string): Promise<Message[]>;
  sendMessage(matchId: string, body: string): Promise<void>;
  subscribeMessages(matchId: string, cb: () => void): () => void;
  confirmMeeting(matchId: string): Promise<void>;
  report(matchId: string, reason: string): Promise<void>;
}
