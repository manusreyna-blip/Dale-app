import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { Button, Header, Screen, T } from '@/components/ui';
import { useData } from '@/lib/data';
import { PHOTO_CREDITS } from '@/lib/photos';
import { fonts, useColors } from '@/lib/theme';

const POINTS = [
  ['Qué ven los demás', 'Las entidades ven tu nombre de pila, tu zona, tu disponibilidad y tus insignias, y solo si les diste “¡Dale!”. Nunca tu email ni tu teléfono.'],
  ['Ubicación', 'Usamos el barrio o la localidad, nunca tu dirección. La dirección de una entidad se muestra solo a la persona aceptada, cuando confirman el primer encuentro.'],
  ['Chat', 'Todo se habla dentro de la app. Podés reportar una conversación en cualquier momento.'],
  ['Antecedentes', 'Para tareas con chicos, personas mayores o con discapacidad pedimos el certificado de antecedentes penales. Las entidades solo ven “verificado”.'],
  ['Entidades', 'Las verificamos antes de que aparezcan: por personería jurídica, por referentes del barrio o con fotos y una videollamada.'],
  ['Tus derechos', 'Podés ver, corregir o borrar tus datos cuando quieras (Ley 25.326 de Protección de Datos Personales). Borrar la cuenta elimina todo de forma definitiva.'],
];

export default function Privacy() {
  const c = useColors();
  const { api, session, refresh } = useData();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <Screen header={<Header onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}>
      <T variant="h2">Cómo cuidamos tus datos</T>
      {POINTS.map(([t, d]) => (
        <View key={t} style={{ gap: 4 }}>
          <T variant="label">{t}</T>
          <T>{d}</T>
        </View>
      ))}

      <View style={{ gap: 4 }}>
        <T variant="label">Fotos</T>
        <T variant="muted" style={{ fontSize: 13 }}>
          Las fotos de portada son de Unsplash, con licencia libre. Gracias a{' '}
          {PHOTO_CREDITS.map((p, i) => (
            <Text key={p.file} style={{ color: c.celeste, fontFamily: fonts.bodySemi }} onPress={() => Linking.openURL(p.photo_url)}>
              {p.author}
              {i < PHOTO_CREDITS.length - 1 ? ', ' : '.'}
            </Text>
          ))}
        </T>
      </View>

      {session ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          {session.role === 'volunteer' ? <Button kind="ghost" title="Editar mi perfil" onPress={() => router.push('/perfil')} /> : null}
          <Button
            kind="ghost"
            title="Cerrar sesión"
            onPress={async () => {
              await api.signOut();
              await refresh();
              router.replace('/');
            }}
          />
          {!confirm ? (
            <Button kind="danger" title="Borrar mi cuenta y mis datos" onPress={() => setConfirm(true)} />
          ) : (
            <View style={{ gap: 10, borderWidth: 1, borderColor: c.no, borderRadius: 14, padding: 12 }}>
              <T>¿Seguro? Se borran tu perfil, tus matches y tus mensajes. No se puede deshacer.</T>
              <Button
                kind="danger"
                title="Sí, borrar todo"
                loading={busy}
                onPress={async () => {
                  setBusy(true);
                  await api.deleteAccount();
                  await refresh();
                  router.replace('/');
                }}
              />
              <Button kind="ghost" title="Cancelar" onPress={() => setConfirm(false)} />
            </View>
          )}
        </View>
      ) : null}
    </Screen>
  );
}
