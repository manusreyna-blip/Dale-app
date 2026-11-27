import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';

import { Button, Header, Privacy, Screen, T } from '@/components/ui';
import { CAUSE_PHOTOS } from '@/lib/photos';
import { fonts, useColors } from '@/lib/theme';

const LINK = 'https://dale-ap.netlify.app/entidades';

const STEPS = [
  ['Se registran en 3 pasos', 'Nombre, barrio y qué necesitan. Hay plantillas, se hace desde el celular en 5 minutos.'],
  ['Los verificamos', 'No hace falta personería: alcanza con 2 o 3 referentes del barrio (escuela, parroquia, sociedad de fomento) o fotos de lo que hacen.'],
  ['Les llegan voluntarios', 'Vecinos y vecinas de la zona les dan “¡Dale!”. Ustedes eligen a quién aceptar y coordinan por chat.'],
];

const FAQ = [
  ['¿Cuánto cuesta?', 'Nada. Para entidades y voluntarios es gratis, siempre.'],
  ['¿Quién puede sumarse?', 'Comedores, merenderos, hogares, clubes de barrio, bibliotecas populares, huertas, refugios, grupos de vecinos. Con o sin personería jurídica.'],
  ['¿Es seguro?', 'La dirección exacta solo la ve la persona que aceptan, cuando confirman el primer encuentro. Para tareas con chicos o personas mayores pedimos certificado de antecedentes.'],
  ['¿Qué tipo de ayuda puedo pedir?', 'Desde “una mano el sábado para cocinar” hasta apoyo escolar semanal, ordenar donaciones, difundir en redes o acompañar a personas mayores.'],
];

export default function ForOrgs() {
  const c = useColors();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const message = `Conocé dale.: una app gratis para que comedores, merenderos y grupos del barrio consigan voluntarios. ${LINK}`;
    if (Platform.OS === 'web') {
      const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
      if (nav.share) {
        try {
          await nav.share({ title: 'dale. para entidades', text: message, url: LINK });
          return;
        } catch {}
      }
      try {
        await navigator.clipboard.writeText(LINK);
        setCopied(true);
      } catch {}
      return;
    }
    try {
      await Share.share({ message });
    } catch {}
  };

  return (
    <Screen header={<Header onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}>
      <View style={{ height: 180, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end', padding: 16 }}>
        <Image source={CAUSE_PHOTOS.Comedores} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Olla y cucharón de un comedor" />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,33,61,0.45)' }]} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.8, color: '#fff', textTransform: 'uppercase' }}>Para entidades</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: '#fff' }}>Voluntarios del barrio para tu comedor, hogar o club</Text>
      </View>

      <T variant="muted" style={{ fontSize: 16, lineHeight: 23 }}>
        dale. conecta a personas que tienen un rato libre con las organizaciones chicas que más lo necesitan. Gratis y sin vueltas.
      </T>

      <View style={{ gap: 2 }}>
        <T variant="label">Cómo funciona</T>
      </View>
      {STEPS.map(([t, d], i) => (
        <View key={t} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.celeste, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.display, color: '#fff', fontSize: 16 }}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T style={{ fontFamily: fonts.bodyBold }}>{t}</T>
            <T variant="muted">{d}</T>
          </View>
        </View>
      ))}

      <Button title="Sumar mi entidad" onPress={() => router.push({ pathname: '/ingresar', params: { rol: 'org' } })} />
      <Button kind="ghost" title={copied ? 'Link copiado' : 'Compartir esta página'} onPress={share} />

      <T variant="label">Preguntas frecuentes</T>
      {FAQ.map(([q, a]) => (
        <View key={q} style={{ gap: 4 }}>
          <T style={{ fontFamily: fonts.bodyBold }}>{q}</T>
          <T variant="muted">{a}</T>
        </View>
      ))}

      <Privacy>Los datos de la entidad y de sus referentes se usan solo para verificar. Nunca se publican.</Privacy>
    </Screen>
  );
}
