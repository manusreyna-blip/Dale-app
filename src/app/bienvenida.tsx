import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, Header, Screen, T } from '@/components/ui';
import { useData } from '@/lib/data';
import type { Role } from '@/lib/types';
import { fonts, useColors } from '@/lib/theme';

export default function Welcome() {
  const c = useColors();
  const { api, session, refresh } = useData();

  const choose = async (role: Role) => {
    if (session) {
      // Logged in but without a role yet
      await api.setRole(role);
      await refresh();
      router.replace('/');
    } else {
      router.push({ pathname: '/ingresar', params: { rol: role } });
    }
  };

  return (
    <Screen header={<Header right={<T variant="small">Argentina</T>} />}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 22 }}>
        <View style={{ height: 150, borderRadius: 24, backgroundColor: c.celesteSoft, overflow: 'hidden', justifyContent: 'flex-end', padding: 16 }}>
          <View style={{ position: 'absolute', right: 40, top: 32, width: 54, height: 54, borderRadius: 27, backgroundColor: c.sol }} />
          <Text style={{ fontFamily: fonts.display, fontSize: 22, color: c.ink }}>1 hora tuya</Text>
          <T variant="muted">alcanza para que un merendero abra el sábado</T>
        </View>
        <T variant="h1">
          Hacé <Text style={{ color: c.celeste }}>match</Text> con una buena causa cerca tuyo.
        </T>
        <T variant="muted" style={{ fontSize: 16, lineHeight: 23 }}>
          Comedores, hogares, clubes y grupos de vecinos que necesitan una mano. Deslizá, elegí y sumate.
        </T>
        <View style={{ gap: 12 }}>
          <Button title="Quiero ayudar" onPress={() => choose('volunteer')} />
          <Button kind="ghost" title="Somos una entidad y necesitamos ayuda" onPress={() => choose('org')} />
        </View>
        <T variant="muted" style={{ fontSize: 13 }}>
          Tus datos no se comparten con nadie hasta que haya match.{' '}
          <Text style={{ color: c.celeste, fontFamily: fonts.bodySemi }} onPress={() => router.push('/privacidad')}>
            Cómo cuidamos tus datos
          </Text>
        </T>
      </View>
    </Screen>
  );
}
