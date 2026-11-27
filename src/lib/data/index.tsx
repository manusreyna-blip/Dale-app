import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { DataApi } from './api';
import { demoApi } from './demo';
import { createSupabaseApi } from './supabase';
import type { Session } from '../types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Without Supabase keys the app runs in demo mode with example entities. */
export const api: DataApi = url && key ? createSupabaseApi(url, key) : demoApi;

interface Ctx {
  api: DataApi;
  session: Session | null;
  ready: boolean;
  refresh: () => Promise<void>;
}
const DataContext = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.getSession().then((s) => {
      setSession(s);
      setReady(true);
    });
    return api.onSessionChange(setSession);
  }, []);

  const value = useMemo(
    () => ({ api, session, ready, refresh: async () => setSession(await api.getSession()) }),
    [session, ready],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const c = useContext(DataContext);
  if (!c) throw new Error('useData outside DataProvider');
  return c;
}
