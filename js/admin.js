(function () {
  const estadoEl = document.getElementById("admin-estado");
  const contenidoEl = document.getElementById("admin-contenido");
  const filtrosEl = document.getElementById("admin-filtros");
  const mensajeEl = document.getElementById("admin-mensaje");
  const listaEl = document.getElementById("admin-lista");

  const NOMBRES_TIPO = {
    publicacion: "Publicación",
    comentario: "Comentario",
    perfil: "Perfil",
    recomendacion: "Recomendación"
  };

  const NOMBRES_MOTIVO = {
    spam: "Spam o publicidad",
    acoso: "Acoso o insultos",
    contenido_inapropiado: "Contenido inapropiado",
    otro: "Otro motivo"
  };

  const TABLAS = {
    publicacion: { tabla: "publicaciones", columnas: "id, titulo, contenido" },
    comentario: { tabla: "comentarios", columnas: "id, texto, recomendacion_id" },
    perfil: { tabla: "profiles", columnas: "id, username, descripcion" },
    recomendacion: { tabla: "recomendaciones", columnas: "id, titulo, autor" }
  };

  const FILTROS = [
    { valor: "pendiente", texto: "Pendientes" },
    { valor: "revisada", texto: "Revisadas" },
    { valor: "descartada", texto: "Descartadas" },
    { valor: "todas", texto: "Todas" }
  ];

  let filtroActual = "pendiente";

  function mostrarMensaje(texto, tipo) {
    mensajeEl.textContent = texto;
    mensajeEl.className = "admin-mensaje" + (tipo ? " " + tipo : "");
  }

  async function esAdministradora(userId) {
    const rpc = await supabaseClient.rpc("es_administrador");
    if (!rpc.error) return rpc.data === true;

    const tabla = await supabaseClient
      .from("administradores")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    return !!tabla.data;
  }

  function textoVista(tipo, objeto) {
    if (!objeto) return "";
    if (tipo === "publicacion") {
      return [objeto.titulo, objeto.contenido].filter(Boolean).join("\n");
    }
    if (tipo === "comentario") return objeto.texto || "";
    if (tipo === "perfil") {
      return "@" + (objeto.username || "") + (objeto.descripcion ? "\n" + objeto.descripcion : "");
    }
    if (tipo === "recomendacion") {
      return [objeto.titulo, objeto.autor].filter(Boolean).join(" — ");
    }
    return "";
  }

  function enlaceVer(tipo, objeto, objetoId) {
    if (tipo === "publicacion") return "publicacion.html?id=" + encodeURIComponent(objetoId);
    if (tipo === "perfil") return "perfil.html?id=" + encodeURIComponent(objetoId);
    if (tipo === "recomendacion") return "recomendacion.html?id=" + encodeURIComponent(objetoId);
    if (tipo === "comentario" && objeto && objeto.recomendacion_id) {
      return "recomendacion.html?id=" + encodeURIComponent(objeto.recomendacion_id);
    }
    return null;
  }

  function crearElemento(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function crearBoton(texto, clase, accion) {
    const boton = crearElemento("button", "admin-boton " + clase, texto);
    boton.type = "button";
    boton.addEventListener("click", async function () {
      boton.disabled = true;
      await accion();
      boton.disabled = false;
    });
    return boton;
  }

  async function cambiarEstado(denuncia, estado) {
    const { data, error } = await supabaseClient
      .from("denuncias")
      .update({ estado: estado })
      .eq("id", denuncia.id)
      .select("id");

    if (error || !data || data.length === 0) {
      mostrarMensaje("No se pudo cambiar el estado.", "error");
      return;
    }

    mostrarMensaje("Listo.", "ok");
    cargar();
  }

  async function borrarContenido(denuncia) {
    const info = TABLAS[denuncia.tipo];
    if (!info) return;

    const seguro = confirm(
      "¿Borrar este contenido para siempre? No se puede deshacer."
    );
    if (!seguro) return;

    const { data, error } = await supabaseClient
      .from(info.tabla)
      .delete()
      .eq("id", denuncia.objeto_id)
      .select("id");

    if (error || !data || data.length === 0) {
      mostrarMensaje("No se pudo borrar el contenido.", "error");
      return;
    }

    await supabaseClient
      .from("denuncias")
      .update({ estado: "revisada" })
      .eq("tipo", denuncia.tipo)
      .eq("objeto_id", denuncia.objeto_id);

    mostrarMensaje("Contenido borrado.", "ok");
    cargar();
  }

  function crearTarjeta(denuncia, objeto, denunciante) {
    const tarjeta = crearElemento("article", "admin-tarjeta");

    const fila = crearElemento("div", "admin-fila");
    fila.appendChild(crearElemento("span", "admin-etiqueta", NOMBRES_TIPO[denuncia.tipo] || denuncia.tipo));
    fila.appendChild(crearElemento("span", "admin-etiqueta " + denuncia.estado, denuncia.estado));
    fila.appendChild(
      crearElemento("span", "admin-fecha", new Date(denuncia.created_at).toLocaleString("es-AR"))
    );
    tarjeta.appendChild(fila);

    tarjeta.appendChild(
      crearElemento("p", "admin-motivo", NOMBRES_MOTIVO[denuncia.motivo] || denuncia.motivo)
    );

    if (denuncia.detalle) {
      tarjeta.appendChild(crearElemento("p", "admin-detalle", "“" + denuncia.detalle + "”"));
    }

    tarjeta.appendChild(
      crearElemento(
        "p",
        "admin-quien",
        "Denunciada por " + (denunciante ? "@" + denunciante.username : "una persona")
      )
    );

    const vista = textoVista(denuncia.tipo, objeto);
    if (objeto && vista) {
      tarjeta.appendChild(crearElemento("div", "admin-vista", vista));
    } else {
      tarjeta.appendChild(
        crearElemento("div", "admin-vista vacia", "El contenido ya no existe o no se pudo cargar.")
      );
    }

    const acciones = crearElemento("div", "admin-acciones");

    const href = enlaceVer(denuncia.tipo, objeto, denuncia.objeto_id);
    if (objeto && href) {
      const ver = crearElemento("a", "admin-boton", "Ver");
      ver.href = href;
      ver.target = "_blank";
      ver.rel = "noopener";
      acciones.appendChild(ver);
    }

    if (objeto && denuncia.tipo !== "perfil" && TABLAS[denuncia.tipo]) {
      acciones.appendChild(
        crearBoton("Borrar contenido", "peligro", function () {
          return borrarContenido(denuncia);
        })
      );
    }

    if (denuncia.estado !== "revisada") {
      acciones.appendChild(
        crearBoton("Revisada", "ok", function () {
          return cambiarEstado(denuncia, "revisada");
        })
      );
    }

    if (denuncia.estado !== "descartada") {
      acciones.appendChild(
        crearBoton("Descartar", "", function () {
          return cambiarEstado(denuncia, "descartada");
        })
      );
    }

    if (denuncia.estado !== "pendiente") {
      acciones.appendChild(
        crearBoton("Volver a pendiente", "", function () {
          return cambiarEstado(denuncia, "pendiente");
        })
      );
    }

    tarjeta.appendChild(acciones);
    return tarjeta;
  }

  async function cargar() {
    listaEl.textContent = "Cargando...";

    let consulta = supabaseClient
      .from("denuncias")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filtroActual !== "todas") consulta = consulta.eq("estado", filtroActual);

    const { data: denuncias, error } = await consulta;

    if (error) {
      listaEl.textContent = "";
      mostrarMensaje("No se pudieron cargar las denuncias.", "error");
      return;
    }

    listaEl.textContent = "";

    if (!denuncias || denuncias.length === 0) {
      listaEl.appendChild(crearElemento("p", "admin-vacio", "No hay denuncias en esta lista. 🌸"));
      return;
    }

    const idsPorTipo = {};
    const idsDenunciantes = new Set();

    denuncias.forEach(function (d) {
      if (!idsPorTipo[d.tipo]) idsPorTipo[d.tipo] = new Set();
      idsPorTipo[d.tipo].add(d.objeto_id);
      idsDenunciantes.add(d.denunciante_id);
    });

    const objetos = {};

    await Promise.all(
      Object.keys(idsPorTipo).map(async function (tipo) {
        const info = TABLAS[tipo];
        objetos[tipo] = {};
        if (!info) return;

        const { data } = await supabaseClient
          .from(info.tabla)
          .select(info.columnas)
          .in("id", Array.from(idsPorTipo[tipo]));

        (data || []).forEach(function (fila) {
          objetos[tipo][fila.id] = fila;
        });
      })
    );

    const denunciantes = {};
    const { data: perfiles } = await supabaseClient
      .from("profiles")
      .select("id, username")
      .in("id", Array.from(idsDenunciantes));

    (perfiles || []).forEach(function (perfil) {
      denunciantes[perfil.id] = perfil;
    });

    denuncias.forEach(function (d) {
      const objeto = objetos[d.tipo] ? objetos[d.tipo][d.objeto_id] : null;
      listaEl.appendChild(crearTarjeta(d, objeto, denunciantes[d.denunciante_id]));
    });
  }

  function crearFiltros() {
    FILTROS.forEach(function (filtro) {
      const boton = crearElemento("button", "admin-filtro", filtro.texto);
      boton.type = "button";
      if (filtro.valor === filtroActual) boton.classList.add("activo");

      boton.addEventListener("click", function () {
        filtroActual = filtro.valor;
        filtrosEl.querySelectorAll(".admin-filtro").forEach(function (otro) {
          otro.classList.remove("activo");
        });
        boton.classList.add("activo");
        mostrarMensaje("", "");
        cargar();
      });

      filtrosEl.appendChild(boton);
    });
  }

  async function iniciar() {
    const { data } = await supabaseClient.auth.getSession();
    const sesion = data.session;

    if (!sesion) {
      estadoEl.textContent = "Iniciá sesión para entrar al panel.";
      return;
    }

    const permitido = await esAdministradora(sesion.user.id);

    if (!permitido) {
      estadoEl.textContent = "No tenés permiso para ver esta página.";
      return;
    }

    estadoEl.hidden = true;
    contenidoEl.hidden = false;
    crearFiltros();
    cargar();
  }

  iniciar();
})();
