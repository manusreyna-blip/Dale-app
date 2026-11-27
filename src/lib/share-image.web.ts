import type { RefObject } from 'react';
import type { View } from 'react-native';
import html2canvas from 'html2canvas';

export type ShareResult = 'shared' | 'downloaded' | 'unavailable';

/** Web: uses the phone's share sheet when the browser supports sharing files, otherwise downloads the PNG. */
export async function shareViewAsImage(ref: RefObject<View | null>, filename: string): Promise<ShareResult> {
  const el = ref.current as unknown as HTMLElement | null;
  if (!el) return 'unavailable';
  // Render at 1080 px wide (Instagram story size) whatever the screen density.
  const canvas = await html2canvas(el, { scale: 1080 / el.offsetWidth, useCORS: true, backgroundColor: null });
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'dale.' });
      return 'shared';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'shared';
    }
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return 'downloaded';
}
