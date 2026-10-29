(function () {
  // IMPORTANTE: cambiá este email por el correo de contacto que querés mostrar.
  const CORREO_CONTACTO = "yuriworld.avisos@gmail.com";

  const ENLACES = [
    ["Reglas", "legal.html#reglas"],
    ["Términos", "legal.html#terminos"],
    ["Privacidad", "legal.html#privacidad"]
  ];

  function ponerIcono() {
    if (document.querySelector('link[rel="icon"]')) return;
    const icono = document.createElement("link");
    icono.rel = "icon";
    icono.type = "image/png";
    icono.href = "favicon.png";
    document.head.appendChild(icono);
  }

  function completarCorreos() {
    document.querySelectorAll(".correo-contacto").forEach(function (elemento) {
      if (elemento.textContent !== CORREO_CONTACTO) {
        elemento.textContent = CORREO_CONTACTO;
        elemento.href = "mailto:" + CORREO_CONTACTO;
      }
    });
  }

  function agregarEnlacesAlPie() {
    const pie = document.querySelector("footer");
    if (!pie || pie.querySelector(".enlaces-legales")) return;

    const caja = document.createElement("p");
    caja.className = "enlaces-legales";
    caja.style.margin = "8px 0 0";
    caja.style.fontSize = "0.9rem";

    ENLACES.forEach(function (par, indice) {
      if (indice > 0) caja.appendChild(document.createTextNode(" · "));
      const enlace = document.createElement("a");
      enlace.href = par[1];
      enlace.textContent = par[0];
      enlace.style.color = "inherit";
      caja.appendChild(enlace);
    });

    pie.appendChild(caja);
  }

  function iniciar() {
    ponerIcono();
    completarCorreos();
    agregarEnlacesAlPie();
  }

  const observador = new MutationObserver(iniciar);
  observador.observe(document.body, { childList: true, subtree: true });
  setTimeout(function () {
    observador.disconnect();
  }, 10000);

  iniciar();
})();
