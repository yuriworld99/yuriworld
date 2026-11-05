(function () {
  let miId = null;
  let fijadaId = null;
  let cargada = false;
  let pendiente = false;

  function avisarTexto(texto) {
    if (typeof avisar === "function") {
      avisar(texto);
    } else {
      alert(texto);
    }
  }

  async function cargarMia() {
    const { data } = await supabaseClient.auth.getSession();
    miId = data.session ? data.session.user.id : null;
    if (!miId) return;

    try {
      const { data: perfil } = await supabaseClient
        .from("profiles")
        .select("publicacion_fijada")
        .eq("id", miId)
        .maybeSingle();
      fijadaId = perfil ? perfil.publicacion_fijada : null;
    } catch (error) {
      console.error(error);
    }
    cargada = true;
  }

  function idDeTarjeta(tarjeta) {
    const enlace = tarjeta.querySelector('a.accion[href*="publicacion.html?id="]');
    if (!enlace) return null;
    const coincidencia = (enlace.getAttribute("href") || "").match(/id=([^&#]+)/);
    return coincidencia ? decodeURIComponent(coincidencia[1]) : null;
  }

  function pintarTodos() {
    document.querySelectorAll(".yw-fijar").forEach(function (boton) {
      boton.textContent =
        fijadaId && boton.dataset.id === fijadaId ? "Quitar fijado del perfil" : "Fijar en mi perfil";
    });
  }

  async function alternar(id) {
    const nuevo = fijadaId === id ? null : id;

    const { error } = await supabaseClient
      .from("profiles")
      .update({ publicacion_fijada: nuevo })
      .eq("id", miId);

    if (error) {
      console.error(error);
      avisarTexto("No se pudo fijar la publicación.");
      return;
    }

    fijadaId = nuevo;
    pintarTodos();
    avisarTexto(nuevo ? "Publicación fijada en tu perfil." : "Se quitó la publicación fijada.");

    if (
      typeof cargarPublicaciones === "function" &&
      typeof perfilId !== "undefined" &&
      perfilId === miId
    ) {
      cargarPublicaciones();
    }
  }

  function decorarMenu(menu) {
    if (menu.querySelector(".yw-fijar")) return;

    const tarjeta = menu.closest("article.post");
    if (!tarjeta) return;
    const id = idDeTarjeta(tarjeta);
    if (!id) return;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "yw-fijar";
    boton.dataset.id = id;
    boton.textContent = fijadaId === id ? "Quitar fijado del perfil" : "Fijar en mi perfil";

    boton.addEventListener("click", function () {
      menu.hidden = true;
      alternar(id);
    });

    menu.insertBefore(boton, menu.firstChild);
  }

  function procesar() {
    if (!cargada || !miId) return;
    document.querySelectorAll(".post-menu").forEach(decorarMenu);
  }

  function programar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () {
      pendiente = false;
      procesar();
    });
  }

  cargarMia().then(function () {
    new MutationObserver(programar).observe(document.body, { childList: true, subtree: true });
    programar();
  });

  // ---------- En el perfil: la publicación fijada va primero ----------
  function instalarPerfil() {
    const original = mostrarPosts;

    mostrarPosts = async function (nombrePanel, items, mensajeVacio) {
      if (nombrePanel !== "publicaciones") return original.apply(this, arguments);

      let idFijada = null;
      try {
        const { data: perfil } = await supabaseClient
          .from("profiles")
          .select("publicacion_fijada")
          .eq("id", perfilId)
          .maybeSingle();
        idFijada = perfil ? perfil.publicacion_fijada : null;
      } catch (error) {
        console.error(error);
      }
      if (!idFijada) return original.apply(this, arguments);

      let resto = items.slice();
      let fila = resto.find(function (item) {
        return item.id === idFijada;
      });

      if (fila) {
        resto = resto.filter(function (item) {
          return item.id !== idFijada;
        });
      } else {
        const { data } = await supabaseClient
          .from("muro_publicaciones")
          .select("*")
          .eq("id", idFijada)
          .maybeSingle();
        fila = data;
      }
      if (!fila) return original.apply(this, arguments);

      const resultado = await original.call(this, nombrePanel, [fila].concat(resto), mensajeVacio);

      const primera = panel(nombrePanel).querySelector("article.post");
      if (primera && !primera.querySelector(".yw-fijado")) {
        const etiqueta = document.createElement("p");
        etiqueta.className = "yw-fijado";
        etiqueta.textContent = "📌 Publicación fijada";
        etiqueta.style.margin = "0 0 6px";
        etiqueta.style.color = "#6d5d7d";
        etiqueta.style.fontSize = "0.85rem";
        etiqueta.style.fontWeight = "700";
        primera.insertBefore(etiqueta, primera.firstChild);
      }
      return resultado;
    };

    setTimeout(function () {
      if (typeof cargarPublicaciones === "function" && typeof perfilId !== "undefined" && perfilId) {
        cargarPublicaciones();
      }
    }, 800);
  }

  if (/perfil\.html$/.test(window.location.pathname)) {
    let intentos = 0;
    const espera = setInterval(function () {
      intentos += 1;
      if (typeof mostrarPosts === "function") {
        clearInterval(espera);
        instalarPerfil();
      } else if (intentos > 200) {
        clearInterval(espera);
      }
    }, 50);
  }
})();
