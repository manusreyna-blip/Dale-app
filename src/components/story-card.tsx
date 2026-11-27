import { useRef, useState } from 'react';
import { Image, Modal, Text, View } from 'react-native';

import { Button, T } from './ui';
import { shareViewAsImage } from '@/lib/share-image';
import { fonts, useColors } from '@/lib/theme';

const SITE = 'dale-ap.netlify.app';

type Props = { photo: number; eyebrow: string; title: string; subtitle?: string };

/** 9:16 card designed for Instagram / WhatsApp stories. Fixed colors so it looks the same in any theme. */
export function StoryCard({ photo, eyebrow, title, subtitle, innerRef }: Props & { innerRef?: React.Ref<View> }) {
  return (
    <View ref={innerRef} collapsable={false} style={{ width: 300, height: 533, borderRadius: 0, overflow: 'hidden', backgroundColor: '#14213D' }}>
      <View style={{ width: 300, height: 310 }}>
        <Image source={photo} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, width: 300, height: 310 }} />
        <View style={{ position: 'absolute', top: 0, left: 0, width: 300, height: 310, backgroundColor: 'rgba(20,33,61,0.25)', padding: 20 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 34, color: '#fff' }}>
            dale<Text style={{ color: '#FFB21E' }}>.</Text>
          </Text>
        </View>
      </View>
      <View style={{ flex: 1, backgroundColor: '#2B93D1', padding: 20, gap: 8 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.6, textTransform: 'uppercase' }}>{eyebrow}</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 25, lineHeight: 29, color: '#fff' }}>{title}</Text>
        {subtitle ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 19, color: '#fff' }}>{subtitle}</Text> : null}
        <View style={{ marginTop: 'auto', backgroundColor: '#FFB21E', alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: '#14213D' }}>¿Te sumás? {SITE}</Text>
        </View>
      </View>
    </View>
  );
}

/** Full-screen sheet with the story preview and a button that shares it as an image. */
export function StoryShareModal({ visible, onClose, card, filename }: { visible: boolean; onClose: () => void; card: Props; filename: string }) {
  const c = useColors();
  const ref = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const share = async () => {
    setBusy(true);
    setNote(null);
    try {
      const r = await shareViewAsImage(ref, filename);
      if (r === 'downloaded') setNote('Descargamos la imagen. Subila a tus historias desde la galería.');
      if (r === 'unavailable') setNote('Este dispositivo no permite compartir imágenes desde la app.');
    } catch {
      setNote('No pudimos generar la imagen. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 14 }}>
        <StoryCard {...card} innerRef={ref} />
        <View style={{ width: 300, gap: 10 }}>
          <Button kind="sol" title="Compartir imagen" loading={busy} onPress={share} />
          <Button kind="ghost" title="Cerrar" onPress={onClose} />
          {note ? <T variant="small" style={{ color: '#fff', textAlign: 'center' }}>{note}</T> : null}
        </View>
      </View>
    </Modal>
  );
}
