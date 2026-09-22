/* Peptra landing page — chromatogram rendering and copy-to-clipboard. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * Chromatogram
   *
   * The trace and the integration table in the markup come from the same
   * four peaks. Gaussian area is h * w * sqrt(2*pi); the purity figure is
   * the main peak's share of total area, so the drawing and the number
   * can never drift apart.
   * ------------------------------------------------------------------ */

  var PEAKS = [
    { rt: 3.15, h: 3.6,   w: 0.09 },
    { rt: 7.12, h: 2.4,   w: 0.10 },
    { rt: 8.42, h: 620.0, w: 0.13, main: true },
    { rt: 9.61, h: 0.9,   w: 0.09 }
  ];

  var X_MIN = 0, X_MAX = 12;      // retention time, minutes
  var Y_MIN = 0, Y_MAX = 800;     // detector response, mAU (headroom above the main peak)
  var ZOOM = 50;                  // magnification of the inset impurity trace

  function signalAt(x) {
    var y = 1.6 + 0.35 * Math.sin(x * 0.55);   // gentle baseline drift
    for (var i = 0; i < PEAKS.length; i++) {
      var p = PEAKS[i];
      var d = (x - p.rt) / p.w;
      y += p.h * Math.exp(-0.5 * d * d);
    }
    return y;
  }

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function drawChromatogram(canvas, sweepX) {
    var box = canvas.parentNode;
    var cssW = box.clientWidth;
    var cssH = box.clientHeight;
    if (!cssW || !cssH) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }

    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var trace = cssVar("--trace", "#00726E");
    var amber = cssVar("--amber", "#8F5400");
    var faint = cssVar("--ink-faint", "#7D8F90");
    var grid  = cssVar("--rule-soft", "#E3EAE9");

    var padL = 46, padR = 14, padT = 18, padB = 30;
    var plotW = Math.max(10, cssW - padL - padR);
    var plotH = Math.max(10, cssH - padT - padB);

    function px(x) { return padL + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW; }
    function py(y) { return padT + plotH - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH; }

    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    /* grid + axis labels */
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = faint;

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (var y = 0; y <= Y_MAX; y += 200) {
      var gy = Math.round(py(y)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(padL + plotW, gy);
      ctx.stroke();
      // The unit takes the place of the topmost number, which would
      // otherwise collide with it at the corner of the plot.
      ctx.fillText(y === Y_MAX ? "mAU" : String(y), padL - 8, gy);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (var t = X_MIN; t <= X_MAX; t += 2) {
      var gx = Math.round(px(t)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, padT + plotH);
      ctx.lineTo(gx, padT + plotH + 4);
      ctx.stroke();
      ctx.fillText(t === X_MAX ? "min" : String(t), gx, padT + plotH + 7);
    }

    /* clip everything that follows to the plot area so the magnified
       trace runs off the top the way it does on a real detector readout */
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();

    var step = (X_MAX - X_MIN) / Math.max(240, Math.round(plotW * 2));

    /* magnified impurity trace (x50), drawn behind the main trace */
    ctx.strokeStyle = amber;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    for (var xa = X_MIN, penA = false; xa <= X_MAX; xa += step) {
      var ya = signalAt(xa) * ZOOM;
      if (ya > Y_MAX) { penA = false; continue; }   // off-scale: lift the pen, as a detector readout does
      if (penA) ctx.lineTo(px(xa), py(ya));
      else { ctx.moveTo(px(xa), py(ya)); penA = true; }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    /* main trace */
    ctx.strokeStyle = trace;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (var xb = X_MIN, firstB = true; xb <= X_MAX; xb += step) {
      var yb = signalAt(xb);
      if (firstB) { ctx.moveTo(px(xb), py(yb)); firstB = false; }
      else { ctx.lineTo(px(xb), py(yb)); }
    }
    ctx.stroke();

    /* main peak marker */
    var mp = PEAKS[2];
    var mx = px(mp.rt);
    var my = py(signalAt(mp.rt));
    ctx.strokeStyle = trace;
    ctx.globalAlpha = 0.45;
    ctx.setLineDash([2, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx, my - 6);
    ctx.lineTo(mx, padT + 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    ctx.fillStyle = trace;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("8.42", mx, padT + 2);

    /* detector sweep, shown once on load */
    if (typeof sweepX === "number") {
      var sx = px(sweepX);
      var g = ctx.createLinearGradient(sx - 26, 0, sx, 0);
      g.addColorStop(0, "rgba(127,127,127,0)");
      g.addColorStop(1, trace);
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = g;
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(sx - 13, padT);
      ctx.lineTo(sx - 13, padT + plotH);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    /* x50 legend */
    ctx.fillStyle = amber;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("×" + ZOOM + " impurity trace", padL + 6, padT + plotH - 4);
  }

  function initChromatogram() {
    var canvas = document.getElementById("chromatogram");
    if (!canvas || !canvas.getContext) return;

    var redraw = function () { drawChromatogram(canvas); };

    /* The complete trace is the resting state — it is painted before any
       animation, so a first frame or thumbnail is never half-drawn. */
    redraw();

    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      var start = null;
      var DURATION = 900;
      var tick = function (ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / DURATION);
        drawChromatogram(canvas, X_MIN + p * (X_MAX - X_MIN));
        if (p < 1) requestAnimationFrame(tick);
        else redraw();
      };
      requestAnimationFrame(tick);
    }

    if (window.ResizeObserver) {
      new ResizeObserver(redraw).observe(canvas.parentNode);
    } else {
      window.addEventListener("resize", redraw);
    }

    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", redraw);
      else if (mq.addListener) mq.addListener(redraw);
    }
    new MutationObserver(redraw).observe(document.documentElement, {
      attributes: true, attributeFilter: ["data-theme"]
    });
  }

  /* ------------------------------------------------------------------ *
   * Copy an address
   *
   * mailto: links are unreliable — plenty of people have no mail client
   * wired up, and the click silently does nothing. Showing the address as
   * selectable text with a copy button always works.
   * ------------------------------------------------------------------ */

  function initCopyButtons() {
    document.addEventListener("click", function (event) {
      var button = event.target.closest ? event.target.closest("[data-copy]") : null;
      if (!button) return;

      var source = document.getElementById(button.getAttribute("data-copy"));
      if (!source) return;

      var text = source.textContent.trim();
      var label = button.textContent;

      var restore = function (message, delay) {
        button.textContent = message;
        setTimeout(function () { button.textContent = label; }, delay);
      };

      var selectInstead = function () {
        var range = document.createRange();
        range.selectNodeContents(source);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        restore("Select & copy", 2400);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          restore("Copied", 1800);
        }, selectInstead);
      } else {
        selectInstead();
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Catalogue filtering
   *
   * The rows are in the HTML, so the table is complete and readable before
   * any of this runs. This only hides rows.
   * ------------------------------------------------------------------ */

  function initCatalogue() {
    var search = document.getElementById("cat-search");
    var warehouse = document.getElementById("cat-warehouse");
    var inStock = document.getElementById("cat-instock");
    var count = document.getElementById("cat-count");
    var empty = document.getElementById("cat-empty");
    var body = document.getElementById("cat-body");
    if (!search || !body) return;

    var rows = [].slice.call(body.querySelectorAll(".cat-row"));

    function apply() {
      var term = search.value.trim().toLowerCase();
      var wh = warehouse.value === "" ? -1 : Number(warehouse.value);
      var stockOnly = inStock.checked;
      var shown = 0;

      rows.forEach(function (row) {
        var stock = row.getAttribute("data-stock");
        var matchesTerm = !term || row.getAttribute("data-search").indexOf(term) !== -1;
        var matchesWarehouse = wh === -1 || stock.charAt(wh) === "1";
        var matchesStock = !stockOnly || stock.indexOf("1") !== -1;
        var visible = matchesTerm && matchesWarehouse && matchesStock;
        row.hidden = !visible;
        if (visible) shown += 1;
      });

      count.textContent = shown === rows.length
        ? rows.length + " of " + rows.length + " products"
        : shown + " of " + rows.length + " products";
      empty.hidden = shown !== 0;
    }

    search.addEventListener("input", apply);
    warehouse.addEventListener("change", apply);
    inStock.addEventListener("change", apply);
    apply();
  }

  function init() {
    initChromatogram();
    initCatalogue();
    initCopyButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
