/* Peptra landing page — chromatogram rendering and waitlist submission. */
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
      ctx.fillText(String(y), padL - 8, gy);
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

    ctx.textAlign = "left";
    ctx.fillText("mAU", 6, padT - 4);

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
   * Waitlist
   * ------------------------------------------------------------------ */

  /* Kept in step with EMAIL_RE in server/store.js — the server is still the
     authority, this only saves a round trip. */
  var EMAIL_RE =
    /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

  /* Swapped out in the Artifact build, which writes to the artifact store
     instead of this origin's API. */
  var submitSignup = window.PEPTRA_SUBMIT || function (payload) {
    return fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) {
          var err = new Error(body.error || "Request failed");
          err.status = res.status;
          throw err;
        }
        return body;
      });
    });
  };

  function setStatus(el, state, message) {
    if (!el) return;
    el.textContent = message;
    el.setAttribute("data-state", state);
    el.hidden = false;
  }

  function wireForm(formId, emailId, submitId, statusId, source) {
    var form = document.getElementById(formId);
    if (!form) return;

    var emailEl = document.getElementById(emailId);
    var submitEl = document.getElementById(submitId);
    var statusEl = document.getElementById(statusId);
    var contextEl = form.querySelector('select[name="context"]');
    var honeypotEl = form.querySelector('input[name="company"]');
    var busy = false;

    emailEl.addEventListener("input", function () {
      emailEl.removeAttribute("aria-invalid");
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (busy) return;

      var email = (emailEl.value || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        emailEl.setAttribute("aria-invalid", "true");
        emailEl.focus();
        setStatus(statusEl, "error", "That address doesn't look complete — check for a typo and try again.");
        return;
      }

      busy = true;
      submitEl.setAttribute("aria-busy", "true");
      var originalLabel = submitEl.textContent;
      submitEl.textContent = "Adding…";
      setStatus(statusEl, "pending", "Adding you to the list…");

      submitSignup({
        email: email,
        context: contextEl ? contextEl.value : "",
        company: honeypotEl ? honeypotEl.value : "",
        source: source
      }).then(function (result) {
        form.reset();
        var state = result && result.state;

        if (state === "already_confirmed") {
          setStatus(statusEl, "ok", "You're already on the list" +
            (result.position ? " at position #" + result.position : "") + ". Nothing more to do.");
        } else if (state === "pending") {
          setStatus(statusEl, "ok", (result.resent ? "We've sent that link again" : "Check your inbox") +
            " — confirm at " + email + " and your place is held. " +
            "Nothing is reserved until you do.");
        } else if (result && result.duplicate) {
          setStatus(statusEl, "ok", "You're already on the list" +
            (result.position ? " at position #" + result.position : "") + ". Nothing more to do.");
        } else if (result && result.position) {
          setStatus(statusEl, "ok", "You're on the list at position #" + result.position +
            ". We'll email " + email + " when founding accounts open.");
        } else {
          setStatus(statusEl, "ok", "You're on the list. We'll email " + email + " when founding accounts open.");
        }
      }).catch(function (error) {
        if (error && error.status === 429) {
          setStatus(statusEl, "error", "Too many attempts from this connection. Give it a minute and try again.");
        } else if (error && error.status === 502) {
          setStatus(statusEl, "error", "We saved your details but the confirmation email didn't send. Try again in a moment.");
        } else if (error && error.code === "read_only") {
          setStatus(statusEl, "error", "This preview is read-only for your account, so the signup wasn't saved.");
        } else {
          setStatus(statusEl, "error", "We couldn't reach the waitlist just now. Try again, or email hello@peptra.com.");
        }
      }).then(function () {
        busy = false;
        submitEl.removeAttribute("aria-busy");
        submitEl.textContent = originalLabel;
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Copy the contact address (links to mail clients are unreliable)
   * ------------------------------------------------------------------ */

  function initCopyEmail() {
    var button = document.getElementById("copy-email");
    var address = document.getElementById("contact-address");
    if (!button || !address) return;

    button.addEventListener("click", function () {
      var text = address.textContent.trim();
      var done = function () {
        button.textContent = "Copied";
        setTimeout(function () { button.textContent = "Copy"; }, 1800);
      };
      var fallback = function () {
        var range = document.createRange();
        range.selectNodeContents(address);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        button.textContent = "Select & copy";
        setTimeout(function () { button.textContent = "Copy"; }, 2400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    });
  }

  function init() {
    initChromatogram();
    initCopyEmail();
    wireForm("hero-form", "hero-email", "hero-submit", "hero-status", "hero");
    wireForm("waitlist-form", "wl-email", "wl-submit", "wl-status", "waitlist-section");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
