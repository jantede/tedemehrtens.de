/* 404 constellation init — deferred, loaded after constellation.js */
(function () {
  const canvas = document.getElementById('errorCanvas');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!canvas || typeof window.createConstellation !== 'function') return;

  window.createConstellation({
    canvas,
    nodeCount: 65,
    maxEdge: 120,
    revealRadius: 200,
    ghostNode: 0.06,
    ghostEdge: 0.04,
    reduceMotion,
    colorResolver: () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      return dark ? [88, 166, 255] : [9, 105, 218];
    },
  });
}());
