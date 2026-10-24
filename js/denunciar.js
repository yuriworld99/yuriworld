(function () {
  const MOTIVOS = [
    { valor: "spam", texto: "Spam o publicidad" },
    { valor: "acoso", texto: "Acoso o insultos" },
    { valor: "contenido_inapropiado", texto: "Contenido inapropiado" },
    { valor: "otro", texto: "Otro motivo" }
  ];

  const ICONO_PUNTOS =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>';

  let sesionId = null;
  let programado = false;
  let recomendacionRevisada = false;

  const promesaSesion = supabaseClient.auth.getSession().then(function (respuesta) {
    sesionId = respuesta.data.session ? respuesta.data.session.user.id : null;
  });

  function agregarEstilos(ruta) {
    const base = ruta.split("?")[0];
    if (document.querySelector('link[href^="' + base + '"]')) return;
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = ruta;
    document.head.appendChild(enlace);
  }

  agregarEstilos("css/denunciar.css?v=1");

  function idDesdeHref(href, clave) {
    const partes = href.split(clave);
    if (partes.length < 2) return null;
    return decodeURIComponent(partes[1].split("&")[0]);
  }

  function cerrarMenusDenuncia() {
    document.querySelectorAll(".den-menu").forEach(function (menu) {
      menu.hidden = true;
    });
  }

  document.addEventListener("click", cerrarMenusDenuncia);

  function cerrarModal() {
    const fondo = document.querySelector(".den-fondo");
    if (fondo) fondo.remove();
    document.body.style.overflow = "";
  }

  function abrirDenuncia(tipo, objetoId, nombreObjeto) {
    if (!sesionId) {
      alert("Iniciá sesión para denunciar.");
      return;
    }

    cerrarModal();

    const fondo = document.createElement("div");
    fondo.className = "den-fondo";
    fondo.addEventListener("click", function (evento) {
      if (evento.target === fondo) cerrarModal();
    });

    const caja = document.createElement("div");
    caja.className = "den-caja";
    caja.setAttribute("role", "dialog");
    caja.setAttribute("aria-label", "Denunciar " + nombreObjeto);

    const titulo = document.createElement("h2");
    titulo.textContent = "Denunciar " + nombreObjeto;

    const ayuda = document.createElement("p");
    ayuda.textContent = "Contanos qué pasó. Un administrador va a revisar tu denuncia.";

    caja.appendChild(titulo);
    caja.appendChild(ayuda);

    MOTIVOS.forEach(function (motivo) {
      const etiqueta = document.createElement("label");
      etiqueta.className = "den-opcion";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "den-motivo";
      radio.value = motivo.valor;

      const texto = document.createElement("span");
      texto.textContent = motivo.texto;

      etiqueta.appendChild(radio);
      etiqueta.appendChild(texto);
      caja.appendChild(etiqueta);
    });

    const detalle = document.createElement("textarea");
    detalle.maxLength = 500;
    detalle.rows = 3;
    detalle.placeholder = "Detalles (opcional)";
    caja.appendChild(detalle);

    const mensaje = document.createElement("p");
    mensaje.className = "den-mensaje";
    caja.appendChild(mensaje);

    function mostrar(texto, tipoMensaje) {
      mensaje.textContent = texto;
      mensaje.className = "den-mensaje " + tipoMensaje;
    }

    const acciones = document.createElement("div");
    acciones.className = "den-acciones";

    const enviar = document.createElement("button");
    enviar.type = "button";
    enviar.className = "den-enviar";
    enviar.textContent = "Enviar denuncia";

    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.className = "den-cancelar";
    cancelar.textContent = "Cancelar";
    cancelar.addEventListener("click", cerrarModal);

    enviar.addEventListener("click", async function () {
      const elegido = caja.querySelector('input[name="den-motivo"]:checked');
      if (!elegido) {
        mostrar("Elegí un motivo.", "error");
        return;
      }

      enviar.disabled = true;
      mostrar("Enviando...", "");

      const { error } = await supabaseClient.from("denuncias").insert({
        tipo: tipo,
        objeto_id: objetoId,
        motivo: elegido.value,
        detalle: detalle.value.trim() || null
      });

      if (error) {
        enviar.disabled = false;
        if (error.code === "23505") {
          mostrar("Ya denunciaste esto. ¡Gracias!", "error");
        } else {
          mostrar("No se pudo enviar la denuncia.", "error");
        }
        return;
      }

      mostrar("Gracias. Recibimos tu denuncia.", "ok");
      setTimeout(cerrarModal, 1500);
    });

    acciones.appendChild(enviar);
    acciones.appendChild(cancelar);
    caja.appendChild(acciones);

    fondo.appendChild(caja);
    document.body.appendChild(fondo);
    document.body.style.overflow = "hidden";
  }

  window.abrirDenuncia = abrirDenuncia;
  function crearMenuDenuncia(tipo, objetoId, nombreObjeto) {
    const grupo = document.createDocumentFragment();

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "den-menu-boton";
    boton.setAttribute("aria-label", "Más opciones");
    boton.innerHTML = ICONO_PUNTOS;

    const menu = document.createElement("div");
    menu.className = "den-menu";
    menu.hidden = true;

    const opcion = document.createElement("button");
    opcion.type = "button";
    opcion.textContent = "Denunciar " + nombreObjeto;
    opcion.addEventListener("click", function () {
      menu.hidden = true;
      abrirDenuncia(tipo, objetoId, nombreObjeto);
    });
    menu.appendChild(opcion);

    boton.addEventListener("click", function (evento) {
      evento.stopPropagation();
      const estabaAbierto = !menu.hidden;
      cerrarMenusDenuncia();
      menu.hidden = estabaAbierto;
    });

    grupo.appendChild(boton);
    grupo.appendChild(menu);
    return grupo;
  }

  function decorarPublicaciones() {
    document.querySelectorAll(".post:not([data-denuncia])").forEach(function (post) {
      if (post.classList.contains("respuesta-perfil")) return;
      if (post.id === "publicacion") return;

      const cabecera = post.querySelector(".post-cabecera");
      const enlaceComentarios = post.querySelector('a[href^="publicacion.html?id="]');
      const avatar = post.querySelector("a.avatar");
      if (!cabecera || !enlaceComentarios || !avatar) return;

      post.dataset.denuncia = "1";

      const autorId = idDesdeHref(avatar.getAttribute("href") || "", "id=");
      if (autorId === sesionId) return;

      const publicacionId = idDesdeHref(enlaceComentarios.getAttribute("href"), "id=");
      if (!publicacionId) return;

      cabecera.style.position = "relative";
      cabecera.appendChild(crearMenuDenuncia("publicacion", publicacionId, "publicación"));
    });
  }

  function decorarDetalle() {
    if (!/publicacion\.html$/.test(window.location.pathname)) return;

    const articulo = document.getElementById("publicacion");
    const cabecera = articulo ? articulo.querySelector(".post-cabecera") : null;
    if (!cabecera || cabecera.dataset.denuncia) return;

    cabecera.dataset.denuncia = "1";

    const avatar = articulo.querySelector("a.avatar");
    const autorId = avatar ? idDesdeHref(avatar.getAttribute("href") || "", "id=") : null;
    if (autorId === sesionId) return;

    const idPublicacion = new URLSearchParams(window.location.search).get("id");
    if (!idPublicacion) return;

    cabecera.style.position = "relative";
    cabecera.appendChild(crearMenuDenuncia("publicacion", idPublicacion, "publicación"));
  }

  function decorarPerfil() {
    if (!/perfil\.html$/.test(window.location.pathname)) return;

    const barra = document.getElementById("perfil-barra");
    if (!barra || barra.dataset.denuncia) return;

    barra.dataset.denuncia = "1";

    const idPerfil = new URLSearchParams(window.location.search).get("id");
    if (!idPerfil || idPerfil === sesionId) return;

    barra.appendChild(crearMenuDenuncia("perfil", idPerfil, "perfil"));
  }

  async function decorarRecomendacion() {
    if (recomendacionRevisada) return;
    if (!/recomendacion\.html$/.test(window.location.pathname)) return;

    const contenedor = document.getElementById("acciones-recomendacion");
    const id = new URLSearchParams(window.location.search).get("id");
    if (!contenedor || !id) return;

    recomendacionRevisada = true;

    const { data } = await supabaseClient
      .from("recomendaciones")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!data || data.user_id === sesionId) return;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "den-enlace";
    boton.textContent = "Denunciar esta recomendación";
    boton.addEventListener("click", function () {
      abrirDenuncia("recomendacion", id, "recomendación");
    });
    contenedor.appendChild(boton);
  }

  async function decorar() {
    programado = false;
    await promesaSesion;
    if (!sesionId) return;

    decorarPublicaciones();
    decorarDetalle();
    decorarPerfil();
    decorarRecomendacion();
  }

  function programar() {
    if (programado) return;
    programado = true;
    setTimeout(decorar, 120);
  }

  new MutationObserver(programar).observe(document.body, {
    childList: true,
    subtree: true
  });

  programar();
})();
