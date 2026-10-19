const COLORES_AVATAR = ["#e0529a", "#7b3fe4", "#c2418c", "#6a35c9", "#d94f8a", "#8a4fe8", "#b8387f", "#5d2fb8"];

function icono(ruta) {
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ruta + "</svg>";
}

const ICONOS = {
  comentario: icono('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>'),
  repost: icono('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  corazon: icono('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>')
};

const parametros = new URLSearchParams(window.location.search);
const publicacionId = parametros.get("id");

const estado = document.getElementById("estado-detalle");
const contenido = document.getElementById("contenido");
const contenedorPublicacion = document.getElementById("publicacion");
const compositorRespuesta = document.getElementById("compositor-respuesta");
const avatarRespuesta = document.getElementById("avatar-respuesta");
const textoRespuesta = document.getElementById("texto-respuesta");
const botonResponder = document.getElementById("boton-responder");
const avisoRespuesta = document.getElementById("aviso-respuesta");
const mensajeRespuesta = document.getElementById("mensaje-respuesta");
const listaRespuestas = document.getElementById("lista-respuestas");
const avisoFlotante = document.getElementById("aviso-flotante");

let sesion = null;
let numeroComentarios = null;
let temporizadorAviso = null;

function avisar(texto) {
  avisoFlotante.textContent = texto;
  avisoFlotante.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(function () {
    avisoFlotante.hidden = true;
  }, 3000);
}

function mostrarMensaje(texto, tipo) {
  mensajeRespuesta.textContent = texto;
  mensajeRespuesta.className = "muro-mensaje " + tipo;
}

function colorDe(texto) {
  let valor = 0;
  for (let i = 0; i < texto.length; i++) {
    valor = (valor * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return COLORES_AVATAR[valor % COLORES_AVATAR.length];
}

function crearAvatar(nombre, userId, pequeno) {
  const elemento = document.createElement(userId ? "a" : "div");
  elemento.className = "avatar" + (pequeno ? " pequeno" : "");
  elemento.style.background = colorDe(nombre);
  elemento.textContent = nombre.charAt(0).toUpperCase();
  if (userId) {
    elemento.href = "perfil.html?id=" + encodeURIComponent(userId);
    elemento.setAttribute("aria-label", "Perfil de " + nombre);
  }
  return elemento;
}

function fechaRelativa(iso) {
  const segundos = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (segundos < 60) return "ahora";
  if (segundos < 3600) return "hace " + Math.floor(segundos / 60) + " min";
  if (segundos < 86400) return "hace " + Math.floor(segundos / 3600) + " h";
  if (segundos < 604800) return "hace " + Math.floor(segundos / 86400) + " d";
  return new Date(iso).toLocaleDateString("es");
}

async function borrarArchivo(bucket, direccion) {
  if (!direccion) return;
  const partes = direccion.split("/" + bucket + "/");
  if (partes.length !== 2) return;
  await supabaseClient.storage.from(bucket).remove([decodeURIComponent(partes[1])]);
}

function crearBloqueRecomendacion(post) {
  const enlazada = !!post.recomendacion_id;
  const bloque = document.createElement(enlazada ? "a" : "div");
  bloque.className = "rec-tarjeta";

  if (enlazada) {
    bloque.href = "recomendacion.html?id=" + encodeURIComponent(post.recomendacion_id);
    bloque.style.color = "inherit";
    bloque.style.textDecoration = "none";
  }

  if (post.rec_portada_url) {
    const portada = document.createElement("img");
    portada.className = "rec-portada";
    portada.src = post.rec_portada_url;
    portada.alt = "Portada de " + post.rec_titulo;
    portada.loading = "lazy";
    bloque.appendChild(portada);
  }

  const info = document.createElement("div");
  info.className = "rec-info";

  const etiqueta = document.createElement("span");
  etiqueta.className = "rec-etiqueta";
  etiqueta.textContent = "RECOMENDACIÓN";

  const titulo = document.createElement("p");
  titulo.className = "rec-titulo-texto";
  titulo.textContent = post.rec_titulo;

  const autor = document.createElement("p");
  autor.className = "rec-autor";
  autor.textContent = "de " + post.rec_autor;

  const sinopsis = document.createElement("p");
  sinopsis.className = "rec-sinopsis";
  sinopsis.textContent = post.rec_sinopsis;

  const generos = document.createElement("div");
  generos.className = "rec-generos";
  (post.rec_generos || []).forEach(function (genero) {
    const chip = document.createElement("span");
    chip.className = "rec-genero";
    chip.textContent = genero;
    generos.appendChild(chip);
  });

  info.appendChild(etiqueta);
  info.appendChild(titulo);
  info.appendChild(autor);
  info.appendChild(sinopsis);
  info.appendChild(generos);

  if (enlazada) {
    const ver = document.createElement("p");
    ver.className = "rec-autor";
    ver.style.color = "#7b3fe4";
    ver.style.fontWeight = "700";
    ver.textContent = "Ver y calificar →";
    info.appendChild(ver);
  }

  bloque.appendChild(info);
  return bloque;
}

function crearBotonAccion(clase, iconoHtml, cantidad, etiqueta) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "accion " + clase;
  boton.setAttribute("aria-label", etiqueta);
  boton.innerHTML = iconoHtml + '<span class="accion-num"></span>';
  boton.querySelector(".accion-num").textContent = cantidad;
  return boton;
}

function configurarMeGusta(boton, post, activoInicial) {
  let activo = activoInicial;
  let cantidad = Number(post.me_gusta);
  let ocupado = false;
  const numero = boton.querySelector(".accion-num");

  function pintar() {
    boton.classList.toggle("activa", activo);
    boton.setAttribute("aria-pressed", activo ? "true" : "false");
    numero.textContent = cantidad;
  }

  pintar();

  boton.addEventListener("click", async function () {
    if (!sesion) {
      avisar("Iniciá sesión para dar Me gusta.");
      return;
    }
    if (ocupado) return;
    ocupado = true;

    if (activo) {
      const { error } = await supabaseClient
        .from("me_gusta")
        .delete()
        .eq("publicacion_id", post.id)
        .eq("user_id", sesion.user.id);
      if (error) {
        avisar("No se pudo quitar el Me gusta.");
      } else {
        activo = false;
        cantidad = Math.max(0, cantidad - 1);
      }
    } else {
      const { error } = await supabaseClient
        .from("me_gusta")
        .insert({ publicacion_id: post.id });
      if (!error) {
        activo = true;
        cantidad += 1;
      } else if (error.code === "23505") {
        activo = true;
      } else {
        avisar("No se pudo dar Me gusta.");
      }
    }

    pintar();
    ocupado = false;
  });
}

function configurarRepost(boton, post, activoInicial) {
  let activo = activoInicial;
  let cantidad = Number(post.reposts);
  let ocupado = false;
  const numero = boton.querySelector(".accion-num");

  function pintar() {
    boton.classList.toggle("activa", activo);
    boton.setAttribute("aria-pressed", activo ? "true" : "false");
    numero.textContent = cantidad;
  }

  pintar();

  boton.addEventListener("click", async function () {
    if (!sesion) {
      avisar("Iniciá sesión para repostear.");
      return;
    }
    if (ocupado) return;
    ocupado = true;

    if (activo) {
      const { error } = await supabaseClient
        .from("publicaciones")
        .delete()
        .eq("repost_de", post.id)
        .eq("user_id", sesion.user.id);
      if (error) {
        avisar("No se pudo quitar el repost.");
      } else {
        activo = false;
        cantidad = Math.max(0, cantidad - 1);
      }
    } else {
      const { error } = await supabaseClient
        .from("publicaciones")
        .insert({ repost_de: post.id });
      if (!error) {
        activo = true;
        cantidad += 1;
      } else if (error.code === "23505") {
        activo = true;
      } else {
        avisar("No se pudo repostear.");
      }
    }

    pintar();
    ocupado = false;
  });
}

async function borrarPublicacion(post) {
  if (!confirm("¿Borrar esta publicación? También se borrarán sus comentarios, Me gusta y reposts.")) return;

  const { error } = await supabaseClient
    .from("publicaciones")
    .delete()
    .eq("id", post.id);

  if (error) {
    avisar("No se pudo borrar la publicación.");
    return;
  }

  await borrarArchivo("muro", post.imagen_url);
  if (!post.recomendacion_id) {
    await borrarArchivo("portadas", post.rec_portada_url);
  }
  window.location.href = "foro.html";
}

function construirPublicacion(post, nombre, meGustaInicial, repostInicial) {
  const fila = document.createElement("div");
  fila.className = "post-fila";
  fila.appendChild(crearAvatar(nombre, post.user_id, false));

  const cuerpo = document.createElement("div");
  cuerpo.className = "post-cuerpo";

  const cabecera = document.createElement("div");
  cabecera.className = "post-cabecera";

  const enlaceNombre = document.createElement("a");
  enlaceNombre.className = "post-nombre";
  enlaceNombre.href = "perfil.html?id=" + encodeURIComponent(post.user_id);
  enlaceNombre.textContent = nombre;

  const fecha = document.createElement("span");
  fecha.className = "post-fecha";
  fecha.textContent = fechaRelativa(post.created_at);
  fecha.title = new Date(post.created_at).toLocaleString("es");

  cabecera.appendChild(enlaceNombre);
  cabecera.appendChild(fecha);
  cuerpo.appendChild(cabecera);

  if (post.titulo) {
    const titulo = document.createElement("p");
    titulo.className = "post-titulo";
    titulo.textContent = post.titulo;
    cuerpo.appendChild(titulo);
  }

  if (post.contenido) {
    const texto = document.createElement("p");
    texto.className = "post-texto";
    texto.textContent = post.contenido;
    cuerpo.appendChild(texto);
  }

  if (post.imagen_url) {
    const enlaceImagen = document.createElement("a");
    enlaceImagen.className = "post-imagen";
    enlaceImagen.href = post.imagen_url;
    enlaceImagen.target = "_blank";
    enlaceImagen.rel = "noopener";
    const imagen = document.createElement("img");
    imagen.src = post.imagen_url;
    imagen.alt = "Imagen de la publicación";
    imagen.loading = "lazy";
    enlaceImagen.appendChild(imagen);
    cuerpo.appendChild(enlaceImagen);
  }

  if (post.rec_titulo) {
    cuerpo.appendChild(crearBloqueRecomendacion(post));
  }

  const acciones = document.createElement("div");
  acciones.className = "post-acciones";

  const comentarios = document.createElement("span");
  comentarios.className = "accion";
  comentarios.style.pointerEvents = "none";
  comentarios.setAttribute("aria-label", "Comentarios");
  comentarios.innerHTML = ICONOS.comentario + '<span class="accion-num"></span>';
  numeroComentarios = comentarios.querySelector(".accion-num");
  numeroComentarios.textContent = Number(post.comentarios);

  const botonMeGusta = crearBotonAccion("me-gusta", ICONOS.corazon, Number(post.me_gusta), "Me gusta");
  const botonRepost = crearBotonAccion("repost", ICONOS.repost, Number(post.reposts), "Repostear");

  configurarMeGusta(botonMeGusta, post, meGustaInicial);
  configurarRepost(botonRepost, post, repostInicial);

  acciones.appendChild(comentarios);
  acciones.appendChild(botonMeGusta);
  acciones.appendChild(botonRepost);

  if (sesion && post.user_id === sesion.user.id) {
    const borrar = document.createElement("button");
    borrar.type = "button";
    borrar.className = "accion borrar";
    borrar.textContent = "Borrar";
    borrar.addEventListener("click", function () {
      borrarPublicacion(post);
    });
    acciones.appendChild(borrar);
  }

  cuerpo.appendChild(acciones);
  fila.appendChild(cuerpo);
  contenedorPublicacion.appendChild(fila);
}

function crearRespuesta(respuesta, nombre) {
  const caja = document.createElement("div");
  caja.className = "respuesta";
  caja.appendChild(crearAvatar(nombre, respuesta.user_id, true));

  const cuerpo = document.createElement("div");
  cuerpo.className = "respuesta-cuerpo";

  const cabecera = document.createElement("div");
  cabecera.className = "post-cabecera";

  const enlaceNombre = document.createElement("a");
  enlaceNombre.className = "post-nombre";
  enlaceNombre.href = "perfil.html?id=" + encodeURIComponent(respuesta.user_id);
  enlaceNombre.textContent = nombre;

  const fecha = document.createElement("span");
  fecha.className = "post-fecha";
  fecha.textContent = fechaRelativa(respuesta.created_at);
  fecha.title = new Date(respuesta.created_at).toLocaleString("es");

  cabecera.appendChild(enlaceNombre);
  cabecera.appendChild(fecha);

  const texto = document.createElement("p");
  texto.className = "respuesta-texto";
  texto.textContent = respuesta.texto;

  cuerpo.appendChild(cabecera);
  cuerpo.appendChild(texto);

  if (sesion && sesion.user.id === respuesta.user_id) {
    const borrar = document.createElement("button");
    borrar.type = "button";
    borrar.className = "respuesta-borrar";
    borrar.textContent = "Borrar";
    borrar.addEventListener("click", async function () {
      if (!confirm("¿Borrar tu comentario?")) return;
      const { error } = await supabaseClient
        .from("respuestas")
        .delete()
        .eq("id", respuesta.id);
      if (error) {
        avisar("No se pudo borrar el comentario.");
        return;
      }
      cargarRespuestas();
    });
    cuerpo.appendChild(borrar);
  }

  caja.appendChild(cuerpo);
  return caja;
}

async function cargarRespuestas() {
  const { data, error } = await supabaseClient
    .from("respuestas")
    .select("id, texto, created_at, user_id")
    .eq("publicacion_id", publicacionId)
    .order("created_at", { ascending: true });

  if (error) {
    listaRespuestas.textContent = "No se pudieron cargar los comentarios.";
    return;
  }

  numeroComentarios.textContent = data.length;

  if (data.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "muro-vacio";
    vacio.textContent = "Todavía no hay comentarios. ¡Escribí el primero!";
    listaRespuestas.replaceChildren(vacio);
    return;
  }

  const ids = [];
  data.forEach(function (respuesta) {
    if (!ids.includes(respuesta.user_id)) ids.push(respuesta.user_id);
  });

  const nombres = {};
  const { data: perfiles } = await supabaseClient
    .from("profiles")
    .select("id, username")
    .in("id", ids);
  (perfiles || []).forEach(function (perfil) {
    nombres[perfil.id] = perfil.username;
  });

  const fragmento = document.createDocumentFragment();
  data.forEach(function (respuesta) {
    fragmento.appendChild(crearRespuesta(respuesta, nombres[respuesta.user_id] || "usuario"));
  });
  listaRespuestas.replaceChildren(fragmento);
}

botonResponder.addEventListener("click", async function () {
  if (!sesion) return;

  const texto = textoRespuesta.value.trim();
  if (!texto) {
    mostrarMensaje("Escribí algo antes de comentar.", "error");
    return;
  }

  botonResponder.disabled = true;

  const { error } = await supabaseClient
    .from("respuestas")
    .insert({ publicacion_id: publicacionId, texto: texto });

  botonResponder.disabled = false;

  if (error) {
    mostrarMensaje("No se pudo publicar el comentario.", "error");
    return;
  }

  textoRespuesta.value = "";
  mostrarMensaje("", "");
  cargarRespuestas();
});

async function iniciar() {
  if (!publicacionId) {
    estado.textContent = "No encontramos esa publicación.";
    return;
  }

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  sesion = datosSesion.session;

  const { data: post, error } = await supabaseClient
    .from("muro_publicaciones")
    .select("*")
    .eq("id", publicacionId)
    .maybeSingle();

  if (error || !post) {
    estado.textContent = "No encontramos esa publicación.";
    return;
  }

  if (post.repost_de) {
    window.location.replace("publicacion.html?id=" + encodeURIComponent(post.repost_de));
    return;
  }

  const { data: autor } = await supabaseClient
    .from("profiles")
    .select("username")
    .eq("id", post.user_id)
    .maybeSingle();
  const nombre = autor ? autor.username : "usuario";

  let meGustaInicial = false;
  let repostInicial = false;

  if (sesion) {
    const { data: miMeGusta } = await supabaseClient
      .from("me_gusta")
      .select("publicacion_id")
      .eq("publicacion_id", post.id)
      .eq("user_id", sesion.user.id)
      .maybeSingle();
    meGustaInicial = !!miMeGusta;

    const { data: miRepost } = await supabaseClient
      .from("publicaciones")
      .select("id")
      .eq("repost_de", post.id)
      .eq("user_id", sesion.user.id)
      .maybeSingle();
    repostInicial = !!miRepost;

    const { data: miPerfil } = await supabaseClient
      .from("profiles")
      .select("username")
      .eq("id", sesion.user.id)
      .maybeSingle();
    avatarRespuesta.replaceWith(
      crearAvatar(miPerfil ? miPerfil.username : "usuario", null, true)
    );
    compositorRespuesta.hidden = false;
  } else {
    avisoRespuesta.hidden = false;
  }

  const resumen = post.contenido ? post.contenido.slice(0, 40) : "publicación";
  document.title = nombre + ": " + resumen + " - YuriWorld";

  construirPublicacion(post, nombre, meGustaInicial, repostInicial);

  estado.hidden = true;
  contenido.hidden = false;

  cargarRespuestas();
}

iniciar();
