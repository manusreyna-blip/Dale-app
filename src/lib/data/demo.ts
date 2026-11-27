import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DataApi } from './api';
import { DEMO_CANDIDATES, SEED } from './seed';
import type {
  Candidate,
  InterestStatus,
  Message,
  Opportunity,
  OrgSummary,
  Role,
  Session,
  VolunteerProfile,
} from '../types';

const KEY = 'dale.demo.v1';

interface DemoState {
  session: Session | null;
  profile: VolunteerProfile | null;
  swipes: { id: string; oppId: string; liked: boolean; status: InterestStatus | null; meetingConfirmed: boolean }[];
  org: (OrgSummary & { exactAddress: string }) | null;
  candidates: (Candidate & { meetingConfirmed: boolean })[];
  messages: Message[];
}

const empty = (): DemoState => ({ session: null, profile: null, swipes: [], org: null, candidates: [], messages: [] });

let state: DemoState = empty();
let loaded = false;
const sessionListeners = new Set<(s: Session | null) => void>();
const messageListeners = new Map<string, Set<() => void>>();
let seq = Date.now();
const uid = (p: string) => `${p}${(seq++).toString(36)}`;

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) state = { ...empty(), ...JSON.parse(raw) };
  } catch {}
}
async function save() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}
function emitMessages(matchId: string) {
  messageListeners.get(matchId)?.forEach((cb) => cb());
}
function setSession(s: Session | null) {
  state.session = s;
  sessionListeners.forEach((cb) => cb(s));
}
function oppById(id: string): Opportunity | undefined {
  return SEED.find((o) => o.id === id) ?? (state.org?.opportunity?.id === id ? state.org.opportunity : undefined);
}
function pushMsg(matchId: string, body: string, mine: boolean) {
  state.messages.push({ id: uid('m'), matchId, body, mine, createdAt: new Date().toISOString() });
}
const DEMO_ADDRESS = 'Calle de ejemplo 1234 (dirección de demostración)';

export const demoApi: DataApi = {
  mode: 'demo',

  async getSession() {
    await load();
    return state.session;
  },
  onSessionChange(cb) {
    sessionListeners.add(cb);
    return () => sessionListeners.delete(cb);
  },
  async sendLoginCode() {},
  async verifyLoginCode(email) {
    await load();
    setSession({ userId: uid('u'), role: null, email });
    await save();
    return state.session!;
  },
  async setRole(role: Role) {
    if (!state.session) return;
    setSession({ ...state.session, role });
    await save();
  },
  async signOut() {
    setSession(null);
    await save();
  },
  async deleteAccount() {
    state = empty();
    setSession(null);
    await save();
  },

  async getVolunteerProfile() {
    await load();
    return state.profile;
  },
  async saveVolunteerProfile(p) {
    state.profile = p;
    await save();
  },
  async listFeed({ causes, availability }) {
    await load();
    const seen = new Set(state.swipes.map((s) => s.oppId));
    const pool = SEED.filter((o) => !seen.has(o.id) && causes.includes(o.cause));
    const fits = pool.filter((o) => o.availability.includes(availability));
    const rest = pool.filter((o) => !fits.includes(o));
    return [...fits, ...rest].map(({ autoAccept, ...o }) => o);
  },
  async swipe(oppId, liked) {
    const opp = SEED.find((o) => o.id === oppId);
    if (!liked || !opp) {
      state.swipes.push({ id: uid('s'), oppId, liked: false, status: null, meetingConfirmed: false });
      await save();
      return { status: 'pass' };
    }
    const status: InterestStatus = opp.autoAccept ? 'accepted' : 'pending';
    const id = uid('s');
    state.swipes.push({ id, oppId, liked: true, status, meetingConfirmed: false });
    if (status === 'accepted') {
      pushMsg(id, `¡Hola${state.profile?.firstName ? ' ' + state.profile.firstName : ''}! Qué bueno que te sumes a ${opp.orgName}. ¿Te viene bien ${opp.schedule.toLowerCase()}?`, false);
    } else {
      // Simulate the org answering a bit later so the demo shows the "pendiente" state turning into a match.
      setTimeout(async () => {
        const s = state.swipes.find((x) => x.id === id);
        if (s && s.status === 'pending') {
          s.status = 'accepted';
          pushMsg(id, `¡Hola! Vimos tu dale. Nos encantaría que vengas a ${opp.orgName}.`, false);
          await save();
          emitMessages(id);
        }
      }, 20000);
    }
    await save();
    return { status, matchId: id };
  },
  async listMatches() {
    await load();
    return state.swipes
      .filter((s) => s.liked)
      .reverse()
      .map((s) => ({
        id: s.id,
        opportunity: oppById(s.oppId)!,
        status: s.status ?? 'pending',
        meetingConfirmed: s.meetingConfirmed,
        exactAddress: s.meetingConfirmed ? DEMO_ADDRESS : null,
      }))
      .filter((m) => m.opportunity);
  },
  async getImpact() {
    await load();
    const liked = state.swipes.filter((s) => s.liked && s.status === 'accepted');
    const meetings = liked.filter((s) => s.meetingConfirmed).length;
    const causes = new Set(liked.map((s) => oppById(s.oppId)?.cause)).size;
    return { matches: liked.length, meetings, hours: meetings * 2, causes };
  },

  async getMyOrg() {
    await load();
    return state.org;
  },
  async createOrg(d) {
    const orgId = uid('g');
    const opportunity: Opportunity = {
      id: uid('o'),
      orgId,
      orgName: d.name,
      cause: d.cause,
      zone: d.zone,
      distanceKm: null,
      need: d.need,
      schedule: d.schedule,
      availability: d.availability,
      team: 'Su equipo',
      impact: d.impact,
      isFormal: d.verification === 'legal',
      verificationLabel: 'Verificación en curso',
      requiresBackgroundCheck: d.requiresBackgroundCheck,
    };
    state.org = { id: orgId, name: d.name, cause: d.cause, zone: d.zone, verificationStatus: 'pending', opportunity, exactAddress: d.exactAddress };
    state.candidates = DEMO_CANDIDATES.map((c) => ({ ...c, id: uid('s'), status: 'pending', opportunityNeed: d.need, meetingConfirmed: false }));
    await save();
    return state.org;
  },
  async listCandidates() {
    await load();
    return state.candidates.filter((c) => c.status === 'pending');
  },
  async listOrgMatches() {
    await load();
    return state.candidates.filter((c) => c.status === 'accepted');
  },
  async decideCandidate(id, accept) {
    const c = state.candidates.find((x) => x.id === id);
    if (!c) return;
    c.status = accept ? 'accepted' : 'rejected';
    if (accept) pushMsg(id, `¡Hola! Gracias por aceptarme. ¿Qué necesitan que lleve?`, false);
    await save();
  },

  async getMatchTitle(matchId) {
    await load();
    const s = state.swipes.find((x) => x.id === matchId);
    if (s) {
      const o = oppById(s.oppId)!;
      return { title: o.orgName, subtitle: `${o.zone} · ${o.schedule}`, status: s.status ?? 'pending', meetingConfirmed: s.meetingConfirmed, exactAddress: s.meetingConfirmed ? DEMO_ADDRESS : null };
    }
    const c = state.candidates.find((x) => x.id === matchId);
    if (c) return { title: c.firstName, subtitle: `${c.zone} · ${c.availability}`, status: c.status, meetingConfirmed: c.meetingConfirmed, exactAddress: c.meetingConfirmed ? state.org?.exactAddress ?? null : null };
    return { title: 'Chat', subtitle: '', status: 'pending', meetingConfirmed: false, exactAddress: null };
  },
  async listMessages(matchId) {
    await load();
    return state.messages.filter((m) => m.matchId === matchId);
  },
  async sendMessage(matchId, body) {
    pushMsg(matchId, body, true);
    await save();
    emitMessages(matchId);
    setTimeout(async () => {
      pushMsg(matchId, '¡Dale! Traé ganas nomás, nosotros ponemos el resto.', false);
      await save();
      emitMessages(matchId);
    }, 1200);
  },
  subscribeMessages(matchId, cb) {
    if (!messageListeners.has(matchId)) messageListeners.set(matchId, new Set());
    messageListeners.get(matchId)!.add(cb);
    return () => messageListeners.get(matchId)?.delete(cb);
  },
  async confirmMeeting(matchId) {
    const s = state.swipes.find((x) => x.id === matchId);
    if (s) s.meetingConfirmed = true;
    const c = state.candidates.find((x) => x.id === matchId);
    if (c) c.meetingConfirmed = true;
    await save();
    emitMessages(matchId);
  },
  async report() {},
};
