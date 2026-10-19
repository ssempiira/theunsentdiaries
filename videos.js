/* =========================================================
   VIDEO ARCHIVE: the only file you edit to add videos.
   ========================================================= */
const VIDEO_SETTINGS = {
  channelName: "Clarity Room",
  channelUrl: "https://www.youtube.com/@clarityroom-cr",
  uploadsPlaylist: "UUChctDc93QEPkKkosL8rIDQ", // channel's uploads (used until you feature a video)
  categories: ["Motivation", "Psychology", "Life Lessons", "Spoken Word", "Personal Growth", "Short Reflections"],
  intro: "Spoken reflections on resilience, solitude and becoming, from the Clarity Room channel."
};
/* One block per video. id = the 11 characters after v= in the YouTube link.
   featured: true on ONE video. date and duration are optional. Every block ends with a comma. */
const VIDEOS = [
  // { id: "XXXXXXXXXXX", title: "Title", description: "One or two lines.", category: "Motivation", featured: true, date: "Oct 2026", duration: "4:12", order: 1 },
];

/* =========================================================
   CODE: no need to edit below
   ========================================================= */
(() => {
  "use strict";
  const S = VIDEO_SETTINGS;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* Inject the section before Contact, and the nav link after Archive */
  const sec = el("section", "block"); sec.id = "videos"; sec.setAttribute("aria-labelledby", "vid-h");
  sec.innerHTML = '<div class="wrap"><div class="sec-head"><h2 id="vid-h">The Video Archive</h2>' +
    '<a class="link-arrow" id="v-channel" target="_blank" rel="noopener noreferrer">Visit the YouTube channel</a></div>' +
    '<p class="v-intro" id="v-intro"></p><div id="v-feat"></div>' +
    '<div class="tools" style="margin-top:44px"><div class="search"><input id="v-q" type="search" placeholder="Search videos by title or topic…" aria-label="Search videos" autocomplete="off"></div>' +
    '<div class="chips" id="v-chips" role="group" aria-label="Filter videos by category"></div></div>' +
    '<p class="ui count" id="v-count" aria-live="polite"></p><div class="v-grid" id="v-grid"></div></div>';
  const contact = $("#contact");
  if (!contact) return;
  contact.before(sec);
  const nav = $("#nav-list"), li = el("li"), nl = el("a", "", "Videos");
  nl.href = "#/videos"; li.append(nl);
  const arch = nav && nav.querySelector('a[href="#/archive"]');
  arch ? arch.parentNode.after(li) : nav && nav.append(li);

  $("#v-channel").href = S.channelUrl; $("#v-intro").textContent = S.intro;
  const vFeat = $("#v-feat"), vGrid = $("#v-grid"), vCount = $("#v-count"), vChips = $("#v-chips"), vQ = $("#v-q");
  const vs = { q: "", cat: "All" };
  const validId = id => /^[\w-]{11}$/.test(id || "");
  const mkFrame = (src, title) => {
    const f = el("iframe"); f.src = src; f.title = title; f.loading = "lazy"; f.allowFullscreen = true;
    f.allow = "accelerometer; encrypted-media; picture-in-picture; fullscreen";
    f.referrerPolicy = "strict-origin-when-cross-origin"; return f;
  };
  function player(v) {   // click-to-load: no iframe until play is pressed
    const box = el("div", "vp"), b = el("button", "vp-play"); b.type = "button";
    b.setAttribute("aria-label", "Play video: " + v.title);
    const img = el("img"); img.alt = ""; img.loading = "lazy"; img.width = 480; img.height = 360;
    const bad = () => box.replaceChildren(el("p", "vp-msg", "This video can’t be previewed here. It may be private, removed or restricted. Try opening it on YouTube."));
    img.onload = () => { if (img.naturalWidth <= 120) bad(); };
    img.onerror = bad;
    img.src = "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg";
    b.onclick = () => box.replaceChildren(mkFrame("https://www.youtube-nocookie.com/embed/" + v.id + "?autoplay=1&rel=0", v.title));
    box.append(img, b); return box;
  }
  const vMeta = v => { const m = el("div", "v-meta ui"); [v.category, v.duration, v.date].filter(Boolean).forEach(t => m.append(el("span", "", t))); return m; };
  const watch = v => { const a = el("a", "yt", "Watch on YouTube"); a.href = "https://www.youtube.com/watch?v=" + v.id; a.target = "_blank"; a.rel = "noopener noreferrer"; return a; };
  const good = VIDEOS.filter(v => validId(v.id)).sort((a, b) => (a.order || 99) - (b.order || 99));
  ["All", ...(S.categories || [])].forEach(c => {
    const b = el("button", "chip", c); b.type = "button"; b.setAttribute("aria-pressed", c === "All");
    b.onclick = () => { vs.cat = c; render(); }; vChips.append(b);
  });
  vQ.addEventListener("input", () => { vs.q = vQ.value; render(); });
  function render() {
    [...vChips.children].forEach(b => b.setAttribute("aria-pressed", b.textContent === vs.cat));
    const fv = good.find(v => v.featured);
    vFeat.replaceChildren();
    if (fv) { const w = el("div", "v-feat"); w.append(player(fv), vMeta(fv), el("h3", "", fv.title), el("p", "", fv.description || ""), watch(fv)); vFeat.append(w); }
    else { const box = el("div", "vp"); box.append(mkFrame("https://www.youtube-nocookie.com/embed/videoseries?list=" + S.uploadsPlaylist, "Latest uploads from " + S.channelName)); vFeat.append(box); }
    const terms = vs.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const out = good.filter(v => v !== fv && (vs.cat === "All" || v.category === vs.cat) &&
      terms.every(t => [v.title, v.description, v.category].join(" ").toLowerCase().includes(t)));
    vGrid.replaceChildren();
    out.forEach(v => { const c = el("article", "v-card"); c.append(player(v), vMeta(v), el("h3", "", v.title), el("p", "", v.description || ""), watch(v)); vGrid.append(c); });
    if (!out.length) vGrid.append(el("p", "v-empty", good.length ? "No videos match that yet." : "Individual videos will be listed here once they are added. Meanwhile, the player above plays the channel’s latest uploads."));
    vCount.textContent = good.length ? out.length + (out.length === 1 ? " video" : " videos") : "";
  }

  /* Routing: make #/videos scroll to the section and highlight the nav link */
  function go() {
    const on = location.hash === "#/videos";
    if (on) nl.setAttribute("aria-current", "true"); else nl.removeAttribute("aria-current");
    if (on && !$("#home").hidden) setTimeout(() => sec.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 60);
  }
  addEventListener("hashchange", go);
  render(); go();
})();
