/* ==========================================================
   ramo.js — compone el ramo: hojas, tallos, lazo, tarjeta y flores
   Usa window.Flores (flores.js) para pintar cada gerbera.
   ========================================================== */

(() => {
  const { TAU, makeCanvas, smoothClosed, circle, renderHead } = window.Flores;


  /* ---------- Configuración ---------- */

  const NAME = 'Senamhi';
  const RATIO = 1.25; // alto / ancho del lienzo (4:5)

  // Posición (fracción del ancho), tamaño y orientación de cada flor.
  // Se dibujan en este orden: primero las de atrás.
  const FLOWERS = [
    { x: 0.34, y: 0.25, size: 0.34, tilt: -0.5, squash: 0.8, phase: 0.3 },
    { x: 0.67, y: 0.23, size: 0.35, tilt: 0.45, squash: 0.8, phase: 1.7 },
    { x: 0.2, y: 0.47, size: 0.34, tilt: -0.9, squash: 0.76, phase: 2.4 },
    { x: 0.8, y: 0.46, size: 0.35, tilt: 0.8, squash: 0.76, phase: 0.9 },
    { x: 0.5, y: 0.4, size: 0.45, tilt: -0.1, squash: 0.88, phase: 3.1 },
    { x: 0.35, y: 0.61, size: 0.36, tilt: -0.35, squash: 0.8, phase: 4.2 },
    { x: 0.66, y: 0.62, size: 0.37, tilt: 0.3, squash: 0.8, phase: 5.0 },
  ];

  const LEAVES = [
    { x: 0.47, y: 0.86, angle: -2.45, k: 1.25 },
    { x: 0.53, y: 0.86, angle: -0.7, k: 1.25 },
    { x: 0.48, y: 0.9, angle: -2.9, k: 1.0 },
    { x: 0.52, y: 0.9, angle: -0.25, k: 1.0 },
  ];

  const TIE = { x: 0.5, y: 0.93 }; // donde el lazo reúne los tallos


  /* ---------- Estado ---------- */

  const stage = document.getElementById('stage');
  const canvas = document.getElementById('ramo');
  const ctx = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const seed = 921; // cambia este número para obtener otras flores
  let S = 0;     // ancho del lienzo en px CSS
  let dpr = 1;
  let heads = [];
  let shadowCol = 'rgba(0, 0, 0, 0.2)';
  let rafId = 0;


  /* ---------- Utilidades ---------- */

  function rotAround(p, o, a) {
    const cs = Math.cos(a);
    const sn = Math.sin(a);
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    return { x: o.x + dx * cs - dy * sn, y: o.y + dx * sn + dy * cs };
  }

  function setShadow(c, blur, x, y) {
    c.shadowColor = shadowCol;
    c.shadowBlur = blur;
    c.shadowOffsetX = x;
    c.shadowOffsetY = y;
  }

  function clearShadow(c) {
    c.shadowColor = 'transparent';
  }


  /* ---------- Flores (se pintan una vez, con su sombra) ---------- */

  function bakeHeads() {
    shadowCol = getComputedStyle(document.documentElement).getPropertyValue('--shadow').trim() || shadowCol;
    heads = FLOWERS.map((f, i) => {
      const px = S * f.size * dpr;
      const head = renderHead(px, seed * 7 + i * 101, f.tilt, f.squash);
      const pad = px * 0.12;
      const cv = makeCanvas(px + pad * 2);
      const c = cv.getContext('2d');
      setShadow(c, px * 0.05, px * 0.025, px * 0.045);
      c.drawImage(head, pad, pad);
      return cv;
    });
  }


  /* ---------- Hojas ---------- */

  function drawLeaf(c, at, angle, s, k) {
    const L = s * 0.25 * k;
    const W = s * 0.075 * k;
    const pts = [
      { x: 0, y: 0 },
      { x: L * 0.2, y: -W * 0.45 },
      { x: L * 0.5, y: -W * 0.62 },
      { x: L * 0.8, y: -W * 0.4 },
      { x: L * 1.02, y: -W * 0.02 },
      { x: L * 0.78, y: W * 0.3 },
      { x: L * 0.48, y: W * 0.46 },
      { x: L * 0.18, y: W * 0.32 },
    ];

    c.save();
    c.translate(at.x, at.y);
    // Las hojas que apuntan a la izquierda se reflejan para que su cara iluminada quede arriba
    if (Math.cos(angle) < 0) {
      c.scale(-1, 1);
      angle = Math.PI - angle;
    }
    c.rotate(angle);

    const g = c.createLinearGradient(0, -W * 0.6, 0, W * 0.5);
    g.addColorStop(0, '#8DB65E');
    g.addColorStop(0.5, '#5A8837');
    g.addColorStop(1, '#3A6124');
    c.beginPath();
    smoothClosed(c, pts);
    setShadow(c, s * 0.02, s * 0.008, s * 0.014);
    c.fillStyle = g;
    c.fill();
    clearShadow(c);

    c.save();
    c.clip();
    // Mitad inferior en sombra: la hoja se pliega por el nervio
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(L * 0.5, -W * 0.08, L * 1.05, -W * 0.02);
    c.lineTo(L * 1.05, W);
    c.lineTo(0, W);
    c.closePath();
    c.fillStyle = 'rgba(20, 50, 10, 0.22)';
    c.fill();
    // Nervios laterales
    c.strokeStyle = 'rgba(225, 240, 200, 0.28)';
    c.lineWidth = Math.max(0.6, s * 0.0016);
    for (let i = 1; i <= 5; i++) {
      const x = L * i / 6.2;
      c.beginPath();
      c.moveTo(x, -W * 0.06);
      c.quadraticCurveTo(x + L * 0.08, -W * 0.3, x + L * 0.16, -W * 0.5);
      c.stroke();
    }
    c.restore();

    // Nervio central
    c.beginPath();
    c.moveTo(L * 0.02, 0);
    c.quadraticCurveTo(L * 0.5, -W * 0.08, L * 0.98, -W * 0.02);
    c.strokeStyle = 'rgba(225, 240, 200, 0.55)';
    c.lineWidth = Math.max(0.8, s * 0.0028);
    c.stroke();
    c.restore();
  }


  /* ---------- Tallos ---------- */

  function stemStroke(c, from, ctrl, to, s) {
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.quadraticCurveTo(ctrl.x, ctrl.y, to.x, to.y);
    c.strokeStyle = '#4A7430';
    c.lineWidth = s * 0.016;
    c.stroke();
    // Brillo lateral
    c.beginPath();
    c.moveTo(from.x - s * 0.003, from.y);
    c.quadraticCurveTo(ctrl.x - s * 0.003, ctrl.y, to.x - s * 0.003, to.y);
    c.strokeStyle = 'rgba(200, 230, 150, 0.32)';
    c.lineWidth = s * 0.004;
    c.stroke();
  }

  // Tallos bajo el lazo, con los cortes visibles abajo
  function drawStemBundle(c, T, s) {
    c.save();
    c.lineCap = 'round';
    setShadow(c, s * 0.015, s * 0.008, s * 0.01);
    FLOWERS.forEach((f, i) => {
      const bx = s * (0.445 + i * 0.018);
      stemStroke(c, { x: T.x + (i - 3) * s * 0.004, y: T.y }, { x: (T.x + bx) / 2, y: s * 1.06 }, { x: bx, y: s * 1.19 }, s);
    });
    clearShadow(c);
    c.fillStyle = '#B5CE8A';
    FLOWERS.forEach((f, i) => {
      c.beginPath();
      c.ellipse(s * (0.445 + i * 0.018), s * 1.19, s * 0.008, s * 0.004, 0, 0, TAU);
      c.fill();
    });
    c.restore();
  }

  // Tallos que suben del lazo a cada flor
  function drawStemsToFlowers(c, T, positions, s) {
    c.save();
    c.lineCap = 'round';
    setShadow(c, s * 0.015, s * 0.008, s * 0.01);
    positions.forEach(({ H }) => {
      const ctrl = { x: (H.x + T.x) / 2 + (T.x - H.x) * 0.15, y: (H.y + T.y) / 2 };
      stemStroke(c, H, ctrl, T, s);
    });
    c.restore();
  }


  /* ---------- Lazo de satén ---------- */

  function satin(c, x0, y0, x1, y1) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#F8EFD6');
    g.addColorStop(0.45, '#E6D2A2');
    g.addColorStop(1, '#BFA36A');
    return g;
  }

  function drawRibbon(c, T, s) {
    c.save();
    c.translate(T.x, T.y);
    setShadow(c, s * 0.015, s * 0.005, s * 0.01);

    // Colas con corte en V
    const tails = [
      [{ x: -0.01, y: 0.01 }, { x: -0.045, y: 0.09 }, { x: -0.085, y: 0.17 }, { x: -0.06, y: 0.155 }, { x: -0.05, y: 0.18 }, { x: -0.015, y: 0.09 }, { x: 0.012, y: 0.012 }],
      [{ x: 0.01, y: 0.01 }, { x: 0.05, y: 0.1 }, { x: 0.07, y: 0.19 }, { x: 0.085, y: 0.165 }, { x: 0.105, y: 0.18 }, { x: 0.075, y: 0.09 }, { x: 0.025, y: 0.005 }],
    ];
    for (const tail of tails) {
      c.beginPath();
      tail.forEach((p, i) => (i ? c.lineTo(p.x * s, p.y * s) : c.moveTo(p.x * s, p.y * s)));
      c.closePath();
      c.fillStyle = satin(c, -0.05 * s, 0, 0.1 * s, 0.18 * s);
      c.fill();
    }

    // Banda alrededor de los tallos
    c.beginPath();
    c.moveTo(-0.055 * s, -0.018 * s);
    c.quadraticCurveTo(0, -0.03 * s, 0.055 * s, -0.018 * s);
    c.lineTo(0.055 * s, 0.018 * s);
    c.quadraticCurveTo(0, 0.006 * s, -0.055 * s, 0.018 * s);
    c.closePath();
    c.fillStyle = satin(c, 0, -0.03 * s, 0, 0.02 * s);
    c.fill();

    // Lazadas
    for (const side of [-1, 1]) {
      const pts = [
        { x: 0, y: 0 }, { x: 0.04, y: -0.05 }, { x: 0.105, y: -0.06 },
        { x: 0.13, y: -0.02 }, { x: 0.105, y: 0.025 }, { x: 0.045, y: 0.018 },
      ].map(p => ({ x: p.x * s * side, y: p.y * s }));
      c.beginPath();
      smoothClosed(c, pts);
      c.fillStyle = satin(c, 0, -0.06 * s, side * 0.13 * s, 0.03 * s);
      c.fill();

      // Pliegue interior
      clearShadow(c);
      c.beginPath();
      c.moveTo(side * 0.02 * s, -0.004 * s);
      c.quadraticCurveTo(side * 0.07 * s, -0.035 * s, side * 0.105 * s, -0.018 * s);
      c.strokeStyle = 'rgba(150, 118, 60, 0.45)';
      c.lineWidth = s * 0.004;
      c.stroke();
      setShadow(c, s * 0.015, s * 0.005, s * 0.01);
    }

    // Nudo
    c.beginPath();
    c.ellipse(0, 0, 0.022 * s, 0.018 * s, 0, 0, TAU);
    c.fillStyle = satin(c, -0.02 * s, -0.02 * s, 0.02 * s, 0.02 * s);
    c.fill();
    c.restore();
  }


  /* ---------- Tarjeta con el nombre ---------- */

  function drawTag(c, T, s, sway) {
    const cx = s * 0.73;
    const cy = s * 1.07;
    const w = s * 0.24;
    const h = s * 0.1;
    const angle = -0.1 + sway;
    const hole = rotAround({ x: cx - w * 0.42, y: cy }, { x: cx, y: cy }, angle);

    c.save();

    // Cordel desde el nudo
    c.beginPath();
    c.moveTo(T.x + s * 0.01, T.y + s * 0.005);
    c.quadraticCurveTo(T.x + s * 0.06, T.y + s * 0.13, hole.x, hole.y);
    c.strokeStyle = '#B08A4E';
    c.lineWidth = Math.max(1, s * 0.0025);
    c.stroke();

    // Etiqueta con las esquinas cortadas del lado del cordel
    c.translate(cx, cy);
    c.rotate(angle);
    setShadow(c, s * 0.02, s * 0.006, s * 0.012);
    c.beginPath();
    c.moveTo(-w / 2 + h * 0.3, -h / 2);
    c.lineTo(w / 2, -h / 2);
    c.lineTo(w / 2, h / 2);
    c.lineTo(-w / 2 + h * 0.3, h / 2);
    c.lineTo(-w / 2, h * 0.2);
    c.lineTo(-w / 2, -h * 0.2);
    c.closePath();
    c.fillStyle = '#FBF6E7';
    c.fill();
    clearShadow(c);
    c.strokeStyle = 'rgba(176, 138, 78, 0.5)';
    c.lineWidth = Math.max(0.8, s * 0.0015);
    c.stroke();

    // Ojal
    c.fillStyle = '#E3D6B6';
    circle(c, -w * 0.42, 0, h * 0.09);

    // Nombre
    c.fillStyle = '#8A5A12';
    c.font = `${Math.round(s * 0.058)}px "Great Vibes", "Segoe Script", cursive`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(NAME, w * 0.06, h * 0.04);
    c.restore();
  }


  /* ---------- Escena completa ---------- */

  function draw(time) {
    const s = S;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s * RATIO);
    if (!heads.length) return;

    const t = time || 0;
    const still = reduceMotion.matches;
    const breeze = still ? 0 : Math.sin(t * 0.00055) * 0.01;
    const T = { x: TIE.x * s, y: TIE.y * s };

    // Cada flor se mece un poco distinto alrededor del lazo
    const positions = FLOWERS.map(f => {
      const a = still ? 0 : breeze + Math.sin(t * 0.0011 + f.phase) * 0.006;
      return { H: rotAround({ x: f.x * s, y: f.y * s }, T, a), a };
    });

    LEAVES.forEach(l => drawLeaf(ctx, { x: l.x * s, y: l.y * s }, l.angle + breeze * 0.5, s, l.k));
    drawStemBundle(ctx, T, s);
    drawStemsToFlowers(ctx, T, positions, s);
    drawRibbon(ctx, T, s);
    drawTag(ctx, T, s, breeze * 0.8);

    // Flores, de atrás hacia adelante
    positions.forEach(({ H, a }, i) => {
      const d = heads[i].width / dpr;
      ctx.save();
      ctx.translate(H.x, H.y);
      ctx.rotate(a * 1.5);
      ctx.drawImage(heads[i], -d / 2, -d / 2, d, d);
      ctx.restore();
    });
  }


  /* ---------- Animación y tamaño ---------- */

  function loop(time) {
    draw(time);
    rafId = reduceMotion.matches ? 0 : requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(rafId);
    if (reduceMotion.matches) draw(0);
    else rafId = requestAnimationFrame(loop);
  }

  function resize() {
    const w = Math.round(stage.clientWidth);
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2.5);
    if (w === S && nextDpr === dpr && heads.length) return;
    S = w;
    dpr = nextDpr;
    canvas.width = Math.round(S * dpr);
    canvas.height = Math.round(S * RATIO * dpr);
    bakeHeads();
    draw(performance.now());
  }

  function rebake() {
    if (!S) return;
    bakeHeads();
    draw(performance.now());
  }


  /* ---------- Eventos ---------- */

  let resizeQueued = false;
  new ResizeObserver(() => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      resize();
    });
  }).observe(stage);

  // Al cambiar entre tema claro y oscuro cambian las sombras
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rebake);
  new MutationObserver(rebake).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  reduceMotion.addEventListener('change', start);

  // La tarjeta usa la letra caligráfica: se redibuja cuando termina de cargar
  if (document.fonts && document.fonts.load) {
    document.fonts.load('40px "Great Vibes"').then(() => draw(performance.now())).catch(() => {});
  }

  resize();
  start();
})();
