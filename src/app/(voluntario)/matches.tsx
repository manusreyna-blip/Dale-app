import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, Button, Header, Loading, Privacy, Screen, T } from '@/components/ui';
import { useData } from '@/lib/data';
import type { Match } from '@/lib/types';
import { fonts, useColors } from '@/lib/theme';

export default function Matches() {
  const c = useColors();
  const { api } = useData();
  const [items, setItems] = useState<Match[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.listMatches().then(setItems);
    }, [api]),
  );

  return (
    <Screen header={<Header />}>
      <T variant="h2">Tus matches</T>
      {items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <View style={{ gap: 12, paddingTop: 24 }}>
          <T variant="h3">Todavía no hay matches</T>
          <T variant="muted">Cuando le des “¡Dale!” a una entidad y te acepte, vas a poder chatear acá.</T>
          <Button title="Ir a descubrir" onPress={() => router.replace('/descubrir')} />
        </View>
      ) : (
        <View>
          {items.map((m) => {
            const ok = m.status === 'accepted';
            const rejected = m.status === 'rejected';
            return (
              <Pressable
                key={m.id}
                disabled={!ok}
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: m.id } })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: c.line }}>
                <Avatar id={m.opportunity.orgId} name={m.opportunity.orgName} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T style={{ fontFamily: fonts.bodyBold }} numberOfLines={1}>{m.opportunity.orgName}</T>
                  <T variant="muted" style={{ fontSize: 13 }} numberOfLines={1}>
                    {ok ? (m.meetingConfirmed ? 'Encuentro confirmado' : m.opportunity.schedule) : rejected ? 'Esta vez no se pudo' : 'Esperando que la entidad confirme'}
                  </T>
                </View>
                <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: ok ? c.yesSoft : rejected ? c.surface2 : c.solSoft }}>
                  <T variant="small" style={{ color: ok ? c.yes : c.ink, fontFamily: fonts.bodyBold }}>{ok ? 'Match' : rejected ? 'Cerrado' : 'Pendiente'}</T>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      <Privacy>Chateás dentro de la app. Tu teléfono y tu email no se comparten. La dirección exacta aparece cuando confirman el primer encuentro.</Privacy>
    </Screen>
  );
}
