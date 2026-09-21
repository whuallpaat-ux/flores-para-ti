/* ==========================================================
   bienvenida.js — pantalla inicial "Toca para abrir"
   Ese primer toque es el que permite que suene la música,
   porque los navegadores no dejan sonar una página sin tocarla.
   ========================================================== */

(() => {
  const bienvenida = document.getElementById('bienvenida');

  function abrir() {
    if (window.Musica) window.Musica.play();
    bienvenida.classList.add('saliendo');
    // Se quita cuando termina de desvanecerse (o enseguida si no hay animación)
    const quitar = () => { bienvenida.hidden = true; };
    bienvenida.addEventListener('transitionend', quitar, { once: true });
    setTimeout(quitar, 900);
  }

  bienvenida.addEventListener('click', abrir, { once: true });
  bienvenida.focus();
})();
