(async function () {
  const estado = document.getElementById("estado-admin");
  const contenido = document.getElementById("contenido-admin");
  const lista = document.getElementById("lista-denuncias");
  const botonesPestana = document.querySelectorAll(".admin-pestana");

  const TIPOS = {
    publicacion: "Publicación",
    comentario: "Comentario",
    perfil: "Perfil",
    recomendacion: "Recomendación"
  };

  const MOTIVOS = {
    spam: "Spam o publicidad",
    acoso: "Acoso o insultos",
    contenido_inapropiado: "Contenido inapropiado",
    otro: "Otro motivo"
  };

  const TABLAS = {
    publicacion: "publicaciones",
    comentario: "respuestas",
    recomendacion: "recomendaciones"
  };

  let estadoActual = "pendiente";

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;

  if (!sesion) {
    estado.textContent = "Iniciá sesión para entrar al panel.";
    return;
  }

  const { data: admin } = await supabaseClient
    .from("administradores")
    .select("user_id")
    .eq("user_id", sesion.user.id)
    .maybeSingle();

  if (!admin) {
    estado.textContent = "Esta página es solo para administradores.";
    return;
  }

  estado.hidden = true;
  contenido.hidden = false;

  function crearParrafo(clase, texto) {
    const parrafo = document.createElement("p");
    if (clase) parrafo.className = clase;
    parrafo.textContent = texto;
    return parrafo;
  }

  function agregarImagen(contenedor, direccion) {
    if (!direccion) return;
    const imagen = document.createElement("img");
    imagen.src = direccion;
    imagen.alt = "Imagen del contenido denunciado";
    imagen.loading = "lazy";
    contenedor.appendChild(imagen);
  }

  async function borrarArchivo(bucket, direccion) {
    if (!direccion) return;
    const partes = direccion.split("/" + bucket + "/");
    if (partes.length !== 2) return;
    await supabaseClient.storage.from(bucket).remove([decodeURIComponent(partes[1])]);
  }

  function direccionVer(denuncia, objeto) {
    if (denuncia.tipo === "publicacion") {
      return "publicacion.html?id=" + encodeURIComponent(denuncia.objeto_id);
    }
    if (denuncia.tipo === "comentario") {
      return objeto ? "publicacion.html?id=" + encodeURIComponent(objeto.publicacion_id) : null;
    }
    if (denuncia.tipo === "perfil") {
      return "perfil.html?id=" + encodeURIComponent(denuncia.objeto_id);
    }
    return "recomendacion.html?id=" + encodeURIComponent(denuncia.objeto_id);
  }

  async function actualizarConteos() {
    const estados = ["pendiente", "revisada", "descartada"];
    for (const nombre of estados) {
      const { count } = await supabaseClient
        .from("denuncias")
        .select("id", { count: "exact", head: true })
        .eq("estado", nombre);
      document.getElementById("conteo-" + nombre).textContent = count || 0;
    }
  }

  async function recargar() {
    await Promise.all([cargarDenuncias(), actualizarConteos()]);
  }

  async function cambiarEstado(denuncia, nuevoEstado) {
    const { error } = await supabaseClient
      .from("denuncias")
      .update({ estado: nuevoEstado })
      .eq("id", denuncia.id);

    if (error) {
      alert("No se pudo actualizar la denuncia.");
      return;
    }
    await recargar();
  }

  async function borrarContenido(denuncia, objeto) {
    const tabla = TABLAS[denuncia.tipo];
    if (!tabla) return;

    if (!confirm("¿Borrar este contenido de forma definitiva? No se puede deshacer.")) return;

    const { data: borrados, error } = await supabaseClient
      .from(tabla)
      .delete()
      .eq("id", objeto.id)
      .select("id");

    if (error || !borrados || borrados.length === 0) {
      alert("No se pudo borrar el contenido. Revisá que tu cuenta tenga permisos de administrador.");
      return;
    }

    if (denuncia.tipo === "publicacion") {
      await borrarArchivo("muro", objeto.imagen_url);
      if (!objeto.recomendacion_id) {
        await borrarArchivo("portadas", objeto.rec_portada_url);
      }
    }

    if (denuncia.tipo === "recomendacion") {
      await borrarArchivo("portadas", objeto.portada_url);
    }

    await supabaseClient
      .from("denuncias")
      .update({ estado: "revisada" })
      .eq("tipo", denuncia.tipo)
      .eq("objeto_id", denuncia.objeto_id);

    await recargar();
  }

  function crearBoton(texto, clase, accion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "den-boton " + clase;
    boton.textContent = texto;
    boton.addEventListener("click", accion);
    return boton;
  }

  function crearVistaObjeto(denuncia, objeto, nombres) {
    const caja = document.createElement("div");
    caja.className = "den-objeto";

    if (!objeto) {
      caja.appendChild(crearParrafo("den-ausente", "El contenido ya no existe."));
      return caja;
    }

    if (denuncia.tipo === "publicacion") {
      caja.appendChild(crearParrafo("", "@" + (nombres[objeto.user_id] || "usuario") + " publicó:"));
      const texto = objeto.contenido || objeto.titulo;
      if (texto) caja.appendChild(crearParrafo("", texto));
      if (objeto.rec_titulo) caja.appendChild(crearParrafo("", "Recomendación: " + objeto.rec_titulo));
      agregarImagen(caja, objeto.imagen_url || objeto.rec_portada_url);
    }

    if (denuncia.tipo === "comentario") {
      caja.appendChild(crearParrafo("", "@" + (nombres[objeto.user_id] || "usuario") + " comentó:"));
      caja.appendChild(crearParrafo("", objeto.texto));
    }

    if (denuncia.tipo === "perfil") {
      caja.appendChild(crearParrafo("", "@" + objeto.username));
      if (objeto.descripcion) caja.appendChild(crearParrafo("", objeto.descripcion));
    }

    if (denuncia.tipo === "recomendacion") {
      caja.appendChild(crearParrafo("", objeto.titulo + " — de " + objeto.autor));
      caja.appendChild(
        crearParrafo("", "Recomendada por @" + (nombres[objeto.user_id] || "usuario"))
      );
      agregarImagen(caja, objeto.portada_url);
    }

    return caja;
  }

  function crearDenuncia(denuncia, objeto, nombres) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "denuncia";

    const cabecera = document.createElement("div");
    cabecera.className = "den-cabecera";

    const tipo = document.createElement("span");
    tipo.className = "den-tipo";
    tipo.textContent = TIPOS[denuncia.tipo] || denuncia.tipo;

    const motivo = document.createElement("span");
    motivo.className = "den-motivo";
    motivo.textContent = MOTIVOS[denuncia.motivo] || denuncia.motivo;

    const fecha = document.createElement("span");
    fecha.className = "den-fecha";
    fecha.textContent = new Date(denuncia.created_at).toLocaleString("es");

    cabecera.appendChild(tipo);
    cabecera.appendChild(motivo);
    cabecera.appendChild(fecha);
    tarjeta.appendChild(cabecera);

    tarjeta.appendChild(
      crearParrafo(
        "den-por",
        "Denunciada por @" + (nombres[denuncia.denunciante_id] || "usuario")
      )
    );

    if (denuncia.detalle) {
      tarjeta.appendChild(crearParrafo("den-detalle", denuncia.detalle));
    }

    tarjeta.appendChild(crearVistaObjeto(denuncia, objeto, nombres));

    const botones = document.createElement("div");
    botones.className = "den-botones";

    const direccion = direccionVer(denuncia, objeto);
    if (direccion) {
      const ver = document.createElement("a");
      ver.className = "den-boton";
      ver.href = direccion;
      ver.target = "_blank";
      ver.rel = "noopener";
      ver.textContent = "Ver";
      botones.appendChild(ver);
    }

    if (objeto && TABLAS[denuncia.tipo]) {
      botones.appendChild(
        crearBoton("Borrar contenido", "peligro", function () {
          borrarContenido(denuncia, objeto);
        })
      );
    }

    if (denuncia.estado === "pendiente") {
      botones.appendChild(
        crearBoton("Marcar como revisada", "principal", function () {
          cambiarEstado(denuncia, "revisada");
        })
      );
      botones.appendChild(
        crearBoton("Descartar", "", function () {
          cambiarEstado(denuncia, "descartada");
        })
      );
    } else {
      botones.appendChild(
        crearBoton("Volver a pendiente", "", function () {
          cambiarEstado(denuncia, "pendiente");
        })
      );
    }

    tarjeta.appendChild(botones);
    return tarjeta;
  }

  async function cargarDenuncias() {
    lista.textContent = "Cargando denuncias...";

    const { data: denuncias, error } = await supabaseClient
      .from("denuncias")
      .select("id, tipo, objeto_id, motivo, detalle, estado, created_at, denunciante_id")
      .eq("estado", estadoActual)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      lista.textContent = "No se pudieron cargar las denuncias.";
      return;
    }

    if (denuncias.length === 0) {
      lista.textContent = "No hay denuncias en esta lista.";
      return;
    }

    const idsPorTipo = { publicacion: [], comentario: [], perfil: [], recomendacion: [] };
    denuncias.forEach(function (denuncia) {
      const grupo = idsPorTipo[denuncia.tipo];
      if (grupo && !grupo.includes(denuncia.objeto_id)) grupo.push(denuncia.objeto_id);
    });

    const objetos = { publicacion: {}, comentario: {}, perfil: {}, recomendacion: {} };

    if (idsPorTipo.publicacion.length > 0) {
      const { data } = await supabaseClient
        .from("muro_publicaciones")
        .select("id, user_id, titulo, contenido, imagen_url, rec_titulo, rec_portada_url, recomendacion_id")
        .in("id", idsPorTipo.publicacion);
      (data || []).forEach(function (fila) {
        objetos.publicacion[fila.id] = fila;
      });
    }

    if (idsPorTipo.comentario.length > 0) {
      const { data } = await supabaseClient
        .from("respuestas")
        .select("id, user_id, texto, publicacion_id")
        .in("id", idsPorTipo.comentario);
      (data || []).forEach(function (fila) {
        objetos.comentario[fila.id] = fila;
      });
    }

    if (idsPorTipo.perfil.length > 0) {
      const { data } = await supabaseClient
        .from("profiles")
        .select("id, username, descripcion")
        .in("id", idsPorTipo.perfil);
      (data || []).forEach(function (fila) {
        objetos.perfil[fila.id] = fila;
      });
    }

    if (idsPorTipo.recomendacion.length > 0) {
      const { data } = await supabaseClient
        .from("recomendaciones")
        .select("id, user_id, titulo, autor, portada_url")
        .in("id", idsPorTipo.recomendacion);
      (data || []).forEach(function (fila) {
        objetos.recomendacion[fila.id] = fila;
      });
    }

    const idsUsuarios = [];
    function sumarUsuario(id) {
      if (id && !idsUsuarios.includes(id)) idsUsuarios.push(id);
    }
    denuncias.forEach(function (denuncia) {
      sumarUsuario(denuncia.denunciante_id);
    });
    ["publicacion", "comentario", "recomendacion"].forEach(function (tipo) {
      Object.keys(objetos[tipo]).forEach(function (id) {
        sumarUsuario(objetos[tipo][id].user_id);
      });
    });

    const nombres = {};
    if (idsUsuarios.length > 0) {
      const { data: perfiles } = await supabaseClient
        .from("profiles")
        .select("id, username")
        .in("id", idsUsuarios);
      (perfiles || []).forEach(function (perfil) {
        nombres[perfil.id] = perfil.username;
      });
    }

    const fragmento = document.createDocumentFragment();
    denuncias.forEach(function (denuncia) {
      const objeto = objetos[denuncia.tipo] ? objetos[denuncia.tipo][denuncia.objeto_id] : null;
      fragmento.appendChild(crearDenuncia(denuncia, objeto, nombres));
    });
    lista.replaceChildren(fragmento);
  }

  botonesPestana.forEach(function (boton) {
    boton.addEventListener("click", function () {
      estadoActual = boton.dataset.estado;
      botonesPestana.forEach(function (otro) {
        otro.classList.toggle("activa", otro === boton);
      });
      cargarDenuncias();
    });
  });

  recargar();
})();
