/* ==========================================================
   sw.js — guarda la página en el celular para abrirla sin internet
   Al cambiar cualquier archivo, sube el número de VERSION.
   ========================================================== */

const VERSION = 'flores-para-ti-v3';

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './css/estilos.css?v=3',
  './js/flores.js?v=3',
  './js/ramo.js?v=3',
  './js/musica.js?v=3',
  './js/dedicatoria.js?v=3',
  './js/bienvenida.js?v=3',
  './js/instalar.js?v=3',
  './audio/cancion.mp3?v=3',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/apple-touch-icon.png',
];


/* ---------- Instalación: descarga todo una vez ---------- */

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(c => c !== VERSION).map(c => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});


/* ---------- Peticiones: primero lo guardado, luego internet ---------- */

// El reproductor pide la canción por partes ("Range"): se las damos desde lo guardado
async function parteDeAudio(request, guardada) {
  const blob = await guardada.blob();
  const m = /bytes=(\d+)-(\d*)/.exec(request.headers.get('range') || '');
  const inicio = m ? Number(m[1]) : 0;
  const fin = m && m[2] ? Number(m[2]) : blob.size - 1;
  return new Response(blob.slice(inicio, fin + 1), {
    status: 206,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Range': `bytes ${inicio}-${fin}/${blob.size}`,
      'Content-Length': String(fin - inicio + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    const guardada = await caches.match(request);
    if (guardada) {
      return request.headers.has('range') ? parteDeAudio(request, guardada) : guardada;
    }

    const respuesta = await fetch(request);
    // Guarda también las fuentes de Google para verlas sin internet
    const esFuente = /fonts\.(googleapis|gstatic)\.com/.test(request.url);
    if ((respuesta.ok || esFuente) && !request.headers.has('range')) {
      const copia = respuesta.clone();
      caches.open(VERSION).then(cache => cache.put(request, copia));
    }
    return respuesta;
  })());
});
