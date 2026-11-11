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

  /* Opening centrepiece: a glittering amethyst flower that blooms open */
  const hero = new THREE.Group(), flower = new THREE.Group(); hero.add(flower);
  const petalMats = [0x6B4F85, 0x8A6FA6, 0xB39BCB, 0xD9C8EA].map(c => new THREE.MeshStandardMaterial({ color: c, flatShading: true, transparent: true, opacity: .9, roughness: .14, metalness: .3, emissive: 0x3a2150, emissiveIntensity: .1 }));
  const LAYERS = [
    { n: 8, len: 3.0, w: .55, open: 1.2, rot: 0, d: 0 },
    { n: 8, len: 2.5, w: .5, open: .9, rot: Math.PI / 8, d: .15 },
    { n: 6, len: 1.9, w: .42, open: .6, rot: .3, d: .3 },
    { n: 5, len: 1.3, w: .32, open: .28, rot: .6, d: .45 }
  ];
  const hinges = [];
  LAYERS.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      const pivot = new THREE.Group(); pivot.rotation.y = L.rot + i / L.n * Math.PI * 2;
      const hinge = new THREE.Group(); pivot.add(hinge);
      const m = new THREE.Mesh(shardGeo, petalMats[li]); m.scale.set(L.w, L.len, L.w * .45); m.position.y = L.len * .92;
      m.add(new THREE.LineSegments(edgeGeo, lineMat)); hinge.add(m); flower.add(pivot);
      hinges.push({ h: hinge, open: L.open, d: L.d, ph: rand() * 6.28 });
    }
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 0), new THREE.MeshStandardMaterial({ color: 0xF3E9FF, flatShading: true, emissive: 0xBDA6D2, emissiveIntensity: 1.1, roughness: .2 }));
  flower.add(core);
  const stMat = new THREE.MeshStandardMaterial({ color: 0xE7D8C5, flatShading: true, emissive: 0xE7D8C5, emissiveIntensity: .5, roughness: .3 });
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2, st = new THREE.Mesh(shardGeo, stMat);
    st.scale.set(.07, .34, .07); st.position.set(Math.cos(a) * .55, .35, Math.sin(a) * .55);
    st.rotation.set(Math.sin(a) * .5, 0, -Math.cos(a) * .5); flower.add(st);
  }
  /* Glitter: twinkling four-point stars around the bloom */
  const GN = small ? 90 : 190, gp = new Float32Array(GN * 3), gph = new Float32Array(GN);
  for (let i = 0; i < GN; i++) {
    const th = rand() * 6.28, q = Math.acos(2 * rand() - 1), r = 1.2 + rand() * 3.6;
    gp[i * 3] = r * Math.sin(q) * Math.cos(th); gp[i * 3 + 1] = r * Math.cos(q) * .7 + 1; gp[i * 3 + 2] = r * Math.sin(q) * Math.sin(th); gph[i] = rand();
  }
  const gg = new THREE.BufferGeometry();
  gg.setAttribute("position", new THREE.BufferAttribute(gp, 3)); gg.setAttribute("ph", new THREE.BufferAttribute(gph, 1));
  const glitter = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { t: { value: 0 }, pr: { value: renderer.getPixelRatio() }, col: { value: new THREE.Color(0x7A47C4) } },
    vertexShader: "attribute float ph;uniform float t;uniform float pr;varying float a;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);a=pow(.5+.5*sin(t*2.+ph*40.),6.);gl_PointSize=(.5+2.*a)*150.*pr/-mv.z;gl_Position=projectionMatrix*mv;}",
    fragmentShader: "uniform vec3 col;varying float a;void main(){vec2 c=gl_PointCoord-.5;float s=max(0.,1.-length(c)*2.);float x=max(0.,1.-abs(c.x)*16.)*max(0.,1.-abs(c.y)*2.);float y=max(0.,1.-abs(c.y)*16.)*max(0.,1.-abs(c.x)*2.);gl_FragColor=vec4(col,(s*s*.5+x+y)*a);}"
  });
  flower.add(new THREE.Points(gg, glitter));
  const sparkLight = new THREE.PointLight(0xffffff, 1.4, 22);   /* roams over the petals so the facets catch light */
  scene.add(hero, sparkLight);

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
    const p = curve.getPoint(.2 + .75 * i / Math.max(1, arr.length - 1)), side = i % 2 ? 1 : -1;
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
    light: { fog: 0xF7F1E7, amb: .9, dir: .7, pt: .5, emi: 0, op: .7, line: 0x3C2C49, lineOp: .28, part: 0x72578A, partOp: .75, text: "#3C2C49", ring: 0x72578A, glit: 0x7A47C4 },
    dark: { fog: 0x2F2239, amb: .55, dir: .9, pt: 1.3, emi: .55, op: .62, line: 0xE7D8C5, lineOp: .4, part: 0xE7D8C5, partOp: .7, text: "#E7D8C5", ring: 0xBDA6D2, glit: 0xFFF1FF }
  };
  function theme() {
    const t = T[root.dataset.theme === "dark" ? "dark" : "light"];
    scene.fog.color.setHex(t.fog); amb.intensity = t.amb; dir.intensity = t.dir; glow.intensity = t.pt;
    mats.forEach(m => { m.emissiveIntensity = t.emi; m.opacity = t.op; });
    lineMat.color.setHex(t.line); lineMat.opacity = t.lineOp; ringMat.color.setHex(t.ring);
    pm.color.setHex(t.part); pm.opacity = t.partOp;
    petalMats.forEach(m => { m.emissiveIntensity = t.emi + .12; }); glitter.uniforms.col.value.setHex(t.glit);
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
    const cam0 = camera.clone(); cam0.position.set(0, .5, 14); cam0.lookAt(curve.getPoint(.03)); cam0.updateMatrixWorld(); cam0.updateProjectionMatrix();
    const aim = new THREE.Vector3(wide ? .7 : 0, wide ? .4 : .66, .5).unproject(cam0).sub(cam0.position).normalize();
    hero.position.copy(cam0.position).addScaledVector(aim, 14); heroY = hero.position.y; hero.scale.setScalar(wide ? .8 : .55);
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
    const s = pick(); if (s && cur > .12) location.hash = "#/poem/" + s.userData.id;
  });

  /* Scroll cue */
  const hint = document.createElement("div"); hint.className = "dive ui"; hint.setAttribute("aria-hidden", "true"); hint.textContent = "Scroll to descend";
  document.body.append(hint);

  /* Frame loop */
  let bloom = 0, cur = 0, target = 0, velS = 0, sx = 0, sy = 0, skip = false, last = performance.now(), time = 0, wasReading = null;
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
    bloom = Math.min(1, bloom + dt * .3);
    const ease = x => x * x * (3 - 2 * x);
    for (const p of hinges) { const b = ease(Math.min(1, Math.max(0, bloom * 1.5 - p.d))); p.h.rotation.z = -(.12 + (p.open - .12) * b) + Math.sin(time * .8 + p.ph) * .03 * b; }
    flower.rotation.y = time * .1 + cur * 4; hero.rotation.x = 1.0 + Math.sin(time * .3) * .04 + sy * .12; hero.rotation.y = sx * .25;
    core.scale.setScalar(.9 + Math.sin(time * 1.6) * .1);
    glitter.uniforms.t.value = time;
    sparkLight.position.set(hero.position.x + Math.cos(time * .7) * 4 + sx * 3, hero.position.y + Math.sin(time * .9) * 3 + sy * 3, 5);
    hero.position.y = heroY + Math.sin(time * .6) * .2;
    finale.rotation.y = time * .1;
    for (const m of field) { m.rotation.y += m.userData.spin * dt * boost; m.position.y = m.userData.y0 + Math.sin(time * m.userData.f + m.userData.ph) * .35; }
    dust.rotation.y = Math.sin(time * .05) * .08;

    if (!reading) {
      if (moved) { moved = false; hovered = overUI || cur < .12 ? null : pick(); document.body.style.cursor = hovered ? "pointer" : ""; }
      for (const s of sprites) {
        s.position.y = s.userData.y0 + Math.sin(time * .5 + s.userData.ph) * .25;
        const fade = Math.min(1, Math.max(0, (cur - .1) / .1)), want = s === hovered ? .95 : s.userData.op * fade;
        s.material.opacity += (want - s.material.opacity) * Math.min(1, dt * 8);
      }
    }
    renderer.render(scene, camera);
  }
  layout();
  requestAnimationFrame(t => { last = t; cv.classList.add("on"); frame(t); });
})();
