export type Role = 'volunteer' | 'org';

export const CAUSES = [
  'Niñez',
  'Personas mayores',
  'Discapacidad',
  'Comedores',
  'Educación',
  'Ambiente',
  'Animales',
  'Salud mental',
] as const;
export type Cause = (typeof CAUSES)[number];

export const AVAILABILITY = ['1–2 h por semana', 'Fines de semana', 'Una sola vez', 'Remoto'] as const;
export type Availability = (typeof AVAILABILITY)[number];

export type VerificationMethod = 'legal' | 'referents' | 'photos';

export interface Session {
  userId: string;
  role: Role | null;
  email?: string;
}

export interface VolunteerProfile {
  firstName: string;
  zone: string;
  availability: Availability;
  causes: Cause[];
  hasBackgroundCheck: boolean;
}

/** What a volunteer sees on a card. Never contains an exact address or contact data. */
export interface Opportunity {
  id: string;
  orgId: string;
  orgName: string;
  cause: Cause;
  zone: string; // barrio / localidad, never the street address
  distanceKm: number | null;
  need: string;
  schedule: string;
  availability: Availability[];
  team: string;
  impact: string;
  isFormal: boolean;
  verificationLabel: string;
  requiresBackgroundCheck: boolean;
}

export type InterestStatus = 'pending' | 'accepted' | 'rejected';

export interface Match {
  id: string; // swipe id
  opportunity: Opportunity;
  status: InterestStatus;
  meetingConfirmed: boolean;
  exactAddress?: string | null; // only filled after meeting is confirmed
  unread?: boolean;
}

export interface Candidate {
  id: string; // swipe id
  firstName: string;
  zone: string;
  availability: string;
  causes: string[];
  hasBackgroundCheck: boolean;
  hoursDone: number;
  status: InterestStatus;
  opportunityNeed: string;
}

export interface Message {
  id: string;
  matchId: string;
  mine: boolean;
  body: string;
  createdAt: string;
}

export interface OrgDraft {
  name: string;
  cause: Cause;
  zone: string;
  exactAddress: string;
  need: string;
  schedule: string;
  availability: Availability[];
  verification: VerificationMethod;
  verificationDetail: string;
  requiresBackgroundCheck: boolean;
  impact: string;
}

export interface OrgSummary {
  id: string;
  name: string;
  cause: Cause;
  zone: string;
  verificationStatus: 'pending' | 'verified';
  opportunity: Opportunity | null;
}

export interface Impact {
  matches: number;
  meetings: number;
  hours: number;
  causes: number;
}

export type SwipeResult = { status: 'pass' } | { status: InterestStatus; matchId: string };
