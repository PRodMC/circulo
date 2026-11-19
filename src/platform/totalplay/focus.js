/* TP.focus — FocusManager con navegación espacial (guía §7, §8).
   Considera los elementos [data-focusable] visibles dentro del "scope" actual
   (la app completa, o el modal abierto) y elige el vecino por geometría real,
   así sigue funcionando aunque el layout sea responsivo o se reordene. */
(function (w) {
  var TP = w.TP = w.TP || {};
  var CLS = 'is-focused';

  function rect(el) {
    var r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom,
             cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2 };
  }

  function isVisible(el) {
    if (el.disabled) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  /* Lleva el elemento a la vista ajustando cada contenedor scrolleable. */
  function reveal(el) {
    var p = el.parentNode;
    while (p && p.nodeType === 1) {
      var c = p.classList;
      if (c && (c.contains('rail') || c.contains('scroll-y') || c.contains('modal-box'))) {
        var pr = p.getBoundingClientRect();
        var er = el.getBoundingClientRect();
        if (c.contains('rail')) {
          var px = 32;
          if (er.left < pr.left + px) p.scrollLeft -= (pr.left + px - er.left);
          else if (er.right > pr.right - px) p.scrollLeft += (er.right - (pr.right - px));
        } else {
          var py = 48;
          if (er.top < pr.top + py) p.scrollTop -= (pr.top + py - er.top);
          else if (er.bottom > pr.bottom - py) p.scrollTop += (er.bottom - (pr.bottom - py));
        }
      }
      p = p.parentNode;
    }
  }

  var FM = {
    current: null,
    scope: null,
    onActivate: null,

    setScope: function (el) { this.scope = el || null; },

    candidates: function () {
      var root = this.scope || document;
      var list = root.querySelectorAll('[data-focusable]');
      var out = [];
      for (var i = 0; i < list.length; i++) if (isVisible(list[i])) out.push(list[i]);
      return out;
    },

    inScope: function (el) {
      var root = this.scope || document.body;
      return !!el && root.contains(el) && isVisible(el);
    },

    focus: function (el, opts) {
      if (!el) return;
      if (this.current && this.current !== el) this.current.classList.remove(CLS);
      this.current = el;
      el.classList.add(CLS);
      try { el.focus({ preventScroll: true }); } catch (e) { /* motor sin opciones de focus */ }
      if (!(opts && opts.noReveal)) reveal(el);
    },

    fid: function () { return this.current ? this.current.getAttribute('data-fid') : null; },

    byFid: function (fid) {
      if (!fid) return null;
      var c = this.candidates();
      for (var i = 0; i < c.length; i++) if (c[i].getAttribute('data-fid') === fid) return c[i];
      return null;
    },

    /* Garantiza un foco válido tras re-render/cierre de modal (§7). */
    ensure: function (preferFid, fallbackSelector) {
      if (this.current && this.inScope(this.current) && !preferFid) return;
      var el = this.byFid(preferFid);
      if (!el && fallbackSelector) {
        var root = this.scope || document;
        var f = root.querySelector(fallbackSelector);
        if (f && isVisible(f)) el = f;
      }
      if (!el) el = this.candidates()[0];
      this.focus(el);
    },

    move: function (dir) {
      var cur = this.current;
      if (!cur || !this.inScope(cur)) { this.ensure(); return; }
      var a = rect(cur);
      var c = this.candidates();
      var best = null, bestScore = Infinity, minPrimary = Infinity;
      var pool = [];

      for (var i = 0; i < c.length; i++) {
        var el = c[i];
        if (el === cur) continue;
        var b = rect(el), primary, secondary;
        if (dir === 'right' || dir === 'left') {
          // Movimiento horizontal: solo dentro de la misma "fila" (traslape vertical).
          if (b.bottom <= a.top + 2 || b.top >= a.bottom - 2) continue;
          primary = dir === 'right' ? b.left - a.right : a.left - b.right;
          if ((dir === 'right' && b.cx <= a.cx) || (dir === 'left' && b.cx >= a.cx)) continue;
          secondary = Math.abs(b.cy - a.cy);
        } else {
          primary = dir === 'down' ? b.top - a.bottom : a.top - b.bottom;
          if ((dir === 'down' && b.cy <= a.cy) || (dir === 'up' && b.cy >= a.cy)) continue;
          secondary = Math.abs(b.cx - a.cx);
        }
        if (primary < -8) continue;
        pool.push({ el: el, p: Math.max(primary, 0), s: secondary });
        if (Math.max(primary, 0) < minPrimary) minPrimary = Math.max(primary, 0);
      }

      // Primero la franja más cercana; dentro de ella, el más alineado.
      var band = (dir === 'up' || dir === 'down') ? (a.bottom - a.top) * 0.6 : 400;
      for (var j = 0; j < pool.length; j++) {
        var it = pool[j];
        if (it.p > minPrimary + band) continue;
        var score = it.s + it.p * 0.5;
        if (score < bestScore) { bestScore = score; best = it.el; }
      }
      if (best) this.focus(best);
    },

    activate: function () {
      var el = this.current;
      if (!el) return;
      // Prompt 2: para <a href> navegar con location, no con .click() sintético.
      if (el.tagName === 'A' && el.getAttribute('href')) {
        w.location.href = el.getAttribute('href');
        return;
      }
      if (this.onActivate) this.onActivate(el);
    }
  };

  TP.focus = FM;
})(window);
