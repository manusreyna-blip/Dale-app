import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, Header, Screen, T } from '@/components/ui';
import { useData } from '@/lib/data';
import type { Candidate } from '@/lib/types';
import { fonts, useColors } from '@/lib/theme';

export default function OrgTeam() {
  const c = useColors();
  const { api } = useData();
  const [items, setItems] = useState<Candidate[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.listOrgMatches().then(setItems);
    }, [api]),
  );

  return (
    <Screen header={<Header />}>
      <T variant="h2">Mi equipo de voluntarios</T>
      {items.length === 0 ? (
        <T variant="muted">Cuando acepten a alguien, aparece acá para coordinar por chat.</T>
      ) : (
        items.map((k) => (
          <Pressable key={k.id} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: k.id } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: c.line }}>
            <Avatar id={k.id} name={k.firstName} />
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: fonts.bodyBold }}>{k.firstName}</T>
              <T variant="muted" style={{ fontSize: 13 }}>{k.availability}</T>
            </View>
            <T style={{ color: c.celeste, fontFamily: fonts.bodyBold }}>Chatear ›</T>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
