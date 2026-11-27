import { Slot } from 'expo-router';
import { View } from 'react-native';

import { TabBar } from '@/components/tab-bar';
import { useColors } from '@/lib/theme';

export default function VolunteerTabs() {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <TabBar
        tabs={[
          { href: '/descubrir', label: 'Descubrir', glyph: '▢' },
          { href: '/matches', label: 'Matches', glyph: '♡' },
          { href: '/impacto', label: 'Mi impacto', glyph: '☆' },
        ]}
      />
    </View>
  );
}
