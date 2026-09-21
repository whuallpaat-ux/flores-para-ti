/* ==========================================================
   dedicatoria.js — abre y cierra el sobre con la carta
   ========================================================== */

(() => {
  const sobre = document.getElementById('sobre');
  const carta = document.getElementById('carta');
  const cerrar = document.getElementById('cerrar');
  const unaColumna = matchMedia('(max-width: 820px)');

  function abrir() {
    sobre.hidden = true;
    sobre.setAttribute('aria-expanded', 'true');
    carta.hidden = false;
    // Abrir el sobre también empieza la música
    if (window.Musica) window.Musica.play();
    // En el celular la carta queda debajo del ramo: bajamos hasta ella
    if (unaColumna.matches) carta.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function guardar() {
    carta.hidden = true;
    sobre.hidden = false;
    sobre.setAttribute('aria-expanded', 'false');
    sobre.focus();
  }

  sobre.addEventListener('click', abrir);
  cerrar.addEventListener('click', guardar);
})();
