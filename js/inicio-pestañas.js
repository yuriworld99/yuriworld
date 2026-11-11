(function () {
  const lista = document.getElementById("lista-recomendaciones");
  if (!lista || typeof cargarRecomendaciones !== "function") return;

  const SECCIONES = [
    { valor: "lecturas", etiqueta: "Lecturas" },
    { valor: "videojuegos", etiqueta: "Videojuegos" },
    { valor: "peliculas", etiqueta: "Películas" },
    { valor: "oneshot", etiqueta: "OneShot" },
    { valor: "doujin", etiqueta: "Doujin" },
    { valor: "fanart", etiqueta: "Fanart" }
  ];

  const titulo = document.getElementById("recomendaciones");
  const textoTituloInicial = titulo ? titulo.textContent : "";

  const nav = document.createElement("nav");
  nav.className = "sec-pestanas";
  nav.setAttribute("aria-label", "Secciones");

  SECCIONES.forEach(function (seccion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "sec-pestana" + (seccion.valor === "lecturas" ? " activa" : "");
    boton.dataset.seccion = seccion.valor;
    boton.textContent = seccion.etiqueta;
    nav.appendChild(boton);
  });

  lista.insertAdjacentElement("beforebegin", nav);
  document.body.dataset.seccion = "lecturas";

  function elegir(valor) {
    document.body.dataset.seccion = valor;

    nav.querySelectorAll(".sec-pestana").forEach(function (boton) {
      boton.classList.toggle("activa", boton.dataset.seccion === valor);
    });

    if (titulo) {
      if (valor === "lecturas") {
        titulo.textContent = textoTituloInicial;
      } else {
        const seccion = SECCIONES.find(function (s) {
          return s.valor === valor;
        });
        titulo.textContent = "Últimos en " + (seccion ? seccion.etiqueta : valor);
      }
    }

    cargarRecomendaciones(valor);
  }

  nav.addEventListener("click", function (evento) {
    const boton = evento.target.closest(".sec-pestana");
    if (!boton || boton.classList.contains("activa")) return;
    elegir(boton.dataset.seccion);
  });
})();
