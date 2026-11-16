/**
 * Worker de falconx.cl en Cloudflare.
 * - El sitio estático (dist/) lo sirve Cloudflare directo; este código solo corre en /api/*.
 * - POST /api/contacto: valida el formulario y envía un aviso por correo con el binding send_email.
 *   El destino (CONTACT_TO) es un secreto: debe ser una dirección verificada en Email Routing.
 */

interface Env {
  ASSETS: Fetcher;
  CONTACT_EMAIL: SendEmail;
  CONTACT_TO: string;
}

const FROM = { name: 'Formulario FalconX', email: 'formulario@falconx.cl' };
const MAX_BODY_BYTES = 10 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Mismos value del <select> de Contacto.astro
const SERVICIOS: Record<string, string> = {
  'agente-whatsapp': 'Agente de IA para WhatsApp',
  'medida': 'Proyecto a medida',
  'coordinacion-equipo': 'Coordinación de Equipo',
  'leads-whatsapp': 'Envío de Mensajes a Leads',
  'instagram': 'Automatización de Instagram',
  'tiktok': 'Automatización de TikTok',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/** Texto de una línea: sin saltos ni caracteres de control (evita inyección en cabeceras). */
const oneLine = (v: string, max: number) =>
  v.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/** Texto multilínea: conserva saltos, quita otros caracteres de control. */
const multiLine = (v: string, max: number) =>
  v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max);

async function handleContacto(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }

  // Solo aceptar envíos desde el propio sitio
  const origin = request.headers.get('Origin');
  const host = new URL(request.url).host;
  let originHost = '';
  try { originHost = origin ? new URL(origin).host : ''; } catch { /* Origin inválido */ }
  if (originHost !== host) return json({ ok: false }, 403);

  const ctype = request.headers.get('Content-Type') ?? '';
  if (!ctype.startsWith('application/x-www-form-urlencoded')) return json({ ok: false }, 415);

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ ok: false }, 413);
  const form = new URLSearchParams(raw);
  const get = (k: string) => form.get(k) ?? '';

  // Honeypot: un humano no ve este campo; si viene lleno, fingir éxito sin enviar
  if (get('sitio_web').trim() !== '') return json({ ok: true });

  const nombre = oneLine(get('nombre'), 100);
  const email = oneLine(get('email'), 254);
  const empresa = oneLine(get('empresa'), 100);
  const telefono = oneLine(get('telefono'), 30);
  const servicioKey = get('servicio');
  const mensaje = multiLine(get('mensaje'), 3000);

  if (!nombre || !EMAIL_RE.test(email) || (servicioKey && !(servicioKey in SERVICIOS))) {
    return json({ ok: false }, 400);
  }

  const servicio = servicioKey ? SERVICIOS[servicioKey] : '(no indicó)';
  const text = [
    'Nueva solicitud desde el formulario de falconx.cl',
    '',
    `Nombre:    ${nombre}`,
    `Email:     ${email}`,
    `Empresa:   ${empresa || '-'}`,
    `WhatsApp:  ${telefono || '-'}`,
    `Servicio:  ${servicio}`,
    '',
    'Mensaje:',
    mensaje || '(sin mensaje)',
    '',
    '—',
    'Responde este correo para contestarle directo a la persona.',
  ].join('\n');

  try {
    await env.CONTACT_EMAIL.send({
      from: FROM,
      to: env.CONTACT_TO,
      replyTo: { name: nombre, email },
      subject: `Nueva solicitud — ${nombre}`,
      text,
    });
  } catch (err) {
    console.error('contacto: fallo al enviar correo', err);
    return json({ ok: false }, 500);
  }

  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contacto') return handleContacto(request, env);
    if (pathname.startsWith('/api/')) return new Response('Not Found', { status: 404 });
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
