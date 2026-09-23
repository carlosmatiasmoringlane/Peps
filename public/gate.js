/**
 * Runs in <head>, before the body paints.
 *
 * A returning visitor who has already confirmed should never see the gate
 * flash. Deferring this to the main script would paint the overlay first
 * and then remove it, which looks broken and is worse than useless on the
 * one screen every visitor meets first.
 *
 * Kept out of app.js deliberately: this must block rendering, and app.js
 * must not.
 */
(function () {
  "use strict";

  // Bump to require everyone to confirm again — e.g. if the wording of the
  // confirmations changes.
  var KEY = "peptra.gate.v1";

  try {
    if (window.localStorage && window.localStorage.getItem(KEY)) {
      document.documentElement.setAttribute("data-gate", "passed");
    }
  } catch (error) {
    // Private windows and blocked site data throw on access. Failing here
    // means the gate shows, which is the correct direction to fail.
  }
})();
