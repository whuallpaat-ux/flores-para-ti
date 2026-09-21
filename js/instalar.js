/* ==========================================================
   instalar.js — botón "Guardar" para instalar la página como app
   Android (Chrome): abre directamente el aviso de instalación.
   iPhone y otros: muestra los pasos para agregarla al inicio.
   ========================================================== */

(() => {
  const boton = document.getElementById('guardar');
  const ayuda = document.getElementById('ayuda-guardar');
  const pasos = document.getElementById('pasos-guardar');
  const cerrar = document.getElementById('cerrar-ayuda');

  // Guarda la página para abrirla sin internet
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Si ya se abrió como app instalada, el botón no hace falta
  const yaInstalada = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (yaInstalada) return;

  let avisoAndroid = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    avisoAndroid = e;
  });
  window.addEventListener('appinstalled', () => { boton.hidden = true; });

  const esIphone = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  function mostrarPasos() {
    pasos.innerHTML = esIphone
      ? `<li>Si lo abriste desde WhatsApp, toca <b>«Abrir en Safari»</b>.</li>
         <li>Toca el botón <b>Compartir</b> (el cuadrado con la flecha ↑).</li>
         <li>Elige <b>«Agregar a pantalla de inicio»</b> y luego <b>«Agregar»</b>.</li>`
      : `<li>Si lo abriste desde WhatsApp, toca <b>⋮</b> y elige <b>«Abrir en Chrome»</b>.</li>
         <li>En Chrome, toca los tres puntos <b>⋮</b> de arriba a la derecha.</li>
         <li>Elige <b>«Instalar app»</b> o <b>«Agregar a pantalla principal»</b>.</li>`;
    ayuda.showModal();
  }

  boton.addEventListener('click', async () => {
    if (avisoAndroid) {
      avisoAndroid.prompt();
      await avisoAndroid.userChoice;
      avisoAndroid = null;
    } else {
      mostrarPasos();
    }
  });

  cerrar.addEventListener('click', () => ayuda.close());
  boton.hidden = false;
})();
