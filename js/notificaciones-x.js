(async function () {
  const estado = document.getElementById("estado-notif");
  const cuerpo = document.getElementById("cuerpo-notif");
  const lista = document.getElementById("lista-notif");
  const botonMarcar = document.getElementById("marcar-todas-x");
  const avatarBarra = document.getElementById("avatar-barra");
  const pestanas = document.querySelectorAll(".nx-pestana");
  const navPerfil = document.getElementById("nav-perfil");

  const COLORES_AVATAR = ["#e0529a", "#7b3fe4", "#c2418c", "#6a35c9", "#d94f8a", "#8a4fe8", "#b8387f", "#5d2fb8"];

  const FILTROS = {
    todas: null,
    comentarios: ["comentario", "respuesta"],
    seguidores: ["seguidor"]
  };

  let filtroActual = "todas";

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;

  if (!sesion) {
    estado.textContent = "Iniciá sesión para ver tus notificaciones.";
    return;
  }

  estado.hidden = true;
  cuerpo.hidden = false;

  navPerfil.href = "perfil.html?mi=" + Date.now();

  function icono(ruta) {
    return '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ruta + "</svg>";
  }

  const ICONOS = {
    me_gusta: icono('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>'),
    repost: icono('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
    seguidor: icono('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>')
  };

  function colorDe(texto) {
    let valor = 0;
    for (let i = 0; i < texto.length; i++) {
      valor = (valor * 31 + texto.charCodeAt(i)) >>> 0;
    }
    return COLORES_AVATAR[valor % COLORES_AVATAR.length];
  }

  function pintarAvatar(elemento, nombre, direccion) {
    elemento.style.background = colorDe(nombre);
    elemento.textContent = nombre.charAt(0).toUpperCase();
    if (direccion) {
      elemento.style.backgroundImage = 'url("' + direccion + '")';
      elemento.style.backgroundSize = "cover";
      elemento.style.backgroundPosition = "center";
      elemento.textContent = "";
    }
  }

  function crearAvatar(nombre, direccion, grande) {
    const elemento = document.createElement("span");
    elemento.className = "nx-avatar" + (grande ? " grande" : "");
    pintarAvatar(elemento, nombre, direccion);
    return elemento;
  }

  function fechaRelativa(iso) {
    const segundos = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (segundos < 60) return "ahora";
    if (segundos < 3600) return Math.floor(segundos / 60) + " min";
    if (segundos < 86400) return Math.floor(segundos / 3600) + " h";
    if (segundos < 604800) return Math.floor(segundos / 86400) + " d";
    return new Date(iso).toLocaleDateString("es");
  }

  function recortar(texto) {
    if (!texto) return "";
    return texto.length > 140 ? texto.slice(0, 140) + "…" : texto;
  }

  const { data: miPerfil } = await supabaseClient
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", sesion.user.id)
    .maybeSingle();

  pintarAvatar(
    avatarBarra,
    miPerfil ? miPerfil.username : "usuario",
    miPerfil ? miPerfil.avatar_url : null
  );
  avatarBarra.href = "perfil.html?mi=" + Date.now();

  async function abrir(grupo, destino) {
    const idsNoLeidos = grupo.filas
      .filter(function (fila) {
        return !fila.leida;
      })
      .map(function (fila) {
        return fila.id;
      });

    if (idsNoLeidos.length > 0) {
      await supabaseClient
        .from("notificaciones")
        .update({ leida: true })
        .in("id", idsNoLeidos);
    }
    window.location.href = destino;
  }

  function textoDeGrupo(grupo, nombres) {
    const actores = [];
    grupo.filas.forEach(function (fila) {
      if (!actores.includes(fila.actor_id)) actores.push(fila.actor_id);
    });

    const primero = "@" + (nombres[actores[0]] || "usuario");
    let sujeto = primero;
    if (actores.length === 2) {
      sujeto = primero + " y @" + (nombres[actores[1]] || "usuario");
    } else if (actores.length > 2) {
      sujeto = primero + " y " + (actores.length - 1) + " más";
    }

    const plural = actores.length > 1;
    let accion = "";
    if (grupo.tipo === "me_gusta") {
      accion = plural ? "indicaron que les gusta tu publicación" : "indicó que le gusta tu publicación";
    } else if (grupo.tipo === "repost") {
      accion = plural ? "repostearon tu publicación" : "reposteó tu publicación";
    } else if (grupo.tipo === "seguidor") {
      accion = "empezó a seguirte";
    }

    return { sujeto: sujeto, accion: accion, actores: actores };
  }

  function agregarHora(texto, iso) {
    const hora = document.createElement("span");
    hora.className = "nx-hora";
    hora.textContent = " · " + fechaRelativa(iso);
    texto.appendChild(hora);
  }

  function crearItemAgrupado(grupo, contexto) {
    const item = document.createElement("article");
    const hayNuevas = grupo.filas.some(function (fila) {
      return !fila.leida;
    });
    item.className = "nx-item" + (hayNuevas ? " nueva" : "");

    const iconoCaja = document.createElement("div");
    iconoCaja.className = "nx-icono " + grupo.tipo;
    iconoCaja.innerHTML = ICONOS[grupo.tipo] || "";

    const cuerpoItem = document.createElement("div");
    cuerpoItem.className = "nx-cuerpo";

    const datos = textoDeGrupo(grupo, contexto.nombres);

    const avatares = document.createElement("div");
    avatares.className = "nx-avatares";
    datos.actores.slice(0, 7).forEach(function (id) {
      avatares.appendChild(
        crearAvatar(contexto.nombres[id] || "usuario", contexto.fotos[id], false)
      );
    });
    cuerpoItem.appendChild(avatares);

    const texto = document.createElement("p");
    texto.className = "nx-texto";
    const fuerte = document.createElement("strong");
    fuerte.textContent = datos.sujeto;
    texto.appendChild(fuerte);
    texto.append(" " + datos.accion);
    agregarHora(texto, grupo.filas[0].created_at);
    cuerpoItem.appendChild(texto);

    let miniatura = null;

    if (grupo.tipo !== "seguidor") {
      const publicacion = contexto.publicaciones[grupo.publicacion_id];
      if (publicacion) {
        let cita = "";
        if (publicacion.contenido) cita = publicacion.contenido;
        else if (publicacion.rec_titulo) cita = "Recomendación: " + publicacion.rec_titulo;
        else if (publicacion.imagen_url) cita = "Imagen";

        if (cita) {
          const citaTexto = document.createElement("p");
          citaTexto.className = "nx-cita";
          citaTexto.textContent = recortar(cita);
          cuerpoItem.appendChild(citaTexto);
        }

        miniatura = publicacion.imagen_url || publicacion.rec_portada_url || null;
      }
    }

    item.appendChild(iconoCaja);
    item.appendChild(cuerpoItem);

    if (miniatura) {
      const imagen = document.createElement("img");
      imagen.className = "nx-miniatura";
      imagen.src = miniatura;
      imagen.alt = "Imagen de la publicación";
      imagen.loading = "lazy";
      item.appendChild(imagen);
    }

    const destino =
      grupo.tipo === "seguidor"
        ? "perfil.html?id=" + encodeURIComponent(grupo.filas[0].actor_id)
        : "publicacion.html?id=" + encodeURIComponent(grupo.publicacion_id);

    item.addEventListener("click", function () {
      abrir(grupo, destino);
    });

    return item;
  }

  function crearItemComentario(grupo, contexto) {
    const fila = grupo.filas[0];
    const item = document.createElement("article");
    item.className = "nx-item" + (fila.leida ? "" : " nueva");

    const nombre = contexto.nombres[fila.actor_id] || "usuario";
    item.appendChild(crearAvatar(nombre, contexto.fotos[fila.actor_id], true));

    const cuerpoItem = document.createElement("div");
    cuerpoItem.className = "nx-cuerpo";

    const encabezado = document.createElement("p");
    encabezado.className = "nx-texto";
    const fuerte = document.createElement("strong");
    fuerte.textContent = "@" + nombre;
    encabezado.appendChild(fuerte);
    agregarHora(encabezado, fila.created_at);
    cuerpoItem.appendChild(encabezado);

    const contextoTexto = document.createElement("p");
    contextoTexto.className = "nx-contexto";
    contextoTexto.textContent =
      fila.tipo === "respuesta" ? "Respondió a tu comentario" : "Comentó tu publicación";
    cuerpoItem.appendChild(contextoTexto);

    const respuesta = contexto.respuestas[fila.respuesta_id];
    if (respuesta) {
      const comentario = document.createElement("p");
      comentario.className = "nx-comentario";
      comentario.textContent = respuesta.texto;
      cuerpoItem.appendChild(comentario);
    }

    const publicacion = contexto.publicaciones[fila.publicacion_id];
    let miniatura = null;
    if (publicacion) {
      let cita = "";
      if (publicacion.contenido) cita = publicacion.contenido;
      else if (publicacion.rec_titulo) cita = "Recomendación: " + publicacion.rec_titulo;
      else if (publicacion.imagen_url) cita = "Imagen";

      if (cita) {
        const citaTexto = document.createElement("p");
        citaTexto.className = "nx-cita";
        citaTexto.textContent = "Tu publicación: " + recortar(cita);
        cuerpoItem.appendChild(citaTexto);
      }
      miniatura = publicacion.imagen_url || publicacion.rec_portada_url || null;
    }

    item.appendChild(cuerpoItem);

    if (miniatura) {
      const imagen = document.createElement("img");
      imagen.className = "nx-miniatura";
      imagen.src = miniatura;
      imagen.alt = "Imagen de la publicación";
      imagen.loading = "lazy";
      item.appendChild(imagen);
    }

    const destino = "publicacion.html?id=" + encodeURIComponent(fila.publicacion_id);
    item.addEventListener("click", function () {
      abrir(grupo, destino);
    });

    return item;
  }

  async function cargar() {
    lista.textContent = "Cargando...";

    let consulta = supabaseClient
      .from("notificaciones")
      .select("id, tipo, actor_id, publicacion_id, respuesta_id, leida, created_at")
      .eq("destinatario_id", sesion.user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const filtro = FILTROS[filtroActual];
    if (filtro) consulta = consulta.in("tipo", filtro);

    const { data: filas, error } = await consulta;

    if (error) {
      lista.textContent = "No se pudieron cargar las notificaciones.";
      return;
    }

    if (filas.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "nx-vacio";
      vacio.textContent = "Todavía no tenés notificaciones acá.";
      lista.replaceChildren(vacio);
      return;
    }

    const grupos = [];
    const indice = {};
    filas.forEach(function (fila) {
      if (fila.tipo === "me_gusta" || fila.tipo === "repost") {
        const clave = fila.tipo + ":" + fila.publicacion_id;
        if (indice[clave] === undefined) {
          indice[clave] = grupos.length;
          grupos.push({ tipo: fila.tipo, publicacion_id: fila.publicacion_id, filas: [fila] });
        } else {
          grupos[indice[clave]].filas.push(fila);
        }
      } else {
        grupos.push({ tipo: fila.tipo, publicacion_id: fila.publicacion_id, filas: [fila] });
      }
    });

    const idsActores = [];
    const idsPublicaciones = [];
    const idsRespuestas = [];
    filas.forEach(function (fila) {
      if (!idsActores.includes(fila.actor_id)) idsActores.push(fila.actor_id);
      if (fila.publicacion_id && !idsPublicaciones.includes(fila.publicacion_id)) {
        idsPublicaciones.push(fila.publicacion_id);
      }
      if (fila.respuesta_id && !idsRespuestas.includes(fila.respuesta_id)) {
        idsRespuestas.push(fila.respuesta_id);
      }
    });

    const nombres = {};
    const fotos = {};
    const { data: perfiles } = await supabaseClient
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", idsActores);
    (perfiles || []).forEach(function (perfil) {
      nombres[perfil.id] = perfil.username;
      fotos[perfil.id] = perfil.avatar_url;
    });

    const publicaciones = {};
    if (idsPublicaciones.length > 0) {
      const { data } = await supabaseClient
        .from("muro_publicaciones")
        .select("id, contenido, rec_titulo, imagen_url, rec_portada_url")
        .in("id", idsPublicaciones);
      (data || []).forEach(function (fila) {
        publicaciones[fila.id] = fila;
      });
    }

    const respuestas = {};
    if (idsRespuestas.length > 0) {
      const { data } = await supabaseClient
        .from("respuestas")
        .select("id, texto")
        .in("id", idsRespuestas);
      (data || []).forEach(function (fila) {
        respuestas[fila.id] = fila;
      });
    }

    const contexto = {
      nombres: nombres,
      fotos: fotos,
      publicaciones: publicaciones,
      respuestas: respuestas
    };

    const fragmento = document.createDocumentFragment();
    grupos.forEach(function (grupo) {
      if (grupo.tipo === "comentario" || grupo.tipo === "respuesta") {
        fragmento.appendChild(crearItemComentario(grupo, contexto));
      } else {
        fragmento.appendChild(crearItemAgrupado(grupo, contexto));
      }
    });
    lista.replaceChildren(fragmento);
  }

  pestanas.forEach(function (pestana) {
    pestana.addEventListener("click", function () {
      filtroActual = pestana.dataset.filtro;
      pestanas.forEach(function (otra) {
        otra.classList.toggle("activa", otra === pestana);
      });
      cargar();
    });
  });

  botonMarcar.addEventListener("click", async function () {
    botonMarcar.disabled = true;
    await supabaseClient
      .from("notificaciones")
      .update({ leida: true })
      .eq("destinatario_id", sesion.user.id)
      .eq("leida", false);
    botonMarcar.disabled = false;
    cargar();
  });

  cargar();
})();
