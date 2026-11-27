import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Role } from './types';

/** The role picked before logging in, kept while the person goes to their email and back. */
const KEY = 'dale.pendingRole';

export async function rememberRole(role: Role) {
  try {
    await AsyncStorage.setItem(KEY, role);
  } catch {}
}

export async function takePendingRole(): Promise<Role | null> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    await AsyncStorage.removeItem(KEY);
    return v === 'org' || v === 'volunteer' ? v : null;
  } catch {
    return null;
  }
}
