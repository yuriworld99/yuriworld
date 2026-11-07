(function () {
  const estilo = document.createElement("style");
  estilo.textContent =
    "a.yw-cita { display: block; margin: 8px 0 4px; padding: 10px 12px; border: 2px solid #e6d9fb; border-radius: 14px; background: #ffffff; color: inherit; text-decoration: none; }" +
    "a.yw-cita:hover { background: #faf5ff; }" +
    ".yw-cita-autor { margin: 0 0 4px; font-size: 0.9rem; font-weight: 800; color: #2b1a3d; }" +
    ".yw-cita-autor span { color: #6d5d7d; font-weight: 600; }" +
    ".yw-cita-texto { margin: 0; color: #2b1a3d; overflow-wrap: anywhere; white-space: pre-wrap; }" +
    ".yw-cita-vacia { margin: 0; color: #6d5d7d; font-style: italic; }" +
    ".yw-cita img { display: block; width: 100%; max-height: 160px; margin-top: 8px; border-radius: 10px; object-fit: cover; }" +
    ".yw-modal { position: fixed; inset: 0; z-index: 100; display: flex; align-items: flex-end; justify-content: center; background: rgba(43, 26, 61, 0.55); }" +
    ".yw-modal-caja { width: 100%; max-width: 620px; max-height: 92vh; overflow-y: auto; box-sizing: border-box; padding: 18px 16px 24px; border-radius: 20px 20px 0 0; background: #ffffff; }" +
    ".yw-modal-caja h3 { margin: 0 0 10px; color: #7b3fe4; }" +
    ".yw-modal-caja textarea { width: 100%; min-height: 110px; box-sizing: border-box; padding: 12px 14px; border: 2px solid #e6d9fb; border-radius: 14px; background: #faf5ff; color: #2b1a3d; font: inherit; font-size: 16px; }" +
    ".yw-modal-botones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }" +
    ".yw-modal-botones button { padding: 10px 20px; border: 2px solid #e6d9fb; border-radius: 999px; background: #ffffff; color: #7b3fe4; font: inherit; font-weight: 700; cursor: pointer; }" +
    ".yw-modal-botones button.principal { border-color: transparent; background: linear-gradient(90deg, #ff5fa2, #7b3fe4); color: #ffffff; }" +
    ".yw-modal-botones button:disabled { opacity: 0.5; cursor: default; }" +
    ".yw-modal-error { margin: 8px 0 0; color: #c0264b; font-size: 0.9rem; font-weight: 700; }" +
    ".yw-hoja { position: fixed; inset: 0; z-index: 100; display: flex; align-items: flex-end; justify-content: center; background: rgba(43, 26, 61, 0.55); }" +
    ".yw-hoja-caja { width: 100%; max-width: 620px; box-sizing: border-box; padding: 10px 8px 22px; border-radius: 22px 22px 0 0; background: #ffffff; }" +
    ".yw-hoja-asa { width: 44px; height: 5px; margin: 0 auto 10px; border-radius: 999px; background: #d9cdea; }" +
    ".yw-hoja-opcion { display: flex; align-items: center; gap: 16px; width: 100%; box-sizing: border-box; padding: 16px 18px; border: none; background: none; color: #2b1a3d; font: inherit; font-size: 1.1rem; font-weight: 700; text-align: left; cursor: pointer; }" +
    ".yw-hoja-opcion svg { flex: 0 0 auto; width: 26px; height: 26px; color: #7b3fe4; }" +
    ".yw-hoja-opcion:active { background: #faf5ff; }" +
    ".yw-cita-avatar { display: inline-block; width: 22px; height: 22px; margin-right: 6px; border-radius: 50%; background: #7b3fe4 center / cover; vertical-align: middle; color: #ffffff; font-size: 0.72rem; line-height: 22px; text-align: center; }";
  document.head.appendChild(estilo);

  const ICONO_REPOST =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
  const ICONO_CITAR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';

  let permitirRepost = false;

  let pendiente = false;

  function avisarTexto(texto) {
    if (typeof avisar === "function") {
      avisar(texto);
    } else {
      alert(texto);
    }
  }

  function idDeTarjeta(tarjeta) {
    const enlace = tarjeta.querySelector('a.accion[href*="publicacion.html?id="]');
    if (!enlace) return null;
    const coincidencia = (enlace.getAttribute("href") || "").match(/id=([^&#]+)/);
    return coincidencia ? decodeURIComponent(coincidencia[1]) : null;
  }

  function fechaRelativa(iso) {
    const segundos = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (segundos < 60) return "ahora";
    if (segundos < 3600) return "hace " + Math.floor(segundos / 60) + " min";
    if (segundos < 86400) return "hace " + Math.floor(segundos / 3600) + " h";
    if (segundos < 604800) return "hace " + Math.floor(segundos / 86400) + " d";
    return new Date(iso).toLocaleDateString("es");
  }

  function recortar(texto, largo) {
    if (!texto) return "";
    return texto.length > largo ? texto.slice(0, largo) + "…" : texto;
  }

  // ---------- Mostrar la publicación citada debajo de la cita ----------
  function crearTarjetaCita(original, nombre, idCitado, avatar) {
    const enlace = document.createElement("a");
    enlace.className = "yw-cita";

    if (!original) {
      enlace.removeAttribute("href");
      const vacio = document.createElement("p");
      vacio.className = "yw-cita-vacia";
      vacio.textContent = "Esta publicación ya no está disponible.";
      enlace.appendChild(vacio);
      return enlace;
    }

    enlace.href = "publicacion.html?id=" + encodeURIComponent(idCitado);

    const autor = document.createElement("p");
    autor.className = "yw-cita-autor";
    const foto = document.createElement("span");
    foto.className = "yw-cita-avatar";
    if (avatar) {
      foto.style.backgroundImage = 'url("' + avatar + '")';
    } else {
      foto.textContent = (nombre || "u").charAt(0).toUpperCase();
    }
    autor.appendChild(foto);
    autor.appendChild(document.createTextNode("@" + (nombre || "usuario") + " "));
    const fecha = document.createElement("span");
    fecha.textContent = "· " + fechaRelativa(original.created_at);
    autor.appendChild(fecha);
    enlace.appendChild(autor);

    let texto = original.contenido || "";
    if (!texto && original.rec_titulo) texto = "Recomendación: " + original.rec_titulo;
    if (texto) {
      const parrafo = document.createElement("p");
      parrafo.className = "yw-cita-texto";
      parrafo.textContent = recortar(texto, 220);
      enlace.appendChild(parrafo);
    }

    if (original.imagen_url) {
      const imagen = document.createElement("img");
      imagen.src = original.imagen_url;
      imagen.alt = "";
      imagen.loading = "lazy";
      enlace.appendChild(imagen);
    }

    return enlace;
  }

  async function mostrarCitas() {
    const tarjetas = Array.from(document.querySelectorAll("article.post:not([data-yw-cita])"));
    if (tarjetas.length === 0) return;

    const porId = {};
    tarjetas.forEach(function (tarjeta) {
      tarjeta.dataset.ywCita = "1";
      const id = idDeTarjeta(tarjeta);
      if (!id) return;
      if (!porId[id]) porId[id] = [];
      porId[id].push(tarjeta);
    });

    const ids = Object.keys(porId);
    if (ids.length === 0) return;

    try {
      const { data: filas, error } = await supabaseClient
        .from("publicaciones")
        .select("id, cita_de")
        .in("id", ids)
        .not("cita_de", "is", null);
      if (error || !filas || filas.length === 0) return;

      const citados = [];
      filas.forEach(function (fila) {
        if (citados.indexOf(fila.cita_de) === -1) citados.push(fila.cita_de);
      });

      const { data: originales } = await supabaseClient
        .from("muro_publicaciones")
        .select("id, user_id, contenido, imagen_url, rec_titulo, created_at")
        .in("id", citados);

      const porOriginal = {};
      const autores = [];
      (originales || []).forEach(function (original) {
        porOriginal[original.id] = original;
        if (autores.indexOf(original.user_id) === -1) autores.push(original.user_id);
      });

      const nombres = {};
      const fotos = {};
      if (autores.length > 0) {
        const { data: perfiles } = await supabaseClient
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", autores);
        (perfiles || []).forEach(function (perfil) {
          nombres[perfil.id] = perfil.username;
          fotos[perfil.id] = perfil.avatar_url;
        });
      }

      filas.forEach(function (fila) {
        const original = porOriginal[fila.cita_de] || null;
        (porId[fila.id] || []).forEach(function (tarjeta) {
          if (tarjeta.querySelector(".yw-cita")) return;

          const caja = crearTarjetaCita(
            original,
            original ? nombres[original.user_id] : null,
            fila.cita_de,
            original ? fotos[original.user_id] : null
          );

          const texto = tarjeta.querySelector(".post-texto");
          const cabecera = tarjeta.querySelector(".post-cabecera");
          if (texto) {
            texto.insertAdjacentElement("afterend", caja);
          } else if (cabecera) {
            cabecera.insertAdjacentElement("afterend", caja);
          } else {
            tarjeta.appendChild(caja);
          }
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

  // ---------- Botón "Citar" y ventana para escribir ----------
  async function abrirVentana(idCitado, tarjeta) {
    const { data } = await supabaseClient.auth.getSession();
    if (!data.session) {
      avisarTexto("Iniciá sesión para citar una publicación.");
      return;
    }

    const nombre = tarjeta.querySelector(".post-nombre");
    const texto = tarjeta.querySelector(".post-texto");

    const fondo = document.createElement("div");
    fondo.className = "yw-modal";

    const caja = document.createElement("div");
    caja.className = "yw-modal-caja";

    const titulo = document.createElement("h3");
    titulo.textContent = "Citar publicación";

    const area = document.createElement("textarea");
    area.maxLength = 1000;
    area.placeholder = "Agregá tu comentario…";

    const vista = document.createElement("a");
    vista.className = "yw-cita";
    vista.removeAttribute("href");
    vista.style.marginTop = "12px";
    const autor = document.createElement("p");
    autor.className = "yw-cita-autor";
    autor.textContent = nombre ? nombre.textContent : "";
    const cuerpo = document.createElement("p");
    cuerpo.className = "yw-cita-texto";
    cuerpo.textContent = recortar(texto ? texto.textContent : "", 200);
    vista.appendChild(autor);
    vista.appendChild(cuerpo);

    const error = document.createElement("p");
    error.className = "yw-modal-error";

    const botones = document.createElement("div");
    botones.className = "yw-modal-botones";
    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.textContent = "Cancelar";
    const publicar = document.createElement("button");
    publicar.type = "button";
    publicar.className = "principal";
    publicar.textContent = "Publicar";
    botones.appendChild(cancelar);
    botones.appendChild(publicar);

    caja.appendChild(titulo);
    caja.appendChild(area);
    caja.appendChild(vista);
    caja.appendChild(error);
    caja.appendChild(botones);
    fondo.appendChild(caja);
    document.body.appendChild(fondo);
    area.focus();

    function cerrar() {
      fondo.remove();
    }

    fondo.addEventListener("click", function (evento) {
      if (evento.target === fondo) cerrar();
    });
    cancelar.addEventListener("click", cerrar);

    publicar.addEventListener("click", async function () {
      const contenido = area.value.trim();
      if (!contenido) {
        error.textContent = "Escribí algo para citar la publicación.";
        return;
      }

      publicar.disabled = true;
      error.textContent = "";

      const { error: errorGuardar } = await supabaseClient
        .from("publicaciones")
        .insert({ contenido: contenido, cita_de: idCitado });

      if (errorGuardar) {
        console.error(errorGuardar);
        error.textContent =
          (errorGuardar.message || "").indexOf("No podés citar") !== -1
            ? "No podés citar esta publicación."
            : "No se pudo publicar la cita. Probá de nuevo.";
        publicar.disabled = false;
        return;
      }

      cerrar();
      avisarTexto("¡Publicaste tu cita!");
      if (typeof cargarMuro === "function" && /foro\.html$/.test(window.location.pathname)) {
        cargarMuro();
      } else if (typeof cargarPublicaciones === "function" && typeof perfilId !== "undefined") {
        cargarPublicaciones();
      }
    });
  }

  // ---------- Hoja inferior al tocar el botón de repostear ----------
  function abrirHoja(boton, tarjeta, idPublicacion) {
    const yaReposteada = boton.classList.contains("activa");

    const fondo = document.createElement("div");
    fondo.className = "yw-hoja";

    const caja = document.createElement("div");
    caja.className = "yw-hoja-caja";

    const asa = document.createElement("div");
    asa.className = "yw-hoja-asa";
    caja.appendChild(asa);

    function opcion(icono, texto, alElegir) {
      const boton2 = document.createElement("button");
      boton2.type = "button";
      boton2.className = "yw-hoja-opcion";
      boton2.innerHTML = icono;
      const etiqueta = document.createElement("span");
      etiqueta.textContent = texto;
      boton2.appendChild(etiqueta);
      boton2.addEventListener("click", function (evento) {
        evento.stopPropagation();
        fondo.remove();
        alElegir();
      });
      caja.appendChild(boton2);
    }

    opcion(ICONO_REPOST, yaReposteada ? "Deshacer repost" : "Repostear", function () {
      permitirRepost = true;
      try {
        boton.click();
      } finally {
        permitirRepost = false;
      }
    });

    opcion(ICONO_CITAR, "Cita", function () {
      abrirVentana(idPublicacion, tarjeta);
    });

    fondo.appendChild(caja);
    fondo.addEventListener("click", function (evento) {
      evento.stopPropagation();
      if (evento.target === fondo) fondo.remove();
    });
    document.body.appendChild(fondo);
  }

  document.addEventListener(
    "click",
    function (evento) {
      if (permitirRepost) return;

      const objetivo = evento.target;
      if (!objetivo || !objetivo.closest) return;

      const boton = objetivo.closest("button.accion.repost");
      if (!boton) return;

      const tarjeta = boton.closest("article.post");
      if (!tarjeta) return;

      const id = idDeTarjeta(tarjeta);
      if (!id) return;

      evento.stopImmediatePropagation();
      evento.preventDefault();
      abrirHoja(boton, tarjeta, id);
    },
    true
  );

  function programar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () {
      pendiente = false;
      mostrarCitas();
    });
  }

  new MutationObserver(programar).observe(document.body, { childList: true, subtree: true });
  programar();
})();
