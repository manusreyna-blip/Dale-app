import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Tag, T } from './ui';
import type { Opportunity } from '@/lib/types';
import { coverFor, coverInk, fonts, initials, useColors } from '@/lib/theme';

export function OppCard({ o, style }: { o: Opportunity; style?: object }) {
  const c = useColors();
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }, style]}>
      <View style={[styles.cover, { backgroundColor: coverFor(o.orgId) }]}>
        <View style={[styles.pill, { left: 14, backgroundColor: 'rgba(255,255,255,0.92)' }]}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: coverInk }}>{o.cause}</Text>
        </View>
        <View style={[styles.pill, { right: 14, backgroundColor: 'rgba(20,33,61,0.82)' }]}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: '#fff' }}>
            {o.distanceKm != null ? `a ~${o.distanceKm} km` : o.zone === 'Remoto' ? 'Remoto' : o.zone.split(',')[0]}
          </Text>
        </View>
        <Text style={{ fontFamily: fonts.display, fontSize: 64, lineHeight: 64, color: coverInk }}>{initials(o.orgName)}</Text>
      </View>
      <View style={{ padding: 16, gap: 8, flex: 1 }}>
        <T variant="h3">{o.orgName}</T>
        <T>{o.need}</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Tag label={o.schedule} />
          <Tag label={o.zone} />
          {o.team ? <Tag label={o.team} /> : null}
          <Tag tone="ok" label={`✓ ${o.verificationLabel}`} />
          {o.requiresBackgroundCheck ? <Tag tone="warn" label="Pide certificado de antecedentes" /> : null}
        </View>
        {o.impact ? (
          <View style={{ marginTop: 'auto', borderTopWidth: 1, borderStyle: 'dashed', borderColor: c.line, paddingTop: 8 }}>
            <T variant="muted" style={{ fontSize: 13 }}>
              Impacto: <Text style={{ color: c.ink, fontFamily: fonts.bodyBold }}>{o.impact}</Text>
            </T>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export type DeckHandle = { swipe: (liked: boolean) => void };

export const SwipeDeck = forwardRef<DeckHandle, { items: Opportunity[]; onSwipe: (o: Opportunity, liked: boolean) => void }>(
  function SwipeDeck({ items, onSwipe }, ref) {
    const c = useColors();
    const { width } = useWindowDimensions();
    const pos = useRef(new Animated.ValueXY()).current;
    const top = items[0];
    const busy = useRef(false);
    const latest = useRef({ top, onSwipe });
    latest.current = { top, onSwipe };

    useEffect(() => {
      pos.setValue({ x: 0, y: 0 });
      busy.current = false;
    }, [top?.id, pos]);

    const fling = (liked: boolean) => {
      const { top: t, onSwipe: cb } = latest.current;
      if (!t || busy.current) return;
      busy.current = true;
      Animated.timing(pos, { toValue: { x: (liked ? 1 : -1) * (width + 200), y: 40 }, duration: 240, useNativeDriver: Platform.OS !== 'web' }).start(() => cb(t, liked));
    };
    useImperativeHandle(ref, () => ({ swipe: fling }));

    useEffect(() => {
      if (Platform.OS !== 'web') return;
      const h = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.key === 'ArrowRight') fling(true);
        if (e.key === 'ArrowLeft') fling(false);
      };
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
    });

    const responder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4,
        onPanResponderMove: (_, g) => pos.setValue({ x: g.dx, y: g.dy * 0.3 }),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > 110 || Math.abs(g.vx) > 0.8) fling(g.dx > 0);
          else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: Platform.OS !== 'web', friction: 6 }).start();
        },
      }),
    ).current;

    if (!top) return null;
    const rotate = pos.x.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-16deg', '0deg', '16deg'] });
    const yesOp = pos.x.interpolate({ inputRange: [0, 110], outputRange: [0, 1], extrapolate: 'clamp' });
    const noOp = pos.x.interpolate({ inputRange: [-110, 0], outputRange: [1, 0], extrapolate: 'clamp' });
    const next = items[1];

    return (
      <View style={{ flex: 1, minHeight: 420 }}>
        {next ? <OppCard key={next.id} o={next} style={{ transform: [{ scale: 0.95 }, { translateY: 14 }] }} /> : null}
        <Animated.View
          key={top.id}
          {...responder.panHandlers}
          accessibilityLabel={`${top.orgName}. ${top.need}`}
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }, Platform.OS === 'web' ? ({ cursor: 'grab', userSelect: 'none', touchAction: 'none' } as object) : null]}>
          <OppCard o={top} />
          <Animated.View style={[styles.stamp, { left: 20, borderColor: c.yes, opacity: yesOp, transform: [{ rotate: '-12deg' }], backgroundColor: c.surface }]}>
            <Text style={[styles.stampText, { color: c.yes }]}>¡DALE!</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, { right: 20, borderColor: c.no, opacity: noOp, transform: [{ rotate: '12deg' }], backgroundColor: c.surface }]}>
            <Text style={[styles.stampText, { color: c.no }]}>PASO</Text>
          </Animated.View>
        </Animated.View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#14213D',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cover: { height: '36%', minHeight: 120, justifyContent: 'flex-end', padding: 16 },
  pill: { position: 'absolute', top: 14, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  stamp: { position: 'absolute', top: 24, borderWidth: 4, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 2 },
  stampText: { fontFamily: fonts.display, fontSize: 30 },
});
