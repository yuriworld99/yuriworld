const COLORES_AVATAR = ["#e0529a", "#7b3fe4", "#c2418c", "#6a35c9", "#d94f8a", "#8a4fe8", "#b8387f", "#5d2fb8"];

function icono(ruta) {
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ruta + "</svg>";
}

const ICONOS = {
  comentario: icono('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>'),
  repost: icono('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  corazon: icono('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>'),
  compartir: icono('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>'),
  puntos: icono('<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'),
  calendario: icono('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>')
};

const parametros = new URLSearchParams(window.location.search);
let perfilId = parametros.get("id");

const estado = document.getElementById("estado-perfil");
const contenido = document.getElementById("contenido-perfil");
const barra = document.getElementById("perfil-barra");
const barraNombre = document.getElementById("barra-nombre");
const barraCuenta = document.getElementById("barra-cuenta");
const botonVolver = document.getElementById("perfil-volver");
const banner = document.getElementById("perfil-banner");
const contenedorAvatar = document.getElementById("perfil-avatar");
const nombrePerfil = document.getElementById("perfil-nombre");
const usuarioPerfil = document.getElementById("perfil-usuario");
const desdePerfil = document.getElementById("perfil-desde");
const cuentaPublicaciones = document.getElementById("cuenta-publicaciones");
const cuentaRecomendaciones = document.getElementById("cuenta-recomendaciones");
const botonesPerfil = document.getElementById("perfil-botones");
const botonCompartir = document.getElementById("boton-compartir-perfil");
const navPerfil = document.getElementById("nav-perfil");
const avisoFlotante = document.getElementById("aviso-flotante");

const PESTANAS = ["publicaciones", "respuestas", "reposts", "multimedia", "recomendaciones"];

let sesion = null;
let nombreActual = "usuario";
let temporizadorAviso = null;
let pestanaActual = "publicaciones";
const yaCargadas = {};

function panel(nombre) {
  return document.getElementById("panel-" + nombre);
}

function avisar(texto) {
  avisoFlotante.textContent = texto;
  avisoFlotante.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(function () {
    avisoFlotante.hidden = true;
  }, 3000);
}

function colorDe(texto) {
  let valor = 0;
  for (let i = 0; i < texto.length; i++) {
    valor = (valor * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return COLORES_AVATAR[valor % COLORES_AVATAR.length];
}

function crearAvatarGrande(nombre, direccion) {
  const elemento = document.createElement("div");
  elemento.className = "avatar";
  elemento.dataset.foto = "1";
  elemento.style.background = colorDe(nombre);
  elemento.textContent = nombre.charAt(0).toUpperCase();
  if (direccion) {
    elemento.style.backgroundImage = 'url("' + direccion + '")';
    elemento.style.backgroundSize = "cover";
    elemento.style.backgroundPosition = "center";
    elemento.textContent = "";
  }
  return elemento;
}

function crearAvatar(nombre, userId) {
  const elemento = document.createElement("a");
  elemento.className = "avatar";
  elemento.style.background = colorDe(nombre);
  elemento.textContent = nombre.charAt(0).toUpperCase();
  elemento.href = "perfil.html?id=" + encodeURIComponent(userId);
  elemento.setAttribute("aria-label", "Perfil de " + nombre);
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

function crearVacio(texto) {
  const vacio = document.createElement("p");
  vacio.className = "perfil-vacio";
  vacio.textContent = texto;
  return vacio;
}

async function borrarArchivo(bucket, direccion) {
  if (!direccion) return;
  const partes = direccion.split("/" + bucket + "/");
  if (partes.length !== 2) return;
  await supabaseClient.storage.from(bucket).remove([decodeURIComponent(partes[1])]);
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

function configurarMeGusta(boton, post, contexto) {
  let activo = contexto.megusta.has(post.id);
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

function configurarRepost(boton, post, contexto) {
  let activo = contexto.reposteados.has(post.id);
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
    let cambio = false;

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
        cambio = true;
      }
    } else {
      const { error } = await supabaseClient
        .from("publicaciones")
        .insert({ repost_de: post.id });
      if (!error) {
        activo = true;
        cantidad += 1;
        cambio = true;
      } else if (error.code === "23505") {
        activo = true;
      } else {
        avisar("No se pudo repostear.");
      }
    }

    pintar();
    ocupado = false;

    if (cambio) {
      yaCargadas.reposts = false;
      if (pestanaActual === "reposts") {
        yaCargadas.reposts = true;
        cargarReposts();
      }
    }
  });
}

async function compartirPublicacion(id) {
  const direccion = new URL(
    "publicacion.html?id=" + encodeURIComponent(id),
    window.location.href
  ).href;

  if (navigator.share) {
    try {
      await navigator.share({ title: "YuriWorld", url: direccion });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(direccion);
    avisar("Enlace copiado.");
  } catch (error) {
    avisar("No se pudo copiar el enlace.");
  }
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
  window.location.reload();
}

function cerrarMenus() {
  document.querySelectorAll(".post-menu").forEach(function (menu) {
    menu.hidden = true;
  });
}

document.addEventListener("click", cerrarMenus);

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

function crearPost(item, contexto) {
  const esRepost = !!item.repost_de;
  const post = esRepost ? contexto.originales[item.repost_de] : item;
  if (!post) return null;

  const tarjeta = document.createElement("article");
  tarjeta.className = "post";

  if (esRepost) {
    const linea = document.createElement("p");
    linea.className = "post-repost";
    linea.innerHTML = ICONOS.repost;
    const quien = contexto.perfiles[item.user_id] || "usuario";
    const texto = document.createElement("span");
    texto.textContent =
      sesion && item.user_id === sesion.user.id ? "Reposteaste" : quien + " reposteó";
    linea.appendChild(texto);
    tarjeta.appendChild(linea);
  }

  const nombre = contexto.perfiles[post.user_id] || "usuario";

  const fila = document.createElement("div");
  fila.className = "post-fila";
  fila.appendChild(crearAvatar(nombre, post.user_id));

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

  if (!esRepost && sesion && post.user_id === sesion.user.id) {
    const botonMenu = document.createElement("button");
    botonMenu.type = "button";
    botonMenu.className = "post-menu-boton";
    botonMenu.setAttribute("aria-label", "Más opciones");
    botonMenu.innerHTML = ICONOS.puntos;

    const menu = document.createElement("div");
    menu.className = "post-menu";
    menu.hidden = true;

    const borrar = document.createElement("button");
    borrar.type = "button";
    borrar.textContent = "Borrar publicación";
    borrar.addEventListener("click", function () {
      menu.hidden = true;
      borrarPublicacion(post);
    });
    menu.appendChild(borrar);

    botonMenu.addEventListener("click", function (evento) {
      evento.stopPropagation();
      const estabaAbierto = !menu.hidden;
      cerrarMenus();
      menu.hidden = estabaAbierto;
    });

    cabecera.appendChild(botonMenu);
    cabecera.appendChild(menu);
  }

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

  const comentar = document.createElement("a");
  comentar.className = "accion";
  comentar.href = "publicacion.html?id=" + encodeURIComponent(post.id);
  comentar.setAttribute("aria-label", "Comentarios");
  comentar.innerHTML = ICONOS.comentario + '<span class="accion-num"></span>';
  comentar.querySelector(".accion-num").textContent = Number(post.comentarios);

  const botonRepost = crearBotonAccion("repost", ICONOS.repost, Number(post.reposts), "Repostear");
  const botonMeGusta = crearBotonAccion("me-gusta", ICONOS.corazon, Number(post.me_gusta), "Me gusta");
  const botonCompartirPost = crearBotonAccion("compartir", ICONOS.compartir, "", "Compartir");

  configurarRepost(botonRepost, post, contexto);
  configurarMeGusta(botonMeGusta, post, contexto);
  botonCompartirPost.addEventListener("click", function () {
    compartirPublicacion(post.id);
  });

  acciones.appendChild(comentar);
  acciones.appendChild(botonRepost);
  acciones.appendChild(botonMeGusta);
  acciones.appendChild(botonCompartirPost);

  cuerpo.appendChild(acciones);
  fila.appendChild(cuerpo);
  tarjeta.appendChild(fila);

  return tarjeta;
}

async function construirContexto(items) {
  const originales = {};
  items.forEach(function (item) {
    originales[item.id] = item;
  });

  const faltantes = [];
  items.forEach(function (item) {
    if (item.repost_de && !originales[item.repost_de] && !faltantes.includes(item.repost_de)) {
      faltantes.push(item.repost_de);
    }
  });

  if (faltantes.length > 0) {
    const { data: extra } = await supabaseClient
      .from("muro_publicaciones")
      .select("*")
      .in("id", faltantes);
    (extra || []).forEach(function (original) {
      originales[original.id] = original;
    });
  }

  const idsUsuarios = [];
  function sumarUsuario(id) {
    if (id && !idsUsuarios.includes(id)) idsUsuarios.push(id);
  }
  items.forEach(function (item) {
    sumarUsuario(item.user_id);
    if (item.repost_de && originales[item.repost_de]) {
      sumarUsuario(originales[item.repost_de].user_id);
    }
  });

  const perfiles = {};
  const { data: filasPerfiles } = await supabaseClient
    .from("profiles")
    .select("id, username")
    .in("id", idsUsuarios);
  (filasPerfiles || []).forEach(function (perfil) {
    perfiles[perfil.id] = perfil.username;
  });

  const idsPosts = [];
  items.forEach(function (item) {
    const id = item.repost_de ? item.repost_de : item.id;
    if (!idsPosts.includes(id)) idsPosts.push(id);
  });

  const megusta = new Set();
  const reposteados = new Set();

  if (sesion && idsPosts.length > 0) {
    const { data: misMeGusta } = await supabaseClient
      .from("me_gusta")
      .select("publicacion_id")
      .eq("user_id", sesion.user.id)
      .in("publicacion_id", idsPosts);
    (misMeGusta || []).forEach(function (fila) {
      megusta.add(fila.publicacion_id);
    });

    const { data: misReposts } = await supabaseClient
      .from("publicaciones")
      .select("repost_de")
      .eq("user_id", sesion.user.id)
      .in("repost_de", idsPosts);
    (misReposts || []).forEach(function (fila) {
      reposteados.add(fila.repost_de);
    });
  }

  return {
    originales: originales,
    perfiles: perfiles,
    megusta: megusta,
    reposteados: reposteados
  };
}

async function mostrarPosts(nombrePanel, items, mensajeVacio) {
  const contenedor = panel(nombrePanel);

  if (items.length === 0) {
    contenedor.replaceChildren(crearVacio(mensajeVacio));
    return;
  }

  const contexto = await construirContexto(items);
  const fragmento = document.createDocumentFragment();
  items.forEach(function (item) {
    const tarjeta = crearPost(item, contexto);
    if (tarjeta) fragmento.appendChild(tarjeta);
  });
  contenedor.replaceChildren(fragmento);
}

async function cargarPublicaciones() {
  const { data, error } = await supabaseClient
    .from("muro_publicaciones")
    .select("*")
    .eq("user_id", perfilId)
    .is("repost_de", null)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    panel("publicaciones").replaceChildren(crearVacio("No se pudieron cargar las publicaciones."));
    return;
  }

  await mostrarPosts("publicaciones", data, "Todavía no publicó nada en el muro.");
}

async function cargarReposts() {
  const { data, error } = await supabaseClient
    .from("muro_publicaciones")
    .select("*")
    .eq("user_id", perfilId)
    .not("repost_de", "is", null)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    panel("reposts").replaceChildren(crearVacio("No se pudieron cargar los reposts."));
    return;
  }

  await mostrarPosts("reposts", data, "Todavía no reposteó nada.");
}

async function cargarMultimedia() {
  const contenedor = panel("multimedia");

  const { data, error } = await supabaseClient
    .from("muro_publicaciones")
    .select("id, imagen_url")
    .eq("user_id", perfilId)
    .is("repost_de", null)
    .not("imagen_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(60);

    if (error) {
    contenedor.replaceChildren(crearVacio("No se pudieron cargar las imágenes."));
    return;
  }

  if (data.length === 0) {
    contenedor.replaceChildren(crearVacio("Todavía no publicó imágenes."));
    return;
  }

  const grilla = document.createElement("div");
  grilla.className = "multimedia-grilla";

  data.forEach(function (fila) {
    const enlace = document.createElement("a");
    enlace.href = "publicacion.html?id=" + encodeURIComponent(fila.id);
    const imagen = document.createElement("img");
    imagen.src = fila.imagen_url;
    imagen.alt = "Imagen publicada";
    imagen.loading = "lazy";
    enlace.appendChild(imagen);
    grilla.appendChild(enlace);
  });

  contenedor.replaceChildren(grilla);
}

function crearRespuestaPerfil(respuesta, original, nombreAutor) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "post respuesta-perfil";

  const contexto = document.createElement("p");
  contexto.className = "contexto";
  contexto.append((respuesta.respuesta_a ? "Respondió" : "Comentó") + " en la publicación de ");
  const enlace = document.createElement("a");
  enlace.href = "publicacion.html?id=" + encodeURIComponent(respuesta.publicacion_id);
  enlace.textContent = "@" + nombreAutor;
  contexto.appendChild(enlace);
  tarjeta.appendChild(contexto);

  let resumen = "";
  if (original) {
    if (original.contenido) resumen = original.contenido;
    else if (original.rec_titulo) resumen = "Recomendación: " + original.rec_titulo;
    else if (original.imagen_url) resumen = "Imagen";
    if (resumen.length > 100) resumen = resumen.slice(0, 100) + "…";
  }

  if (resumen) {
    const cita = document.createElement("p");
    cita.className = "cita";
    cita.textContent = resumen;
    tarjeta.appendChild(cita);
  }

  const texto = document.createElement("p");
  texto.className = "post-texto";
  texto.textContent = respuesta.texto;
  tarjeta.appendChild(texto);

  const fecha = document.createElement("p");
  fecha.className = "post-fecha";
  fecha.style.margin = "6px 0 0";
  fecha.textContent = fechaRelativa(respuesta.created_at);
  fecha.title = new Date(respuesta.created_at).toLocaleString("es");
  tarjeta.appendChild(fecha);

  return tarjeta;
}

async function cargarRespuestas() {
  const contenedor = panel("respuestas");

  const { data, error } = await supabaseClient
    .from("respuestas")
    .select("id, texto, created_at, publicacion_id, respuesta_a")
    .eq("user_id", perfilId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    contenedor.replaceChildren(crearVacio("No se pudieron cargar las respuestas."));
    return;
  }

  if (data.length === 0) {
    contenedor.replaceChildren(crearVacio("Todavía no comentó nada."));
    return;
  }

  const idsPublicaciones = [];
  data.forEach(function (respuesta) {
    if (!idsPublicaciones.includes(respuesta.publicacion_id)) {
      idsPublicaciones.push(respuesta.publicacion_id);
    }
  });

  const originales = {};
  const { data: filasOriginales } = await supabaseClient
    .from("muro_publicaciones")
    .select("id, user_id, contenido, rec_titulo, imagen_url")
    .in("id", idsPublicaciones);
  (filasOriginales || []).forEach(function (fila) {
    originales[fila.id] = fila;
  });

  const idsAutores = [];
  Object.keys(originales).forEach(function (id) {
    const autor = originales[id].user_id;
    if (!idsAutores.includes(autor)) idsAutores.push(autor);
  });

  const nombres = {};
  if (idsAutores.length > 0) {
    const { data: filasPerfiles } = await supabaseClient
      .from("profiles")
      .select("id, username")
      .in("id", idsAutores);
    (filasPerfiles || []).forEach(function (perfil) {
      nombres[perfil.id] = perfil.username;
    });
  }

  const fragmento = document.createDocumentFragment();
  data.forEach(function (respuesta) {
    const original = originales[respuesta.publicacion_id];
    const nombreAutor = original ? nombres[original.user_id] || "usuario" : "usuario";
    fragmento.appendChild(crearRespuestaPerfil(respuesta, original, nombreAutor));
  });
  contenedor.replaceChildren(fragmento);
}

function crearTarjetaRecomendacion(rec, resumen) {
  const tarjeta = document.createElement("a");
  tarjeta.className = "tarjeta";
  tarjeta.href = "recomendacion.html?id=" + encodeURIComponent(rec.id);
  tarjeta.style.color = "inherit";
  tarjeta.style.textDecoration = "none";

  const imagen = document.createElement("img");
  imagen.src = rec.portada_url;
  imagen.alt = "Portada de " + rec.titulo;
  imagen.loading = "lazy";

  const cuerpo = document.createElement("div");
  cuerpo.className = "tarjeta-cuerpo";

  const titulo = document.createElement("h3");
  titulo.textContent = rec.titulo;

  const autor = document.createElement("p");
  autor.className = "tarjeta-autor";
  autor.textContent = "de " + rec.autor;

  const estrellas = document.createElement("p");
  estrellas.className = "tarjeta-autor";
  estrellas.style.fontWeight = "bold";
  estrellas.style.color = "#b0245f";
  if (resumen) {
    estrellas.textContent =
      "★ " + resumen.promedio + " · " + resumen.cantidad +
      (resumen.cantidad === 1 ? " voto" : " votos");
  } else {
    estrellas.textContent = "☆ Sin calificaciones";
  }

  const sinopsis = document.createElement("p");
  sinopsis.className = "tarjeta-sinopsis";
  sinopsis.textContent = rec.sinopsis;

  const generos = document.createElement("div");
  generos.className = "tarjeta-generos";
  rec.generos.forEach(function (genero) {
    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta-genero";
    etiqueta.textContent = genero;
    generos.appendChild(etiqueta);
  });

  cuerpo.appendChild(titulo);
  cuerpo.appendChild(autor);
  cuerpo.appendChild(estrellas);
  cuerpo.appendChild(sinopsis);
  cuerpo.appendChild(generos);
  tarjeta.appendChild(imagen);
  tarjeta.appendChild(cuerpo);

  return tarjeta;
}

async function cargarRecomendaciones() {
  const contenedor = panel("recomendaciones");

  const { data, error } = await supabaseClient
    .from("recomendaciones")
    .select("id, titulo, autor, sinopsis, generos, portada_url")
    .eq("user_id", perfilId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    contenedor.replaceChildren(crearVacio("No se pudieron cargar las recomendaciones."));
    return;
  }

  if (data.length === 0) {
    contenedor.replaceChildren(crearVacio("Todavía no recomendó ninguna obra."));
    return;
  }

  const ids = data.map(function (rec) {
    return rec.id;
  });

  const { data: resumenes } = await supabaseClient
    .from("resumen_calificaciones")
    .select("recomendacion_id, promedio, cantidad")
    .in("recomendacion_id", ids);

  const porRecomendacion = {};
  (resumenes || []).forEach(function (resumen) {
    porRecomendacion[resumen.recomendacion_id] = resumen;
  });

  const fragmento = document.createDocumentFragment();
  data.forEach(function (rec) {
    fragmento.appendChild(crearTarjetaRecomendacion(rec, porRecomendacion[rec.id]));
  });
  contenedor.replaceChildren(fragmento);
}

const cargadores = {
  publicaciones: cargarPublicaciones,
  respuestas: cargarRespuestas,
  reposts: cargarReposts,
  multimedia: cargarMultimedia,
  recomendaciones: cargarRecomendaciones
};

function mostrarPestana(nombre) {
  pestanaActual = nombre;
  PESTANAS.forEach(function (clave) {
    panel(clave).hidden = clave !== nombre;
    document.getElementById("pestana-" + clave).classList.toggle("activa", clave === nombre);
  });
  if (!yaCargadas[nombre]) {
    yaCargadas[nombre] = true;
    cargadores[nombre]();
  }
}

async function compartirPerfil() {
  const direccion = new URL(
    "perfil.html?id=" + encodeURIComponent(perfilId),
    window.location.href
  ).href;

  if (navigator.share) {
    try {
      await navigator.share({ title: nombreActual + " en YuriWorld", url: direccion });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(direccion);
    avisar("Enlace copiado.");
  } catch (error) {
    avisar("No se pudo copiar el enlace.");
  }
}

function actualizarBarra() {
  const limite = banner.offsetHeight - 52;
  barra.classList.toggle("compacta", window.scrollY > limite);
}

botonVolver.addEventListener("click", function () {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "foro.html";
  }
});

botonCompartir.addEventListener("click", compartirPerfil);

async function iniciar() {
  const { data: datosSesion } = await supabaseClient.auth.getSession();
  sesion = datosSesion.session;

  navPerfil.href = sesion ? "perfil.html?mi=" + Date.now() : "iniciar-sesion.html";

  if (!perfilId && sesion) {
    perfilId = sesion.user.id;
  }

  if (!perfilId) {
    estado.textContent = "No encontramos ese perfil.";
    return;
  }

  let { data: perfil, error } = await supabaseClient
    .from("profiles")
    .select("id, username, created_at, avatar_url, banner_url")
    .eq("id", perfilId)
    .maybeSingle();

  if (error) {
    const respaldo = await supabaseClient
      .from("profiles")
      .select("id, username, created_at, avatar_url")
      .eq("id", perfilId)
      .maybeSingle();
    perfil = respaldo.data;
    error = respaldo.error;
  }

  if (error || !perfil) {
    estado.textContent = "No encontramos ese perfil.";
    return;
  }

  nombreActual = perfil.username;
  document.title = perfil.username + " - YuriWorld";

  if (perfil.banner_url) {
    banner.style.backgroundImage = 'url("' + perfil.banner_url + '")';
  }

  contenedorAvatar.replaceWith(crearAvatarGrande(perfil.username, perfil.avatar_url));

  nombrePerfil.textContent = perfil.username;
  usuarioPerfil.textContent = "@" + perfil.username;
  barraNombre.textContent = perfil.username;

  desdePerfil.innerHTML = ICONOS.calendario;
  const textoDesde = document.createElement("span");
  textoDesde.textContent =
    "Se unió en " +
    new Date(perfil.created_at).toLocaleDateString("es", { month: "long", year: "numeric" });
  desdePerfil.appendChild(textoDesde);

  const esPropio = !!sesion && sesion.user.id === perfil.id;
  botonesPerfil.classList.toggle("uno", !esPropio);

  const { count: totalPublicaciones } = await supabaseClient
    .from("publicaciones")
    .select("id", { count: "exact", head: true })
    .eq("user_id", perfilId)
    .is("repost_de", null);

  const { count: totalRecomendaciones } = await supabaseClient
    .from("recomendaciones")
    .select("id", { count: "exact", head: true })
    .eq("user_id", perfilId);

  cuentaPublicaciones.textContent = totalPublicaciones || 0;
  cuentaRecomendaciones.textContent = totalRecomendaciones || 0;
  barraCuenta.textContent = (totalPublicaciones || 0) + " publicaciones";

  estado.hidden = true;
  contenido.hidden = false;

  window.addEventListener("scroll", actualizarBarra, { passive: true });
  actualizarBarra();

  PESTANAS.forEach(function (clave) {
    document.getElementById("pestana-" + clave).addEventListener("click", function () {
      mostrarPestana(clave);
    });
  });

  mostrarPestana("publicaciones");
}

iniciar();
