import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { DataApi } from './api';
import type { Availability, Candidate, Cause, Opportunity, Role, Session } from '../types';

function client(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Web: the login link in the email brings the session back in the URL.
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'implicit',
    },
  });
}

function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

type FeedRow = {
  id: string; org_id: string; org_name: string; cause: string; zone: string; need: string; schedule: string;
  availability: string[]; team: string; impact: string; is_formal: boolean; verification_label: string;
  requires_background_check: boolean;
};
const toOpp = (r: FeedRow): Opportunity => ({
  id: r.id,
  orgId: r.org_id,
  orgName: r.org_name,
  cause: r.cause as Cause,
  zone: r.zone,
  distanceKm: null,
  need: r.need,
  schedule: r.schedule,
  availability: r.availability as Availability[],
  team: r.team,
  impact: r.impact,
  isFormal: r.is_formal,
  verificationLabel: r.verification_label,
  requiresBackgroundCheck: r.requires_background_check,
});

type CandRow = { id: string; first_name: string; zone: string; availability: string; causes: string[]; has_background_check: boolean; hours_done: number; status: string; need: string };
const toCand = (r: CandRow): Candidate => ({
  id: r.id,
  firstName: r.first_name,
  zone: r.zone,
  availability: r.availability,
  causes: r.causes ?? [],
  hasBackgroundCheck: r.has_background_check,
  hoursDone: r.hours_done,
  status: r.status as Candidate['status'],
  opportunityNeed: r.need,
});

export function createSupabaseApi(url: string, key: string): DataApi {
  const sb = client(url, key);

  async function me() {
    const { data } = await sb.auth.getSession();
    return data.session?.user ?? null;
  }
  async function toSession(): Promise<Session | null> {
    const u = await me();
    if (!u) return null;
    const p = await sb.from('profiles').select('role').eq('id', u.id).maybeSingle();
    return { userId: u.id, email: u.email, role: (p.data?.role as Role) ?? null };
  }
  const OPP_SELECT =
    'id, need, schedule, availability, requires_background_check, organizations!inner(id, name, cause, zone, team, impact, is_formal, verification_label)';
  const nestedToOpp = (o: any): Opportunity =>
    toOpp({ ...o, org_id: o.organizations.id, org_name: o.organizations.name, cause: o.organizations.cause, zone: o.organizations.zone, team: o.organizations.team, impact: o.organizations.impact, is_formal: o.organizations.is_formal, verification_label: o.organizations.verification_label });

  return {
    mode: 'supabase',

    getSession: toSession,
    onSessionChange(cb) {
      const { data } = sb.auth.onAuthStateChange(() => {
        toSession().then(cb);
      });
      return () => data.subscription.unsubscribe();
    },
    async sendLoginCode(email) {
      const emailRedirectTo = Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      check(await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo } }));
    },
    async verifyLoginCode(email, token) {
      check(await sb.auth.verifyOtp({ email, token, type: 'email' }));
      return (await toSession())!;
    },
    async setRole(role) {
      const u = await me();
      check(await sb.from('profiles').update({ role }).eq('id', u!.id));
    },
    async signOut() {
      await sb.auth.signOut();
    },
    async deleteAccount() {
      check(await sb.rpc('delete_my_account'));
      await sb.auth.signOut();
    },

    async getVolunteerProfile() {
      const u = await me();
      if (!u) return null;
      const p = check(await sb.from('profiles').select('first_name, zone, availability, causes, has_background_check').eq('id', u.id).maybeSingle());
      if (!p || !p.first_name) return null;
      return { firstName: p.first_name, zone: p.zone ?? '', availability: p.availability as Availability, causes: (p.causes ?? []) as Cause[], hasBackgroundCheck: p.has_background_check };
    },
    async saveVolunteerProfile(p) {
      const u = await me();
      check(await sb.from('profiles').update({ first_name: p.firstName, zone: p.zone, availability: p.availability, causes: p.causes }).eq('id', u!.id));
    },
    async listFeed({ causes, availability }) {
      const rows = check(await sb.rpc('feed', { p_causes: causes, p_availability: availability })) as FeedRow[];
      return rows.map(toOpp);
    },
    async swipe(opp, liked) {
      const rows = check(await sb.rpc('swipe', { p_opp: opp, p_liked: liked })) as { id: string; status: string | null }[];
      const r = rows[0];
      if (!liked || !r?.status) return { status: 'pass' };
      return { status: r.status as 'pending' | 'accepted', matchId: r.id };
    },
    async listMatches() {
      const u = await me();
      const rows = check(
        await sb.from('swipes').select(`id, status, meeting_confirmed, opportunities!inner(${OPP_SELECT})`).eq('volunteer_id', u!.id).eq('liked', true).order('created_at', { ascending: false }),
      ) as any[];
      return rows.map((r) => ({ id: r.id, status: r.status, meetingConfirmed: r.meeting_confirmed, opportunity: nestedToOpp(r.opportunities) }));
    },
    async getImpact() {
      const rows = check(await sb.rpc('my_impact')) as any[];
      return rows[0] ?? { matches: 0, meetings: 0, hours: 0, causes: 0 };
    },

    async getMyOrg() {
      const u = await me();
      if (!u) return null;
      const g = check(await sb.from('organizations').select('id, name, cause, zone, verification_status, team, impact, is_formal, verification_label').eq('owner_id', u.id).maybeSingle()) as any;
      if (!g) return null;
      const o = check(await sb.from('opportunities').select('id, need, schedule, availability, requires_background_check').eq('org_id', g.id).order('created_at', { ascending: false }).limit(1).maybeSingle()) as any;
      return {
        id: g.id,
        name: g.name,
        cause: g.cause,
        zone: g.zone,
        verificationStatus: g.verification_status,
        opportunity: o ? nestedToOpp({ ...o, organizations: g }) : null,
      };
    },
    async createOrg(d) {
      const u = await me();
      const g = check(
        await sb.from('organizations').insert({ owner_id: u!.id, name: d.name, cause: d.cause, zone: d.zone, is_formal: d.verification === 'legal', verification_method: d.verification, impact: d.impact }).select('id').single(),
      ) as { id: string };
      check(await sb.from('org_private').insert({ org_id: g.id, exact_address: d.exactAddress, verification_detail: d.verificationDetail }));
      check(await sb.from('opportunities').insert({ org_id: g.id, need: d.need, schedule: d.schedule, availability: d.availability, requires_background_check: d.requiresBackgroundCheck }));
      return (await this.getMyOrg())!;
    },
    async listCandidates() {
      return (check(await sb.rpc('org_candidates', { p_status: 'pending' })) as CandRow[]).map(toCand);
    },
    async listOrgMatches() {
      return (check(await sb.rpc('org_candidates', { p_status: 'accepted' })) as CandRow[]).map(toCand);
    },
    async decideCandidate(id, accept) {
      check(await sb.rpc('decide_interest', { p_swipe: id, p_accept: accept }));
    },

    async getMatchTitle(matchId) {
      const u = await me();
      const s = check(await sb.from('swipes').select(`id, volunteer_id, status, meeting_confirmed, opportunities!inner(${OPP_SELECT})`).eq('id', matchId).single()) as any;
      const addr = s.meeting_confirmed ? ((await sb.rpc('get_meeting_address', { p_swipe: matchId })).data as string | null) : null;
      if (s.volunteer_id === u!.id) {
        const o = nestedToOpp(s.opportunities);
        return { title: o.orgName, subtitle: `${o.zone} · ${o.schedule}`, status: s.status, meetingConfirmed: s.meeting_confirmed, exactAddress: addr };
      }
      const p = (await sb.from('profiles').select('first_name, zone, availability').eq('id', s.volunteer_id).maybeSingle()).data;
      return { title: p?.first_name ?? 'Voluntario/a', subtitle: `${p?.zone ?? ''} · ${p?.availability ?? ''}`, status: s.status, meetingConfirmed: s.meeting_confirmed, exactAddress: addr };
    },
    async listMessages(matchId) {
      const u = await me();
      const rows = check(await sb.from('messages').select('id, swipe_id, sender_id, body, created_at').eq('swipe_id', matchId).order('created_at')) as any[];
      return rows.map((m) => ({ id: m.id, matchId: m.swipe_id, body: m.body, createdAt: m.created_at, mine: m.sender_id === u!.id }));
    },
    async sendMessage(matchId, body) {
      const u = await me();
      check(await sb.from('messages').insert({ swipe_id: matchId, sender_id: u!.id, body }));
    },
    subscribeMessages(matchId, cb) {
      const ch = sb
        .channel(`messages:${matchId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `swipe_id=eq.${matchId}` }, () => cb())
        .subscribe();
      return () => {
        sb.removeChannel(ch);
      };
    },
    async confirmMeeting(matchId) {
      check(await sb.rpc('confirm_meeting', { p_swipe: matchId }));
    },
    async report(matchId, reason) {
      const u = await me();
      check(await sb.from('reports').insert({ swipe_id: matchId, reporter_id: u!.id, reason }));
    },
  };
}
