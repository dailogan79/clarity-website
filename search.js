// Search the site (David, 24 Nov 2026). The page list is built at publish time (search-index.json); everything runs in the visitor's browser.
(function () {
  var box = document.getElementById("site-search"), out = document.getElementById("search-results");
  if (!box || !out) return;
  var index = null, loading = null;

  function load() {
    if (index) return Promise.resolve(index);
    if (!loading) {
      loading = fetch("search-index.json?v=20").then(function (r) { return r.json(); }).then(function (j) { index = j; return j; });
    }
    return loading;
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function words(q) {
    return q.toLowerCase().split(/[^a-z0-9£%']+/).filter(function (w) { return w.length > 1; });
  }
  function count(hay, w) {
    var n = 0, i = hay.indexOf(w);
    while (i !== -1 && n < 20) { n++; i = hay.indexOf(w, i + w.length); }
    return n;
  }
  function snippet(text, ws) {
    var low = text.toLowerCase(), at = -1, i;
    for (i = 0; i < ws.length; i++) { var k = low.indexOf(ws[i]); if (k !== -1 && (at === -1 || k < at)) at = k; }
    var from = Math.max(0, (at === -1 ? 0 : at) - 50), part = text.substr(from, 150);
    var html = esc(part);
    ws.forEach(function (w) { html = html.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
    return (from > 0 ? "…" : "") + html + (from + 150 < text.length ? "…" : "");
  }
  function search(q) {
    var ws = words(q);
    if (!ws.length) return [];
    return index.map(function (p) {
      var title = p.t.toLowerCase(), heads = p.h.join(" ").toLowerCase(), body = p.x.toLowerCase(), score = 0, ok = true;
      ws.forEach(function (w) {
        var inT = count(title, w), inH = count(heads, w), inB = count(body, w);
        if (!inT && !inH && !inB) ok = false;
        score += inT * 8 + inH * 4 + inB;
      });
      return ok ? { p: p, score: score } : null;
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 6);
  }
  function show(q) {
    var ws = words(q);
    if (!ws.length) { out.hidden = true; out.innerHTML = ""; return; }
    var hits = search(q);
    if (!hits.length) {
      out.innerHTML = '<p>Nothing found for “' + esc(q) + '”. Try another word, or <a href="contact.html" style="display:inline;padding:0;border:0;text-decoration:underline">contact us</a>.</p>';
    } else {
      out.innerHTML = hits.map(function (h) {
        return '<a href="' + h.p.u + '"><strong>' + esc(h.p.t.replace(/\s*[:|\-]\s*Clarity( Cabs UK)?$/, "")) + "</strong><span>" + snippet(h.p.x, ws) + "</span></a>";
      }).join("");
    }
    out.hidden = false;
  }
  box.addEventListener("focus", load);
  box.addEventListener("input", function () { var q = box.value; load().then(function () { show(q); }); });
  box.addEventListener("keydown", function (e) {
    var links = Array.prototype.slice.call(out.querySelectorAll("a[href]")), cur = links.indexOf(document.activeElement);
    if (e.key === "Escape") { out.hidden = true; }
    else if (e.key === "ArrowDown" && links.length) { e.preventDefault(); links[Math.min(cur + 1, links.length - 1)].focus(); }
    else if (e.key === "Enter" && links.length) { e.preventDefault(); location.href = links[0].getAttribute("href"); }
  });
  out.addEventListener("keydown", function (e) {
    var links = Array.prototype.slice.call(out.querySelectorAll("a[href]")), cur = links.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); links[Math.min(cur + 1, links.length - 1)].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); (cur > 0 ? links[cur - 1] : box).focus(); }
    else if (e.key === "Escape") { out.hidden = true; box.focus(); }
  });
  document.addEventListener("click", function (e) { if (!out.contains(e.target) && e.target !== box) out.hidden = true; });
})();
