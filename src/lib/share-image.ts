import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export type ShareResult = 'shared' | 'downloaded' | 'unavailable';

/** Captures a view as a 1080×1920 PNG and opens the system share sheet (Instagram, WhatsApp…). */
export async function shareViewAsImage(ref: RefObject<View | null>, _filename: string): Promise<ShareResult> {
  const uri = await captureRef(ref, { format: 'png', quality: 1, width: 1080, height: 1920, result: 'tmpfile' });
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir en historias', UTI: 'public.png' });
  return 'shared';
}
