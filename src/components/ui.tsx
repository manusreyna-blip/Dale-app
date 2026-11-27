import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/lib/data';
import { coverFor, coverInk, fonts, initials, useColors } from '@/lib/theme';

type TProps = { children: ReactNode; style?: StyleProp<TextStyle>; variant?: 'h1' | 'h2' | 'h3' | 'body' | 'muted' | 'label' | 'small'; numberOfLines?: number };
export function T({ children, style, variant = 'body', numberOfLines }: TProps) {
  const c = useColors();
  const base: Record<string, TextStyle> = {
    h1: { fontFamily: fonts.display, fontSize: 36, lineHeight: 38, color: c.ink, letterSpacing: -0.5 },
    h2: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: c.ink },
    h3: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: c.ink },
    body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: c.ink },
    muted: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    small: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, color: c.muted },
    label: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', color: c.muted },
  };
  return (
    <Text style={[base[variant], style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Screen({ children, scroll = true, header }: { children: ReactNode; scroll?: boolean; header?: ReactNode }) {
  const c = useColors();
  const inner = <View style={styles.inner}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top', 'left', 'right']}>
      <View style={styles.frame}>
        {header}
        {api.mode === 'demo' && <DemoBanner />}
        {scroll ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            {inner}
          </ScrollView>
        ) : (
          inner
        )}
      </View>
    </SafeAreaView>
  );
}

function DemoBanner() {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.solSoft, paddingVertical: 6, paddingHorizontal: 20 }}>
      <T variant="small" style={{ color: c.ink }}>
        Modo demo: entidades de ejemplo, los datos quedan solo en este dispositivo.
      </T>
    </View>
  );
}

export function Header({ right, onBack }: { right?: ReactNode; onBack?: () => void }) {
  const c = useColors();
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <T style={{ color: c.celeste, fontFamily: fonts.bodyBold }}>‹ Volver</T>
        </Pressable>
      ) : (
        <Text style={{ fontFamily: fonts.display, fontSize: 26, color: c.ink, letterSpacing: -0.6 }}>
          dale<Text style={{ color: c.celeste }}>.</Text>
        </Text>
      )}
      {right}
    </View>
  );
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'sol' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const bg = { primary: c.celeste, ghost: c.surface2, sol: c.sol, danger: c.noSoft }[kind];
  const fg = { primary: c.onAccent, ghost: c.ink, sol: '#14213D', danger: c.no }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1, borderColor: kind === 'ghost' ? c.line : 'transparent' },
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontFamily: fonts.bodyBold, fontSize: 15 }}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { borderColor: selected ? c.celeste : c.line, backgroundColor: selected ? c.celesteSoft : c.surface }]}>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <T variant="label">{label}</T>
      <TextInput
        placeholderTextColor={c.muted}
        {...props}
        style={[styles.input, { borderColor: c.line, color: c.ink, backgroundColor: c.surface }, props.multiline && { minHeight: 84, textAlignVertical: 'top' }]}
      />
      {hint ? <T variant="small">{hint}</T> : null}
    </View>
  );
}

export function Privacy({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <View style={[styles.privacy, { backgroundColor: c.surface2, borderColor: c.line }]}>
      <Text style={{ color: c.yes, fontSize: 15 }}>●</Text>
      <T variant="muted" style={{ flex: 1, fontSize: 13 }}>
        {children}
      </T>
    </View>
  );
}

export function Avatar({ id, name, size = 48 }: { id: string; name: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: coverFor(id), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.display, color: coverInk, fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
}

export function Tag({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'ok' | 'warn' }) {
  const c = useColors();
  const bg = { neutral: c.surface2, ok: c.yesSoft, warn: c.solSoft }[tone];
  const fg = { neutral: c.muted, ok: c.yes, warn: c.ink }[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: tone === 'neutral' ? 1 : 0, borderColor: c.line }}>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: fg }}>{label}</Text>
    </View>
  );
}

export function Loading() {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator color={c.celeste} />
    </View>
  );
}

export function ErrorText({ error }: { error: string | null }) {
  const c = useColors();
  if (!error) return null;
  return <T style={{ color: c.no, fontSize: 14 }}>{error}</T>;
}

export function Sheet({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }}>
      <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32, gap: 14, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  inner: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, minHeight: 52 },
  btn: { borderRadius: 14, paddingVertical: 15, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13 },
  input: { borderWidth: 1.5, borderRadius: 12, padding: 12, fontFamily: fonts.body, fontSize: 15 },
  privacy: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 12, alignItems: 'flex-start' },
});
