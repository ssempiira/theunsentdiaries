/* The Amethyst Mind: scroll-driven 3D layer (Three.js r128).
   Load AFTER three.min.js and AFTER your main site <script>, so POEMS is available.
   The camera descends through a field of amethyst crystals as you scroll.
   Poem lines float in the dark; click one to open that piece. */
(() => {
  "use strict";
  if (!window.THREE) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;
  const home = document.getElementById("home"), reader = document.getElementById("reader");
  if (!home || !reader) return;
  const small = innerWidth < 720;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { return; }                                   // no WebGL: the normal site simply stays as is
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement; cv.id = "scene3d"; cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xF7F1E7, 10, 52);
  const camera = new THREE.PerspectiveCamera(55, 1, .1, 120);
  const amb = new THREE.AmbientLight(0xffffff, .9);
  const dir = new THREE.DirectionalLight(0xffffff, .7); dir.position.set(5, 8, 6);
  const glow = new THREE.PointLight(0xBDA6D2, .5, 32);
  scene.add(amb, dir, glow);

  let seed = 7;
  const rand = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  /* The route the camera travels */
  const curve = new THREE.CatmullRomCurve3([
    [0, .5, 14], [1.5, .8, 4], [-2, 0, -8], [2.5, -.8, -20], [-2, .6, -32], [1, 0, -44], [0, 0, -56]
  ].map(a => new THREE.Vector3(...a)));

  /* Crystals */
  const PAL = [0x72578A, 0x8A6FA6, 0xBDA6D2, 0x5A4372, 0x9C84B5];
  const mats = PAL.map(c => new THREE.MeshStandardMaterial({ color: c, flatShading: true, transparent: true, opacity: .7, roughness: .28, metalness: .15, emissive: 0x2a1a3a, emissiveIntensity: 0 }));
  const shardGeo = new THREE.OctahedronGeometry(1, 0), edgeGeo = new THREE.EdgesGeometry(shardGeo);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x3C2C49, transparent: true, opacity: .28 });
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x72578A, transparent: true, opacity: .45 });
  const shard = (mat, sx, sy, edges) => {
    const m = new THREE.Mesh(shardGeo, mat); m.scale.set(sx, sy, sx);
    if (edges) m.add(new THREE.LineSegments(edgeGeo, lineMat));
    return m;
  };

  /* Opening centrepiece: a cluster of shards with two thin rings */
  const hero = new THREE.Group();
  [[0, 0, 0, 1.1, 3.2, 0, 0], [1.5, -.6, .4, .7, 2.1, .3, .4], [-1.4, -.4, -.3, .75, 2.3, -.25, -.3], [.6, .9, -.8, .55, 1.6, .5, .2], [-.7, 1, .5, .5, 1.4, -.4, .5]]
    .forEach(([x, y, z, sx, sy, rz, rx], i) => { const m = shard(mats[i % 5], sx, sy, true); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); hero.add(m); });
  [[Math.PI / 2.4, 0], [Math.PI / 3, 1.1]].forEach(([rx, rz]) => { const r = new THREE.Mesh(new THREE.TorusGeometry(3.6, .014, 6, 120), ringMat); r.rotation.set(rx, 0, rz); hero.add(r); });
  scene.add(hero);

  /* Closing centrepiece, waiting at the end of the route */
  const finale = new THREE.Group();
  [[0, 0, 0, 1.8, 5, 0, 0], [3, -1, 1, 1.1, 3.2, .35, .3], [-3, -.8, .5, 1.2, 3.6, -.3, -.3]]
    .forEach(([x, y, z, sx, sy, rz, rx], i) => { const m = shard(mats[(i + 2) % 5], sx, sy, true); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); finale.add(m); });
  finale.position.set(0, 0, -66); scene.add(finale);

  /* Field of crystals along the route, kept to the sides so text stays readable */
  const field = [], N = small ? 34 : 72;
  for (let i = 0; i < N; i++) {
    const p = curve.getPoint(.06 + rand() * .9), side = rand() < .5 ? -1 : 1;
    const m = shard(mats[i % 5], .35 + rand() * .7, .9 + rand() * 1.9, i % 3 === 0);
    m.position.set(p.x + side * (5 + rand() * 8), p.y + (rand() - .5) * 12, p.z + (rand() - .5) * 6);
    m.rotation.set(rand() * 6, rand() * 6, rand() * 6);
    m.userData = { spin: (rand() - .5) * .5, y0: m.position.y, f: .3 + rand() * .5, ph: rand() * 6.28 };
    scene.add(m); field.push(m);
  }

  /* Dust */
  const PN = small ? 500 : 1400, pos = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) { pos[i * 3] = (rand() - .5) * 44; pos[i * 3 + 1] = (rand() - .5) * 26; pos[i * 3 + 2] = 18 - rand() * 86; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.PointsMaterial({ size: .11, transparent: true, opacity: .75, depthWrite: false, color: 0x72578A });
  const dust = new THREE.Points(pg, pm); scene.add(dust);

  /* Floating lines from your poems. Click one to open its piece. */
  const sprites = [], SW = 1024, SH = 128;
  const items = [];
  if (typeof POEMS !== "undefined") POEMS.forEach((p, pi) => {
    const c = p.text.split("\n").map(s => s.trim().replace(/[*_]/g, "")).filter(s => s.length >= 24 && s.length <= 52);
    if (c.length) items.push({ id: p.id, text: c[(pi * 3) % c.length] });
  });
  const step = Math.max(1, Math.floor(items.length / 14));
  items.filter((_, i) => i % step === 0).slice(0, 14).forEach((it, i, arr) => {
    const c = document.createElement("canvas"); c.width = SW; c.height = SH;
    const tex = new THREE.CanvasTexture(c);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: .42, depthWrite: false }));
    s.scale.set(7, 7 * SH / SW, 1);
    const p = curve.getPoint(.1 + .85 * i / Math.max(1, arr.length - 1)), side = i % 2 ? 1 : -1;
    s.position.set(p.x + side * (3.2 + rand() * 3.5), p.y + (rand() - .5) * 5, p.z - rand() * 2);
    s.userData = { id: it.id, text: it.text, c, tex, y0: s.position.y, ph: rand() * 6.28, op: .42 };
    scene.add(s); sprites.push(s);
  });
  function paint(s, color) {
    const { c, text, tex } = s.userData, g = c.getContext("2d"); let size = 54;
    g.clearRect(0, 0, SW, SH); g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = color;
    do { g.font = 'italic 400 ' + size + 'px "Cormorant Garamond",Georgia,serif'; size -= 2; } while (g.measureText(text).width > SW - 48 && size > 20);
    g.fillText(text, SW / 2, SH / 2); tex.needsUpdate = true;
  }

  /* Light and dark follow your existing theme button */
  const T = {
    light: { fog: 0xF7F1E7, amb: .9, dir: .7, pt: .5, emi: 0, op: .7, line: 0x3C2C49, lineOp: .28, part: 0x72578A, partOp: .75, text: "#3C2C49", ring: 0x72578A },
    dark: { fog: 0x2F2239, amb: .55, dir: .9, pt: 1.3, emi: .55, op: .62, line: 0xE7D8C5, lineOp: .4, part: 0xE7D8C5, partOp: .7, text: "#E7D8C5", ring: 0xBDA6D2 }
  };
  function theme() {
    const t = T[root.dataset.theme === "dark" ? "dark" : "light"];
    scene.fog.color.setHex(t.fog); amb.intensity = t.amb; dir.intensity = t.dir; glow.intensity = t.pt;
    mats.forEach(m => { m.emissiveIntensity = t.emi; m.opacity = t.op; });
    lineMat.color.setHex(t.line); lineMat.opacity = t.lineOp; ringMat.color.setHex(t.ring);
    pm.color.setHex(t.part); pm.opacity = t.partOp;
    sprites.forEach(s => paint(s, t.text));
  }
  new MutationObserver(theme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  theme();
  if (document.fonts && document.fonts.load) document.fonts.load('italic 400 54px "Cormorant Garamond"').then(theme, () => {});

  /* Scroll position -> position along the route, section by section */
  let ys = [0, 1, 2, 3]; const ts = [0, .34, .66, 1];
  function measure() {
    if (home.hidden) return;
    const top = id => document.getElementById(id).getBoundingClientRect().top + scrollY;
    const max = Math.max(4, root.scrollHeight - innerHeight);
    ys = [0, top("featured") - innerHeight * .4, top("archive") - innerHeight * .4, max];
    for (let i = 1; i < 4; i++) ys[i] = Math.max(ys[i], ys[i - 1] + 1);
  }
  const tFromScroll = y => { for (let i = 1; i < 4; i++) if (y <= ys[i]) return ts[i - 1] + (ts[i] - ts[i - 1]) * Math.max(0, (y - ys[i - 1]) / (ys[i] - ys[i - 1])); return 1; };

  let heroY = .3;
  function layout() {
    const w = innerWidth, h = innerHeight, wide = w / h > 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    heroY = wide ? .3 : 3.4; hero.position.set(wide ? 5.6 : .4, heroY, 0); hero.scale.setScalar(wide ? 1 : .7);
    measure();
  }
  addEventListener("resize", layout);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(home);

  /* Pointer: parallax, hover and click on floating lines */
  const ndc = new THREE.Vector2(0, 0), ray = new THREE.Raycaster();
  let moved = false, overUI = false, hovered = null;
  const isUI = t => !!(t && t.closest && t.closest("a,button,input,textarea,label,select,summary,[role=button]"));
  const pick = () => { ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(sprites, false); return h.length ? h[0].object : null; };
  addEventListener("pointermove", e => { ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); moved = true; overUI = isUI(e.target); }, { passive: true });
  addEventListener("click", e => {
    if (!reader.hidden || isUI(e.target)) return;
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const s = pick(); if (s) location.hash = "#/poem/" + s.userData.id;
  });

  /* Scroll cue */
  const hint = document.createElement("div"); hint.className = "dive ui"; hint.setAttribute("aria-hidden", "true"); hint.textContent = "Scroll to descend";
  document.body.append(hint);

  /* Frame loop */
  let cur = 0, target = 0, velS = 0, sx = 0, sy = 0, skip = false, last = performance.now(), time = 0, wasReading = null;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, .05); last = now;
    if (document.hidden) return;
    const reading = !reader.hidden;
    if (reading !== wasReading) {
      cv.classList.toggle("dim", reading); sprites.forEach(s => { s.visible = !reading; });
      hint.classList.toggle("off", reading || scrollY > 80); wasReading = reading;
    }
    if (reading) { skip = !skip; if (skip) return; } else { target = tFromScroll(scrollY); hint.classList.toggle("off", scrollY > 80); }
    time += dt;

    const prev = cur; cur += (target - cur) * Math.min(1, dt * 4);
    velS += ((cur - prev) / Math.max(dt, .001) - velS) * .1;
    sx += (ndc.x - sx) * Math.min(1, dt * 3); sy += (ndc.y - sy) * Math.min(1, dt * 3);

    const u = cur * .975, pp = curve.getPoint(u), pl = curve.getPoint(Math.min(1, u + .03));
    camera.position.set(pp.x + sx * 1.1, pp.y + sy * .7, pp.z);
    camera.lookAt(pl.x + sx * .5, pl.y + sy * .3, pl.z);
    camera.rotateZ(THREE.MathUtils.clamp(-velS * .25, -.08, .08));
    glow.position.copy(camera.position);

    const boost = 1 + Math.min(Math.abs(velS) * 30, 6);
    hero.rotation.y = time * .12 + cur * 5; hero.rotation.x = Math.sin(time * .3) * .05 + sy * .1;
    hero.position.y = heroY + Math.sin(time * .6) * .2;
    finale.rotation.y = time * .1;
    for (const m of field) { m.rotation.y += m.userData.spin * dt * boost; m.position.y = m.userData.y0 + Math.sin(time * m.userData.f + m.userData.ph) * .35; }
    dust.rotation.y = Math.sin(time * .05) * .08;

    if (!reading) {
      if (moved) { moved = false; hovered = overUI ? null : pick(); document.body.style.cursor = hovered ? "pointer" : ""; }
      for (const s of sprites) {
        s.position.y = s.userData.y0 + Math.sin(time * .5 + s.userData.ph) * .25;
        const want = s === hovered ? .95 : s.userData.op;
        s.material.opacity += (want - s.material.opacity) * Math.min(1, dt * 8);
      }
    }
    renderer.render(scene, camera);
  }
  layout();
  requestAnimationFrame(t => { last = t; cv.classList.add("on"); frame(t); });
})();
