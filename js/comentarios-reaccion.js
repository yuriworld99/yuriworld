(function () {
  if (!/publicacion\.html$/.test(window.location.pathname)) return;

  const publicacionId = new URLSearchParams(window.location.search).get("id");
  if (!publicacionId) return;

  const estilo = document.createElement("style");
  estilo.textContent =
    ".yw-rbtn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border: none; background: none; color: #6d5d7d; font: inherit; font-size: 0.85rem; font-weight: 700; cursor: pointer; }" +
    ".yw-rbtn svg { width: 18px; height: 18px; }" +
    ".yw-rbtn.activo { color: #e0529a; }" +
    ".yw-rbtn:disabled { opacity: 0.6; cursor: default; }" +
    ".yw-rbtn[hidden] { display: none; }" +
    ".respuesta-acciones.yw-acciones { display: flex; flex-wrap: nowrap; align-items: center; justify-content: space-between; gap: 2px; position: relative; max-width: 100%; }" +
    ".yw-menu-lista { position: absolute; right: 0; top: 100%; z-index: 30; min-width: 170px; overflow: hidden; border: 2px solid #e6d9fb; border-radius: 14px; background: #ffffff; box-shadow: 0 8px 24px rgba(123, 63, 228, 0.18); }" +
    ".yw-menu-lista[hidden] { display: none; }" +
    ".yw-menu-lista > * { display: block !important; width: 100%; box-sizing: border-box; margin: 0 !important; padding: 12px 16px !important; border: none !important; border-bottom: 1px solid #f0e6fb !important; border-radius: 0 !important; background: #ffffff !important; font: inherit; font-size: 0.95rem; font-weight: 700; text-align: left; cursor: pointer; }" +
    ".yw-menu-lista > *:last-child { border-bottom: none !important; }" +
    "@keyframes yw-resaltar { from { background: #ffe3f1; } to { background: transparent; } }" +
    ".yw-resaltado { animation: yw-resaltar 2.4s ease-out; border-radius: 12px; }";
  document.head.appendChild(estilo);

  const CORAZON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
  const COMPARTIR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>';

  const PUNTOS =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';

  let miId = null;
  let pendiente = false;
  let resaltado = false;
  const conteos = {};
  const mios = {};

  function avisarSesion() {
    const texto = "Iniciá sesión para dar Me gusta.";
    if (typeof avisar === "function") {
      avisar(texto);
    } else {
      alert(texto);
    }
  }

  function decorar(caja) {
    const id = caja.dataset.id;
    caja.id = "comentario-" + id;

    const acciones = caja.querySelector(".respuesta-acciones");
    if (!acciones) return;

    const botonLike = document.createElement("button");
    botonLike.type = "button";
    botonLike.className = "yw-rbtn";
    botonLike.setAttribute("aria-label", "Me gusta");
    botonLike.innerHTML = CORAZON;
    const cuenta = document.createElement("span");
    botonLike.appendChild(cuenta);

    function pintar() {
      const activo = !!mios[id];
      botonLike.classList.toggle("activo", activo);
      botonLike.querySelector("svg").style.fill = activo ? "currentColor" : "none";
      cuenta.textContent = conteos[id] > 0 ? String(conteos[id]) : "";
    }

    botonLike.addEventListener("click", async function () {
      if (!miId) {
        avisarSesion();
        return;
      }

      botonLike.disabled = true;
      try {
        if (mios[id]) {
          const { error } = await supabaseClient
            .from("respuestas_me_gusta")
            .delete()
            .eq("respuesta_id", id)
            .eq("user_id", miId);
          if (error) throw error;
          mios[id] = false;
          conteos[id] = Math.max(0, (conteos[id] || 0) - 1);
        } else {
          const { error } = await supabaseClient
            .from("respuestas_me_gusta")
            .insert({ respuesta_id: id, user_id: miId });
          if (error && error.code !== "23505") throw error;
          if (!error) conteos[id] = (conteos[id] || 0) + 1;
          mios[id] = true;
        }
      } catch (error) {
        console.error(error);
        alert("No se pudo guardar tu Me gusta. Probá de nuevo.");
      }
      botonLike.disabled = false;
      pintar();
    });

    const botonCompartir = document.createElement("button");
    botonCompartir.type = "button";
    botonCompartir.className = "yw-rbtn";
    botonCompartir.setAttribute("aria-label", "Compartir comentario");
    botonCompartir.innerHTML = COMPARTIR;
    const etiqueta = document.createElement("span");
    etiqueta.textContent = "Compartir";
    botonCompartir.appendChild(etiqueta);

    botonCompartir.addEventListener("click", async function () {
      const direccion =
        window.location.origin +
        window.location.pathname +
        "?id=" +
        encodeURIComponent(publicacionId) +
        "#comentario-" +
        id;
      const nombre = caja.dataset.nombre || "alguien";

      if (navigator.share) {
        try {
          await navigator.share({
            title: "YuriWorld",
            text: "Mirá este comentario de " + nombre + " en YuriWorld",
            url: direccion
          });
          return;
        } catch (error) {
          if (error && error.name === "AbortError") return;
        }
      }

      try {
        await navigator.clipboard.writeText(direccion);
        etiqueta.textContent = "¡Enlace copiado!";
        setTimeout(function () {
          etiqueta.textContent = "Compartir";
        }, 1800);
      } catch (error) {
        window.prompt("Copiá este enlace:", direccion);
      }
    });

    acciones.classList.add("yw-acciones");
    acciones.insertBefore(botonLike, acciones.firstChild);
    const responder = acciones.querySelector(".respuesta-responder");
    if (responder) {
      responder.insertAdjacentElement("afterend", botonCompartir);
    } else {
      acciones.appendChild(botonCompartir);
    }

    const botonMas = document.createElement("button");
    botonMas.type = "button";
    botonMas.className = "yw-rbtn yw-menu-boton";
    botonMas.setAttribute("aria-label", "Más opciones");
    botonMas.innerHTML = PUNTOS;
    botonMas.hidden = true;

    const lista = document.createElement("div");
    lista.className = "yw-menu-lista";
    lista.hidden = true;

    botonMas.addEventListener("click", function (evento) {
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

    acciones.appendChild(botonMas);
    acciones.appendChild(lista);

    pintar();
    reorganizar(acciones);
  }

  // Las acciones secundarias (Denunciar, Bloquear, Borrar…) pasan al menú ⋮.
  function reorganizar(acciones) {
    const lista = acciones.querySelector(".yw-menu-lista");
    const botonMas = acciones.querySelector(".yw-menu-boton");
    if (!lista || !botonMas) return;

    Array.from(acciones.children).forEach(function (hijo) {
      if (
        hijo === lista ||
        hijo === botonMas ||
        hijo.classList.contains("yw-rbtn") ||
        hijo.classList.contains("respuesta-responder")
      ) {
        return;
      }
      lista.appendChild(hijo);
    });

    botonMas.hidden = lista.children.length === 0;
  }

  function reorganizarTodas() {
    document.querySelectorAll(".respuesta-acciones.yw-acciones").forEach(reorganizar);
  }

  document.addEventListener("click", function () {
    document.querySelectorAll(".yw-menu-lista").forEach(function (lista) {
      lista.hidden = true;
    });
  });

  function resaltarDesdeEnlace() {
    if (resaltado) return;
    const coincidencia = window.location.hash.match(/^#comentario-(.+)$/);
    if (!coincidencia) {
      resaltado = true;
      return;
    }

    const elemento = document.getElementById("comentario-" + coincidencia[1]);
    if (!elemento) return;

    resaltado = true;
    elemento.scrollIntoView({ block: "center" });
    elemento.classList.add("yw-resaltado");
  }

  async function procesar() {
    reorganizarTodas();

    const cajas = Array.from(
      document.querySelectorAll(".respuesta[data-id]:not([data-yw-reaccion])")
    );
    if (cajas.length === 0) return;

    cajas.forEach(function (caja) {
      caja.dataset.ywReaccion = "1";
    });

    const ids = cajas.map(function (caja) {
      return caja.dataset.id;
    });

    try {
      const { data: filas } = await supabaseClient
        .from("me_gusta_respuestas_conteo")
        .select("respuesta_id, cantidad")
        .in("respuesta_id", ids);
      (filas || []).forEach(function (fila) {
        conteos[fila.respuesta_id] = fila.cantidad;
      });

      if (miId) {
        const { data: propios } = await supabaseClient
          .from("respuestas_me_gusta")
          .select("respuesta_id")
          .eq("user_id", miId)
          .in("respuesta_id", ids);
        (propios || []).forEach(function (fila) {
          mios[fila.respuesta_id] = true;
        });
      }
    } catch (error) {
      console.error(error);
    }

    cajas.forEach(decorar);
    resaltarDesdeEnlace();
  }

  function programar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () {
      pendiente = false;
      procesar();
    });
  }

  supabaseClient.auth.getSession().then(function (respuesta) {
    miId = respuesta.data.session ? respuesta.data.session.user.id : null;
    new MutationObserver(programar).observe(document.body, { childList: true, subtree: true });
    programar();
  });
})();
