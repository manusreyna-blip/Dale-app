import { Slot } from 'expo-router';
import { View } from 'react-native';

import { TabBar } from '@/components/tab-bar';
import { useColors } from '@/lib/theme';

export default function OrgTabs() {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <TabBar
        tabs={[
          { href: '/panel', label: 'Interesados', glyph: '♡' },
          { href: '/equipo', label: 'Mi equipo', glyph: '☺' },
        ]}
      />
    </View>
  );
}
