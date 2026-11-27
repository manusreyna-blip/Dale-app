import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { Loading } from '@/components/ui';
import { useData } from '@/lib/data';
import { takePendingRole } from '@/lib/pending-role';

/** Decides where each person lands depending on their account state. */
export default function Gate() {
  const { api, session, ready, refresh } = useData();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      if (!session) return setTarget('/bienvenida');
      if (!session.role) {
        // Came back from the email link: apply the role chosen before logging in.
        const pending = await takePendingRole();
        if (pending) {
          await api.setRole(pending);
          await refresh();
          return;
        }
        return setTarget('/bienvenida');
      }
      if (session.role === 'volunteer') {
        const p = await api.getVolunteerProfile();
        if (alive) setTarget(p ? '/descubrir' : '/perfil');
      } else {
        const o = await api.getMyOrg();
        if (alive) setTarget(o ? '/panel' : '/alta-entidad');
      }
    })().catch(() => alive && setTarget('/bienvenida'));
    return () => {
      alive = false;
    };
  }, [ready, session, api, refresh]);

  if (!target) return <Loading />;
  return <Redirect href={target as never} />;
}
