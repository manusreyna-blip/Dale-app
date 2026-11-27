import { router, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, useColors } from '@/lib/theme';

type Tab = { href: string; label: string; glyph: string };

export function TabBar({ tabs }: { tabs: Tab[] }) {
  const c = useColors();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.line, paddingBottom: Math.max(insets.bottom, 8) }}>
      <View style={{ flexDirection: 'row', width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        {tabs.map((t) => {
          const active = path === t.href;
          return (
            <Pressable
              key={t.href}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => router.replace(t.href as never)}
              style={{ flex: 1, alignItems: 'center', paddingTop: 10, gap: 2 }}>
              <Text style={{ fontSize: 18, color: active ? c.celeste : c.muted }}>{t.glyph}</Text>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: active ? c.celeste : c.muted }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
