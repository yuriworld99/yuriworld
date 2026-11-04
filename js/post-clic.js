(function () {
  // En la página de cada publicación no hace falta: ya estás adentro.
  if (/publicacion\.html$/.test(window.location.pathname)) return;

  const estilo = document.createElement("style");
  estilo.textContent = "article.post { cursor: pointer; }";
  document.head.appendChild(estilo);

  const INTERACTIVOS =
    "a, button, input, textarea, select, label, summary, video, audio, [role='button'], .post-menu, .yw-sugerencias";

  document.addEventListener("click", function (evento) {
    if (evento.defaultPrevented) return;

    const objetivo = evento.target;
    if (!objetivo || !objetivo.closest) return;
    if (objetivo.closest(INTERACTIVOS)) return;

    const tarjeta = objetivo.closest("article.post");
    if (!tarjeta) return;

    const seleccion = window.getSelection ? String(window.getSelection()) : "";
    if (seleccion) return;

    const enlace = tarjeta.querySelector('a.accion[href*="publicacion.html?id="]');
    if (!enlace) return;

    window.location.href = enlace.getAttribute("href");
  });
})();
