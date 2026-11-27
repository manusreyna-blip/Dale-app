import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Chip, Chips, ErrorText, Field, Header, Privacy, Screen, T } from '@/components/ui';
import { useData } from '@/lib/data';
import { AVAILABILITY, CAUSES, type OrgDraft, type VerificationMethod } from '@/lib/types';
import { fonts, useColors } from '@/lib/theme';

const TEMPLATES = ['Necesitamos 2 personas para cocinar', 'Apoyo escolar para chicos', 'Compañía para personas mayores', 'Una mano por única vez'];
const VERIF: { k: VerificationMethod; t: string; d: string; detail: string }[] = [
  { k: 'legal', t: 'Tenemos personería jurídica', d: 'Cargás el CUIT o la resolución de IGJ / Personas Jurídicas.', detail: 'CUIT o número de resolución' },
  { k: 'referents', t: 'Nos conocen en el barrio', d: '2 o 3 referentes (escuela, parroquia, sociedad de fomento) confirman que existen.', detail: 'Nombre y contacto de 2 o 3 referentes' },
  { k: 'photos', t: 'Mostramos lo que hacemos', d: 'Fotos de la actividad y una videollamada corta con el equipo de dale.', detail: 'Un link a fotos o redes de la entidad' },
];

export default function OrgOnboarding() {
  const c = useColors();
  const { api } = useData();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [d, setD] = useState<OrgDraft>({
    name: '',
    cause: 'Comedores',
    zone: '',
    exactAddress: '',
    need: '',
    schedule: '',
    availability: ['Fines de semana'],
    verification: 'referents',
    verificationDetail: '',
    requiresBackgroundCheck: false,
    impact: '',
  });
  const set = (p: Partial<OrgDraft>) => setD((x) => ({ ...x, ...p }));

  const valid = [
    d.name.trim().length > 1 && d.zone.trim().length > 1 && d.exactAddress.trim().length > 3,
    d.need.trim().length > 4 && d.schedule.trim().length > 1 && d.availability.length > 0,
    d.verificationDetail.trim().length > 2,
  ][step];

  const next = async () => {
    if (step < 2) return setStep(step + 1);
    setBusy(true);
    setError(null);
    try {
      await api.createOrg({ ...d, name: d.name.trim(), zone: d.zone.trim(), need: d.need.trim(), schedule: d.schedule.trim(), impact: d.impact.trim() });
      router.replace('/panel');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos publicar. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen header={<Header onBack={step ? () => setStep(step - 1) : undefined} right={<T variant="small">Paso {step + 1} de 3</T>} />}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flex: 1, height: 5, borderRadius: 5, backgroundColor: i <= step ? c.celeste : c.line }} />
        ))}
      </View>

      {step === 0 ? (
        <>
          <T variant="h2">¿Quiénes son?</T>
          <Field label="Nombre" value={d.name} onChangeText={(name) => set({ name })} placeholder="Ej.: Merendero Los Girasoles" />
          <T variant="label">Qué hacen</T>
          <Chips>
            {CAUSES.map((x) => (
              <Chip key={x} label={x} selected={d.cause === x} onPress={() => set({ cause: x, requiresBackgroundCheck: x === 'Niñez' || x === 'Personas mayores' || x === 'Discapacidad' })} />
            ))}
          </Chips>
          <Field label="Barrio o localidad" value={d.zone} onChangeText={(zone) => set({ zone })} placeholder="Ej.: San Martín" hint="Es lo único de la ubicación que se muestra en la tarjeta." />
          <Field label="Dirección exacta" value={d.exactAddress} onChangeText={(exactAddress) => set({ exactAddress })} placeholder="Calle y número" hint="Privada. Solo la ve la persona que acepten, cuando confirmen el primer encuentro." />
        </>
      ) : step === 1 ? (
        <>
          <T variant="h2">¿Qué necesitan?</T>
          <Chips>
            {TEMPLATES.map((t) => (
              <Chip key={t} label={t} onPress={() => set({ need: t + '. ' })} />
            ))}
          </Chips>
          <Field label="Contalo en una o dos frases" value={d.need} onChangeText={(need) => set({ need })} multiline placeholder="O elegí una plantilla de arriba" />
          <Field label="Cuándo" value={d.schedule} onChangeText={(schedule) => set({ schedule })} placeholder="Ej.: Sábados de 16 a 18 h" />
          <Field label="Su impacto (opcional)" value={d.impact} onChangeText={(impact) => set({ impact })} placeholder="Ej.: 45 chicos meriendan cada sábado" hint="Una cifra concreta ayuda mucho a que la gente se sume." />
          <T variant="label">Qué tipo de tiempo piden</T>
          <Chips>
            {AVAILABILITY.map((a) => (
              <Chip key={a} label={a} selected={d.availability.includes(a)} onPress={() => set({ availability: d.availability.includes(a) ? d.availability.filter((x) => x !== a) : [...d.availability, a] })} />
            ))}
          </Chips>
          <Chip
            label={d.requiresBackgroundCheck ? '✓ Pedimos certificado de antecedentes' : 'Pedir certificado de antecedentes'}
            selected={d.requiresBackgroundCheck}
            onPress={() => set({ requiresBackgroundCheck: !d.requiresBackgroundCheck })}
          />
          <T variant="small">Recomendado si la tarea es con chicos, personas mayores o con discapacidad.</T>
        </>
      ) : (
        <>
          <T variant="h2">¿Cómo los validamos?</T>
          <T variant="muted">No hace falta personería. Elegí la opción que tengan a mano.</T>
          {VERIF.map((v) => {
            const on = d.verification === v.k;
            return (
              <Pressable key={v.k} onPress={() => set({ verification: v.k })} accessibilityRole="radio" accessibilityState={{ selected: on }}
                style={{ borderWidth: 1.5, borderRadius: 14, padding: 14, gap: 2, borderColor: on ? c.celeste : c.line, backgroundColor: on ? c.celesteSoft : c.surface }}>
                <T style={{ fontFamily: fonts.bodyBold }}>{v.t}</T>
                <T variant="muted" style={{ fontSize: 13 }}>{v.d}</T>
              </Pressable>
            );
          })}
          <Field label={VERIF.find((v) => v.k === d.verification)!.detail} value={d.verificationDetail} onChangeText={(verificationDetail) => set({ verificationDetail })} multiline />
          <Privacy>Estos datos se usan solo para verificar y no se publican. Mientras revisamos (24 a 48 h), su pedido queda guardado pero no aparece para voluntarios.</Privacy>
        </>
      )}

      <ErrorText error={error} />
      <Button title={step < 2 ? 'Seguir' : 'Enviar para verificar'} disabled={!valid} loading={busy} onPress={next} style={{ marginTop: 'auto' }} />
    </Screen>
  );
}
