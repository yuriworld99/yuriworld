(function () {
  if (!/publicacion\.html$/.test(window.location.pathname)) return;

  const estilo = document.createElement("style");
  estilo.textContent =
    ".respuesta-acciones.yw-acciones { display: flex; flex-wrap: nowrap; align-items: center; justify-content: space-between; gap: 2px; position: relative; max-width: 100%; }" +
    ".yw-menu-boton { display: inline-flex; align-items: center; margin-left: auto; padding: 4px 8px; border: none; background: none; color: #6d5d7d; cursor: pointer; }" +
    ".yw-menu-boton svg { width: 20px; height: 20px; }" +
    ".yw-menu-boton[hidden] { display: none; }" +
    ".yw-menu-lista { position: absolute; right: 0; top: 100%; z-index: 30; min-width: 170px; overflow: hidden; border: 2px solid #e6d9fb; border-radius: 14px; background: #ffffff; box-shadow: 0 8px 24px rgba(123, 63, 228, 0.18); }" +
    ".yw-menu-lista[hidden] { display: none; }" +
    ".yw-menu-lista > * { display: block !important; width: 100%; box-sizing: border-box; margin: 0 !important; padding: 12px 16px !important; border: none !important; border-bottom: 1px solid #f0e6fb !important; border-radius: 0 !important; background: #ffffff !important; font: inherit; font-size: 0.95rem; font-weight: 700; text-align: left; cursor: pointer; }" +
    ".yw-menu-lista > *:last-child { border-bottom: none !important; }";
  document.head.appendChild(estilo);

  const PUNTOS =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';

  let pendiente = false;

  function esPropio(hijo, boton, lista) {
    return (
      hijo === boton ||
      hijo === lista ||
      hijo.classList.contains("yw-rbtn") ||
      hijo.classList.contains("respuesta-responder")
    );
  }

  function reorganizar(acciones) {
    acciones.classList.add("yw-acciones");

    let boton = acciones.querySelector(".yw-menu-boton");
    let lista = acciones.querySelector(".yw-menu-lista");

    if (!boton || !lista) {
      boton = document.createElement("button");
      boton.type = "button";
      boton.className = "yw-menu-boton";
      boton.setAttribute("aria-label", "Más opciones");
      boton.innerHTML = PUNTOS;
      boton.hidden = true;

      lista = document.createElement("div");
      lista.className = "yw-menu-lista";
      lista.hidden = true;

      boton.addEventListener("click", function (evento) {
        evento.stopPropagation();
        const abrir = lista.hidden;
        document.querySelectorAll(".yw-menu-lista").forEach(function (otra) {
          otra.hidden = true;
        });
        lista.hidden = !abrir;
      });

      lista.addEventListener("click", function () {
        setTimeout(function () {
          lista.hidden = true;
        }, 0);
      });

      acciones.appendChild(boton);
      acciones.appendChild(lista);
    }

    Array.from(acciones.children).forEach(function (hijo) {
      if (esPropio(hijo, boton, lista)) return;
      lista.appendChild(hijo);
    });

    boton.hidden = lista.children.length === 0;
  }

  function procesar() {
    document.querySelectorAll(".respuesta-acciones").forEach(reorganizar);
  }

  function programar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () {
      pendiente = false;
      procesar();
    });
  }

  document.addEventListener("click", function () {
    document.querySelectorAll(".yw-menu-lista").forEach(function (lista) {
      lista.hidden = true;
    });
  });

  new MutationObserver(programar).observe(document.body, { childList: true, subtree: true });
  programar();
})();
