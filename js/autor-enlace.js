(function () {
  const autor = document.getElementById("detalle-autor");
  if (!autor) return;

  function convertir() {
    if (autor.dataset.ywAutor === "1") return;

    let texto = (autor.textContent || "").trim();
    if (!texto) return;
    autor.dataset.ywAutor = "1";

    let prefijo = "";
    if (/^de\s+/i.test(texto)) {
      prefijo = "de ";
      texto = texto.replace(/^de\s+/i, "");
    }

    const nombres = texto
      .split(/[,;/&]/)
      .map(function (nombre) {
        return nombre.trim();
      })
      .filter(Boolean);
    if (nombres.length === 0) return;

    const fragmento = document.createDocumentFragment();
    if (prefijo) fragmento.appendChild(document.createTextNode(prefijo));

    nombres.forEach(function (nombre, indice) {
      if (indice > 0) fragmento.appendChild(document.createTextNode(", "));
      const enlace = document.createElement("a");
      enlace.href = "autor.html?n=" + encodeURIComponent(nombre);
      enlace.textContent = nombre;
      enlace.style.color = "inherit";
      enlace.style.textDecoration = "underline";
      enlace.title = "Ver las otras obras de " + nombre;
      fragmento.appendChild(enlace);
    });

    autor.replaceChildren(fragmento);
  }

  new MutationObserver(convertir).observe(autor, {
    childList: true,
    characterData: true,
    subtree: true
  });
  convertir();
})();
