import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { OppCard } from '@/components/swipe-deck';
import { Avatar, Header, Loading, Privacy, Screen, T } from '@/components/ui';
import { useData } from '@/lib/data';
import type { Candidate, OrgSummary } from '@/lib/types';
import { fonts, useColors } from '@/lib/theme';

export default function OrgPanel() {
  const c = useColors();
  const { api } = useData();
  const [org, setOrg] = useState<OrgSummary | null | undefined>(undefined);
  const [cands, setCands] = useState<Candidate[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const o = await api.getMyOrg();
    if (!o) return router.replace('/alta-entidad');
    setOrg(o);
    setCands(await api.listCandidates());
  }, [api]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const decide = async (cand: Candidate, accept: boolean) => {
    await api.decideCandidate(cand.id, accept);
    setNotice(accept ? `Aceptaron a ${cand.firstName}. Ya pueden chatear en “Mi equipo”.` : `Listo. ${cand.firstName} no recibe un rechazo, simplemente no avanza.`);
    load();
  };

  if (org === undefined) return <Loading />;

  return (
    <Screen header={<Header right={<Text onPress={() => router.push('/privacidad')} style={{ fontFamily: fonts.bodySemi, color: c.celeste }}>Cuenta</Text>} />}>
      <T variant="h2">{org?.name}</T>
      {org?.verificationStatus === 'pending' ? (
        <View style={{ backgroundColor: c.solSoft, borderRadius: 14, padding: 12, gap: 2 }}>
          <T style={{ fontFamily: fonts.bodyBold }}>Estamos verificando la entidad</T>
          <T variant="muted" style={{ fontSize: 13, color: c.ink }}>
            Suele tardar 24 a 48 h. Cuando esté lista, su pedido empieza a aparecer para voluntarios de la zona.
            {api.mode === 'demo' ? ' En la demo ya pueden ver interesados de ejemplo.' : ''}
          </T>
        </View>
      ) : null}

      {org?.opportunity ? (
        <View style={{ gap: 8 }}>
          <T variant="label">Así ven su pedido</T>
          <View style={{ height: 380 }}>
            <OppCard o={org.opportunity} />
          </View>
        </View>
      ) : null}

      <T variant="label">Personas interesadas ({cands.length})</T>
      {notice ? <T variant="small" style={{ color: c.yes }}>{notice}</T> : null}
      {cands.length === 0 ? (
        <T variant="muted">Todavía no hay interesados. Cuando alguien les dé “¡Dale!”, aparece acá.</T>
      ) : (
        cands.map((k) => (
          <View key={k.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: c.line }}>
            <Avatar id={k.id} name={k.firstName} size={44} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T style={{ fontFamily: fonts.bodyBold }}>
                {k.firstName} <Text style={{ fontFamily: fonts.body, color: c.muted, fontSize: 13 }}>{k.zone}</Text>
              </T>
              <T variant="muted" style={{ fontSize: 13 }}>
                {k.availability} · {k.hoursDone ? `${k.hoursDone} horas de bien` : 'Nuevo en dale'}
                {k.hasBackgroundCheck ? ' · Antecedentes verificados' : ''}
              </T>
            </View>
            <Circle label={`Rechazar a ${k.firstName}`} glyph="✕" color={c.no} onPress={() => decide(k, false)} />
            <Circle label={`Aceptar a ${k.firstName}`} glyph="♥" color={c.yes} onPress={() => decide(k, true)} />
          </View>
        ))
      )}
      <Privacy>Ven nombre de pila, zona y disponibilidad. Email y teléfono nunca se comparten: hablan por el chat de la app.</Privacy>
    </Screen>
  );
}

function Circle({ glyph, color, label, onPress }: { glyph: string; color: string; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}
      style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: 18, fontFamily: fonts.bodyBold }}>{glyph}</Text>
    </Pressable>
  );
}
