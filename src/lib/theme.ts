import { useColorScheme } from 'react-native';

const light = {
  bg: '#EEF4F9',
  surface: '#FFFFFF',
  surface2: '#F4F8FB',
  ink: '#14213D',
  muted: '#5B6B82',
  line: '#D9E3EC',
  celeste: '#2B93D1',
  celesteSoft: '#DDEEF9',
  sol: '#FFB21E',
  solSoft: '#FFF1D2',
  yes: '#169C68',
  yesSoft: '#DDF4EA',
  no: '#D9485F',
  noSoft: '#FBE3E7',
  onAccent: '#FFFFFF',
  overlay: 'rgba(14,22,38,0.55)',
};
const dark: typeof light = {
  bg: '#0E1626',
  surface: '#17223A',
  surface2: '#1D2A45',
  ink: '#EAF1F8',
  muted: '#9DB0C8',
  line: '#2A3A58',
  celeste: '#5DB6EA',
  celesteSoft: '#1C3854',
  sol: '#FFC24D',
  solSoft: '#3A3020',
  yes: '#3CC58D',
  yesSoft: '#173B30',
  no: '#F06B80',
  noSoft: '#41222B',
  onAccent: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.6)',
};
export type Palette = typeof light;

export function useColors(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
};

/** Pastel covers for cards; always paired with dark ink text so they read in both themes. */
export const coverColors = ['#8FD0F5', '#FFD27A', '#A8E6C8', '#F5B8C4', '#C9C2F2', '#FFC6A0', '#B5E3E8'];
export const coverInk = '#14213D';

export function coverFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return coverColors[h % coverColors.length];
}

const SKIP = /^(Hogar|Merendero|Olla Popular|Biblioteca Popular|Huerta Comunitaria|Comedor|Club)\s/i;
export function initials(name: string) {
  const words = name.replace(SKIP, '').split(/[\s,]+/).filter((w) => w.length > 2);
  return (words.slice(0, 2).map((w) => w[0]).join('') || name.slice(0, 2)).toUpperCase();
}
