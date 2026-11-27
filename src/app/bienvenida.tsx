import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Header, Screen, T } from '@/components/ui';
import { useData } from '@/lib/data';
import type { Role } from '@/lib/types';
import { WELCOME_PHOTO } from '@/lib/photos';
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
        <View style={{ height: 190, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end', padding: 16, backgroundColor: c.celesteSoft }}>
          <Image source={WELCOME_PHOTO} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Manos de varias personas juntas" />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,33,61,0.38)' }]} />
          <View style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 22, backgroundColor: c.sol }} />
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff' }}>1 hora tuya</Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: '#fff' }}>alcanza para que un merendero abra el sábado</Text>
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
          <Text onPress={() => router.push('/entidades')} style={{ textAlign: 'center', fontFamily: fonts.bodySemi, color: c.celeste, paddingVertical: 4 }}>
            ¿Tenés un comedor, hogar o club? Mirá cómo funciona
          </Text>
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
