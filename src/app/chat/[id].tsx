import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, TextInput, View, Pressable, Text } from 'react-native';

import { Avatar, Button, Chip, Field, Header, Privacy, Screen, Sheet, T } from '@/components/ui';
import { useData } from '@/lib/data';
import type { Message } from '@/lib/types';
import { fonts, useColors } from '@/lib/theme';

type Info = Awaited<ReturnType<ReturnType<typeof useData>['api']['getMatchTitle']>>;

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const { api } = useData();
  const [info, setInfo] = useState<Info | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);

  // Bumping `tick` reloads the conversation (after sending, confirming, or a realtime event).
  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    Promise.all([api.getMatchTitle(id), api.listMessages(id)]).then(([i, m]) => {
      if (!alive) return;
      setInfo(i);
      setMsgs(m);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => {
      alive = false;
    };
  }, [api, id, tick]);

  useEffect(() => api.subscribeMessages(id, load), [api, id, load]);

  const send = async (body: string) => {
    const t = body.trim();
    if (!t) return;
    setText('');
    await api.sendMessage(id, t);
    load();
  };

  const accepted = info?.status === 'accepted';

  return (
    <Screen scroll={false} header={<Header onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} right={<Text onPress={() => setReporting(true)} style={{ fontFamily: fonts.bodySemi, color: c.muted }}>Reportar</Text>} />}>
      <KeyboardAvoidingView style={{ flex: 1, gap: 10 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        {info ? (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Avatar id={id} name={info.title} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T style={{ fontFamily: fonts.bodyBold }}>{info.title}</T>
              <T variant="muted" style={{ fontSize: 13 }} numberOfLines={1}>{info.subtitle}</T>
            </View>
          </View>
        ) : null}

        {info && !accepted ? <Privacy>La entidad todavía no confirmó. Te avisamos apenas responda.</Privacy> : null}
        {info?.meetingConfirmed ? (
          <Privacy>
            Encuentro confirmado.{info.exactAddress ? ` Dirección: ${info.exactAddress}.` : ''} Solo ustedes dos ven esta información.
          </Privacy>
        ) : null}

        <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingVertical: 6 }}>
          {msgs.map((m) => (
            <View
              key={m.id}
              style={{
                maxWidth: '80%',
                alignSelf: m.mine ? 'flex-end' : 'flex-start',
                backgroundColor: m.mine ? c.celeste : c.surface2,
                borderWidth: m.mine ? 0 : 1,
                borderColor: c.line,
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: 16,
                borderBottomRightRadius: m.mine ? 4 : 16,
                borderBottomLeftRadius: m.mine ? 16 : 4,
              }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 15, color: m.mine ? '#fff' : c.ink }}>{m.body}</Text>
            </View>
          ))}
        </ScrollView>

        {notice ? <T variant="small" style={{ color: c.yes }}>{notice}</T> : null}

        {accepted ? (
          <View style={{ gap: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip label="¿Qué tengo que llevar?" onPress={() => send('¿Qué tengo que llevar?')} />
              {!info?.meetingConfirmed ? (
                <Chip
                  label="Confirmar primer encuentro"
                  onPress={async () => {
                    await api.confirmMeeting(id);
                    load();
                  }}
                />
              ) : null}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Escribí un mensaje"
                placeholderTextColor={c.muted}
                onSubmitEditing={() => send(text)}
                returnKeyType="send"
                accessibilityLabel="Mensaje"
                style={{ flex: 1, minWidth: 0, borderWidth: 1.5, borderColor: c.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, color: c.ink, fontFamily: fonts.body, fontSize: 15 }}
              />
              <Pressable onPress={() => send(text)} accessibilityRole="button" style={{ backgroundColor: c.celeste, borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontFamily: fonts.bodyBold }}>Enviar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <Modal visible={reporting} transparent animationType="slide" onRequestClose={() => setReporting(false)}>
        <Sheet>
          <T variant="h3">Reportar esta conversación</T>
          <T variant="muted">Lo revisa una persona del equipo de dale. La otra parte no se entera de que reportaste.</T>
          <Field label="¿Qué pasó?" value={reason} onChangeText={setReason} multiline placeholder="Contanos en pocas palabras" />
          <Button
            kind="danger"
            title="Enviar reporte"
            disabled={reason.trim().length < 3}
            onPress={async () => {
              await api.report(id, reason.trim());
              setReporting(false);
              setReason('');
              setNotice('Recibimos tu reporte. Gracias por cuidar la comunidad.');
            }}
          />
          <Button kind="ghost" title="Cancelar" onPress={() => setReporting(false)} />
        </Sheet>
      </Modal>
    </Screen>
  );
}
