/* The Amethyst Mind: kinetic words (Three.js r128).
   Load AFTER three.min.js and AFTER your main site <script> (it reads POEMS).
   Poem lines drift in 3D depth at the edges of the page and write themselves in
   as the camera approaches. Click a line to open its piece.
   Also animates: the hero tagline (ink-in) and each poem's lines as you read. */
(() => {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;
  const home = document.getElementById("home"), reader = document.getElementById("reader"), piece = document.getElementById("piece");
  if (!home || !reader) return;

  /* ---------- 1. Hero tagline writes itself in, letter by letter ---------- */
  const tg = document.getElementById("tagline");
  if (tg && tg.textContent.trim() && !tg.dataset.split) {
    const txt = tg.textContent; tg.dataset.split = "1"; tg.setAttribute("aria-label", txt); tg.textContent = "";
    let n = 0;
    txt.split(" ").forEach((w, wi, arr) => {
      const word = document.createElement("span"); word.className = "tword"; word.setAttribute("aria-hidden", "true");
      [...w].forEach(ch => { const s = document.createElement("span"); s.className = "ink"; s.textContent = ch; s.style.animationDelay = (.8 + n++ * .06) + "s"; word.append(s); });
      tg.append(word); if (wi < arr.length - 1) tg.append(" ");
    });
  }

  /* ---------- 2. Poems write in line by line as you read ---------- */
  if (piece && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15, rootMargin: "0px 0px -6% 0px" });
    const writeIn = () => {
      const prose = piece.querySelector(".prose"); if (!prose || prose.dataset.w) return; prose.dataset.w = "1";
      const verse = prose.classList.contains("verse");
      prose.querySelectorAll("p").forEach(p => {
        if (verse) {
          const lines = p.textContent.split("\n").map(x => x.trim()).filter(Boolean); p.textContent = "";
          lines.forEach((l, i) => { const s = document.createElement("span"); s.className = "ln"; s.style.transitionDelay = (i * .14) + "s"; s.textContent = l; p.append(s); });
          p.classList.add("wr", "vs");
        } else p.classList.add("wr");
        io.observe(p);
      });
    };
    new MutationObserver(writeIn).observe(piece, { childList: true }); writeIn();
  }

  /* ---------- 3. The 3D word field ---------- */
  if (!window.THREE) return;
  const small = innerWidth < 720;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: "high-performance" }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement; cv.id = "scene3d"; cv.setAttribute("aria-hidden", "true"); document.body.prepend(cv);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, 1, .1, 120);

  let seed = 11;
  const rand = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  /* Pick evocative lines from your poems */
  let items = [];
  if (typeof POEMS !== "undefined") POEMS.forEach(p => {
    const c = p.text.split("\n").map(s => s.trim().replace(/[*_]/g, "")).filter(s => s.length >= 20 && s.length <= 58);
    [.3, .7].forEach(f => { const l = c[Math.floor(c.length * f)]; if (l && !items.some(x => x.text === l)) items.push({ id: p.id, text: l }); });
  });
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
  items = items.slice(0, small ? 18 : 34);

  const SW = 1024, SH = 128, SPACING = 4.6, geo = new THREE.PlaneGeometry(8, 8 * SH / SW);
  const VS = "varying vec2 vUv;varying float vD;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vD=-mv.z;gl_Position=projectionMatrix*mv;}";
  const FS = "uniform sampler2D map;uniform float op;uniform float prog;uniform float tf;varying vec2 vUv;varying float vD;" +
    "void main(){vec4 c=texture2D(map,vUv);float u=(vUv.x-(.5-tf*.5))/tf;float w=1.-smoothstep(prog-.12,prog,u);" +
    "float f=(1.-smoothstep(20.,50.,vD))*smoothstep(4.,12.,vD);gl_FragColor=vec4(c.rgb,c.a*w*f*op);}";
  const lines = [];
  items.forEach((it, i) => {
    const c = document.createElement("canvas"); c.width = SW; c.height = SH;
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexShader: VS, fragmentShader: FS,
      uniforms: { map: { value: tex }, op: { value: .5 }, prog: { value: 0 }, tf: { value: 1 } } });
    const m = new THREE.Mesh(geo, mat), side = i % 2 ? 1 : -1;
    m.scale.setScalar(.85 + rand() * .5);
    m.position.set(side * (6 + rand() * 5), (rand() - .5) * 8, 8 - i * SPACING);
    m.rotation.y = -side * .3;
    m.userData = { id: it.id, text: it.text, c, tex, u: mat.uniforms, y0: m.position.y, ph: rand() * 6.28, kind: i % 3 === 0, base: .5 };
    scene.add(m); lines.push(m);
  });
  const zEnd = 8 - Math.max(1, lines.length) * SPACING - 8;

  function paint(m, color) {
    const { c, text, tex, u } = m.userData, g = c.getContext("2d"); let size = 56;
    g.clearRect(0, 0, SW, SH); g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = color;
    do { g.font = 'italic 400 ' + size + 'px "Cormorant Garamond",Georgia,serif'; size -= 2; } while (g.measureText(text).width > SW - 48 && size > 20);
    u.tf.value = Math.min(1, (g.measureText(text).width + 24) / SW);
    g.fillText(text, SW / 2, SH / 2); tex.needsUpdate = true;
  }
  const T = { light: { text: "#3C2C49", acc: "#72578A", op: .5 }, dark: { text: "#E7D8C5", acc: "#BDA6D2", op: .58 } };
  function theme() {
    const t = T[root.dataset.theme === "dark" ? "dark" : "light"];
    lines.forEach(m => { m.userData.base = t.op; paint(m, m.userData.kind ? t.acc : t.text); });
  }
  new MutationObserver(theme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  theme();
  if (document.fonts && document.fonts.load) document.fonts.load('italic 400 56px "Cormorant Garamond"').then(theme, () => {});

  /* Scroll -> distance travelled, section by section */
  let ys = [0, 1, 2, 3]; const ts = [0, .34, .66, 1];
  function measure() {
    if (home.hidden) return;
    const top = id => document.getElementById(id).getBoundingClientRect().top + scrollY;
    const max = Math.max(4, root.scrollHeight - innerHeight);
    ys = [0, top("featured") - innerHeight * .4, top("archive") - innerHeight * .4, max];
    for (let i = 1; i < 4; i++) ys[i] = Math.max(ys[i], ys[i - 1] + 1);
  }
  const tFromScroll = y => { for (let i = 1; i < 4; i++) if (y <= ys[i]) return ts[i - 1] + (ts[i] - ts[i - 1]) * Math.max(0, (y - ys[i - 1]) / (ys[i] - ys[i - 1])); return 1; };
  function layout() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); measure(); }
  addEventListener("resize", layout);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(home);

  /* Pointer: parallax, hover, click */
  const ndc = new THREE.Vector2(0, 0), ray = new THREE.Raycaster();
  let moved = false, overUI = false, hovered = null;
  const isUI = t => !!(t && t.closest && t.closest("a,button,input,textarea,label,select,summary,[role=button]"));
  const pick = () => { ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(lines, false); return h.length ? h[0].object : null; };
  addEventListener("pointermove", e => { ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); moved = true; overUI = isUI(e.target); }, { passive: true });
  addEventListener("click", e => {
    if (!reader.hidden || isUI(e.target)) return;
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const m = pick(); if (m && m.userData.u.prog.value > .5) location.hash = "#/poem/" + m.userData.id;
  });

  const hint = document.createElement("div"); hint.className = "dive ui"; hint.setAttribute("aria-hidden", "true"); hint.textContent = "Scroll to descend";
  document.body.append(hint);

  let cur = 0, velS = 0, sx = 0, sy = 0, last = performance.now(), time = 0, wasReading = null;
  const clamp = THREE.MathUtils.clamp;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, .05); last = now;
    if (document.hidden) return;
    const reading = !reader.hidden;
    if (reading !== wasReading) { cv.classList.toggle("dim", reading); wasReading = reading; }
    if (reading) { hint.classList.add("off"); return; }          /* nothing to draw while a poem is open */
    hint.classList.toggle("off", scrollY > 80);
    time += dt;

    const prev = cur; cur += (tFromScroll(scrollY) - cur) * Math.min(1, dt * 4);
    velS += ((cur - prev) / Math.max(dt, .001) - velS) * .1;
    sx += (ndc.x - sx) * Math.min(1, dt * 3); sy += (ndc.y - sy) * Math.min(1, dt * 3);

    const z = 14 + (zEnd - 14) * cur, x = Math.sin(cur * 7) * 1.1 + sx * 1.1, y = Math.sin(cur * 5) * .5 + sy * .7;
    camera.position.set(x, y, z); camera.lookAt(x * .5, y * .5, z - 12);
    camera.rotateZ(clamp(-velS * .25, -.06, .06));

    if (moved) { moved = false; hovered = overUI ? null : pick(); if (hovered && hovered.userData.u.prog.value < .5) hovered = null; document.body.style.cursor = hovered ? "pointer" : ""; }
    for (const m of lines) {
      const d = z - m.position.z, u = m.userData.u;
      u.prog.value = clamp((50 - d) / 16, 0, 1.2);                       /* writes itself in as you approach */
      m.position.y = m.userData.y0 + Math.sin(time * .4 + m.userData.ph) * .18;
      const want = m === hovered ? 1 : m.userData.base;
      u.op.value += (want - u.op.value) * Math.min(1, dt * 8);
    }
    renderer.render(scene, camera);
  }
  layout();
  requestAnimationFrame(t => { last = t; cv.classList.add("on"); frame(t); });
})();
