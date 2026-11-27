import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { StoryShareModal } from '@/components/story-card';
import { SwipeDeck, type DeckHandle } from '@/components/swipe-deck';
import { Button, Chip, Header, Loading, Privacy, Screen, Sheet, T, Tag } from '@/components/ui';
import { useData } from '@/lib/data';
import { CAUSE_PHOTOS } from '@/lib/photos';
import type { Opportunity, VolunteerProfile } from '@/lib/types';
import { fonts, useColors } from '@/lib/theme';

const HINT_KEY = 'dale.swipeHint.v1';

type Result = { o: Opportunity; status: 'accepted' | 'pending'; matchId: string };

export default function Discover() {
  const c = useColors();
  const { api } = useData();
  const deck = useRef<DeckHandle>(null);
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [items, setItems] = useState<Opportunity[] | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [info, setInfo] = useState<Opportunity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const p = await api.getVolunteerProfile();
        if (!p) return router.replace('/perfil');
        const feed = await api.listFeed({ causes: p.causes, availability: p.availability });
        if (alive) {
          setProfile(p);
          setItems(feed);
        }
      })().catch((e) => alive && setError(String(e?.message ?? e)));
      return () => {
        alive = false;
      };
    }, [api]),
  );

  const visible = (items ?? []).filter((o) => !filter || o.cause === filter);

  const onSwipe = async (o: Opportunity, liked: boolean) => {
    if (hint) dismissHint();
    setItems((xs) => (xs ?? []).filter((x) => x.id !== o.id));
    try {
      const r = await api.swipe(o.id, liked);
      if (r.status === 'accepted' || r.status === 'pending') setResult({ o, status: r.status, matchId: r.matchId });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar tu elección.');
    }
  };

  const [story, setStory] = useState<Opportunity | null>(null);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(HINT_KEY)
      .then((v) => setHint(v !== 'done'))
      .catch(() => setHint(true));
  }, []);
  const dismissHint = () => {
    setHint(false);
    AsyncStorage.setItem(HINT_KEY, 'done').catch(() => {});
  };

  return (
    <Screen scroll={false} header={<Header right={<Pressable onPress={() => router.push('/perfil')} hitSlop={10}><Tag label={profile?.availability ?? '…'} /></Pressable>} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginHorizontal: -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
        {(profile?.causes ?? []).map((cause) => (
          <Chip key={cause} label={cause} selected={filter === cause} onPress={() => setFilter(filter === cause ? null : cause)} />
        ))}
        <Chip label="+ Editar" onPress={() => router.push('/perfil')} />
      </ScrollView>

      {error ? <T style={{ color: c.no }}>{error}</T> : null}

      {items === null ? (
        <Loading />
      ) : visible.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 12 }}>
          <T variant="h3" style={{ textAlign: 'center' }}>No hay más pedidos por ahora</T>
          <T variant="muted" style={{ textAlign: 'center' }}>
            Probá sumar otras causas o ampliar tu disponibilidad. Cada semana se suman entidades nuevas.
          </T>
          <Button kind="ghost" title="Editar preferencias" onPress={() => router.push('/perfil')} />
        </View>
      ) : (
        <>
          {hint ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.celesteSoft, borderRadius: 14, padding: 12 }}>
              <T style={{ flex: 1, fontSize: 14 }}>
                Deslizá a la <Text style={{ fontFamily: fonts.bodyBold, color: c.yes }}>derecha</Text> si te sumás y a la{' '}
                <Text style={{ fontFamily: fonts.bodyBold, color: c.no }}>izquierda</Text> si pasás. También podés usar los botones.
              </T>
              <Pressable onPress={dismissHint} accessibilityRole="button" hitSlop={8}>
                <Text style={{ fontFamily: fonts.bodyBold, color: c.celeste }}>Entendido</Text>
              </Pressable>
            </View>
          ) : null}
          <SwipeDeck ref={deck} items={visible} onSwipe={onSwipe} hint={hint} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
            <RoundBtn label="Paso" glyph="✕" color={c.no} size={60} onPress={() => deck.current?.swipe(false)} />
            <RoundBtn label="Ver más" glyph="i" color={c.celeste} size={46} onPress={() => setInfo(visible[0])} />
            <RoundBtn label="¡Dale!" glyph="♥" color={c.yes} size={70} onPress={() => deck.current?.swipe(true)} />
          </View>
        </>
      )}

      <Modal visible={!!result} transparent animationType="slide" onRequestClose={() => setResult(null)}>
        {result ? (
          <Sheet>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: result.status === 'accepted' ? 40 : 30, color: result.status === 'accepted' ? c.celeste : c.ink }}>
                {result.status === 'accepted' ? '¡Es un match!' : '¡Le diste dale!'}
              </Text>
              <T variant="muted" style={{ textAlign: 'center' }}>
                {result.status === 'accepted'
                  ? `${result.o.orgName} también quiere sumarte.`
                  : `${result.o.orgName} revisa los pedidos y suele responder en menos de un día. Te avisamos.`}
              </T>
            </View>
            <View style={{ borderRadius: 20, padding: 18, backgroundColor: c.celeste, gap: 6 }}>
              <Text style={{ color: '#fff', opacity: 0.85, fontFamily: fonts.bodySemi, fontSize: 12 }}>dale. · voluntariado cerca tuyo</Text>
              <Text style={{ color: '#fff', fontFamily: fonts.display, fontSize: 22, lineHeight: 27 }}>
                Me sumé a {result.o.orgName}{result.o.impact ? `: ${result.o.impact.toLowerCase()}` : ''}.
              </Text>
            </View>
            {result.o.requiresBackgroundCheck ? (
              <Privacy>
                Esta actividad es con personas vulnerables. Antes del primer encuentro te vamos a pedir el certificado de antecedentes penales (se tramita online y es gratis). La entidad solo ve “verificado”.
              </Privacy>
            ) : null}
            <Button
              title={result.status === 'accepted' ? 'Escribirles' : 'Seguir deslizando'}
              onPress={() => {
                const r = result;
                setResult(null);
                if (r.status === 'accepted') router.push({ pathname: '/chat/[id]', params: { id: r.matchId } });
              }}
            />
            <Button
              kind="ghost"
              title="Compartir en historias"
              onPress={() => {
                const o = result.o;
                setResult(null);
                setStory(o);
              }}
            />
          </Sheet>
        ) : null}
      </Modal>

      <Modal visible={!!info} transparent animationType="slide" onRequestClose={() => setInfo(null)}>
        {info ? (
          <Sheet>
            <T variant="h2">{info.orgName}</T>
            <T>{info.need}</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Tag label={info.schedule} />
              <Tag label={info.zone} />
              {info.team ? <Tag label={info.team} /> : null}
              <Tag tone="ok" label={`✓ ${info.verificationLabel}`} />
            </View>
            <Privacy>
              Mostramos el barrio, no la dirección. {info.isFormal ? 'Entidad con personería jurídica.' : 'Entidad sin personería, validada por personas del barrio que la conocen.'}
            </Privacy>
            <Button title="Volver a la tarjeta" onPress={() => setInfo(null)} />
          </Sheet>
        ) : null}
      </Modal>
      {story ? (
        <StoryShareModal
          visible
          onClose={() => setStory(null)}
          filename="dale-me-sume.png"
          card={{ photo: CAUSE_PHOTOS[story.cause], eyebrow: `Voluntariado · ${story.cause}`, title: `Me sumé a ${story.orgName}`, subtitle: story.impact || undefined }}
        />
      ) : null}
    </Screen>
  );
}

function RoundBtn({ glyph, color, size, label, onPress }: { glyph: string; color: string; size: number; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.surface,
        borderWidth: 1.5,
        borderColor: c.line,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.94 : 1 }],
        shadowColor: '#14213D',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      })}>
      <Text style={{ color, fontSize: size * 0.42, fontFamily: fonts.bodyBold, lineHeight: size * 0.5 }}>{glyph}</Text>
    </Pressable>
  );
}
