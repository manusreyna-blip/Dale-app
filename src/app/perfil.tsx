import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Chip, Chips, ErrorText, Field, Header, Screen, T } from '@/components/ui';
import { useData } from '@/lib/data';
import { AVAILABILITY, CAUSES, type Availability, type Cause } from '@/lib/types';

export default function VolunteerProfile() {
  const { api } = useData();
  const [firstName, setFirstName] = useState('');
  const [zone, setZone] = useState('');
  const [availability, setAvailability] = useState<Availability>('Fines de semana');
  const [causes, setCauses] = useState<Cause[]>([]);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getVolunteerProfile().then((p) => {
      if (!p) return;
      setEditing(true);
      setFirstName(p.firstName);
      setZone(p.zone);
      setAvailability(p.availability);
      setCauses(p.causes);
    });
  }, [api]);

  const toggle = (c: Cause) => setCauses((xs) => (xs.includes(c) ? xs.filter((x) => x !== c) : [...xs, c]));
  const ok = firstName.trim().length > 1 && zone.trim().length > 1 && causes.length > 0;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.saveVolunteerProfile({ firstName: firstName.trim(), zone: zone.trim(), availability, causes, hasBackgroundCheck: false });
      router.replace('/descubrir');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen header={<Header onBack={editing ? () => router.back() : undefined} />}>
      <View style={{ gap: 4 }}>
        <T variant="h2">¿Cuánto tiempo tenés?</T>
        <T variant="muted">Mostramos primero lo que te entra en la semana.</T>
      </View>
      <Chips>
        {AVAILABILITY.map((a) => (
          <Chip key={a} label={a} selected={availability === a} onPress={() => setAvailability(a)} />
        ))}
      </Chips>
      <View style={{ gap: 4 }}>
        <T variant="h2">¿Qué te mueve?</T>
        <T variant="muted">Elegí una o varias.</T>
      </View>
      <Chips>
        {CAUSES.map((c) => (
          <Chip key={c} label={c} selected={causes.includes(c)} onPress={() => toggle(c)} />
        ))}
      </Chips>
      <Field label="Tu nombre de pila" value={firstName} onChangeText={setFirstName} placeholder="Ej.: Manu" autoComplete="given-name" hint="Las entidades ven solo tu nombre de pila." />
      <Field label="Tu barrio o localidad" value={zone} onChangeText={setZone} placeholder="Ej.: Constitución, CABA" hint="Usamos solo la zona. Nunca pedimos ni mostramos tu dirección." />
      <ErrorText error={error} />
      <Button title={editing ? 'Guardar' : 'Empezar a deslizar'} disabled={!ok} loading={busy} onPress={save} style={{ marginTop: 'auto' }} />
    </Screen>
  );
}
