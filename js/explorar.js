(async function () {
  const cuerpo = document.getElementById("ex-cuerpo");
  const formulario = document.getElementById("ex-form");
  const entrada = document.getElementById("ex-q");
  const botonBorrar = document.getElementById("ex-borrar");
  const botonesPestana = document.querySelectorAll(".ex-pestana");
  const avatarBarra = document.getElementById("ex-avatar");
  const navPerfil = document.getElementById("nav-perfil");

  const GENEROS = ["Romance", "Drama", "Comedia", "Fantasía", "Escolar", "Slice of life", "Ciencia ficción", "Misterio", "Histórico", "Sobrenatural"];
  GENEROS.push("Romance y comedia (RomCom)", "Drama romántico", "Psicológico", "Fantasía oscura", "Suspenso", "Terror", "Acción", "Aventura", "Tragedia", "Musical", "Deporte", "Erótico");
  const COLORES_AVATAR = ["#e0529a", "#7b3fe4", "#c2418c", "#6a35c9", "#d94f8a", "#8a4fe8", "#b8387f", "#5d2fb8"];

  let pestana = "todo";
  let consulta = "";
  let temporizador = null;
  let turnoBusqueda = 0;

  const misSeguidos = new Set();
  const bloqueados = new Set();

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesionId = datosSesion.session ? datosSesion.session.user.id : null;

  navPerfil.href = sesionId ? "perfil.html?mi=" + Date.now() : "iniciar-sesion.html";

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

  function quitarTildes(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function limpiarTexto(texto) {
    return texto.replace(/[,()%*\\"]/g, " ").trim();
  }

  function recortar(texto, largo) {
    if (!texto) return "";
    return texto.length > largo ? texto.slice(0, largo) + "…" : texto;
  }

  function fechaRelativa(iso) {
    const segundos = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (segundos < 60) return "ahora";
    if (segundos < 3600) return "hace " + Math.floor(segundos / 60) + " min";
    if (segundos < 86400) return "hace " + Math.floor(segundos / 3600) + " h";
    if (segundos < 604800) return "hace " + Math.floor(segundos / 86400) + " d";
    return new Date(iso).toLocaleDateString("es");
  }

  if (sesionId) {
    const { data: miPerfil } = await supabaseClient
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", sesionId)
      .maybeSingle();
    pintarAvatar(
      avatarBarra,
      miPerfil ? miPerfil.username : "usuario",
      miPerfil ? miPerfil.avatar_url : null
    );
    avatarBarra.href = "perfil.html?mi=" + Date.now();

    const { data: seguidos } = await supabaseClient
      .from("seguidores")
      .select("seguido_id")
      .eq("seguidor_id", sesionId)
      .limit(1000);
    (seguidos || []).forEach(function (fila) {
      misSeguidos.add(fila.seguido_id);
    });

    const { data: misBloqueos } = await supabaseClient
      .from("bloqueos")
      .select("bloqueado_id")
      .eq("bloqueador_id", sesionId);
    (misBloqueos || []).forEach(function (fila) {
      bloqueados.add(fila.bloqueado_id);
    });
  } else {
    pintarAvatar(avatarBarra, "?", null);
    avatarBarra.style.background = "#b9a9d4";
    avatarBarra.href = "iniciar-sesion.html";
  }

  function crearMensaje(texto) {
    const mensaje = document.createElement("p");
    mensaje.className = "ex-vacio";
    mensaje.textContent = texto;
    return mensaje;
  }

  function crearSeccion(titulo, nodos, alVerMas) {
    const seccion = document.createElement("section");
    seccion.className = "ex-seccion";

    const encabezado = document.createElement("h2");
    encabezado.className = "ex-titulo";
    encabezado.textContent = titulo;
    seccion.appendChild(encabezado);

    nodos.forEach(function (nodo) {
      seccion.appendChild(nodo);
    });

    if (alVerMas) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "ex-mas";
      boton.textContent = "Ver más";
      boton.addEventListener("click", alVerMas);
      seccion.appendChild(boton);
    }

    return seccion;
  }

  function crearBotonSeguir(usuarioId, nombre) {
    let siguiendo = misSeguidos.has(usuarioId);
    const boton = document.createElement("button");
    boton.type = "button";

    function pintar() {
      boton.textContent = siguiendo ? "Siguiendo" : "Seguir";
      boton.className = "ex-boton" + (siguiendo ? "" : " seguir");
    }

    pintar();

    boton.addEventListener("click", async function () {
      if (!sesionId) {
        window.location.href = "iniciar-sesion.html";
        return;
      }

      boton.disabled = true;

      if (siguiendo) {
        if (!confirm("¿Dejar de seguir a @" + nombre + "?")) {
          boton.disabled = false;
          return;
        }
        const { error } = await supabaseClient
          .from("seguidores")
          .delete()
          .eq("seguidor_id", sesionId)
          .eq("seguido_id", usuarioId);
        if (error) {
          alert("No se pudo dejar de seguir.");
        } else {
          siguiendo = false;
          misSeguidos.delete(usuarioId);
        }
      } else {
        const { error } = await supabaseClient
          .from("seguidores")
          .insert({ seguido_id: usuarioId });
        if (!error || error.code === "23505") {
          siguiendo = true;
          misSeguidos.add(usuarioId);
        } else {
          alert("No se pudo seguir a este usuario.");
        }
      }

      pintar();
      boton.disabled = false;
    });

    return boton;
  }

  function crearFilaPersona(perfil) {
    const fila = document.createElement("div");
    fila.className = "ex-fila";

    const avatar = document.createElement("a");
    avatar.className = "ex-avatar";
    avatar.href = "perfil.html?id=" + encodeURIComponent(perfil.id);
    pintarAvatar(avatar, perfil.username, perfil.avatar_url);

    const info = document.createElement("div");
    info.className = "ex-info";

    const nombre = document.createElement("a");
    nombre.className = "ex-nombre";
    nombre.href = "perfil.html?id=" + encodeURIComponent(perfil.id);
    nombre.textContent = "@" + perfil.username;
    info.appendChild(nombre);

    if (perfil.descripcion) {
      const descripcion = document.createElement("p");
      descripcion.className = "ex-desc";
      descripcion.textContent = recortar(perfil.descripcion, 90);
      info.appendChild(descripcion);
    }

    fila.appendChild(avatar);
    fila.appendChild(info);

    if (perfil.id !== sesionId) {
      fila.appendChild(crearBotonSeguir(perfil.id, perfil.username));
    }

    return fila;
  }

  function crearFilaObra(rec, resumen) {
    const enlace = document.createElement("a");
    enlace.className = "ex-obra";
    enlace.href = "recomendacion.html?id=" + encodeURIComponent(rec.id);

    const portada = document.createElement("img");
    portada.className = "ex-portada";
    portada.src = rec.portada_url;
    portada.alt = "Portada de " + rec.titulo;
    portada.loading = "lazy";

    const info = document.createElement("div");
    info.className = "ex-info";

    const titulo = document.createElement("p");
    titulo.className = "ex-obra-titulo";
    titulo.textContent = rec.titulo;

    const autor = document.createElement("p");
    autor.className = "ex-obra-datos";
    autor.textContent = "de " + rec.autor;

    const estrellas = document.createElement("p");
    estrellas.className = "ex-obra-datos ex-estrellas";
    if (resumen) {
      estrellas.textContent =
        "★ " + resumen.promedio + " · " + resumen.cantidad +
        (resumen.cantidad === 1 ? " voto" : " votos");
    } else {
      estrellas.textContent = "☆ Sin calificaciones";
    }

    const generos = document.createElement("div");
    generos.className = "ex-generos";
    (rec.generos || []).slice(0, 3).forEach(function (genero) {
      const chip = document.createElement("span");
      chip.className = "ex-genero";
      chip.textContent = genero;
      generos.appendChild(chip);
    });

    info.appendChild(titulo);
    info.appendChild(autor);
    info.appendChild(estrellas);
    info.appendChild(generos);

    enlace.appendChild(portada);
    enlace.appendChild(info);
    return enlace;
  }

  async function nodosDeObras(recs) {
    if (recs.length === 0) return [];

    const ids = recs.map(function (rec) {
      return rec.id;
    });

    const { data } = await supabaseClient
      .from("resumen_calificaciones")
      .select("recomendacion_id, promedio, cantidad")
      .in("recomendacion_id", ids);

    const mapa = {};
    (data || []).forEach(function (fila) {
      mapa[fila.recomendacion_id] = fila;
    });

    return recs.map(function (rec) {
      return crearFilaObra(rec, mapa[rec.id]);
    });
  }

  function crearFilaPublicacion(post, nombres, fotos) {
    const enlace = document.createElement("a");
    enlace.className = "ex-post";
    enlace.href = "publicacion.html?id=" + encodeURIComponent(post.id);

    const nombre = nombres[post.user_id] || "usuario";

    const avatar = document.createElement("span");
    avatar.className = "ex-avatar";
    pintarAvatar(avatar, nombre, fotos[post.user_id]);

    const cuerpoPost = document.createElement("div");
    cuerpoPost.className = "ex-info";

    const cabecera = document.createElement("p");
    cabecera.className = "ex-post-cabecera";
    const fuerte = document.createElement("strong");
    fuerte.textContent = "@" + nombre;
    const fecha = document.createElement("span");
    fecha.textContent = " · " + fechaRelativa(post.created_at);
    cabecera.appendChild(fuerte);
    cabecera.appendChild(fecha);

    let texto = post.contenido || "";
    if (!texto && post.rec_titulo) texto = "Recomendación: " + post.rec_titulo;
    if (!texto && post.imagen_url) texto = "Imagen";

    const parrafo = document.createElement("p");
    parrafo.className = "ex-post-texto";
    parrafo.textContent = recortar(texto, 160);

    const datos = document.createElement("p");
    datos.className = "ex-post-datos";
    datos.textContent =
      Number(post.comentarios) + " comentarios · " + Number(post.me_gusta) + " Me gusta";

    cuerpoPost.appendChild(cabecera);
    cuerpoPost.appendChild(parrafo);
    cuerpoPost.appendChild(datos);

    enlace.appendChild(avatar);
    enlace.appendChild(cuerpoPost);
    return enlace;
  }

  async function nodosDePublicaciones(posts) {
    if (posts.length === 0) return [];

    const ids = [];
    posts.forEach(function (post) {
      if (!ids.includes(post.user_id)) ids.push(post.user_id);
    });

    const nombres = {};
    const fotos = {};
    const { data } = await supabaseClient
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", ids);
    (data || []).forEach(function (perfil) {
      nombres[perfil.id] = perfil.username;
      fotos[perfil.id] = perfil.avatar_url;
    });

    return posts.map(function (post) {
      return crearFilaPublicacion(post, nombres, fotos);
    });
  }

  async function personasParaSeguir(limite) {
    const { data } = await supabaseClient
      .from("profiles")
      .select("id, username, avatar_url, descripcion")
      .order("created_at", { ascending: false })
      .limit(60);

    return (data || [])
      .filter(function (perfil) {
        return perfil.id !== sesionId && !misSeguidos.has(perfil.id) && !bloqueados.has(perfil.id);
      })
      .slice(0, limite);
  }

  async function mejorPuntuadas(limite) {
    const { data: resumenes } = await supabaseClient
      .from("resumen_calificaciones")
      .select("recomendacion_id, promedio, cantidad")
      .order("promedio", { ascending: false })
      .order("cantidad", { ascending: false })
      .limit(limite);

    if (!resumenes || resumenes.length === 0) return [];

    const ids = resumenes.map(function (fila) {
      return fila.recomendacion_id;
    });

    const { data: recs } = await supabaseClient
      .from("recomendaciones")
      .select("id, titulo, autor, generos, portada_url")
      .in("id", ids);

    const porId = {};
    (recs || []).forEach(function (rec) {
      porId[rec.id] = rec;
    });

    return ids
      .map(function (id) {
        return porId[id];
      })
      .filter(Boolean);
  }

  async function obrasRecientes(limite) {
    const { data } = await supabaseClient
      .from("recomendaciones")
      .select("id, titulo, autor, generos, portada_url")
      .order("created_at", { ascending: false })
      .limit(limite);
    return data || [];
  }

  async function publicacionesRecientes(limite) {
    const { data } = await supabaseClient
      .from("muro_publicaciones")
      .select("*")
      .is("repost_de", null)
      .order("created_at", { ascending: false })
      .limit(limite);
    return data || [];
  }

  async function buscarPersonas(q, limite) {
    const t = limpiarTexto(q);
    if (!t) return [];
    const { data } = await supabaseClient
      .from("profiles")
      .select("id, username, avatar_url, descripcion")
      .or("username.ilike.%" + t + "%,descripcion.ilike.%" + t + "%")
      .limit(limite);
    return data || [];
  }

  async function buscarObras(q, limite) {
    const t = limpiarTexto(q);
    if (!t) return [];

    const { data: porTexto } = await supabaseClient
      .from("recomendaciones")
      .select("id, titulo, autor, generos, portada_url")
      .or("titulo.ilike.%" + t + "%,autor.ilike.%" + t + "%")
      .order("created_at", { ascending: false })
      .limit(limite);

    const resultado = porTexto || [];

    const genero = GENEROS.find(function (nombre) {
      return quitarTildes(nombre) === quitarTildes(t);
    });

    if (genero) {
      const { data: porGenero } = await supabaseClient
        .from("recomendaciones")
        .select("id, titulo, autor, generos, portada_url")
        .contains("generos", [genero])
        .order("created_at", { ascending: false })
        .limit(limite);

      (porGenero || []).forEach(function (rec) {
        if (!resultado.some(function (existente) { return existente.id === rec.id; })) {
          resultado.push(rec);
        }
      });
    }

    return resultado.slice(0, limite);
  }

  async function buscarPublicaciones(q, limite) {
    const t = limpiarTexto(q);
    if (!t) return [];
    const { data } = await supabaseClient
      .from("muro_publicaciones")
      .select("*")
      .is("repost_de", null)
      .ilike("contenido", "%" + t + "%")
      .order("created_at", { ascending: false })
      .limit(limite);
    return data || [];
  }

  function cambiarPestana(nombre) {
    pestana = nombre;
    botonesPestana.forEach(function (boton) {
      boton.classList.toggle("activa", boton.dataset.pestana === nombre);
    });
    cargar();
  }

  function crearGeneros() {
    const contenedor = document.createElement("div");
    contenedor.className = "ex-chips";

    GENEROS.forEach(function (genero) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "ex-chip";
      chip.textContent = genero;
      chip.addEventListener("click", function () {
        entrada.value = genero;
        consulta = genero;
        botonBorrar.hidden = false;
        cambiarPestana("obras");
      });
      contenedor.appendChild(chip);
    });

    return crearSeccion("Géneros", [contenedor], null);
  }

  async function armarDescubrir() {
    const nodos = [];

    if (pestana === "todo" || pestana === "obras") {
      nodos.push(crearGeneros());
    }

    if (pestana === "todo") {
      const mejores = await mejorPuntuadas(5);
      if (mejores.length > 0) {
        nodos.push(
          crearSeccion("Obras mejor puntuadas", await nodosDeObras(mejores), function () {
            cambiarPestana("obras");
          })
        );
      }

      const personas = await personasParaSeguir(4);
      if (personas.length > 0) {
        nodos.push(
          crearSeccion("Personas para seguir", personas.map(crearFilaPersona), function () {
            cambiarPestana("personas");
          })
        );
      }

      const recientes = await obrasRecientes(5);
      if (recientes.length > 0) {
        nodos.push(crearSeccion("Recomendaciones recientes", await nodosDeObras(recientes), null));
      }
    }

    if (pestana === "personas") {
      const personas = await personasParaSeguir(30);
      if (personas.length > 0) {
        nodos.push(crearSeccion("Personas para seguir", personas.map(crearFilaPersona), null));
      }
    }

    if (pestana === "obras") {
      const mejores = await mejorPuntuadas(10);
      if (mejores.length > 0) {
        nodos.push(crearSeccion("Obras mejor puntuadas", await nodosDeObras(mejores), null));
      }
      const recientes = await obrasRecientes(20);
      if (recientes.length > 0) {
        nodos.push(crearSeccion("Recomendaciones recientes", await nodosDeObras(recientes), null));
      }
    }

    if (pestana === "publicaciones") {
      const posts = await publicacionesRecientes(20);
      if (posts.length > 0) {
        nodos.push(crearSeccion("Publicaciones recientes", await nodosDePublicaciones(posts), null));
      }
    }

    if (nodos.length === 0 || (nodos.length === 1 && pestana === "obras")) {
      if (nodos.length === 0) nodos.push(crearMensaje("Todavía no hay nada para mostrar."));
    }

    return nodos;
  }

  async function armarResultados() {
    const q = consulta;

    if (pestana === "personas") {
      const personas = await buscarPersonas(q, 30);
      return personas.length > 0
        ? personas.map(crearFilaPersona)
        : [crearMensaje("No encontramos personas para «" + q + "».")];
    }

    if (pestana === "obras") {
      const obras = await buscarObras(q, 30);
      return obras.length > 0
        ? await nodosDeObras(obras)
        : [crearMensaje("No encontramos obras para «" + q + "».")];
    }

    if (pestana === "publicaciones") {
      const posts = await buscarPublicaciones(q, 30);
      return posts.length > 0
        ? await nodosDePublicaciones(posts)
        : [crearMensaje("No encontramos publicaciones para «" + q + "».")];
    }

    const resultados = await Promise.all([
      buscarPersonas(q, 4),
      buscarObras(q, 4),
      buscarPublicaciones(q, 4)
    ]);

    const personas = resultados[0];
    const obras = resultados[1];
    const posts = resultados[2];
    const nodos = [];

    if (personas.length > 0) {
      nodos.push(
        crearSeccion(
          "Personas",
          personas.slice(0, 3).map(crearFilaPersona),
          personas.length > 3
            ? function () {
                cambiarPestana("personas");
              }
            : null
        )
      );
    }

    if (obras.length > 0) {
      nodos.push(
        crearSeccion(
          "Obras",
          await nodosDeObras(obras.slice(0, 3)),
          obras.length > 3
            ? function () {
                cambiarPestana("obras");
              }
            : null
        )
      );
    }

    if (posts.length > 0) {
      nodos.push(
        crearSeccion(
          "Publicaciones",
          await nodosDePublicaciones(posts.slice(0, 3)),
          posts.length > 3
            ? function () {
                cambiarPestana("publicaciones");
              }
            : null
        )
      );
    }

    if (nodos.length === 0) {
      nodos.push(crearMensaje("No encontramos resultados para «" + q + "»."));
    }

    return nodos;
  }

  async function cargar() {
    turnoBusqueda += 1;
    const turno = turnoBusqueda;
    cuerpo.replaceChildren(crearMensaje("Cargando..."));

    let nodos;
    try {
      nodos = consulta ? await armarResultados() : await armarDescubrir();
    } catch (error) {
        nodos = [crearMensaje("No se pudo cargar. Probá de nuevo.")];
    }

    if (turno !== turnoBusqueda) return;
    cuerpo.replaceChildren.apply(cuerpo, nodos);
  }

  entrada.addEventListener("input", function () {
    consulta = entrada.value.trim();
    botonBorrar.hidden = entrada.value.length === 0;
    clearTimeout(temporizador);
    temporizador = setTimeout(cargar, 400);
  });

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    clearTimeout(temporizador);
    consulta = entrada.value.trim();
    cargar();
    entrada.blur();
  });

  botonBorrar.addEventListener("click", function () {
    entrada.value = "";
    consulta = "";
    botonBorrar.hidden = true;
    cargar();
    entrada.focus();
  });

  botonesPestana.forEach(function (boton) {
    boton.addEventListener("click", function () {
      cambiarPestana(boton.dataset.pestana);
    });
  });

  const inicial = new URLSearchParams(window.location.search).get("q");
  if (inicial) {
    entrada.value = inicial;
    consulta = inicial.trim();
    botonBorrar.hidden = false;
  }

  cargar();
})();
