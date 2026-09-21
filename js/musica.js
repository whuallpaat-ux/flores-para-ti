/* ==========================================================
   musica.js — botón de música
   Si existe audio/cancion.mp3 suena esa canción.
   Si no, toca una melodía suave de cajita musical generada aquí.
   Expone window.Musica con play(), pause() y toggle().
   ========================================================== */

(() => {
  const boton = document.getElementById('musica');
  const texto = boton.querySelector('.musica-texto');

  const archivo = new Audio('audio/cancion.mp3?v=3');
  archivo.loop = true;
  archivo.volume = 0.8;
  archivo.preload = 'auto';

  // La cajita musical solo se usa si el archivo de la canción no carga
  let archivoFalla = false;
  archivo.addEventListener('error', () => { archivoFalla = true; });

  let sonando = false;


  /* ---------- Cajita musical ---------- */

  const cajita = (() => {
    const BPM = 76;
    const OCTAVO = 60 / BPM / 2; // duración de una corchea en segundos

    // Acordes (notas MIDI): Do, La menor, Fa, Sol
    const ACORDES = [
      [60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67],
      [60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67],
    ];
    const ARPEGIO = [0, 1, 2, 3, 2, 1, 2, 1];

    // Melodía: una nota por corchea, null = silencio
    const MELODIA = [
      [76, null, null, null, 79, null, 77, null],
      [76, null, null, null, 72, null, null, null],
      [77, null, null, null, 76, null, 74, null],
      [74, null, null, null, null, null, null, null],
      [76, null, null, null, 79, null, 81, null],
      [79, null, null, null, 76, null, null, null],
      [77, null, 76, null, 74, null, 72, null],
      [74, null, null, null, 71, null, null, null],
    ];

    let ac = null;
    let master = null;
    let salida = null;
    let timer = 0;
    let paso = 0;
    let siguiente = 0;

    const frecuencia = midi => 440 * Math.pow(2, (midi - 69) / 12);

    function preparar() {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      ac = new Contexto();
      master = ac.createGain();
      master.gain.value = 0;
      master.connect(ac.destination);

      // Eco suave para dar sensación de espacio
      salida = ac.createGain();
      const eco = ac.createDelay();
      const retorno = ac.createGain();
      const mezcla = ac.createGain();
      eco.delayTime.value = 0.28;
      retorno.gain.value = 0.28;
      mezcla.gain.value = 0.22;
      salida.connect(master);
      salida.connect(eco);
      eco.connect(retorno);
      retorno.connect(eco);
      eco.connect(mezcla);
      mezcla.connect(master);
    }

    // Una nota con ataque corto y caída larga, como una lámina de metal
    function nota(midi, tiempo, volumen, duracion) {
      const f = frecuencia(midi);
      const env = ac.createGain();
      env.gain.setValueAtTime(0.0001, tiempo);
      env.gain.exponentialRampToValueAtTime(volumen, tiempo + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, tiempo + duracion);
      env.connect(salida);

      const base = ac.createOscillator();
      base.type = 'sine';
      base.frequency.value = f;
      base.connect(env);

      const brillo = ac.createOscillator();
      const brilloGain = ac.createGain();
      brillo.type = 'triangle';
      brillo.frequency.value = f * 2;
      brilloGain.gain.value = 0.18;
      brillo.connect(brilloGain);
      brilloGain.connect(env);

      [base, brillo].forEach(o => {
        o.start(tiempo);
        o.stop(tiempo + duracion + 0.05);
      });
    }

    function programar() {
      while (siguiente < ac.currentTime + 0.25) {
        const compas = Math.floor(paso / 8) % ACORDES.length;
        const tiempoCompas = paso % 8;
        const acorde = ACORDES[compas];

        nota(acorde[ARPEGIO[tiempoCompas]], siguiente, 0.05, 1.6);
        if (tiempoCompas === 0) nota(acorde[0] - 12, siguiente, 0.07, 2.4);
        const m = MELODIA[compas][tiempoCompas];
        if (m) nota(m, siguiente, 0.11, 2.2);

        siguiente += OCTAVO;
        paso++;
      }
    }

    function start() {
      if (!ac) preparar();
      ac.resume();
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setTargetAtTime(0.9, ac.currentTime, 0.4);
      siguiente = ac.currentTime + 0.05;
      clearInterval(timer);
      timer = setInterval(programar, 50);
      programar();
    }

    function stop() {
      if (!ac) return;
      clearInterval(timer);
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setTargetAtTime(0, ac.currentTime, 0.2);
    }

    return { start, stop };
  })();


  /* ---------- Control ---------- */

  function mostrar() {
    boton.setAttribute('aria-pressed', String(sonando));
    texto.textContent = sonando ? 'Pausar música' : 'Poner música';
  }

  async function play() {
    if (sonando) return;
    sonando = true;
    mostrar();
    if (!archivoFalla && !archivo.error) {
      try {
        await archivo.play();
        return;
      } catch (e) {
        if (!archivo.error) {
          // Bloqueado o interrumpido: se vuelve a intentar con el siguiente toque
          sonando = false;
          mostrar();
          return;
        }
        archivoFalla = true;
      }
    }
    if (sonando) cajita.start(); // solo si la canción no existe o está dañada
  }

  function pause() {
    sonando = false;
    mostrar();
    archivo.pause();
    cajita.stop();
  }

  function toggle() {
    if (sonando) pause();
    else play();
  }

  boton.addEventListener('click', toggle);


  /* ---------- Arranque automático ---------- */

  // La música empieza con el primer toque en cualquier parte.
  // Se usa "click" porque en el celular es el único momento en que el
  // navegador ya cuenta el toque como permiso para sonar.
  function primerToque(e) {
    if (boton.contains(e.target)) return; // el botón ya se encarga
    play();
  }
  document.addEventListener('click', primerToque);
  document.addEventListener('keydown', primerToque);

  // Cuando la música ya suena, dejamos de escuchar los toques
  archivo.addEventListener('playing', () => {
    document.removeEventListener('click', primerToque);
    document.removeEventListener('keydown', primerToque);
  });

  window.Musica = { play, pause, toggle };
})();
