(function () {
  const MODULOS = [
    "js/post-clic.js?v=1",
    "js/autor-enlace.js?v=2",
    "js/comentarios-reaccion.js?v=2"
  ];

  MODULOS.forEach(function (ruta) {
    const script = document.createElement("script");
    script.src = ruta;
    document.head.appendChild(script);
  });
})();
