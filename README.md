# dale.

App para hacer *match* entre personas con ganas de ayudar y entidades chicas (comedores, merenderos, hogares, clubes, grupos de vecinos) que necesitan una mano. Funciona en **iOS, Android y web** con un solo código (Expo + React Native) y usa **Supabase** como base de datos.

## Qué incluye el MVP

**Voluntarios**
- Ingreso sin contraseña, con un código por email.
- Perfil en un minuto: disponibilidad ("1–2 h por semana", "Fines de semana", "Una sola vez", "Remoto"), causas, nombre de pila y barrio.
- Descubrir: tarjetas para deslizar (derecha = ¡Dale!, izquierda = paso; también con botones o con las flechas del teclado en la web). Primero aparece lo que encaja con tu disponibilidad.
- Match: algunas entidades aceptan automáticamente y otras revisan cada pedido.
- Chat interno, confirmación del primer encuentro y botón para reportar.
- Mi impacto: horas, matches, causas, insignias e invitar amigos.

**Entidades**
- Alta en 3 pasos, con plantillas de pedido.
- Verificación flexible: personería jurídica, referentes del barrio o fotos con una videollamada.
- Panel de interesados para aceptar o rechazar, "Mi equipo" y chat.

**Privacidad** (detalle en `supabase/migrations/0001_init.sql`)
- Nadie ve el email ni el teléfono de nadie.
- Las tarjetas muestran solo el barrio. La dirección exacta la ve únicamente la persona aceptada, después de confirmar el primer encuentro.
- Una entidad solo ve a quienes le dieron "¡Dale!", y solo nombre de pila, zona, disponibilidad e insignias.
- Las entidades no aparecen hasta que un administrador las verifica.
- El certificado de antecedentes lo marca solo un administrador. Nadie puede autodeclararlo.
- "Borrar mi cuenta" elimina todo (Ley 25.326).
- Hay 20 pruebas automáticas de estas reglas en `supabase/tests`.

## Modo demo vs. modo real

Sin variables de entorno, la app arranca en **modo demo**: muestra 10 entidades de ejemplo y guarda los datos solo en el dispositivo. Sirve para mostrarla a entidades y a posibles socios.

Con las variables de Supabase, pasa a **modo real**: cuentas, matches y chat en tiempo real entre personas reales.

## Cómo correrla

```bash
npm install
npm run web        # en el navegador
npm start          # escaneá el QR con la app Expo Go (iOS / Android)
```

## Activar el modo real (Supabase)

1. Creá un proyecto gratis en https://supabase.com. Elegí la región São Paulo, que es la más cercana a Argentina.
2. En **SQL Editor**, pegá y ejecutá el contenido de `supabase/migrations/0001_init.sql`.
3. En **Authentication → Providers → Email**, dejá activado "Email OTP".
4. En **Authentication → Email Templates → Magic Link**, poné `{{ .Token }}` en el cuerpo para que el mail incluya el código de 6 dígitos.
5. Copiá `.env.example` como `.env` y completá `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (están en **Settings → API**). La clave "anon" es pública por diseño: la seguridad la dan las reglas de la base. **Nunca** pongas la clave "service_role" en la app.
6. Para verificar una entidad: en **Table Editor → organizations**, cambiá `verification_status` a `verified` y escribí en `verification_label` cómo se verificó (por ejemplo "Validada por 3 referentes del barrio"). Los datos para verificarla están en `org_private`.

## Publicar

- **Web en Netlify (actual):** `netlify.toml` ya tiene la configuración. En Netlify: Add new site → Import from GitHub → `dale-app`. Para el modo real, cargá las dos variables `EXPO_PUBLIC_…` en Site configuration → Environment variables.
- **Web:** el workflow `.github/workflows/deploy-web.yml` publica la web en GitHub Pages con cada push a `main`. Hay que activarlo en Settings → Pages → Source: "GitHub Actions". Para el modo real, cargá las dos variables `EXPO_PUBLIC_…` en Settings → Secrets and variables → Actions → **Variables**.
- **iOS / Android:** con EAS (`npx eas-cli@latest build`). Hace falta una cuenta de Apple Developer (USD 99 por año) y de Google Play (USD 25, pago único).

## Estructura

```
src/app/                 pantallas (Expo Router)
  bienvenida, ingresar, perfil, privacidad, alta-entidad, chat/[id]
  (voluntario)/          descubrir, matches, impacto
  (entidad)/             panel, equipo
src/components/          UI, mazo de tarjetas, barra de pestañas
src/lib/data/            demo.ts (modo demo) · supabase.ts (modo real) · seed.ts (ejemplos)
supabase/migrations/     esquema y reglas de seguridad
supabase/tests/          pruebas de privacidad
```

## Próximos pasos sugeridos

- Notificaciones push (nuevo match, mensaje nuevo).
- Distancia real a partir de la zona (geocodificación aproximada, sin guardar direcciones de voluntarios).
- Carga del certificado de antecedentes y flujo de revisión.
- Panel de administración para verificar entidades.
- Varios pedidos por entidad.
- Desafíos para empresas (modelo de ingresos).
