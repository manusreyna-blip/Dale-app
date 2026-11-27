import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Share, Text, View } from 'react-native';

import { StoryShareModal } from '@/components/story-card';
import { Button, Header, Privacy, Screen, T } from '@/components/ui';
import { useData } from '@/lib/data';
import { WELCOME_PHOTO } from '@/lib/photos';
import type { Impact } from '@/lib/types';
import { fonts, useColors } from '@/lib/theme';

const BADGES: { label: string; done: (i: Impact) => boolean }[] = [
  { label: 'Primer match', done: (i) => i.matches >= 1 },
  { label: 'Primer encuentro', done: (i) => i.meetings >= 1 },
  { label: 'Dos causas', done: (i) => i.causes >= 2 },
  { label: '10 horas', done: (i) => i.hours >= 10 },
  { label: '5 encuentros', done: (i) => i.meetings >= 5 },
  { label: 'Tres causas', done: (i) => i.causes >= 3 },
];

export default function ImpactScreen() {
  const c = useColors();
  const { api } = useData();
  const [impact, setImpact] = useState<Impact>({ matches: 0, meetings: 0, hours: 0, causes: 0 });
  const [name, setName] = useState('');
  const [story, setStory] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.getImpact().then(setImpact);
      api.getVolunteerProfile().then((p) => setName(p?.firstName ?? ''));
    }, [api]),
  );

  const invite = async () => {
    try {
      await Share.share({
        message: `${name ? name + ' te invita' : 'Te invito'} a dale., la app para hacer match con causas de tu barrio. Con 1 hora alcanza. https://dale-ap.netlify.app`,
      });
    } catch {}
  };

  return (
    <Screen header={<Header right={<Text onPress={() => router.push('/privacidad')} style={{ fontFamily: fonts.bodySemi, color: c.celeste }}>Cuenta</Text>} />}>
      <T variant="h2">Mi impacto</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          [impact.hours, 'horas de bien'],
          [impact.matches, 'matches'],
          [impact.causes, 'causas'],
        ].map(([n, l]) => (
          <View key={l} style={{ flex: 1, backgroundColor: c.surface2, borderColor: c.line, borderWidth: 1, borderRadius: 16, padding: 12 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, color: c.ink, fontVariant: ['tabular-nums'] }}>{n}</Text>
            <T variant="small">{l}</T>
          </View>
        ))}
      </View>

      <T variant="label">Insignias</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {BADGES.map((b) => {
          const on = b.done(impact);
          return (
            <View key={b.label} style={{ width: '31.5%', alignItems: 'center', gap: 6, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: c.line, opacity: on ? 1 : 0.4 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: on ? c.sol : c.line }} />
              <T variant="small" style={{ color: c.ink, textAlign: 'center' }}>{b.label}</T>
            </View>
          );
        })}
      </View>
      <T variant="small">Cada encuentro confirmado suma 2 horas de bien.</T>

      <View style={{ borderRadius: 20, padding: 18, backgroundColor: c.celeste, gap: 6 }}>
        <Text style={{ color: '#fff', opacity: 0.85, fontFamily: fonts.bodySemi, fontSize: 12 }}>dale. · mi impacto</Text>
        <Text style={{ color: '#fff', fontFamily: fonts.display, fontSize: 22, lineHeight: 27 }}>
          {impact.hours > 0 ? `Doné ${impact.hours} horas a causas de mi barrio. ¿Te sumás?` : 'Me sumé a dale. para dar una mano en mi barrio. ¿Te sumás?'}
        </Text>
      </View>
      <Button kind="sol" title="Compartir en historias" onPress={() => setStory(true)} />
      <Button kind="ghost" title="Invitar a un amigo" onPress={invite} />
      <StoryShareModal
        visible={story}
        onClose={() => setStory(false)}
        filename="dale-mi-impacto.png"
        card={{
          photo: WELCOME_PHOTO,
          eyebrow: 'Mi impacto en dale.',
          title: impact.hours > 0 ? `Doné ${impact.hours} horas a causas de mi barrio` : 'Me sumé a dar una mano en mi barrio',
          subtitle: impact.matches > 0 ? `${impact.matches} ${impact.matches === 1 ? 'causa' : 'causas'} con las que hice match` : 'Con 1 hora alcanza.',
        }}
      />
      <Privacy>¿Trabajás en una empresa? Pueden armar un desafío de equipo. Las personas y las entidades nunca pagan.</Privacy>
    </Screen>
  );
}
