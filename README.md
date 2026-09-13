# EventoSePack

App para captar leads en ferias y eventos: alta manual, escaneo de tarjetas de
visita (OCR) y un QR de autorregistro por evento. Pensada como PWA instalable
desde el navegador, desplegada en Vercel.

## Funcionalidades

- Login simple (email + contraseña, Supabase Auth).
- Eventos como "carpetas": cada feria es un evento independiente con su
  contador de leads.
- Alta manual de lead: nombre, apellidos, email, teléfono, empresa, nota.
- Escaneo de tarjeta: cámara o galería → OCR (OCR.space) → formulario
  pre-rellenado y editable antes de guardar.
- QR de autorregistro por evento: la otra persona escanea y rellena sus
  propios datos desde su móvil, sin necesitar la app.
- Aviso legal / política de privacidad y checkbox de consentimiento en el
  formulario público, para respaldar el uso de RGPD (consentimiento
  otorgado voluntariamente tras una conversación previa o al escanear el QR).

## Configuración

1. Copia `.env.local.example` a `.env.local` y rellena:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: del proyecto
     Supabase (tablas `epack_events` y `epack_leads`, con RLS ya configurado).
   - `OCR_SPACE_API_KEY`: clave gratuita de [ocr.space](https://ocr.space/ocrapi)
     (regístrate con un email, la key llega al momento).
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
