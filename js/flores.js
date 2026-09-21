/* ==========================================================
   flores.js — dibuja una gerbera amarilla
   Expone window.Flores con utilidades de dibujo y renderHead(),
   que devuelve un lienzo con la cabeza de la flor ya pintada.
   ========================================================== */

(() => {
  const TAU = Math.PI * 2;
  const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // ángulo áureo para la espiral del centro
  const LIGHT = Math.atan2(-1, -0.8);          // luz principal: arriba a la izquierda

  // Paleta de la flor, de la sombra a la luz
  const COLOR = {
    petalo: ['#A9640C', '#CF8716', '#EBAA1F', '#F7C632', '#FBD64B', '#F2BD2B'],
    petaloStops: [0, 0.12, 0.32, 0.6, 0.85, 1],
    disco: ['#6C7A2A', '#4E5A1E', '#3A3312', '#2A1A08', '#3B240A'],
    discoStops: [0, 0.3, 0.5, 0.75, 1],
  };


  /* ---------- Utilidades ---------- */

  // Generador aleatorio con semilla: la misma semilla da la misma flor
  function rng(seed) {
    let a = seed;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function makeCanvas(w, h = w) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  // Curva suave y cerrada que pasa entre una lista de puntos
  function smoothClosed(c, pts) {
    const n = pts.length;
    const last = pts[n - 1];
    c.moveTo((last.x + pts[0].x) / 2, (last.y + pts[0].y) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % n];
      c.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    c.closePath();
  }

  function circle(c, x, y, r) {
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  }

  function gradient(g, colors, stops) {
    colors.forEach((col, i) => g.addColorStop(stops[i], col));
    return g;
  }


  /* ---------- Pétalo ---------- */

  // Contorno de un pétalo apuntando hacia +x, con la base en 0
  function petalOutline(L, W, r) {
    const asymTop = 1 + (r() - 0.5) * 0.16;
    const asymBot = 1 + (r() - 0.5) * 0.16;
    const profile = t => 0.13 + 0.37 * Math.pow(Math.sin(Math.PI / 2 * Math.min(t / 0.72, 1)), 0.85);
    const jitter = () => (r() - 0.5) * 0.03 * W;
    const ts = [0.02, 0.16, 0.34, 0.52, 0.7, 0.84];
    const notch = 0.035 + r() * 0.06;
    const pts = [];

    // Borde superior
    for (const t of ts) pts.push({ x: t * L, y: -profile(t) * W * asymTop + jitter() });

    // Punta con tres lóbulos y pequeñas muescas
    pts.push({ x: L * 0.93, y: -0.44 * W * asymTop });
    pts.push({ x: L * (1.0 + (r() - 0.5) * 0.03), y: -0.3 * W });
    pts.push({ x: L * (1 - notch), y: -0.13 * W });
    pts.push({ x: L * (1.03 + (r() - 0.5) * 0.03), y: 0.02 * W });
    pts.push({ x: L * (1 - notch * (0.6 + r() * 0.6)), y: 0.16 * W });
    pts.push({ x: L * (1.0 + (r() - 0.5) * 0.03), y: 0.31 * W });
    pts.push({ x: L * 0.93, y: 0.44 * W * asymBot });

    // Borde inferior
    for (let i = ts.length - 1; i >= 0; i--) pts.push({ x: ts[i] * L, y: profile(ts[i]) * W * asymBot + jitter() });
    return pts;
  }

  function drawPetal(c, p) {
    c.save();
    c.rotate(p.angle);
    c.translate(p.r0, 0);
    c.scale(1, p.squash);

    // Cuerpo con sombra proyectada sobre los pétalos de abajo
    c.beginPath();
    smoothClosed(c, p.pts);
    c.shadowColor = 'rgba(110, 55, 0, 0.3)';
    c.shadowBlur = p.blur;
    c.shadowOffsetX = p.sx;
    c.shadowOffsetY = p.sy;
    c.fillStyle = gradient(c.createLinearGradient(0, 0, p.L, 0), COLOR.petalo, COLOR.petaloStops);
    c.fill();
    c.shadowColor = 'transparent';
    c.shadowBlur = 0;
    c.shadowOffsetX = 0;
    c.shadowOffsetY = 0;

    c.save();
    c.clip();
    const hw = p.W * 0.6;
    const cover = () => c.fillRect(0, -hw, p.L * 1.1, hw * 2);

    // Forma cóncava: bordes más oscuros y una cresta de luz
    c.fillStyle = gradient(
      c.createLinearGradient(0, -hw, 0, hw),
      ['rgba(150, 78, 0, 0.32)', 'rgba(150, 78, 0, 0)', 'rgba(255, 246, 205, 0.24)', 'rgba(255, 246, 205, 0)', 'rgba(150, 78, 0, 0)', 'rgba(150, 78, 0, 0.28)'],
      [0, 0.3, 0.45, 0.58, 0.8, 1]
    );
    cover();

    // Venas finas y paralelas
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(168, 96, 6, 0.15)';
    c.lineWidth = p.vein;
    for (let k = -4; k <= 4; k++) {
      if (!k) continue;
      c.beginPath();
      c.moveTo(p.L * 0.06, k * p.W * 0.025);
      c.quadraticCurveTo(p.L * 0.5, k * p.W * 0.09, p.L * 0.95, k * p.W * 0.1);
      c.stroke();
    }

    // Nervio central hundido con su brillo al lado
    c.beginPath();
    c.moveTo(p.L * 0.05, 0);
    c.quadraticCurveTo(p.L * 0.5, p.W * 0.02, p.L * 0.9, 0);
    c.strokeStyle = 'rgba(160, 86, 0, 0.3)';
    c.lineWidth = p.vein * 2.2;
    c.stroke();
    c.beginPath();
    c.moveTo(p.L * 0.08, -p.W * 0.055);
    c.quadraticCurveTo(p.L * 0.5, -p.W * 0.045, p.L * 0.85, -p.W * 0.055);
    c.strokeStyle = 'rgba(255, 250, 220, 0.3)';
    c.lineWidth = p.vein * 1.6;
    c.stroke();

    // Orientación respecto a la luz
    c.fillStyle = p.light > 0
      ? `rgba(255, 238, 150, ${0.18 * p.light})`
      : `rgba(125, 60, 0, ${0.17 * -p.light})`;
    cover();

    // Variación propia: unos pétalos más dorados, otros más claros
    c.fillStyle = p.shade > 0
      ? `rgba(120, 58, 0, ${p.shade})`
      : `rgba(255, 240, 170, ${-p.shade})`;
    cover();

    // Oscurecimiento donde el pétalo nace del disco
    c.fillStyle = gradient(c.createLinearGradient(0, 0, p.L * 0.35, 0), ['rgba(90, 40, 0, 0.45)', 'rgba(90, 40, 0, 0)'], [0, 1]);
    c.fillRect(0, -hw, p.L * 0.4, hw * 2);
    c.restore();

    // Borde definido pero suave
    c.beginPath();
    smoothClosed(c, p.pts);
    c.strokeStyle = 'rgba(176, 104, 10, 0.35)';
    c.lineWidth = p.vein;
    c.stroke();
    c.restore();
  }

  // Un anillo de pétalos alrededor del centro, en orden aleatorio
  function petalRing(r, opts) {
    const { n, r0, len, wid, start, shade, curlProb, tilt, common } = opts;
    const step = TAU / n;
    const list = [];

    for (let i = 0; i < n; i++) {
      const angle = start + i * step + (r() - 0.5) * step * 0.35;
      let L = len * (0.92 + r() * 0.14);
      const W = wid * (0.88 + r() * 0.24);
      let squash = 1;
      let extra = shade + (r() - 0.5) * 0.1;

      if (r() < curlProb) { // pétalo curvado o girado
        L *= 0.84 + r() * 0.08;
        squash = 0.62 + r() * 0.2;
        extra += 0.08;
      }

      list.push({
        ...common, angle, r0, L, W, squash,
        shade: extra,
        light: Math.cos(angle + tilt - LIGHT),
        pts: petalOutline(L, W, r),
      });
    }

    for (let i = list.length - 1; i > 0; i--) {
      const k = Math.floor(r() * (i + 1));
      [list[i], list[k]] = [list[k], list[i]];
    }
    return list;
  }


  /* ---------- Centro ---------- */

  function drawStamens(c, r, Rd) {
    c.lineCap = 'round';
    for (let i = 0; i < 180; i++) {
      const a = r() * TAU;
      const rr = Rd * (0.78 + r() * 0.2);
      const len = Rd * (0.08 + r() * 0.08);
      const x1 = Math.cos(a) * (rr + len);
      const y1 = Math.sin(a) * (rr + len);
      c.strokeStyle = r() < 0.5 ? '#B8740F' : '#9A5C0B';
      c.lineWidth = Rd * 0.022;
      c.beginPath();
      c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      c.lineTo(x1, y1);
      c.stroke();
      c.fillStyle = r() < 0.6 ? '#F6CC45' : '#E9A51E';
      circle(c, x1, y1, Rd * (0.022 + r() * 0.016));
    }
  }

  function drawDisc(c, r, Rd) {
    // Base del disco
    c.fillStyle = gradient(c.createRadialGradient(-Rd * 0.15, -Rd * 0.2, 0, 0, 0, Rd * 0.86), COLOR.disco, COLOR.discoStops);
    circle(c, 0, 0, Rd * 0.86);

    // Flósculos en espiral: verde oliva en el medio, marrón hacia fuera
    const N = 460;
    const Rf = Rd * 0.84;
    for (let i = 1; i < N; i++) {
      const t = i / N;
      const rr = Rf * Math.sqrt(t);
      const a = i * GOLDEN;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      const s = Rf * 0.046 * (0.75 + 0.45 * t);
      let col, hi;
      if (t < 0.18) { col = r() < 0.5 ? '#8A9A35' : '#76862B'; hi = 'rgba(232, 242, 170, 0.4)'; }
      else if (t < 0.42) { col = r() < 0.5 ? '#5E5E1D' : '#4F4A17'; hi = 'rgba(220, 225, 150, 0.28)'; }
      else if (t < 0.8) { col = r() < 0.5 ? '#2F1D09' : '#3C250C'; hi = 'rgba(255, 200, 120, 0.16)'; }
      else { col = '#6B3F0E'; hi = 'rgba(255, 210, 120, 0.25)'; }
      c.fillStyle = col;
      circle(c, x, y, s);
      c.fillStyle = hi;
      circle(c, x - s * 0.3, y - s * 0.35, s * 0.42);
      if (t > 0.82 && r() < 0.6) {
        c.fillStyle = '#E9B22E';
        circle(c, x, y, s * 0.45);
      }
    }

    // Volumen: luz arriba a la izquierda, sombra abajo a la derecha
    c.fillStyle = gradient(c.createRadialGradient(-Rd * 0.3, -Rd * 0.35, 0, -Rd * 0.3, -Rd * 0.35, Rd * 0.75), ['rgba(255, 250, 215, 0.22)', 'rgba(255, 250, 215, 0)'], [0, 1]);
    circle(c, 0, 0, Rd * 0.86);
    c.fillStyle = gradient(c.createRadialGradient(Rd * 0.35, Rd * 0.4, 0, Rd * 0.35, Rd * 0.4, Rd * 0.8), ['rgba(20, 10, 0, 0.28)', 'rgba(20, 10, 0, 0)'], [0, 1]);
    circle(c, 0, 0, Rd * 0.86);

    // Polen disperso
    for (let i = 0; i < 90; i++) {
      const a = r() * TAU;
      const rr = Rd * (0.55 + r() * 0.6);
      c.fillStyle = `rgba(247, 207, 74, ${0.6 + r() * 0.4})`;
      circle(c, Math.cos(a) * rr, Math.sin(a) * rr, Rd * (0.012 + r() * 0.014));
    }
  }


  /* ---------- Flor completa ---------- */

  // px: tamaño del lienzo; tilt y squash: hacia dónde mira la flor
  function renderHead(px, seed, tilt, squash) {
    const r = rng(seed);
    const cv = makeCanvas(px);
    const c = cv.getContext('2d');
    const R = px * 0.47;   // radio hasta la punta de los pétalos
    const Rd = px * 0.135; // radio del disco central
    const common = {
      blur: px * 0.012,
      sx: px * 0.003,
      sy: px * 0.007,
      vein: Math.max(0.5, px * 0.0016),
    };

    c.translate(px / 2, px / 2);
    c.rotate(tilt);
    c.scale(1, squash);

    const n = 20 + Math.floor(r() * 4);
    const start = r() * TAU;
    const baseW = TAU * (R * 0.6) / n;
    const back = petalRing(r, { n, r0: Rd * 0.55, len: R - Rd * 0.55, wid: baseW * 1.25, start, shade: 0.12, curlProb: 0.1, tilt, common });
    const front = petalRing(r, { n, r0: Rd * 0.6, len: (R - Rd * 0.6) * 0.88, wid: baseW * 1.3, start: start + Math.PI / n, shade: 0, curlProb: 0.18, tilt, common });
    const inner = petalRing(r, { n: 34, r0: Rd * 0.8, len: Rd * 1.05, wid: TAU * Rd * 1.3 / 34 * 1.6, start: r() * TAU, shade: -0.04, curlProb: 0.3, tilt, common });

    back.forEach(p => drawPetal(c, p));
    front.forEach(p => drawPetal(c, p));

    // Sombra suave del disco sobre los pétalos
    c.fillStyle = gradient(c.createRadialGradient(0, 0, Rd * 0.8, 0, 0, Rd * 1.9), ['rgba(95, 45, 0, 0.35)', 'rgba(95, 45, 0, 0)'], [0, 1]);
    circle(c, 0, 0, Rd * 1.9);

    inner.forEach(p => drawPetal(c, p));
    drawStamens(c, r, Rd);
    drawDisc(c, r, Rd);
    return cv;
  }

  window.Flores = { TAU, rng, makeCanvas, smoothClosed, circle, renderHead };
})();
