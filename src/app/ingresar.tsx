import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, ErrorText, Field, Header, Privacy, Screen, T } from '@/components/ui';
import { useData } from '@/lib/data';
import { rememberRole } from '@/lib/pending-role';
import { fonts, useColors } from '@/lib/theme';
import type { Role } from '@/lib/types';

export default function Login() {
  const { rol } = useLocalSearchParams<{ rol: Role }>();
  const c = useColors();
  const { api, refresh } = useData();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const role: Role = rol === 'org' ? 'org' : 'volunteer';

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos completar el paso. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const finish = async (s: { role: Role | null }) => {
    if (!s.role) await api.setRole(role);
    await refresh();
    router.replace('/');
  };

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  return (
    <Screen header={<Header onBack={() => router.back()} />}>
      <T variant="h2">{role === 'org' ? 'Sumá tu entidad' : 'Sumate como voluntario/a'}</T>
      <T variant="muted">Sin contraseñas: te mandamos un mail para entrar.</T>

      {api.mode === 'demo' ? (
        <View style={{ gap: 12 }}>
          <Button title="Probar la demo" loading={busy} onPress={() => run(async () => finish(await api.verifyLoginCode('demo@dale.ar', '000000')))} />
          <T variant="small">En la demo no hace falta email. Con la app conectada a la base de datos, el ingreso es con código.</T>
        </View>
      ) : !sent ? (
        <View style={{ gap: 12 }}>
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" inputMode="email" />
          <Button title="Enviarme el acceso" disabled={!validEmail} loading={busy} onPress={() => run(async () => { await rememberRole(role); await api.sendLoginCode(email.trim()); setSent(true); })} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <View style={{ backgroundColor: c.celesteSoft, borderRadius: 14, padding: 14, gap: 4 }}>
            <T style={{ fontFamily: fonts.bodyBold }}>Revisá tu email</T>
            <T variant="muted" style={{ color: c.ink }}>
              Te mandamos un mail a {email}. Tocá el botón o link del mail y vas a entrar directo. Si no llega en un par de minutos, revisá Spam o Promociones.
            </T>
          </View>
          <Field label="¿El mail trae un código? Ingresalo acá" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" />
          <Button title="Entrar con el código" disabled={code.length !== 6} loading={busy} onPress={() => run(async () => finish(await api.verifyLoginCode(email.trim(), code)))} />
          <Button kind="ghost" title="Cambiar email" onPress={() => { setSent(false); setCode(''); }} />
        </View>
      )}
      <ErrorText error={error} />
      <Privacy>Tu email nunca se muestra a otras personas ni a las entidades. Lo usamos solo para que entres.</Privacy>
    </Screen>
  );
}
