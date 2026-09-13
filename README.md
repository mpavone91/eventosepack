# Lead Capturer

App para captar leads en ferias y eventos: alta manual, escaneo de tarjetas de
visita (OCR) y un QR de autorregistro por evento. Pensada como PWA instalable
desde el navegador, desplegada en Vercel.

## Funcionalidades

- Login por email + PIN (Supabase Auth). No hay registro público: solo un
  manager puede dar de alta cuentas nuevas desde la pantalla "Equipo".
- Roles: un `manager` ve todos los eventos y leads del equipo; un `rep`
  (comercial) ve y gestiona todo lo compartido pero solo puede editar/borrar
  lo que él mismo creó.
- Eventos como "carpetas" compartidas por todo el equipo: cada feria es un
  evento con su contador de leads, visible para todos los que tengan cuenta.
- Alta manual de lead: nombre, apellidos, email, teléfono, empresa, nota.
- Escaneo de tarjeta: cámara o galería → extracción con IA (Claude, visión) →
  formulario pre-rellenado y editable antes de guardar.
- QR de autorregistro por evento: la otra persona escanea y rellena sus
  propios datos desde su móvil, sin necesitar la app.
- Aviso legal / política de privacidad y checkbox de consentimiento en el
  formulario público, para respaldar el uso de RGPD (consentimiento
  otorgado voluntariamente tras una conversación previa o al escanear el QR).

## Configuración

1. Copia `.env.local.example` a `.env.local` y rellena:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: del proyecto
     Supabase (tablas `epack_events` y `epack_leads`, con RLS ya configurado).
   - `ANTHROPIC_API_KEY`: clave de la [consola de Anthropic](https://console.anthropic.com/)
     usada para extraer los datos de la tarjeta con visión (modelo Claude Haiku).
   - `SUPABASE_SERVICE_ROLE_KEY`: clave secreta de Supabase (Project Settings →
     API → service_role). Solo se usa en el servidor, nunca llega al cliente —
     la necesita la pantalla "Equipo" para crear cuentas de compañeros sin
     cerrar la sesión del manager.
2. `npm install`
3. `npm run dev`

## Despliegue en Vercel

1. Conecta este repo en Vercel.
2. Añade las mismas variables de entorno del paso anterior en el proyecto de
   Vercel (Settings → Environment Variables).
3. Deploy. La app es instalable como PWA desde el propio navegador (menú
   "Añadir a pantalla de inicio" / "Instalar app").

## Notas legales (RGPD)

Los leads solo deben recogerse tras una conversación previa y con entrega
voluntaria de los datos, o porque la persona escanea el QR y decide enviar su
información. La app registra el método de captación (`manual`, `card_scan`,
`qr_self`) y muestra el aviso de privacidad en el formulario de autorregistro.
Revisa `/privacy` y ajusta el texto a tu empresa antes de usarla en un evento
real.
