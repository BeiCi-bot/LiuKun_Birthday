/* =========================================================
   星屑成诗 · STARDUST BIRTHDAY
   A hand-built particle birthday card.
   Canvas 2D · no external dependencies · mobile friendly
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     0. tiny helpers
     --------------------------------------------------------- */
  const TAU = Math.PI * 2;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const isSmall = () => Math.min(innerWidth, innerHeight) < 700;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hexToRgba(hex, a) {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  /* ---------------------------------------------------------
     1. palettes + configuration
     --------------------------------------------------------- */
  const PALETTES = {
    violet: {
      label: '紫夜',
      accent: '#e8c98a',
      accentLight: '#f6e3b6',
      violet: '#b9a7ff',
      bg: ['#080a14', '#05050b', '#0b0917'],
      nebula: ['#6d4bb0', '#29598f', '#8a5f45'],
      cake: ['#5b4aa3', '#9a86e8', '#d8ccff', '#fff8ee', '#f2d39a', '#a9dcff'],
      text: ['#a9dcff', '#b9a7ff', '#e9ddff', '#f6e3b6'],
      fire: ['#f6e3b6', '#ffc6d9', '#b9a7ff', '#a9dcff', '#ffd79a'],
    },
    gold: {
      label: '香槟',
      accent: '#e8c98a',
      accentLight: '#fff0c9',
      violet: '#ffe1a8',
      bg: ['#0d0a07', '#060504', '#120d08'],
      nebula: ['#8a6634', '#5f4322', '#7a4a3a'],
      cake: ['#5a4224', '#9d7941', '#d8b878', '#fff3d8', '#f6d99a', '#ffcf8e'],
      text: ['#ffe9b8', '#f6d99a', '#fff5df', '#e8c98a'],
      fire: ['#ffe9b8', '#ffd08a', '#fff5df', '#ffb36b', '#f6d99a'],
    },
    rose: {
      label: '玫瑰',
      accent: '#f0c3cf',
      accentLight: '#ffe6ec',
      violet: '#ffb9ce',
      bg: ['#0d0710', '#060409', '#120813'],
      nebula: ['#8a3f68', '#5a2a4f', '#8a5a42'],
      cake: ['#5e2744', '#a34f72', '#e08fa9', '#ffe3ec', '#f0c3cf', '#c9a7ff'],
      text: ['#ffd7e4', '#ffb9ce', '#fff0f4', '#f6e3b6'],
      fire: ['#ffe6ec', '#ffb9ce', '#f6e3b6', '#d9b6ff', '#ff9db9'],
    },
    aurora: {
      label: '极光',
      accent: '#a9e8dc',
      accentLight: '#d8fff8',
      violet: '#9fe8ff',
      bg: ['#041012', '#030608', '#061417'],
      nebula: ['#2b8f8f', '#2d5f9e', '#6a4a8a'],
      cake: ['#175257', '#2c8f8a', '#7bd8c9', '#e4fff9', '#a9e8dc', '#8fbcff'],
      text: ['#b8fff2', '#8fe8ff', '#e6fffb', '#d8f7c9'],
      fire: ['#b8fff2', '#8fe8ff', '#e6fffb', '#f6e3b6', '#a9e8dc'],
    },
  };

  /* =========================================================
     ★★  想换成自己的内容，直接改下面这个对象就好  ★★
     改完保存、刷新页面即可。
     页面上的「定制 / 写祝福」按钮已经隐藏，不会被收卡的人看到。
     如果确实需要临时打开设置面板，在网址后加 ?edit=1。
     ========================================================= */
  const DEFAULT_CONFIG = {
    // 收卡人的名字，会出现在许愿页和结尾文案里
    name: '最可爱的你',
    // 一句想对 TA 说的话
    wish: '愿你岁岁欢愉，万事胜意',
    // 粒子大标题，2–6 个字
    title: '生日快乐',
    // 主题形状：'cake' 蛋糕 | 'heart' 爱心 | 'star' 星辰 | 'moon' 月亮
    theme: 'cake',
    // 星屑配色：'violet' 紫夜 | 'gold' 香槟 | 'rose' 玫瑰 | 'aurora' 极光
    palette: 'violet',
    // 是否播放背景音乐
    music: true,
    // 是否尝试开启麦克风吹蜡烛（需要 localhost / HTTPS）
    mic: false,
  };

  // 默认以代码里的配置为准，避免浏览器里残留的旧设置覆盖你改的内容。
  // 只有带 ?edit=1 打开时，才会读取设置面板保存过的值。
  const EDIT_MODE = (() => {
    try { return new URLSearchParams(location.search).get('edit') === '1'; }
    catch (e) { return false; }
  })();

  function loadConfig() {
    const c = Object.assign({}, DEFAULT_CONFIG);
    if (EDIT_MODE) {
      try {
        const saved = JSON.parse(localStorage.getItem('stardust-config') || '{}');
        Object.assign(c, saved);
      } catch (e) { /* private mode / file:// */ }
    }
    try {
      const q = new URLSearchParams(location.search);
      ['name', 'wish', 'title', 'theme', 'palette'].forEach((k) => {
        if (q.get(k)) c[k] = q.get(k);
      });
    } catch (e) { /* ignore */ }
    if (!PALETTES[c.palette]) c.palette = 'violet';
    if (!['cake', 'heart', 'star', 'moon'].includes(c.theme)) c.theme = 'cake';
    c.title = String(c.title || '生日快乐').slice(0, 6) || '生日快乐';
    c.name = String(c.name || '最可爱的你').slice(0, 12);
    c.wish = String(c.wish || DEFAULT_CONFIG.wish).slice(0, 40);
    c.music = c.music !== false;
    c.mic = c.mic === true;
    return c;
  }

  let config = loadConfig();

  /* ---------------------------------------------------------
     2. DOM
     --------------------------------------------------------- */
  const bgCanvas = $('#bgScene');
  const bgCtx = bgCanvas.getContext('2d', { alpha: false });
  const canvas = $('#scene');
  const ctx = canvas.getContext('2d', { alpha: true });
  const interactEl = $('#interact');
  const landingEl = $('#landing');
  const enterBtn = $('#enter');
  const chapterEl = $('#chapter');
  const chapterNo = $('#chapterNo');
  const chapterTag = $('#chapterTag');
  const chapterTitle = $('#chapterTitle');
  const chapterDesc = $('#chapterDesc');
  const stepsEl = $('#steps');
  const cardsBackEl = $('#cardsBack');
  const cardsFrontEl = $('#cardsFront');
  const tipKicker = $('#tipKicker');
  const tipTitle = $('#tipTitle');
  const tipText = $('#tipText');
  const tipMeta = $('#tipMeta');
  const wishBtn = $('#wishBtn');
  const wishBtnText = $('#wishBtnText');
  const editBtn = $('#editBtn');
  const wishUI = $('#wishUI');
  const wishName = $('#wishName');
  const wishLine = $('#wishLine');
  const blessingsEl = $('#blessings');
  const soundBtn = $('#soundBtn');
  const fullBtn = $('#fullBtn');
  const setBtn = $('#setBtn');
  const scrim = $('#scrim');
  const drawer = $('#settings');
  const closeSet = $('#closeSet');
  const saveSet = $('#saveSet');
  const resetSet = $('#resetSet');
  const inName = $('#inName');
  const inWish = $('#inWish');
  const inTitle = $('#inTitle');
  const inMusic = $('#inMusic');
  const inMic = $('#inMic');
  const themeSeg = $('#themeSeg');
  const paletteSeg = $('#paletteSeg');
  const lightbox = $('#lightbox');
  const lbMedia = $('#lbMedia');
  const lbTitle = $('#lbTitle');
  const lbCap = $('#lbCap');
  const lbClose = $('#lbClose');
  const lbPrev = $('#lbPrev');
  const lbNext = $('#lbNext');
  const lbCount = $('#lbCount');
  const lbTotal = $('#lbTotal');
  const flashEl = $('#flash');
  const toastEl = $('#toast');

  /* ---------------------------------------------------------
     3. canvas / camera
     --------------------------------------------------------- */
  let W = innerWidth;
  let H = innerHeight;
  let DPR = 1;
  let SCALE = 300;
  let camCosY = 1, camSinY = 0, camCosP = 1, camSinP = 0;
  const CAM_D = 5.6;
  const FOCAL = 3.2;

  const state = {
    phase: 'landing',
    started: false,
    sound: true,
    yaw: 0.42,
    pitch: 0.16,
    zoom: 1,
    zoomTarget: 1,
    spinVel: 0,
    cardOrbit: 0,
    reveal: 0,
    revealStart: 0,
    morph: 0,
    morphStart: 0,
    candlesLit: false,
    dragging: false,
    dragMoved: false,
    drawOpen: false,
    lbOpen: false,
    photoIndex: 0,
    flameHits: [],
    nextFw: 0,
    micOn: false,
    lastBlow: 0,
    pointerX: innerWidth / 2,
    pointerY: innerHeight / 2,
    ready: false,
    textTargetsBuilt: false,
  };

  function updateCamera() {
    camCosY = Math.cos(state.yaw);
    camSinY = Math.sin(state.yaw);
    camCosP = Math.cos(state.pitch);
    camSinP = Math.sin(state.pitch);
  }

  function project(x, y, z) {
    const x1 = x * camCosY + z * camSinY;
    const z1 = -x * camSinY + z * camCosY;
    const y1 = y * camCosP - z1 * camSinP;
    const z2 = y * camSinP + z1 * camCosP;
    const k = FOCAL / (CAM_D - z2);
    return {
      x: W / 2 + x1 * k * SCALE * state.zoom,
      y: H * 0.545 - y1 * k * SCALE * state.zoom,
      k,
      z: z2,
    };
  }

  function resize() {
    W = innerWidth;
    H = innerHeight;
    DPR = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bgCanvas.width = Math.round(W * DPR);
    bgCanvas.height = Math.round(H * DPR);
    bgCanvas.style.width = W + 'px';
    bgCanvas.style.height = H + 'px';
    bgCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    SCALE = Math.min(W, H) * 0.4 * (W < 700 ? 1.3 : 1);
    buildBackground();
    buildTextGlow();
    if (state.phase === 'text') {
      buildTextTargets();
      state.morphStart = performance.now() - 1600;
    }
    updateCards(performance.now());
  }

  /* ---------------------------------------------------------
     4. palette + sprites
     --------------------------------------------------------- */
  let palette = PALETTES[config.palette];
  let CAKE_COLORS = [];
  let TEXT_COLORS = [];
  let RING_COLORS = [];
  let glowSprites = [];
  let textGlowSprites = [];
  let flameSprite = null;
  let smokeSprite = null;
  let starSprite = null;

  function makeGlow(hex, size) {
    size = size || 64;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, hexToRgba(hex, 1));
    grd.addColorStop(0.18, hexToRgba(hex, 0.75));
    grd.addColorStop(0.45, hexToRgba(hex, 0.24));
    grd.addColorStop(1, hexToRgba(hex, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    return cv;
  }

  function makeFlameSprite() {
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 96;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(32, 68, 2, 32, 60, 30);
    grd.addColorStop(0, 'rgba(255,255,245,1)');
    grd.addColorStop(0.24, 'rgba(255,236,170,0.98)');
    grd.addColorStop(0.52, 'rgba(255,172,80,0.8)');
    grd.addColorStop(0.8, 'rgba(255,110,40,0.24)');
    grd.addColorStop(1, 'rgba(255,90,20,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(32, 0);
    g.bezierCurveTo(52, 34, 58, 58, 44, 78);
    g.bezierCurveTo(36, 90, 28, 90, 20, 78);
    g.bezierCurveTo(6, 58, 12, 34, 32, 0);
    g.fill();
    // inner core
    const core = g.createRadialGradient(32, 64, 0, 32, 64, 14);
    core.addColorStop(0, 'rgba(255,255,250,0.95)');
    core.addColorStop(0.5, 'rgba(255,238,180,0.55)');
    core.addColorStop(1, 'rgba(255,200,90,0)');
    g.fillStyle = core;
    g.beginPath();
    g.ellipse(32, 64, 10, 18, 0, 0, TAU);
    g.fill();
    return cv;
  }

  function makeSmokeSprite() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 96;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(48, 48, 0, 48, 48, 46);
    grd.addColorStop(0, 'rgba(200,200,215,0.34)');
    grd.addColorStop(0.45, 'rgba(160,160,180,0.12)');
    grd.addColorStop(1, 'rgba(120,120,140,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 96, 96);
    return cv;
  }

  function makeStarSprite() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.2, 'rgba(235,240,255,0.8)');
    grd.addColorStop(1, 'rgba(220,230,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return cv;
  }

  function applyPalette() {
    palette = PALETTES[config.palette];
    document.documentElement.style.setProperty('--gold', palette.accent);
    document.documentElement.style.setProperty('--gold-2', palette.accentLight);
    document.documentElement.style.setProperty('--violet', palette.violet);
    CAKE_COLORS = palette.cake.map((c) => [
      hexToRgba(c, 0.16), hexToRgba(c, 0.32), hexToRgba(c, 0.62), hexToRgba(c, 0.95),
    ]);
    TEXT_COLORS = palette.text.map((c) => [
      hexToRgba(c, 0.16), hexToRgba(c, 0.34), hexToRgba(c, 0.65), hexToRgba(c, 0.95),
    ]);
    RING_COLORS = palette.cake.map((c) => [hexToRgba(c, 0.05), hexToRgba(c, 0.16), hexToRgba(c, 0.42), hexToRgba(c, 0.8)]);
    glowSprites = palette.cake.map((c) => makeGlow(c));
    textGlowSprites = palette.text.map((c) => makeGlow(c));
    flameSprite = makeFlameSprite();
    smokeSprite = makeSmokeSprite();
    starSprite = makeStarSprite();
    buildBackground();
    buildTextGlow();
  }

  /* ---------------------------------------------------------
     5. background cache
     --------------------------------------------------------- */
  let bgGrad = null;
  let nebulaGrads = [];

  function buildBackground() {
    if (!W || !H) return;
    bgGrad = bgCtx.createLinearGradient(0, 0, W * 0.4, H);
    bgGrad.addColorStop(0, palette.bg[0]);
    bgGrad.addColorStop(0.55, palette.bg[1]);
    bgGrad.addColorStop(1, palette.bg[2]);
    nebulaGrads = [];
    const blobs = [
      { x: 0.24, y: 0.28, r: 0.62, c: palette.nebula[0], a: 0.16 },
      { x: 0.78, y: 0.72, r: 0.58, c: palette.nebula[1], a: 0.11 },
      { x: 0.62, y: 0.35, r: 0.36, c: palette.nebula[2], a: 0.06 },
    ];
    for (const b of blobs) {
      const g = bgCtx.createRadialGradient(W * b.x, H * b.y, 0, W * b.x, H * b.y, Math.max(W, H) * b.r);
      g.addColorStop(0, hexToRgba(b.c, b.a));
      g.addColorStop(0.5, hexToRgba(b.c, b.a * 0.32));
      g.addColorStop(1, hexToRgba(b.c, 0));
      nebulaGrads.push(g);
    }
  }

  /* ---------------------------------------------------------
     6. stars + ambient dust
     --------------------------------------------------------- */
  const stars = [];
  (function initStars() {
    const n = isSmall() ? 170 : 300;
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        s: rand(0.5, 1.7),
        a: rand(0.18, 0.82),
        tw: rand(0, TAU),
        sp: rand(0.2, 0.8),
      });
    }
  })();

  const dust = [];
  (function initDust() {
    const n = reduceMotion ? 90 : 260;
    for (let i = 0; i < n; i++) {
      dust.push({
        a: rand(0, TAU),
        r: rand(0.08, 0.52),
        y: rand(-0.12, 0.12),
        s: rand(0.4, 1.8),
        sp: rand(0.02, 0.12) * (Math.random() < 0.5 ? -1 : 1),
        ph: rand(0, TAU),
      });
    }
  })();

  /* ---------------------------------------------------------
     7. particles + shape builders
     --------------------------------------------------------- */
  let particles = [];
  let candles = [];
  let rings = [];

  function addP(x, y, z, ci, s) {
    particles.push({ x, y, z, ci, s, tw: 0, seed: 0, ox: 0, oy: 0, oz: 0, appear: 0 });
  }

  function buildCake(n) {
    const bottom = { r: 1.04, y0: -0.58, y1: -0.05 };
    const top = { r: 0.72, y0: -0.05, y1: 0.4 };
    const topY = top.y1;

    // ---- cake board -------------------------------------------------
    const boardN = Math.round(n * 0.035);
    for (let i = 0; i < boardN; i++) {
      const a = rand(0, TAU);
      const r = Math.sqrt(Math.random()) * 1.18;
      addP(Math.cos(a) * r, -0.63 + rand(-0.01, 0.01), Math.sin(a) * r, i % 11 === 0 ? 4 : 2, rand(0.6, 1.5));
    }
    for (let i = 0; i < Math.round(n * 0.015); i++) {
      const a = rand(0, TAU);
      addP(Math.cos(a) * 1.2, -0.62 + rand(-0.008, 0.008), Math.sin(a) * 1.2, 4, rand(0.7, 1.7));
    }

    // ---- tier sides -------------------------------------------------
    const tiers = [
      { t: bottom, share: 0.38, bright: 0.5 },
      { t: top, share: 0.3, bright: 0.78 },
    ];
    for (const tier of tiers) {
      const t = tier.t;
      const sideN = Math.round(n * tier.share);
      for (let i = 0; i < sideN; i++) {
        const a = rand(0, TAU);
        const rel = Math.random();
        const y = lerp(t.y0, t.y1, rel);
        const ripple = Math.cos(a * 18 + t.r * 5) * 0.008 + Math.cos(a * 7) * 0.005;
        const r = t.r + ripple + rand(-0.009, 0.009);
        let ci;
        const rr = Math.random();
        if (rr < 0.12 + tier.bright * 0.18) ci = 3;
        else if (rr < 0.55 + tier.bright * 0.2) ci = 2;
        else if (rr < 0.9) ci = 1;
        else ci = 0;
        if (rel > 0.84 && Math.random() < 0.4) ci = 3;
        if (Math.random() < 0.022) ci = 4;
        if (Math.random() < 0.012) ci = 5;
        addP(Math.cos(a) * r, y, Math.sin(a) * r, ci, rand(0.7, 1.8));
      }

      // thick scalloped frosting rim
      const rimN = Math.round(n * (t === bottom ? 0.08 : 0.072));
      for (let i = 0; i < rimN; i++) {
        const a = rand(0, TAU);
        const scallop = Math.cos(a * 14) * 0.026 + Math.cos(a * 5 + 1.2) * 0.014;
        const rr = t.r + 0.013 + scallop;
        addP(
          Math.cos(a) * rr,
          t.y1 + rand(-0.012, 0.032),
          Math.sin(a) * rr,
          Math.random() < 0.82 ? 3 : 2,
          rand(1.0, 2.5)
        );
      }
      // extra cream row just below the rim, gives the icing real thickness
      for (let i = 0; i < Math.round(rimN * 0.55); i++) {
        const a = rand(0, TAU);
        const rr = t.r + 0.01 + Math.cos(a * 11 + 0.6) * 0.01;
        addP(
          Math.cos(a) * rr,
          t.y1 - 0.035 + rand(-0.018, 0.012),
          Math.sin(a) * rr,
          Math.random() < 0.72 ? 3 : 2,
          rand(0.9, 2.1)
        );
      }

      // icing drips
      const dripN = t === bottom ? 26 : 20;
      for (let d = 0; d < dripN; d++) {
        const a = rand(0, TAU);
        const len = rand(0.06, t === bottom ? 0.24 : 0.19);
        const drops = Math.round(len * 85);
        for (let k = 0; k < drops; k++) {
          const yy = t.y1 - (k / drops) * len;
          const wob = Math.sin(k * 0.65 + d) * 0.007;
          const thickness = k < 2 ? 0.012 : 0.004;
          addP(
            Math.cos(a) * (t.r + 0.012 + wob),
            yy,
            Math.sin(a) * (t.r + 0.012 + wob),
            k > drops * 0.78 ? 3 : 2,
            rand(0.8, 1.7) + thickness * 20
          );
        }
      }

      // continuous scalloped icing curtain
      const curtainN = Math.round(n * (t === bottom ? 0.035 : 0.03));
      for (let i = 0; i < curtainN; i++) {
        const a = (i / curtainN) * TAU;
        const wave = 0.5 + 0.5 * Math.sin(a * 9 + (t === bottom ? 0.6 : 2.2));
        const len = 0.025 + wave * 0.085 + rand(0, 0.02);
        const k = Math.random();
        const yy = t.y1 - k * len;
        const rr = t.r + 0.016 + Math.sin(a * 22) * 0.004;
        addP(Math.cos(a) * rr, yy, Math.sin(a) * rr, Math.random() < 0.82 ? 3 : 2, rand(0.85, 1.85));
      }

      // crisp outline along the silhouette
      for (let i = 0; i < n * 0.018; i++) {
        const a = rand(0, TAU);
        const y = rand(t.y0 + 0.03, t.y1 - 0.02);
        addP(Math.cos(a) * (t.r + 0.004), y, Math.sin(a) * (t.r + 0.004), Math.random() < 0.45 ? 3 : 2, rand(0.8, 1.7));
      }

      // a dark seam just under the icing rim gives the tiers depth
      for (let i = 0; i < n * 0.008; i++) {
        const a = rand(0, TAU);
        addP(Math.cos(a) * (t.r + 0.004), t.y1 - 0.045 + rand(-0.01, 0.01), Math.sin(a) * (t.r + 0.004), 0, rand(0.6, 1.2));
      }

      // visible top surface of the lower tier
      if (t === bottom) {
        const annN = Math.round(n * 0.035);
        for (let i = 0; i < annN; i++) {
          const a = rand(0, TAU);
          const r = rand(top.r + 0.015, t.r);
          addP(
            Math.cos(a) * r,
            t.y1 + rand(-0.006, 0.012),
            Math.sin(a) * r,
            Math.random() < 0.62 ? 3 : 2,
            rand(0.7, 1.5)
          );
        }
      }
    }

    // ---- domed cream top -------------------------------------------
    const domeN = Math.round(n * 0.18);
    for (let i = 0; i < domeN; i++) {
      const a = rand(0, TAU);
      const rr = Math.sqrt(Math.random()) * top.r;
      const q = rr / top.r;
      const domeY = topY + 0.11 * (1 - q * q) + Math.sin(a * 7 + rr * 18) * 0.008 + rand(-0.008, 0.008);
      let ci = Math.random() < 0.76 ? 3 : 2;
      if (Math.random() < 0.05) ci = 4;
      addP(Math.cos(a) * rr, domeY, Math.sin(a) * rr, ci, rand(0.9, 2.2));
    }
    // cream swirl, a little denser in the centre
    for (let i = 0; i < n * 0.035; i++) {
      const a = rand(0, TAU);
      const rr = rand(0.03, 0.52);
      addP(Math.cos(a) * rr, topY + 0.115 * (1 - (rr / top.r) ** 2) + rand(-0.005, 0.012), Math.sin(a) * rr, Math.random() < 0.4 ? 4 : 3, rand(0.8, 1.9));
    }

    // ---- candles ----------------------------------------------------
    const candleDefs = [
      { x: 0, z: 0, h: 0.43, base: 0.55 },
      { x: -0.28, z: 0.1, h: 0.27, base: 0.51 },
      { x: 0.29, z: 0.12, h: 0.3, base: 0.5 },
      { x: 0.04, z: -0.3, h: 0.24, base: 0.5 },
      { x: -0.1, z: 0.31, h: 0.22, base: 0.49 },
    ];
    candles = [];
    candleDefs.forEach((c) => {
      const bodyN = 74;
      for (let i = 0; i < bodyN; i++) {
        const a = rand(0, TAU);
        const rr = Math.sqrt(Math.random()) * 0.04;
        const y = c.base + rand(0, c.h);
        addP(c.x + Math.cos(a) * rr, y, c.z + Math.sin(a) * rr, Math.random() < 0.18 ? 3 : 4, rand(0.8, 1.7));
      }
      for (let i = 0; i < 22; i++) {
        const a = rand(0, TAU);
        addP(c.x + Math.cos(a) * 0.04, c.base + c.h, c.z + Math.sin(a) * 0.04, 3, rand(0.7, 1.3));
      }
      candles.push({
        x: c.x, z: c.z, h: c.h, baseY: c.base, lit: false,
        seed: rand(0, 10), litAt: 0, flameH: rand(0.13, 0.19),
      });
    });

    // ---- sugar beads + sparkles ------------------------------------
    for (let i = 0; i < n * 0.022; i++) {
      const tier = pick([bottom, top]);
      const a = rand(0, TAU);
      const r = tier.r + 0.02;
      addP(Math.cos(a) * r, tier.y1 + rand(-0.05, 0.03), Math.sin(a) * r, Math.random() < 0.55 ? 4 : 5, rand(1.0, 2.3));
    }
  }

  function buildHeart(n) {
    for (let i = 0; i < n; i++) {
      const t = rand(0, TAU);
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const k = Math.sqrt(Math.random());
      let x = hx * 0.067 * k;
      let y = hy * 0.067 * k + 0.1;
      const z = (Math.random() - 0.5) * (0.34 * (1 - k * 0.55));
      let ci;
      const r = Math.random();
      if (r < 0.1) ci = 4;
      else if (r < 0.32) ci = 3;
      else if (r < 0.65) ci = 2;
      else ci = 1;
      addP(x, y, z, ci, rand(0.7, 1.8));
    }
    // bright outline
    for (let i = 0; i < n * 0.08; i++) {
      const t = rand(0, TAU);
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      addP(hx * 0.067, hy * 0.067 + 0.1, rand(-0.04, 0.04), Math.random() < 0.3 ? 4 : 3, rand(0.9, 2.2));
    }
  }

  function buildStar(n) {
    const outer = 1.08;
    const inner = 0.43;
    const poly = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? outer : inner;
      poly.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    function inside(px, py) {
      let c = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a.y > py) !== (b.y > py) && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x) c = !c;
      }
      return c;
    }
    let tries = 0;
    while (particles.length < n && tries < n * 14) {
      tries++;
      const x = rand(-outer, outer);
      const y = rand(-outer, outer) + 0.05;
      if (!inside(x, y)) continue;
      const z = (Math.random() - 0.5) * 0.22 * (1 - Math.min(1, Math.hypot(x, y) / outer) * 0.5);
      const r = Math.random();
      let ci = r < 0.12 ? 4 : r < 0.4 ? 3 : r < 0.72 ? 2 : 1;
      addP(x, y, z, ci, rand(0.7, 1.8));
    }
    // crisp outline
    for (let i = 0; i < 10; i++) {
      const a = poly[i], b = poly[(i + 1) % 10];
      const steps = 55;
      for (let k = 0; k < steps; k++) {
        addP(lerp(a.x, b.x, k / steps), lerp(a.y, b.y, k / steps) + 0.05, rand(-0.02, 0.02), Math.random() < 0.3 ? 4 : 3, rand(0.9, 2.0));
      }
    }
  }

  function buildMoon(n) {
    const outer = 1.04;
    const innerR = 0.78;
    const ox = 0.42;
    const oy = 0.04;
    let tries = 0;
    while (particles.length < n && tries < n * 20) {
      tries++;
      const x = rand(-outer, outer);
      const y = rand(-outer, outer);
      if (x * x + y * y > outer * outer) continue;
      if ((x - ox) * (x - ox) + (y - oy) * (y - oy) < innerR * innerR) continue;
      const z = rand(-0.22, 0.22) * (1 - Math.min(1, Math.hypot(x, y) / outer) * 0.35);
      const r = Math.random();
      let ci = r < 0.14 ? 4 : r < 0.45 ? 3 : r < 0.78 ? 2 : 1;
      addP(x, y + 0.04, z, ci, rand(0.7, 1.8));
    }
    // crisp crescent outline
    for (let i = 0; i < 150; i++) {
      const a = (i / 150) * TAU;
      addP(Math.cos(a) * outer, Math.sin(a) * outer + 0.04, rand(-0.03, 0.03), Math.random() < 0.3 ? 4 : 3, rand(0.9, 1.9));
    }
    for (let i = 0; i < 150; i++) {
      const a = (i / 150) * TAU;
      const px = ox + Math.cos(a) * innerR;
      const py = oy + Math.sin(a) * innerR;
      if (px * px + py * py > outer * outer) continue;
      addP(px, py + 0.04, rand(-0.03, 0.03), 2, rand(0.8, 1.7));
    }
  }

  function buildShape() {
    particles = [];
    candles = [];
    const n = reduceMotion ? 7000 : isSmall() ? 11000 : 17000;
    if (config.theme === 'cake') buildCake(n);
    else if (config.theme === 'heart') buildHeart(n);
    else if (config.theme === 'star') buildStar(n);
    else buildMoon(n);

    particles.forEach((p) => {
      p.tw = rand(0, TAU);
      p.seed = Math.random();
      const a = rand(0, TAU);
      const rr = rand(1.6, 3.4);
      p.ox = Math.cos(a) * rr;
      p.oy = rand(-0.9, 1.8);
      p.oz = Math.sin(a) * rr;
      p.appear = Math.random() * 0.45;
    });

    rings = [];
    const ringCount = isSmall() ? 3 : 3;
    for (let i = 0; i < ringCount; i++) {
      rings.push({
        r: [1.48, 1.78, 2.04][i],
        y: [-0.36, -0.16, -0.04][i],
        n: [360, 460, 240][i],
        sp: [0.16, -0.11, 0.07][i],
        ci: [2, 1, 4][i],
        phase: rand(0, TAU),
      });
    }
    state.revealStart = performance.now();
    state.reveal = 0;
    state.textTargetsBuilt = false;
  }

  /* ---------------------------------------------------------
     8. text sampling
     --------------------------------------------------------- */
  const FONT_STACK = '"Songti SC","STSong","STZhongsong","Noto Serif SC","Source Han Serif SC","SimSun",Georgia,serif';
  const sampleCanvas = document.createElement('canvas');
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  let textLayout = null;
  let textGlowCanvas = document.createElement('canvas');
  let textGlowCtx = textGlowCanvas.getContext('2d');
  let textCache = null;
  let textCacheReady = false;

  function invalidateTextCache() {
    textCache = null;
    textCacheReady = false;
  }

  function fitFont(text, size, maxW) {
    sampleCtx.font = '600 ' + size + 'px ' + FONT_STACK;
    const w = sampleCtx.measureText(text).width;
    if (w > maxW) size = Math.floor((size * maxW) / w);
    return Math.max(24, size);
  }

  function sampleText(text, size, cx, cy, step, weight) {
    const pad = Math.ceil(size * 0.6);
    sampleCanvas.width = Math.max(2, Math.ceil(W));
    sampleCanvas.height = Math.max(2, Math.ceil(H));
    const g = sampleCtx;
    g.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
    g.font = (weight || 600) + ' ' + size + 'px ' + FONT_STACK;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText(text, cx, cy);
    const mw = Math.min(W, Math.ceil(g.measureText(text).width) + pad * 2);
    const x0 = clamp(Math.floor(cx - mw / 2), 0, W);
    const y0 = clamp(Math.floor(cy - size * 0.85), 0, H);
    const w = Math.max(1, Math.min(Math.ceil(mw), W - x0));
    const h = Math.max(1, Math.min(Math.ceil(size * 1.7), H - y0));
    let data;
    try {
      data = g.getImageData(x0, y0, w, h).data;
    } catch (e) {
      return [];
    }
    const pts = [];
    const st = Math.max(2, step);
    for (let y = 0; y < h; y += st) {
      const iy = Math.floor(y);
      for (let x = 0; x < w; x += st) {
        const ix = Math.floor(x);
        const a = data[(iy * w + ix) * 4 + 3];
        if (a > 120) {
          pts.push({ x: x0 + x + rand(-0.7, 0.7), y: y0 + y + rand(-0.7, 0.7) });
        }
      }
    }
    return pts;
  }

  function buildTextTargets() {
    invalidateTextCache();
    state.textTargetsBuilt = false;
    const title = (config.title || '生日快乐').trim() || '生日快乐';
    const len = Math.max(2, Array.from(title).length);
    let size = Math.min((W * 0.86) / len, H * 0.29);
    size = Math.max(52, size);
    size = fitFont(title, size, W * 0.86);
    const cy = H * 0.565;
    const pts = sampleText(title, size, W / 2, cy, isSmall() ? 3.2 : 3.6, 600);
    if (!pts.length) return;
    textLayout = { title, size, cx: W / 2, cy };
    particles.forEach((p, i) => {
      const t = pts[i % pts.length];
      p.tx = t.x + rand(-1.4, 1.4);
      p.ty = t.y + rand(-1.4, 1.4);
      const q = t.x / W;
      p.tci = q < 0.28 ? 0 : q < 0.54 ? 1 : q < 0.8 ? 2 : 3;
    });
    state.textTargetsBuilt = true;
    buildTextGlow();
  }

  function buildTextGlow() {
    textGlowCanvas.width = Math.max(2, Math.ceil(W));
    textGlowCanvas.height = Math.max(2, Math.ceil(H));
    textGlowCtx = textGlowCanvas.getContext('2d');
    const g = textGlowCtx;
    g.clearRect(0, 0, textGlowCanvas.width, textGlowCanvas.height);
    if (!textLayout) return;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '600 ' + textLayout.size + 'px ' + FONT_STACK;
    g.shadowColor = hexToRgba(palette.text[1], 0.55);
    g.shadowBlur = 56;
    g.fillStyle = hexToRgba(palette.text[2], 0.085);
    g.fillText(textLayout.title, textLayout.cx, textLayout.cy);
  }

  function buildTextCache() {
    if (!state.textTargetsBuilt || !particles.length) return;
    const dpr = Math.min(DPR, 1.6);
    const cv = document.createElement('canvas');
    cv.width = Math.max(2, Math.ceil(W * dpr));
    cv.height = Math.max(2, Math.ceil(H * dpr));
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (typeof p.tx !== 'number') continue;
      const tw = 0.72 + 0.28 * Math.sin(p.tw);
      const s = (p.tci === 3 ? 1.58 : 1.18) * (0.85 + tw * 0.4);
      const x = p.tx + Math.sin(p.tw) * 1.1;
      const y = p.ty + Math.cos(p.tw) * 1.1;
      g.fillStyle = particleColor(TEXT_COLORS, p.tci, 0.9);
      g.fillRect(x, y, s, s);
      if (p.seed > 0.9 || (p.tci === 3 && p.seed > 0.78)) {
        const gs = s * 5.2;
        g.globalAlpha = 0.3;
        g.drawImage(textGlowSprites[p.tci % 4], x - gs / 2, y - gs / 2, gs, gs);
        g.globalAlpha = 1;
      }
    }
    textCache = cv;
    textCacheReady = true;
  }

  /* ---------------------------------------------------------
     9. countdown
     --------------------------------------------------------- */
  const cd = {
    active: false,
    particles: [],
    targets: [],
    digit: '3',
    fontSize: 300,
    labelAlpha: 0,
  };

  function initCountdown() {
    cd.active = true;
    cd.particles = [];
    cd.digit = '3';
    cd.fontSize = Math.min(W, H) * 0.46;
    const n = reduceMotion ? 700 : isSmall() ? 1100 : 1700;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const r = rand(0.2, 0.5);
      cd.particles.push({
        x: W / 2 + Math.cos(a) * W * r,
        y: H / 2 + Math.sin(a) * H * r * 0.42,
        vx: 0,
        vy: 0,
        tx: W / 2,
        ty: H / 2,
        s: rand(0.7, 2.0),
        ci: Math.random() < 0.16 ? 4 : Math.random() < 0.45 ? 3 : 2,
        ph: rand(0, TAU),
      });
    }
    setCountdownDigit('3');
  }

  function setCountdownDigit(d) {
    cd.digit = d;
    const size = Math.min(W * 0.72, H * 0.72);
    cd.fontSize = size;
    const pts = sampleText(d, size, W / 2, H * 0.47, isSmall() ? 3 : 3.4, 600);
    cd.targets = pts;
    if (!pts.length) return;
    cd.particles.forEach((p, i) => {
      const t = pts[(i * 7 + ((i * i) % 11)) % pts.length];
      p.tx = t.x + rand(-1, 1);
      p.ty = t.y + rand(-1, 1);
    });
  }

  function scatterCountdown() {
    cd.particles.forEach((p) => {
      const a = Math.atan2(p.y - H / 2, p.x - W / 2) + rand(-0.6, 0.6);
      const f = rand(5, 16);
      p.vx += Math.cos(a) * f;
      p.vy += Math.sin(a) * f;
    });
  }

  async function runCountdown() {
    setCountdownDigit('3');
    await sleep(780);
    scatterCountdown();
    await sleep(140);
    setCountdownDigit('2');
    await sleep(780);
    scatterCountdown();
    await sleep(140);
    setCountdownDigit('1');
    await sleep(820);
    scatterCountdown();
    await sleep(260);
    cd.active = false;
    enterCake();
  }

  /* ---------------------------------------------------------
     10. photos / cards
     --------------------------------------------------------- */
  /* =========================================================
     ★ 照片星轨：换照片 / 换标题 / 调角度，直接改这个数组 ★
     angle 是它绕蛋糕的起始角度，r 是离蛋糕的距离，y 是高度。
     ========================================================= */
  const PHOTOS = [
    { type: 'photo', src: 'assets/photo1.jpg', title: '光落在你身上', cap: '2026.01 · 一起看的展', angle: 0.25, r: 2.05, y: 0.25 },
    { type: 'quote', q: '愿你眼里有光', sub: 'SEE THE LIGHT', title: '写给今天的你', cap: 'KEEP SHINING', angle: 1.3, r: 1.9, y: 0.8 },
    { type: 'photo', src: 'assets/photo2.jpg', title: '睡个好觉', cap: '平凡又安心的一天', angle: 2.34, r: 1.98, y: -0.2 },
    { type: 'quote', q: '岁岁常欢愉', sub: 'ALL THE BEST', title: '所有美好如期而至', cap: 'HAPPY BIRTHDAY', angle: 3.39, r: 1.9, y: 0.48 },
    { type: 'photo', src: 'assets/photo3.jpg', title: '一起走很远', cap: '冬天也有暖意', angle: 4.44, r: 2.08, y: 0.9 },
    { type: 'quote', q: '万事皆胜意', sub: 'WISHES COME TRUE', title: '星星替你记得', cap: 'A LITTLE UNIVERSE', angle: 5.49, r: 1.88, y: -0.32 },
  ];

  function buildCards() {
    cardsFrontEl.innerHTML = '';
    cardsBackEl.innerHTML = '';
    PHOTOS.forEach((p, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'card' + (p.type === 'quote' ? ' quote-card' : '');
      el.dataset.idx = String(i);
      el.setAttribute('aria-label', p.title);
      if (p.type === 'photo') {
        const img = document.createElement('img');
        img.src = p.src;
        img.alt = p.title;
        img.loading = 'lazy';
        img.draggable = false;
        img.onerror = () => { img.style.display = 'none'; };
        el.appendChild(img);
      } else {
        const q = document.createElement('div');
        q.className = 'q';
        q.innerHTML = '<b>' + escapeHtml(p.q) + '</b><small>' + escapeHtml(p.sub) + '</small>';
        el.appendChild(q);
      }
      const cap = document.createElement('span');
      cap.className = 'cap';
      cap.textContent = p.title;
      el.appendChild(cap);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openPhoto(i, el);
      });
      p.el = el;
      p.back = false;
      cardsFrontEl.appendChild(el);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function updateCards(now) {
    if (state.phase !== 'cake') return;
    const t = now * 0.001;
    PHOTOS.forEach((p) => {
      if (!p.el) return;
      const ang = p.angle + state.yaw * 0.92 + state.cardOrbit;
      const rr = p.r * (isSmall() ? 0.62 : 1);
      const x = Math.cos(ang) * rr;
      const z = Math.sin(ang) * rr;
      const y = p.y + Math.sin(t * 0.55 + p.angle) * 0.045;
      const pr = project(x, y, z);
      // Cards are sorted into a real back / front layer. A little hysteresis
      // keeps a card from flickering between layers as it crosses the plane.
      if (p.back === undefined) p.back = pr.z < 0;
      if (pr.z > 0.12) p.back = false;
      else if (pr.z < -0.12) p.back = true;
      const layer = p.back ? cardsBackEl : cardsFrontEl;
      if (p.el.parentNode !== layer) layer.appendChild(p.el);

      // Photos facing the camera get a gentle zoom-in. Only the scale changes;
      // the orbit angle stays exactly the same, so the rotation is untouched.
      const isPhoto = p.type === 'photo';
      const facing = clamp((Math.sin(ang) - 0.12) / 0.88, 0, 1);
      const facingEase = facing * facing * (3 - 2 * facing);
      const breath = 1 + 0.025 * Math.sin(now * 0.003 + p.angle) * facingEase;
      const boost = isPhoto && !p.back ? (1 + (isSmall() ? 0.28 : 0.38) * facingEase) * breath : 1;
      let sc = clamp(pr.k * state.zoom * (isSmall() ? 0.92 : 1.04), 0.62, 1.45) * (W < 520 ? 0.88 : 1);
      sc = clamp(sc * boost * (p.back ? 0.86 : 1), 0.62, isSmall() ? 1.58 : 1.82);
      let px = pr.x;
      let py = pr.y;
      if (isSmall()) {
        const half = 46;
        px = clamp(px, half, W - half);
        py = clamp(py, 105, H - 120);
      }
      p.el.classList.toggle('is-front', isPhoto && !p.back && facingEase > 0.52);
      p.el.style.transform = 'translate(-50%,-50%) translate(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px) scale(' + sc.toFixed(3) + ')';
      if (p.back) {
        p.el.style.opacity = '0.62';
        p.el.style.filter = 'saturate(.6) brightness(.7) blur(.3px)';
        p.el.style.zIndex = String(Math.max(1, Math.min(99, 100 + Math.round(pr.z * 100))));
      } else {
        p.el.style.opacity = '1';
        p.el.style.filter = '';
        p.el.style.zIndex = String(400 + Math.round(pr.z * 100));
      }
      if (!isSmall() && (pr.x < -120 || pr.x > W + 120)) p.el.style.opacity = '0';
    });
  }

  function openPhoto(i, sourceEl, dir) {
    const total = PHOTOS.length;
    i = ((i % total) + total) % total;
    state.photoIndex = i;
    const p = PHOTOS[i];
    const wasOpen = lightbox.classList.contains('on');
    if (lbMedia.getAnimations) lbMedia.getAnimations().forEach((a) => a.cancel());
    lbMedia.innerHTML = '';
    if (p.type === 'photo') {
      const img = document.createElement('img');
      img.src = p.src;
      img.alt = p.title;
      img.draggable = false;
      lbMedia.appendChild(img);
    } else {
      const q = document.createElement('div');
      q.className = 'lb-quote';
      q.innerHTML = '<b>' + escapeHtml(p.q) + '</b><small>' + escapeHtml(p.sub) + '</small>';
      lbMedia.appendChild(q);
    }
    lbTitle.textContent = p.title;
    lbCap.textContent = p.cap;
    lbCount.textContent = String(i + 1).padStart(2, '0');
    lbTotal.textContent = String(total).padStart(2, '0');
    lightbox.classList.add('on');
    lightbox.setAttribute('aria-hidden', 'false');
    state.lbOpen = true;
    AudioKit.chime(wasOpen ? 988 : 880, 0.12, 0.15);

    const figure = lightbox.querySelector('figure');
    if (figure && figure.animate) {
      figure.animate(
        [{ opacity: 0.35, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    }

    if (!reduceMotion) {
      requestAnimationFrame(() => {
        if (!lbMedia.animate) return;
        const last = lbMedia.getBoundingClientRect();
        if (!last.width || !last.height) return;
        if (!wasOpen && sourceEl) {
          // FLIP: the photo grows out of the card that was just clicked.
          const first = sourceEl.getBoundingClientRect();
          if (!first.width || !first.height) return;
          const dx = first.left + first.width / 2 - (last.left + last.width / 2);
          const dy = first.top + first.height / 2 - (last.top + last.height / 2);
          const sx = Math.max(0.12, first.width / last.width);
          const sy = Math.max(0.12, first.height / last.height);
          lbMedia.animate(
            [
              { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', opacity: 0.25, filter: 'blur(3px)' },
              { transform: 'none', opacity: 1, filter: 'blur(0px)' },
            ],
            { duration: 660, easing: 'cubic-bezier(.2,.85,.2,1)' }
          );
        } else if (wasOpen) {
          // Prev / next: a short horizontal card-slide.
          const d = dir || 1;
          lbMedia.animate(
            [
              { transform: 'translateX(' + d * 42 + 'px) scale(.97)', opacity: 0, filter: 'blur(2px)' },
              { transform: 'none', opacity: 1, filter: 'blur(0px)' },
            ],
            { duration: 430, easing: 'cubic-bezier(.2,.8,.2,1)' }
          );
        }
      });
    }
  }

  function navigatePhoto(step) {
    if (!state.lbOpen) return;
    openPhoto(state.photoIndex + step, null, step);
  }

  function closePhoto() {
    lightbox.classList.remove('on');
    lightbox.setAttribute('aria-hidden', 'true');
    state.lbOpen = false;
  }

  /* ---------------------------------------------------------
     11. audio
     --------------------------------------------------------- */
  const AudioKit = {
    ctx: null,
    master: null,
    music: null,
    musicTimer: null,
    ready: false,
    init() {
      if (this.ready) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
        this.music = new Audio('assets/music.mp3');
        this.music.loop = true;
        this.music.volume = 0;
        this.music.preload = 'auto';
        this.music.onerror = () => { /* music is optional */ };
        this.ready = true;
      } catch (e) { this.ready = false; }
    },
    resume() {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    },
    playMusic(fade) {
      if (!this.ready || !this.music) return;
      if (!config.music || !state.sound) return;
      this.resume();
      if (!this.music.paused) return;
      this.music.play().then(() => {
        const target = 0.34;
        const start = this.music.volume;
        const t0 = performance.now();
        clearInterval(this.musicTimer);
        this.musicTimer = setInterval(() => {
          const k = Math.min(1, (performance.now() - t0) / (fade || 2400));
          this.music.volume = lerp(start, target, k);
          if (k >= 1) clearInterval(this.musicTimer);
        }, 50);
      }).catch(() => {});
    },
    stopMusic(fade) {
      if (!this.music) return;
      clearInterval(this.musicTimer);
      const start = this.music.volume;
      const t0 = performance.now();
      this.musicTimer = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / (fade || 500));
        this.music.volume = lerp(start, 0, k);
        if (k >= 1) {
          this.music.pause();
          clearInterval(this.musicTimer);
        }
      }, 40);
    },
    tone(freq, dur, gain, type) {
      if (!this.ready || !state.sound) return;
      this.resume();
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.82), t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain || 0.08, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.05);
    },
    chime(freq, dur, gain) {
      this.tone(freq || 880, dur || 0.4, gain || 0.06, 'sine');
      this.tone((freq || 880) * 1.5, (dur || 0.4) * 0.8, (gain || 0.06) * 0.5, 'triangle');
    },
    sparkle() {
      [1046, 1318, 1568, 2093].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 0.045, 'sine'), i * 55));
    },
    whoosh() {
      if (!this.ready || !state.sound) return;
      this.resume();
      const dur = 1.0;
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, sr * dur, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(280, this.ctx.currentTime);
      bp.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.45);
      bp.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.16, this.ctx.currentTime + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.95);
      src.connect(bp); bp.connect(g); g.connect(this.master);
      src.start();
    },
    boom() {
      if (!this.ready || !state.sound) return;
      this.resume();
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.55);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + 0.75);
      // noise tail
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, sr * 0.4, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = this.ctx.createBufferSource(); src.buffer = buf;
      const g2 = this.ctx.createGain();
      g2.gain.value = 0.06;
      src.connect(g2); g2.connect(this.master);
      src.start();
    },
  };

  /* ---------------------------------------------------------
     12. smoke / fireworks / meteors
     --------------------------------------------------------- */
  const smoke = [];
  const fwParticles = [];
  const meteors = [];

  (function initMeteors() {
    const n = reduceMotion ? 8 : 20;
    for (let i = 0; i < n; i++) {
      meteors.push({
        x: rand(-0.1, 1.2) * W,
        y: rand(-0.4, 0.9) * H,
        len: rand(50, 170),
        sp: rand(120, 340),
        a: rand(0.06, 0.24),
        w: rand(0.5, 1.4),
      });
    }
  })();

  function spawnSmoke(x, y, n) {
    for (let i = 0; i < n; i++) {
      smoke.push({
        x: x + rand(-4, 4),
        y: y + rand(-6, 4),
        vx: rand(-7, 7),
        vy: rand(-22, -8),
        size: rand(10, 22),
        age: 0,
        life: rand(1.4, 2.6),
        rot: rand(0, TAU),
      });
    }
  }

  const FW_TYPES = ['heart', 'ring', 'chrys'];

  function heartXY(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [x * 0.062, -y * 0.062];
  }

  function spawnBurst(x, y, type, big) {
    type = type || pick(FW_TYPES);
    const n = big ? 150 : 90;
    const spread = big ? 17 : 12;
    const base = pick(palette.fire);
    for (let i = 0; i < n; i++) {
      let vx, vy;
      if (type === 'heart') {
        const t = (i / n) * TAU;
        const [hx, hy] = heartXY(t);
        const k = spread * rand(0.86, 1.08);
        const fill = Math.random() < 0.55 ? Math.sqrt(Math.random()) : 1;
        vx = hx * k * 30 * fill;
        vy = hy * k * 30 * fill;
      } else if (type === 'ring') {
        const a = (i / n) * TAU;
        const sp = spread * 24 * rand(0.9, 1.05);
        vx = Math.cos(a) * sp;
        vy = Math.sin(a) * sp;
      } else {
        const a = rand(0, TAU);
        const sp = spread * 28 * rand(0.25, 1);
        vx = Math.cos(a) * sp;
        vy = Math.sin(a) * sp;
      }
      fwParticles.push({
        x, y, px: x, py: y, vx, vy,
        age: 0,
        life: rand(1.25, 2.3),
        s: rand(0.8, 1.9),
        color: Math.random() < 0.65 ? base : pick(palette.fire),
      });
    }
    // flash
    for (let i = 0; i < 8; i++) {
      fwParticles.push({
        x, y, px: x, py: y,
        vx: rand(-20, 20), vy: rand(-20, 20),
        age: 0, life: rand(0.2, 0.45), s: rand(1.6, 2.6), color: '#fff6e6',
      });
    }
    if (state.sound) AudioKit.boom();
  }

  /* ---------------------------------------------------------
     13. phase transitions + UI copy
     --------------------------------------------------------- */
  function setPhase(p) {
    state.phase = p;
    document.body.dataset.phase = p;
  }

  function setWishBtn(label, disabled) {
    wishBtnText.textContent = label;
    wishBtn.disabled = !!disabled;
    wishBtn.style.opacity = disabled ? '0.65' : '';
  }

  const THEME_COPY = {
    cake: { title: '把愿望\n放进蛋糕', desc: '拖动旋转星轨，点击照片打开回忆。<br />轻点烛火，再把它们吹灭。', hint: '拖动旋转 · 正面照片可点 · 点亮烛火', tip: '轻点蛋糕上的烛芯，或按下方的按钮，让第一束光落下来。' },
    heart: { title: '把心愿\n放进心里', desc: '拖动旋转星轨，点击照片打开回忆。<br />让所有没说出口的话，落进这颗心里。', hint: '拖动旋转 · 正面照片可点 · 收下祝福', tip: '星屑已经聚拢成一颗心。点击照片，或者收下这份祝福。' },
    star: { title: '把心愿\n交给星辰', desc: '拖动旋转星轨，点击照片打开回忆。<br />每一粒星屑，都替你记得一个愿望。', hint: '拖动旋转 · 正面照片可点 · 收下祝福', tip: '星屑已经聚拢成一颗星。点击照片，或者收下这份祝福。' },
    moon: { title: '把愿望\n寄给月亮', desc: '拖动旋转星轨，点击照片打开回忆。<br />月光会替你把心愿，轻轻说完。', hint: '拖动旋转 · 正面照片可点 · 收下祝福', tip: '星屑已经聚拢成一轮月亮。点击照片，或者收下这份祝福。' },
  };

  function themeCopy() {
    return THEME_COPY[config.theme] || THEME_COPY.cake;
  }

  function setChapter(mode) {
    if (mode === 'cake') {
      const copy = themeCopy();
      chapterNo.textContent = 'CHAPTER II';
      chapterTag.textContent = '许愿';
      chapterTitle.textContent = copy.title;
      chapterTitle.classList.remove('small');
      chapterTitle.style.fontSize = '';
      chapterDesc.innerHTML = copy.desc;
      $$('li', stepsEl).forEach((li, i) => {
        li.classList.toggle('on', i === 0);
        li.classList.remove('done');
      });
    } else {
      chapterNo.textContent = 'CHAPTER III';
      chapterTag.textContent = '如愿';
      chapterTitle.textContent = config.name + '，\n生日快乐';
      chapterTitle.classList.toggle('small', config.name.length > 5);
      chapterTitle.style.fontSize = config.name.length > 8 ? '22px' : '';
      chapterDesc.innerHTML = '烛火熄灭，星屑升起。<br />愿你被这个世界温柔以待。';
      $$('li', stepsEl).forEach((li) => {
        li.classList.remove('on');
        li.classList.add('done');
      });
    }
  }

  function setStep(n) {
    $$('li', stepsEl).forEach((li, i) => {
      li.classList.toggle('on', i === n - 1);
      li.classList.toggle('done', i < n - 1);
    });
  }

  function setTip(kicker, title, text, meta) {
    tipKicker.textContent = kicker;
    tipTitle.textContent = title;
    tipText.textContent = text;
    tipMeta.textContent = meta;
  }

  function defaultTip() {
    const copy = themeCopy();
    const hint = $('#hintChip');
    if (hint) hint.textContent = copy.hint;
    if (!candles.length) {
      setTip('STARDUST · WISH', '星屑已经聚拢', copy.tip, '点击 · 收下');
      setWishBtn('收下这份祝福');
    } else if (!state.candlesLit) {
      setTip('SECOND HAND · WISH', '烛光还没有点亮', '轻点蛋糕上的烛芯，或按下方的按钮，让第一束光落下来。', '点击 · 点亮');
      setWishBtn('点亮烛光');
    } else {
      setTip('SECOND HAND · WISH', '烛光被点亮了', '对着烛光轻轻吹一口气，或者按下按钮——愿望就要启程。', '吹灭 · 许愿');
      setWishBtn('吹灭蜡烛 · 收下祝福');
    }
  }

  function refreshCopy() {
    wishName.textContent = config.name;
    wishLine.textContent = config.wish;
    document.title = config.name + ' · 星屑成诗';
    inName.value = config.name;
    inWish.value = config.wish;
    inTitle.value = config.title;
    inMusic.checked = config.music;
    inMic.checked = config.mic;
    $$('button', themeSeg).forEach((b) => b.classList.toggle('on', b.dataset.theme === config.theme));
    $$('button', paletteSeg).forEach((b) => b.classList.toggle('on', b.dataset.palette === config.palette));
  }

  function updateStepsForCandles() {
    if (state.phase !== 'cake') return;
    setStep(state.candlesLit ? 2 : 1);
  }

  function showToast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    document.body.classList.add('toast-on');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toastEl.classList.remove('on');
      document.body.classList.remove('toast-on');
    }, ms || 2400);
  }

  function flash() {
    flashEl.classList.remove('on');
    void flashEl.offsetWidth;
    flashEl.classList.add('on');
  }

  /* ---------------------------------------------------------
     14. actions
     --------------------------------------------------------- */
  function startExperience() {
    if (state.started) return;
    state.started = true;
    AudioKit.init();
    AudioKit.resume();
    if (config.music && state.sound) AudioKit.playMusic(2800);
    landingEl.classList.add('gone');
    setPhase('countdown');
    setWishBtn('正在收集星屑…', true);
    initCountdown();
    runCountdown();
  }

  function enterCake() {
    setPhase('cake');
    state.candlesLit = false;
    state.revealStart = performance.now();
    state.reveal = 0;
    setChapter('cake');
    defaultTip();
    updateStepsForCandles();
    AudioKit.chime(660, 0.5, 0.05);
    setTimeout(() => showToast('星屑已经就位 · 点亮烛火吧', 2600), 500);
    if (EDIT_MODE) {
      setTimeout(() => {
        if (state.phase === 'cake' && !state.drawOpen) openDrawer();
      }, 1100);
    }
  }

  function lightAll() {
    if (!candles.length) {
      startWish();
      return;
    }
    if (state.candlesLit) return;
    state.candlesLit = true;
    const now = performance.now();
    candles.forEach((c, i) => {
      c.lit = true;
      c.litAt = now + i * 80;
      const pr = project(c.x, c.baseY + c.h, c.z);
      for (let k = 0; k < 6; k++) {
        fwParticles.push({
          x: pr.x, y: pr.y, px: pr.x, py: pr.y,
          vx: rand(-40, 40), vy: rand(-80, -20),
          age: 0, life: rand(0.5, 1.1), s: rand(0.8, 1.6),
          color: pick(palette.fire),
        });
      }
    });
    AudioKit.sparkle();
    setStep(2);
    setTip('SECOND HAND · WISH', '烛光被点亮了', '对着烛光轻轻吹一口气，或者按下按钮——愿望就要启程。', '吹灭 · 许愿');
    setWishBtn('吹灭蜡烛 · 收下祝福');
    showToast('烛光亮了 · 现在，轻轻吹灭它');
  }

  function lightOne(idx) {
    const c = candles[idx];
    if (!c) return;
    c.lit = true;
    c.litAt = performance.now();
    AudioKit.tone(1046 + idx * 60, 0.35, 0.05, 'sine');
    const pr = project(c.x, c.baseY + c.h, c.z);
    for (let k = 0; k < 10; k++) {
      fwParticles.push({
        x: pr.x, y: pr.y, px: pr.x, py: pr.y,
        vx: rand(-55, 55), vy: rand(-95, -25),
        age: 0, life: rand(0.5, 1.2), s: rand(0.7, 1.7),
        color: pick(palette.fire),
      });
    }
    if (candles.every((x) => x.lit)) {
      state.candlesLit = true;
      setStep(2);
      setTip('SECOND HAND · WISH', '烛光被点亮了', '对着烛光轻轻吹一口气，或者按下按钮——愿望就要启程。', '吹灭 · 许愿');
      setWishBtn('吹灭蜡烛 · 收下祝福');
      AudioKit.sparkle();
      showToast('所有的烛光都亮了');
    } else {
      showToast('再点亮剩下的烛火');
    }
  }

  function blowCandles() {
    if (state.phase !== 'cake') return;
    if (!candles.length) {
      startWish();
      return;
    }
    if (!state.candlesLit) {
      lightAll();
      return;
    }
    state.candlesLit = false;
    candles.forEach((c) => {
      c.lit = false;
      const pr = project(c.x, c.baseY + c.h, c.z);
      spawnSmoke(pr.x, pr.y - 6, 16);
    });
    AudioKit.whoosh();
    setWishBtn('正在收下星屑…', true);
    setTip('SECOND HAND · WISH', '愿望已经出发', '烛火熄灭，星屑正在替你把它写进夜空。', '稍等 · 星屑');
    setStep(3);
    setTimeout(() => {
      startWish();
    }, 800);
  }

  function startWish() {
    if (state.phase === 'text') return;
    buildTextTargets();
    if (!state.textTargetsBuilt) {
      showToast('文字采样失败，请刷新重试');
      return;
    }
    // freeze current projected positions
    updateCamera();
    particles.forEach((p) => {
      const pr = project(p.x, p.y, p.z);
      p.fx = pr.x;
      p.fy = pr.y;
    });
    state.morphStart = performance.now();
    setPhase('text');
    state.candlesLit = false;
    setChapter('text');
    wishName.textContent = config.name;
    wishLine.textContent = config.wish;
    buildBlessings();
    setWishBtn('再看一次');
    state.nextFw = performance.now() + 650;
    state.lastBlow = performance.now();
    AudioKit.whoosh();
    setTimeout(() => AudioKit.boom(), 150);
    [
      [520, 0.2, 0.3, 'heart'],
      [880, 0.8, 0.31, 'chrys'],
      [1300, 0.7, 0.16, 'heart'],
    ].forEach((b) => {
      setTimeout(() => spawnBurst(W * b[1], H * b[2], b[3], true), b[0]);
    });
    setTimeout(() => showToast(candles.length ? '烛火熄灭 · 生日快乐' : '星屑升起 · 生日快乐', 2800), 1400);
  }

  function replay() {
    if (state.phase !== 'cake' && state.phase !== 'text') return;
    flash();
    setTimeout(() => {
      state.candlesLit = false;
      state.morph = 0;
      state.revealStart = performance.now();
      state.reveal = 0;
      state.nextFw = 0;
      setPhase('cake');
      setChapter('cake');
      defaultTip();
      setStep(1);
      blessingsEl.innerHTML = '';
      if (state.micOn) { /* keep listening */ }
      AudioKit.chime(523, 0.6, 0.05);
      showToast('再来一次 · 轻轻点亮烛火');
    }, 380);
  }

  function handleWishAction() {
    if (state.phase === 'text') {
      replay();
      return;
    }
    if (state.phase !== 'cake') return;
    if (!candles.length) {
      startWish();
      return;
    }
    if (!state.candlesLit) {
      lightAll();
      return;
    }
    blowCandles();
  }

  const BLESSINGS = ['身体健康', '万事如意', '美梦成真', '心想事成', '一路顺风', '无忧无虑', '遇挚友如逢春', '恭喜发财'];
  const BLESS_POS = [
    [10, 30], [8, 48], [10, 66], [23, 82],
    [50, 89], [77, 82], [91, 66], [92, 45],
  ];

  function buildBlessings() {
    blessingsEl.innerHTML = '';
    BLESSINGS.forEach((b, i) => {
      const s = document.createElement('span');
      s.className = 'blessing';
      s.textContent = b;
      s.style.left = BLESS_POS[i][0] + '%';
      s.style.top = BLESS_POS[i][1] + '%';
      s.style.animationDelay = (0.55 + i * 0.12) + 's, ' + (i * 0.7) + 's';
      blessingsEl.appendChild(s);
    });
  }

  /* ---------------------------------------------------------
     15. settings
     --------------------------------------------------------- */
  let draftTheme = config.theme;
  let draftPalette = config.palette;

  function openDrawer() {
    refreshCopy();
    draftTheme = config.theme;
    draftPalette = config.palette;
    $$('button', themeSeg).forEach((b) => b.classList.toggle('on', b.dataset.theme === draftTheme));
    $$('button', paletteSeg).forEach((b) => b.classList.toggle('on', b.dataset.palette === draftPalette));
    document.body.classList.add('drawer-open');
    drawer.setAttribute('aria-hidden', 'false');
    state.drawOpen = true;
  }

  function closeDrawer() {
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
    state.drawOpen = false;
  }

  function saveSettings() {
    const oldTheme = config.theme;
    const oldPalette = config.palette;
    config.name = (inName.value || DEFAULT_CONFIG.name).trim().slice(0, 12) || DEFAULT_CONFIG.name;
    config.wish = (inWish.value || DEFAULT_CONFIG.wish).trim().slice(0, 40) || DEFAULT_CONFIG.wish;
    config.title = (inTitle.value || '生日快乐').trim().slice(0, 6) || '生日快乐';
    config.theme = draftTheme;
    config.palette = draftPalette;
    config.music = inMusic.checked;
    config.mic = inMic.checked;
    try {
      localStorage.setItem('stardust-config', JSON.stringify({
        name: config.name, wish: config.wish, title: config.title,
        theme: config.theme, palette: config.palette, music: config.music, mic: config.mic,
      }));
    } catch (e) { /* ignore */ }

    const themeChanged = oldTheme !== config.theme;
    const paletteChanged = oldPalette !== config.palette;
    applyPalette();
    refreshCopy();
    closeDrawer();
    if (config.music && state.sound) {
      AudioKit.init();
      AudioKit.playMusic(1200);
    } else {
      AudioKit.stopMusic(400);
    }
    if (config.mic) enableMic(); else disableMic();

    if (state.phase === 'landing' || state.phase === 'countdown') {
      buildShape();
    } else if (themeChanged) {
      state.revealStart = performance.now();
      state.reveal = 0;
      state.candlesLit = false;
      flash();
      setTimeout(() => {
        buildShape();
        if (state.phase === 'text') {
          updateCamera();
          particles.forEach((p) => {
            const pr = project(p.x, p.y, p.z);
            p.fx = pr.x;
            p.fy = pr.y;
          });
          buildTextTargets();
          state.morphStart = performance.now();
        } else {
          setPhase('cake');
          setChapter('cake');
          defaultTip();
          setStep(1);
        }
      }, 240);
    } else if (paletteChanged) {
      invalidateTextCache();
      buildTextGlow();
      if (state.phase === 'text') {
        state.morphStart = performance.now() - 1600;
      }
    } else {
      // copy-only change
      if (state.phase === 'text') {
        buildTextTargets();
        state.morphStart = performance.now() - 1600;
        setChapter('text');
      } else if (state.phase === 'cake') {
        setChapter('cake');
        defaultTip();
      }
    }
    showToast('已经收进星屑里了');
  }

  function resetSettings() {
    config = Object.assign({}, DEFAULT_CONFIG);
    draftTheme = config.theme;
    draftPalette = config.palette;
    try { localStorage.removeItem('stardust-config'); } catch (e) { /* ignore */ }
    disableMic();
    applyPalette();
    refreshCopy();
    closeDrawer();
    buildShape();
    state.candlesLit = false;
    state.revealStart = performance.now();
    setPhase('cake');
    setChapter('cake');
    defaultTip();
    setStep(1);
    state.morph = 0;
    showToast('已经回到最初的那片星屑');
  }

  /* ---------------------------------------------------------
     16. microphone "blow" (optional)
     --------------------------------------------------------- */
  const MicKit = {
    stream: null,
    ctx: null,
    analyser: null,
    data: null,
    raf: 0,
    calm: 0,
    last: 0,
    async enable() {
      if (this.stream) return true;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('当前环境不支持麦克风 · 请用本地服务器或 HTTPS 打开');
        return false;
      }
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false } });
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        const src = this.ctx.createMediaStreamSource(this.stream);
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.5;
        this.data = new Uint8Array(this.analyser.fftSize);
        src.connect(this.analyser);
        const loop = () => {
          if (!this.stream) return;
          this.raf = requestAnimationFrame(loop);
          this.analyser.getByteTimeDomainData(this.data);
          let sum = 0;
          for (let i = 0; i < this.data.length; i++) {
            const v = (this.data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / this.data.length);
          const now = performance.now();
          if (rms > 0.19) this.calm++; else this.calm = Math.max(0, this.calm - 1);
          if (this.calm > 5 && now - this.last > 2600 && state.phase === 'cake' && state.candlesLit) {
            this.last = now;
            this.calm = 0;
            blowCandles();
          }
        };
        loop();
        state.micOn = true;
        showToast('麦克风已开启 · 对着它吹一口气试试');
        return true;
      } catch (e) {
        this.disable();
        showToast('麦克风没有打开 · 可以继续用按钮许愿');
        return false;
      }
    },
    disable() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
      if (this.ctx) this.ctx.close().catch(() => {});
      this.stream = null; this.ctx = null; this.analyser = null;
      state.micOn = false;
    },
  };

  function enableMic() {
    if (!config.mic) return;
    MicKit.enable().then((ok) => {
      if (!ok) {
        config.mic = false;
        inMic.checked = false;
      }
    });
  }
  function disableMic() {
    MicKit.disable();
    if (config.mic) { config.mic = false; inMic.checked = false; }
  }

  /* ---------------------------------------------------------
     17. drawing
     --------------------------------------------------------- */
  function drawBackground(now) {
    bgCtx.globalCompositeOperation = 'source-over';
    bgCtx.globalAlpha = 1;
    bgCtx.fillStyle = bgGrad || '#05060d';
    bgCtx.fillRect(0, 0, W, H);
    bgCtx.globalCompositeOperation = 'lighter';
    const pulse = 0.9 + Math.sin(now * 0.00022) * 0.08;
    for (const g of nebulaGrads) {
      bgCtx.globalAlpha = pulse;
      bgCtx.fillStyle = g;
      bgCtx.fillRect(0, 0, W, H);
    }
    bgCtx.globalAlpha = 1;
  }

  function drawStars(now) {
    bgCtx.globalCompositeOperation = 'lighter';
    for (const s of stars) {
      const a = s.a * (0.55 + 0.45 * Math.sin(now * 0.0009 * s.sp + s.tw));
      if (a <= 0.02) continue;
      bgCtx.fillStyle = 'rgba(226,235,255,' + a.toFixed(3) + ')';
      const x = s.x * W + Math.sin(now * 0.00008 + s.tw) * 3;
      const y = s.y * H + Math.cos(now * 0.00006 + s.tw) * 3;
      bgCtx.fillRect(x, y, s.s, s.s);
    }
    bgCtx.globalAlpha = 1;
  }

  function drawDust(now) {
    bgCtx.globalCompositeOperation = 'lighter';
    const t = now * 0.001;
    const cx = W / 2;
    const cy = H * 0.52;
    for (const d of dust) {
      const a = d.a + t * d.sp;
      const r = d.r * Math.min(W, H) * (1 + Math.sin(t * 0.4 + d.ph) * 0.03);
      const x = cx + Math.cos(a) * r * 1.35;
      const y = cy + Math.sin(a) * r * 0.42 + Math.sin(t * 0.6 + d.ph) * 18;
      const alpha = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.7 + d.ph));
      bgCtx.fillStyle = 'rgba(200,205,255,' + alpha.toFixed(3) + ')';
      bgCtx.fillRect(x, y, d.s, d.s);
    }
    bgCtx.globalAlpha = 1;
  }

  function drawRings(now) {
    const reveal = state.reveal;
    if (reveal <= 0.15) return;
    const ease = easeOutCubic(clamp((reveal - 0.15) / 0.85, 0, 1));
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.85;
    for (const ring of rings) {
      const rot = now * 0.001 * ring.sp + ring.phase + state.yaw * 0.6;
      const n = ring.n;
      const baseColor = RING_COLORS[ring.ci][2];
      const dimColor = RING_COLORS[ring.ci][1];
      for (let i = 0; i < n; i++) {
        const a = rot + (i / n) * TAU * 3;
        const jitter = Math.sin(i * 12.9898 + ring.phase) * 0.02;
        const x = Math.cos(a) * (ring.r + jitter);
        const z = Math.sin(a) * (ring.r + jitter);
        const y = ring.y + Math.sin(a * 2 + ring.phase) * 0.05;
        const pr = project(x, y, z);
        if (pr.x < -20 || pr.x > W + 20 || pr.y < -20 || pr.y > H + 20) continue;
        const tw = 0.5 + 0.5 * Math.sin(now * 0.002 + i * 1.7 + ring.phase);
        ctx.fillStyle = pr.z > 0.2 ? baseColor : dimColor;
        const s = (0.6 + tw * 1.2) * pr.k * clamp(state.zoom, 0.7, 1.5) * ease;
        ctx.fillRect(pr.x, pr.y, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  function particleColor(colors, ci, z) {
    const bucket = z > 0.42 ? 3 : z > -0.35 ? 2 : z > -1.1 ? 1 : 0;
    return colors[ci % colors.length][bucket];
  }

  function drawCakeSolid(reveal) {
    const tiers = [
      { r: 1.04, y0: -0.58, y1: -0.05 },
      { r: 0.72, y0: -0.05, y1: 0.4 },
    ];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // plate
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * TAU;
      const p = project(Math.cos(a) * 1.2, -0.63, Math.sin(a) * 1.2);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(232,201,138,0.035)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,201,138,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (const t of tiers) {
      const top = [];
      const bot = [];
      const N = 48;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * TAU;
        top.push(project(Math.cos(a) * t.r, t.y1, Math.sin(a) * t.r));
        bot.push(project(Math.cos(a) * t.r, t.y0, Math.sin(a) * t.r));
      }
      const topY = top.reduce((s, p) => s + p.y, 0) / top.length;
      const botY = bot.reduce((s, p) => s + p.y, 0) / bot.length;
      const g = ctx.createLinearGradient(0, topY, 0, botY);
      g.addColorStop(0, hexToRgba(palette.cake[2], 0.018));
      g.addColorStop(0.5, hexToRgba(palette.cake[1], 0.008));
      g.addColorStop(1, hexToRgba(palette.cake[0], 0));
      ctx.beginPath();
      top.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();

      // top surface / icing rim
      const tc = project(0, t.y1, 0);
      const gg = ctx.createRadialGradient(tc.x, tc.y, 0, tc.x, tc.y, t.r * SCALE * state.zoom);
      gg.addColorStop(0, hexToRgba(palette.cake[3], 0.05));
      gg.addColorStop(0.75, hexToRgba(palette.cake[2], 0.025));
      gg.addColorStop(1, hexToRgba(palette.cake[2], 0));
      ctx.beginPath();
      top.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.fillStyle = gg;
      ctx.fill();

      ctx.strokeStyle = hexToRgba(palette.cake[3], 0.1);
      ctx.lineWidth = 4;
      ctx.beginPath();
      top.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();
      ctx.strokeStyle = hexToRgba(palette.cake[3], 0.36);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      top.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();

      ctx.strokeStyle = hexToRgba(palette.cake[2], 0.2);
      ctx.lineWidth = 1;
      ctx.beginPath();
      bot.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();
    }

    // soft crown of the domed cream
    const crown = project(0, 0.5, 0);
    const cr = 0.46 * SCALE * state.zoom;
    const cg = ctx.createRadialGradient(crown.x, crown.y - cr * 0.25, 0, crown.x, crown.y, cr);
    cg.addColorStop(0, hexToRgba(palette.cake[3], 0.05));
    cg.addColorStop(0.6, hexToRgba(palette.cake[2], 0.02));
    cg.addColorStop(1, hexToRgba(palette.cake[2], 0));
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(crown.x, crown.y, cr, cr * 0.72, 0, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawCake(now) {
    if (state.reveal <= 0.001) return;
    const reveal = state.reveal;
    ctx.globalCompositeOperation = 'lighter';
    const ctr = project(0, 0.05, 0);
    const aura = SCALE * 1.75 * state.zoom * clamp(reveal, 0, 1);
    ctx.globalAlpha = 0.055 * reveal;
    ctx.drawImage(glowSprites[2], ctr.x - aura, ctr.y - aura, aura * 2, aura * 2);
    if (state.candlesLit) {
      ctx.globalAlpha = 0.12 * reveal;
      ctx.drawImage(glowSprites[4], ctr.x - aura * 0.58, ctr.y - aura * 0.58, aura * 1.16, aura * 1.16);
    }
    ctx.globalAlpha = 1;
    drawCakeSolid(reveal);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const ap = clamp((reveal - p.appear) / 0.55, 0, 1);
      if (ap <= 0) continue;
      const e = easeOutCubic(ap);
      const wx = lerp(p.ox, p.x, e);
      const wy = lerp(p.oy, p.y, e);
      const wz = lerp(p.oz, p.z, e);
      const pr = project(wx, wy, wz);
      if (pr.x < -30 || pr.x > W + 30 || pr.y < -30 || pr.y > H + 30) continue;
      const tw = 0.72 + 0.28 * Math.sin(now * 0.0018 + p.tw);
      const s = clamp(p.s * pr.k * tw * (W < 700 ? 1.4 : 1.2), 0.55, 4.8);
      ctx.fillStyle = particleColor(CAKE_COLORS, p.ci, pr.z);
      ctx.fillRect(pr.x, pr.y, s, s);
      if (p.ci >= 3 && p.seed > 0.86 && ap > 0.7) {
        const g = glowSprites[p.ci % glowSprites.length];
        const gs = s * (4.4 + tw * 2.5) * e;
        ctx.globalAlpha = 0.42 * ap;
        ctx.drawImage(g, pr.x - gs / 2, pr.y - gs / 2, gs, gs);
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawText(now) {
    if (!state.textTargetsBuilt) return;
    const elapsed = now - state.morphStart;
    const globalT = clamp(elapsed / 1500, 0, 1);
    state.morph = globalT;
    // soft glow behind the letters
    if (globalT > 0.2 && textGlowCanvas.width > 2) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = clamp((globalT - 0.2) / 0.8, 0, 1) * 0.5;
      ctx.drawImage(textGlowCanvas, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    if (globalT >= 1 && textCacheReady && textCache) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.94 + 0.06 * Math.sin(now * 0.0018);
      ctx.drawImage(textCache, 0, 0, W, H);
      ctx.globalAlpha = 1;
      // a handful of live twinkles keep the settled text breathing
      for (let i = 0; i < particles.length; i += 41) {
        const p = particles[i];
        if (typeof p.tx !== 'number') continue;
        const tw = 0.5 + 0.5 * Math.sin(now * 0.0024 + p.tw);
        if (tw < 0.45) continue;
        const x = p.tx + Math.sin(now * 0.0009 + p.seed * 9) * 1.8;
        const y = p.ty + Math.cos(now * 0.0008 + p.seed * 11) * 1.8;
        const s = 0.9 + tw * 1.6;
        ctx.fillStyle = TEXT_COLORS[p.tci][3];
        ctx.fillRect(x, y, s, s);
        if (tw > 0.86) {
          const gs = s * 6;
          ctx.globalAlpha = 0.3 * tw;
          ctx.drawImage(textGlowSprites[p.tci % 4], x - gs / 2, y - gs / 2, gs, gs);
          ctx.globalAlpha = 1;
        }
      }
      return;
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const delay = p.seed * 0.3;
      let t = clamp((elapsed / 1250 - delay) / 0.72, 0, 1);
      if (t < 0) continue;
      t = easeInOutCubic(t);
      const arc = Math.sin(t * Math.PI) * (p.seed - 0.5) * 90;
      const arcY = Math.cos(t * Math.PI * 0.9) * (p.seed - 0.5) * 44;
      const fx = typeof p.fx === 'number' ? p.fx : W / 2;
      const fy = typeof p.fy === 'number' ? p.fy : H / 2;
      let x = lerp(fx, p.tx, t) + arc * (1 - t * 0.25);
      let y = lerp(fy, p.ty, t) + arcY * (1 - t);
      if (t > 0.98) {
        x += Math.sin(now * 0.0011 + p.seed * 9) * 1.2;
        y += Math.cos(now * 0.0009 + p.seed * 11) * 1.2;
      }
      const tw = 0.72 + 0.28 * Math.sin(now * 0.002 + p.tw);
      const s = lerp(p.s, p.tci === 3 ? 1.55 : 1.15, t) * (0.85 + tw * 0.4);
      const colorSet = t > 0.42 ? TEXT_COLORS : CAKE_COLORS;
      const ci = t > 0.42 ? p.tci : p.ci;
      ctx.fillStyle = particleColor(colorSet, ci, t > 0.42 ? 0.9 : 0.1);
      ctx.fillRect(x, y, s, s);
      if (t > 0.65 && (p.seed > 0.92 || (p.tci === 3 && p.seed > 0.78))) {
        const g = (t > 0.42 ? textGlowSprites : glowSprites)[ci % 4];
        const gs = s * (5 + tw * 3);
        ctx.globalAlpha = 0.38 * t;
        ctx.drawImage(g, x - gs / 2, y - gs / 2, gs, gs);
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalAlpha = 1;
    if (globalT >= 1 && !textCacheReady) buildTextCache();
  }

  function drawCountdown(now, dt) {
    if (!cd.active) return;
    // ghost digit
    ctx.globalCompositeOperation = 'lighter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 ' + cd.fontSize + 'px ' + FONT_STACK;
    ctx.fillStyle = hexToRgba(palette.text[2], 0.035);
    ctx.fillText(cd.digit, W / 2, H * 0.47);
    const f = Math.min(2.2, dt * 60);
    for (const p of cd.particles) {
      p.vx += (p.tx - p.x) * 0.034 * f;
      p.vy += (p.ty - p.y) * 0.034 * f;
      p.vx *= Math.pow(0.875, f);
      p.vy *= Math.pow(0.875, f);
      p.x += p.vx * f;
      p.y += p.vy * f;
      const tw = 0.65 + 0.35 * Math.sin(now * 0.003 + p.ph);
      const s = p.s * (0.85 + tw * 0.5);
      ctx.fillStyle = particleColor(p.ci === 4 ? CAKE_COLORS : TEXT_COLORS, p.ci === 4 ? 4 : p.ci, 0.5);
      ctx.fillRect(p.x, p.y, s, s);
      if (p.ci >= 3 && Math.sin(now * 0.002 + p.ph * 3) > 0.3) {
        const g = glowSprites[4];
        const gs = s * 5;
        ctx.globalAlpha = 0.32;
        ctx.drawImage(g, p.x - gs / 2, p.y - gs / 2, gs, gs);
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawCandles(now) {
    if (!candles.length) return;
    const reveal = state.reveal;
    if (reveal < 0.35) return;
    const vis = clamp((reveal - 0.35) / 0.5, 0, 1);
    state.flameHits = [];
    // wicks (dark, source-over so they read against the glow)
    ctx.globalCompositeOperation = 'source-over';
    for (const c of candles) {
      const base = project(c.x, c.baseY + c.h, c.z);
      if (!base) continue;
      const top = project(c.x, c.baseY + c.h + 0.045, c.z);
      ctx.strokeStyle = 'rgba(48,35,22,' + (0.75 * vis).toFixed(2) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(top.x, top.y);
      ctx.stroke();
      state.flameHits.push({ x: base.x, y: base.y - 10, r: 34, idx: state.flameHits.length });
    }
    // flames
    ctx.globalCompositeOperation = 'lighter';
    for (const c of candles) {
      const base = project(c.x, c.baseY + c.h, c.z);
      const top = project(c.x, c.baseY + c.h + 0.055, c.z);
      const lit = c.lit;
      if (lit) {
        const flick = 0.86 + 0.18 * Math.sin(now * 0.017 + c.seed * 7) + 0.08 * Math.sin(now * 0.041 + c.seed * 2);
        const w = 30 * flick * base.k * clamp(state.zoom, 0.7, 1.4);
        const h = 54 * flick * base.k * clamp(state.zoom, 0.7, 1.4);
        // halo
        const halo = 86 * base.k;
        ctx.globalAlpha = 0.3 * vis;
        ctx.drawImage(glowSprites[4], top.x - halo, top.y - halo, halo * 2, halo * 2);
        ctx.globalAlpha = 1;
        ctx.drawImage(flameSprite, top.x - w / 2, top.y - h + 6, w, h);
        // tiny sparks
        for (let i = 0; i < 3; i++) {
          const a = now * 0.004 + c.seed + i * 2.1;
          const sx = top.x + Math.sin(a) * 5;
          const sy = top.y - 12 - ((now * 0.03 + i * 14) % 26);
          ctx.fillStyle = 'rgba(255,220,150,' + (0.35 * vis).toFixed(2) + ')';
          ctx.fillRect(sx, sy, 1.2, 1.2);
        }
      } else {
        // ember + a little warm promise at the wick
        const a = 0.25 + 0.2 * Math.sin(now * 0.004 + c.seed);
        const halo = 30 * base.k;
        ctx.globalAlpha = 0.1 * vis;
        ctx.drawImage(glowSprites[4], top.x - halo, top.y - halo, halo * 2, halo * 2);
        ctx.globalAlpha = a * vis;
        ctx.drawImage(glowSprites[4], base.x - 8, base.y - 18, 16, 16);
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawSmoke(now, dt) {
    if (!smoke.length) return;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      s.age += dt;
      if (s.age > s.life) { smoke.splice(i, 1); continue; }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy *= Math.pow(0.55, dt);
      s.vx *= Math.pow(0.5, dt);
      const k = s.age / s.life;
      s.size += 26 * dt;
      ctx.globalAlpha = (1 - k) * 0.42;
      ctx.drawImage(smokeSprite, s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawFireworks(now, dt) {
    if (!fwParticles.length) return;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = fwParticles.length - 1; i >= 0; i--) {
      const p = fwParticles[i];
      p.age += dt;
      if (p.age >= p.life) { fwParticles.splice(i, 1); continue; }
      p.px = p.x;
      p.py = p.y;
      p.vx *= Math.pow(0.42, dt);
      p.vy = p.vy * Math.pow(0.42, dt) + 120 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = Math.pow(1 - p.age / p.life, 1.4);
      ctx.strokeStyle = hexToRgba(p.color, a * 0.9);
      ctx.lineWidth = p.s;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      if (p.s > 1.4) {
        ctx.fillStyle = hexToRgba('#fff8ec', a * 0.7);
        ctx.fillRect(p.x - 0.6, p.y - 0.6, 1.4, 1.4);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawMeteors(now, intensity) {
    if (reduceMotion) return;
    ctx.globalCompositeOperation = 'lighter';
    const dt = 0.016;
    for (const m of meteors) {
      m.x -= m.sp * 0.42 * dt;
      m.y += m.sp * dt;
      if (m.y > H + 160 || m.x < -200) {
        m.x = rand(0.1, 1.15) * W + 120;
        m.y = rand(-0.5, 0.25) * H;
        m.sp = rand(120, 340);
        m.len = rand(50, 170);
      }
      ctx.strokeStyle = 'rgba(220,230,255,' + (m.a * intensity).toFixed(3) + ')';
      ctx.lineWidth = m.w;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x + m.len * 0.42, m.y - m.len);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,' + (m.a * intensity * 1.6).toFixed(3) + ')';
      ctx.fillRect(m.x, m.y, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------------------------------------------------
     18. update loop
     --------------------------------------------------------- */
  let lastT = 0;

  function update(now, dt) {
    if (!state.dragging) {
      if (state.phase === 'cake') state.yaw += dt * 0.055;
      state.yaw += state.spinVel * dt;
      state.spinVel *= Math.pow(0.18, dt);
    }
    state.cardOrbit += dt * 0.095;
    state.zoom += (state.zoomTarget - state.zoom) * Math.min(1, dt * 6);
    if (state.revealStart) state.reveal = clamp((now - state.revealStart) / 1600, 0, 1);
    if (state.phase === 'text') {
      state.morph = clamp((now - state.morphStart) / 1500, 0, 1);
      if (now > state.nextFw) {
        state.nextFw = now + rand(1300, 2500);
        spawnBurst(W * rand(0.18, 0.82), H * rand(0.16, 0.42), Math.random() < 0.45 ? 'heart' : pick(FW_TYPES), Math.random() < 0.4);
      }
    }
    updateCards(now);
  }

  function draw(now, dt) {
    updateCamera();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    drawBackground(now);
    drawStars(now);
    drawDust(now);

    if (state.phase === 'landing') return;
    if (state.phase === 'countdown') {
      drawCountdown(now, dt);
      drawMeteors(now, 0.3);
      return;
    }
    if (state.phase === 'cake') {
      drawRings(now);
      drawCake(now);
      drawCandles(now);
      drawSmoke(now, dt);
      drawFireworks(now, dt);
      drawMeteors(now, 0.35);
      return;
    }
    if (state.phase === 'text') {
      drawText(now);
      drawSmoke(now, dt);
      drawFireworks(now, dt);
      drawMeteors(now, 1);
    }
  }

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    update(now, dt);
    draw(now, dt);
  }

  /* ---------------------------------------------------------
     19. input / events
     --------------------------------------------------------- */
  const pointers = new Map();
  let pinchStart = 0;
  let pinchZoom = 1;

  interactEl.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const arr = Array.from(pointers.values());
      pinchStart = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
      pinchZoom = state.zoomTarget;
    }
    state.dragging = true;
    state.dragMoved = false;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.spinVel = 0;
    document.body.classList.add('dragging');
    try { interactEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });

  interactEl.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const arr = Array.from(pointers.values());
      const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
      if (pinchStart > 0) state.zoomTarget = clamp(pinchZoom * (d / pinchStart), 0.7, 1.8);
      return;
    }
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) state.dragMoved = true;
    if (state.phase === 'cake' || state.phase === 'text') {
      state.yaw += dx * 0.0052;
      state.pitch = clamp(state.pitch + dy * 0.0028, -0.32, 0.62);
      state.spinVel = dx * 0.12;
    }
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.pointerX = e.clientX;
    state.pointerY = e.clientY;
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = 0;
    if (pointers.size === 0) {
      state.dragging = false;
      document.body.classList.remove('dragging');
      if (!state.dragMoved) handleTap(e.clientX, e.clientY);
    }
  }
  interactEl.addEventListener('pointerup', endPointer);
  interactEl.addEventListener('pointercancel', endPointer);
  interactEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.zoomTarget = clamp(state.zoomTarget * (1 - e.deltaY * 0.0011), 0.7, 1.8);
  }, { passive: false });

  function handleTap(x, y) {
    if (state.phase === 'cake') {
      for (const hit of state.flameHits) {
        if (Math.hypot(hit.x - x, hit.y - y) < hit.r) {
          if (state.candlesLit) {
            blowCandles();
          } else {
            lightOne(hit.idx);
          }
          return;
        }
      }
      // small stardust
      for (let i = 0; i < 10; i++) {
        fwParticles.push({
          x, y, px: x, py: y,
          vx: rand(-50, 50), vy: rand(-70, -10),
          age: 0, life: rand(0.4, 1.0), s: rand(0.7, 1.4),
          color: pick(palette.fire),
        });
      }
      AudioKit.chime(1320, 0.18, 0.025);
    } else if (state.phase === 'text') {
      spawnBurst(x, y, Math.random() < 0.4 ? 'heart' : pick(FW_TYPES), false);
    }
  }

  enterBtn.addEventListener('click', startExperience);
  wishBtn.addEventListener('click', handleWishAction);
  editBtn.addEventListener('click', openDrawer);

  soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    soundBtn.classList.toggle('muted', !state.sound);
    if (state.sound) {
      AudioKit.init();
      if (config.music) AudioKit.playMusic(600);
      showToast('声音已开启');
    } else {
      AudioKit.stopMusic(250);
      showToast('声音已关闭');
    }
  });

  fullBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen && document.exitFullscreen().catch(() => {});
    }
  });

  setBtn.addEventListener('click', openDrawer);
  closeSet.addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  saveSet.addEventListener('click', saveSettings);
  resetSet.addEventListener('click', resetSettings);

  themeSeg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-theme]');
    if (!b) return;
    draftTheme = b.dataset.theme;
    $$('button', themeSeg).forEach((x) => x.classList.toggle('on', x === b));
  });
  paletteSeg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-palette]');
    if (!b) return;
    draftPalette = b.dataset.palette;
    $$('button', paletteSeg).forEach((x) => x.classList.toggle('on', x === b));
  });

  lbClose.addEventListener('click', closePhoto);
  lbPrev.addEventListener('click', () => navigatePhoto(-1));
  lbNext.addEventListener('click', () => navigatePhoto(1));
  lightbox.addEventListener('click', (e) => {
    if (lbSwiped) return;
    if (e.target === lightbox || e.target.classList.contains('lb-stars')) closePhoto();
  });

  // swipe left / right to move through the memory cards
  let lbSwipeX = null;
  let lbSwipeY = null;
  let lbSwiped = false;
  lightbox.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    lbSwipeX = e.clientX;
    lbSwipeY = e.clientY;
  });
  window.addEventListener('pointerup', (e) => {
    if (lbSwipeX === null || !state.lbOpen) return;
    const dx = e.clientX - lbSwipeX;
    const dy = e.clientY - lbSwipeY;
    lbSwipeX = null;
    lbSwipeY = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      lbSwiped = true;
      navigatePhoto(dx < 0 ? 1 : -1);
      setTimeout(() => { lbSwiped = false; }, 350);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (state.lbOpen) {
      if (e.key === 'Escape') { closePhoto(); return; }
      if (e.key === 'ArrowLeft') { navigatePhoto(-1); return; }
      if (e.key === 'ArrowRight') { navigatePhoto(1); return; }
    }
    if (e.key === 'Escape') {
      if (state.drawOpen) closeDrawer();
    }
  });

  window.addEventListener('resize', () => {
    resize();
    setTimeout(() => { resize(); }, 80);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      AudioKit.stopMusic(0);
    } else if (config.music && state.sound) {
      AudioKit.playMusic(1200);
    }
  });

  /* ---------------------------------------------------------
     20. boot
     --------------------------------------------------------- */
  applyPalette();
  buildCards();
  buildShape();
  refreshCopy();
  setPhase('landing');
  resize();
  updateCards(performance.now());
  // make sure the initial chapter copy is not inherited from a text phase
  setChapter('cake');
  defaultTip();

  requestAnimationFrame((t) => {
    lastT = t;
    loop(t);
  });

  // Small debug surface, useful when tweaking the card in a browser console.
  window.__stardust = {
    state,
    get particles() { return particles; },
    get layout() { return textLayout; },
    sampleText,
    sampleCanvas,
    sampleCtx,
    rebuildText: buildTextTargets,
    rebuildShape: buildShape,
  };
})();
