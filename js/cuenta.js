(function () {
  const TEXTO = "Eliminar mi cuenta";
  let conSesion = false;
  let pendiente = false;

  function agregarAlPie() {
    const pie = document.querySelector("footer");
    if (!pie || pie.querySelector(".enlace-cuenta")) return;

    const parrafo = document.createElement("p");
    parrafo.className = "enlace-cuenta";
    parrafo.style.margin = "4px 0 0";
    parrafo.style.fontSize = "0.85rem";

    const enlace = document.createElement("a");
    enlace.href = "eliminar-cuenta.html";
    enlace.textContent = TEXTO;
    enlace.style.color = "inherit";
    enlace.style.opacity = "0.85";

    parrafo.appendChild(enlace);
    pie.appendChild(parrafo);
  }

  function agregarAlMenu() {
    document.querySelectorAll('a[href="bloqueados.html"]').forEach(function (enlace) {
      const siguiente = enlace.nextElementSibling;
      if (siguiente && siguiente.classList.contains("enlace-cuenta-menu")) return;

      const copia = enlace.cloneNode(false);
      copia.href = "eliminar-cuenta.html";
      copia.className = (enlace.className + " enlace-cuenta-menu").trim();
      copia.textContent = TEXTO;
      enlace.insertAdjacentElement("afterend", copia);
    });
  }

  function decorar() {
    if (!conSesion) return;
    agregarAlPie();
    agregarAlMenu();
  }

  supabaseClient.auth.getSession().then(function (respuesta) {
    conSesion = !!respuesta.data.session;
    decorar();
  });

  new MutationObserver(function () {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () {
      pendiente = false;
      decorar();
    });
  }).observe(document.body, { childList: true, subtree: true });
})();
