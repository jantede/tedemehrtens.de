/* Theme initialisation — must load synchronously before first paint.
 * This file is kept for reference; the minified equivalent is inlined in
 * _includes/header.html to guarantee zero-FOUC with no network round-trip.
 * The inline script's SHA-256 hash is declared in _headers (script-src). */
(function () {
  var c = localStorage.getItem('theme-mode');
  // Validate stored value — only 'light' and 'dark' are valid; anything else → auto
  var mode = (c === 'light' || c === 'dark') ? c : 'auto';
  // 'auto' is represented by *absence* of a storage entry
  if (mode === 'auto') { localStorage.removeItem('theme-mode'); }
  var sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = (mode === 'auto') ? sys : mode;
}());
