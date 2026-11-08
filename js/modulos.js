(function () {
  const MODULOS = [
    "js/post-clic.js?v=1",
    "js/autor-enlace.js?v=2",
    "js/comentarios-reaccion.js?v=1",
    "js/comentarios-menu.js?v=2",
    "js/feed-reposts.js?v=1",
    "js/fijar-post.js?v=1",
    "js/citas.js?v=2",
    "js/enlace-obra.js?v=1"
  ];

  MODULOS.forEach(function (ruta) {
    const script = document.createElement("script");
    script.src = ruta;
    document.head.appendChild(script);
  });
})();
