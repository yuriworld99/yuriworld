const PAGINA = 20;
const COLORES_AVATAR = ["#e0529a", "#7b3fe4", "#c2418c", "#6a35c9", "#d94f8a", "#8a4fe8", "#b8387f", "#5d2fb8"];

function icono(ruta) {
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ruta + "</svg>";
}

const ICONOS = {
  comentario: icono('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>'),
  repost: icono('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  corazon: icono('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>')
};

const aviso = document.getElementById("aviso-sesion");
const compositor = document.getElementById("compositor");
const avatarCompositor = document.getElementById("avatar-compositor");
const textoPublicacion = document.getElementById("texto-publicacion");
const contador = document.getElementById("contador");
const vistaImagen = document.getElementById("vista-imagen");
const imagenPrevia = document.getElementById("imagen-previa");
const quitarImagen = document.getElementById("quitar-imagen");
const archivoImagen = document.getElementById("archivo-imagen");
const botonImagen = document.getElementById("boton-imagen");
const botonRecomendacion = document.getElementById("boton-recomendacion");
const panelRecomendacion = document.getElementById("panel-recomendacion");
const recPortada = document.getElementById("rec-portada");
const portadaPrevia = document.getElementById("portada-previa");
const mensajeCompositor = document.getElementById("mensaje-compositor");
const botonPublicar = document.getElementById("boton-publicar");
const lista = document.getElementById("muro-lista");
const botonCargarMas = document.getElementById("cargar-mas");
const avisoFlotante = document.getElementById("aviso-flotante");

let sesion = null;
let imagenAdjunta = null;
let portadaAdjunta = null;
let cantidadVisible = PAGINA;
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
  mensajeCompositor.textContent = texto;
  mensajeCompositor.className = "muro-mensaje " + tipo;
}

function colorDe(texto) {
  let valor = 0;
  for (let i = 0; i < texto.length; i++) {
    valor = (valor * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return COLORES_AVATAR[valor % COLORES_AVATAR.length];
}

function crearAvatar(nombre, userId) {
  const elemento = document.createElement(userId ? "a" : "div");
  elemento.className = "avatar";
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

function comprimirImagen(archivo) {
  return new Promise(function (resolver, rechazar) {
    const direccion = URL.createObjectURL(archivo);
    const imagen = new Image();
    imagen.onload = function () {
      URL.revokeObjectURL(direccion);
      const ladoMaximo = 1280;
      const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height));
      const ancho = Math.round(imagen.width * escala);
      const alto = Math.round(imagen.height * escala);
      const lienzo = document.createElement("canvas");
      lienzo.width = ancho;
      lienzo.height = alto;
      const contexto = lienzo.getContext("2d");
      contexto.fillStyle = "#ffffff";
      contexto.fillRect(0, 0, ancho, alto);
      contexto.drawImage(imagen, 0, 0, ancho, alto);
      lienzo.toBlob(function (blob) {
        if (blob) resolver(blob);
        else rechazar(new Error("No se pudo procesar la imagen."));
      }, "image/jpeg", 0.85);
    };
    imagen.onerror = function () {
      URL.revokeObjectURL(direccion);
      rechazar(new Error("No se pudo leer la imagen."));
    };
    imagen.src = direccion;
  });
}

async function prepararImagen(archivo) {
  if (!archivo.type.startsWith("image/")) {
    throw new Error("El archivo tiene que ser una imagen.");
  }
  const blob = await comprimirImagen(archivo);
  if (blob.size > 2 * 1024 * 1024) {
    throw new Error("La imagen sigue pesando más de 2 MB. Elegí otra.");
  }
  return blob;
}

async function subirArchivo(bucket, blob, registro) {
  const ruta =
    sesion.user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
  const { error } = await supabaseClient.storage
    .from(bucket)
    .upload(ruta, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  registro.push({ bucket: bucket, ruta: ruta });
  return supabaseClient.storage.from(bucket).getPublicUrl(ruta).data.publicUrl;
}

async function borrarArchivo(bucket, direccion) {
  if (!direccion) return;
  const partes = direccion.split("/" + bucket + "/");
  if (partes.length !== 2) return;
  await supabaseClient.storage.from(bucket).remove([decodeURIComponent(partes[1])]);
}

function actualizarBotones() {
  botonImagen.disabled = !panelRecomendacion.hidden;
  botonRecomendacion.disabled = !!imagenAdjunta;
  botonRecomendacion.classList.toggle("activo", !panelRecomendacion.hidden);
}

function limpiarRecomendacion() {
  document.getElementById("rec-titulo").value = "";
  document.getElementById("rec-autor").value = "";
  document.getElementById("rec-sinopsis").value = "";
  document.querySelectorAll('input[name="genero"]').forEach(function (casilla) {
    casilla.checked = false;
  });
  recPortada.value = "";
  portadaAdjunta = null;
  portadaPrevia.hidden = true;
  panelRecomendacion.hidden = true;
}

function limpiarCompositor() {
  textoPublicacion.value = "";
  contador.textContent = "0/500";
  imagenAdjunta = null;
  vistaImagen.hidden = true;
  limpiarRecomendacion();
  actualizarBotones();
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
    if (cambio) cargarMuro();
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
  await borrarArchivo("portadas", post.rec_portada_url);
  avisar("Publicación borrada.");
  cargarMuro();
}

function crearBloqueRecomendacion(post) {
  const bloque = document.createElement("div");
  bloque.className = "rec-tarjeta";

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

  const botonMeGusta = crearBotonAccion("me-gusta", ICONOS.corazon, Number(post.me_gusta), "Me gusta");
  const botonRepost = crearBotonAccion("repost", ICONOS.repost, Number(post.reposts), "Repostear");

  configurarMeGusta(botonMeGusta, post, contexto);
  configurarRepost(botonRepost, post, contexto);

  acciones.appendChild(comentar);
  acciones.appendChild(botonMeGusta);
  acciones.appendChild(botonRepost);

  if (!esRepost && sesion && post.user_id === sesion.user.id) {
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
  tarjeta.appendChild(fila);

  return tarjeta;
}

async function cargarMuro() {
  const { data: items, error } = await supabaseClient
    .from("muro_publicaciones")
    .select("*")
    .order("created_at", { ascending: false })
    .range(0, cantidadVisible - 1);

  if (error) {
    lista.textContent = "No se pudieron cargar las publicaciones.";
    botonCargarMas.hidden = true;
    return;
  }

  if (items.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "muro-vacio";
    vacio.textContent = "Todavía no hay publicaciones. ¡Sé la primera persona en publicar!";
    lista.replaceChildren(vacio);
    botonCargarMas.hidden = true;
    return;
  }

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

  const contexto = {
    originales: originales,
    perfiles: perfiles,
    megusta: megusta,
    reposteados: reposteados
  };

  const fragmento = document.createDocumentFragment();
  items.forEach(function (item) {
    const tarjeta = crearPost(item, contexto);
    if (tarjeta) fragmento.appendChild(tarjeta);
  });

  lista.replaceChildren(fragmento);
  botonCargarMas.hidden = items.length < cantidadVisible;
}

textoPublicacion.addEventListener("input", function () {
  contador.textContent = textoPublicacion.value.length + "/500";
});

botonImagen.addEventListener("click", function () {
  archivoImagen.click();
});

archivoImagen.addEventListener("change", async function () {
  const archivo = archivoImagen.files[0];
  archivoImagen.value = "";
  if (!archivo) return;

  try {
    imagenAdjunta = await prepararImagen(archivo);
    imagenPrevia.src = URL.createObjectURL(imagenAdjunta);
    vistaImagen.hidden = false;
    mostrarMensaje("", "");
  } catch (error) {
    imagenAdjunta = null;
    vistaImagen.hidden = true;
    mostrarMensaje(error.message, "error");
  }
  actualizarBotones();
});

quitarImagen.addEventListener("click", function () {
  imagenAdjunta = null;
  vistaImagen.hidden = true;
  actualizarBotones();
});

botonRecomendacion.addEventListener("click", function () {
  if (panelRecomendacion.hidden) {
    panelRecomendacion.hidden = false;
  } else {
    limpiarRecomendacion();
  }
  actualizarBotones();
});

recPortada.addEventListener("change", async function () {
  const archivo = recPortada.files[0];
  if (!archivo) {
    portadaAdjunta = null;
    portadaPrevia.hidden = true;
    return;
  }

  try {
    portadaAdjunta = await prepararImagen(archivo);
    portadaPrevia.src = URL.createObjectURL(portadaAdjunta);
    portadaPrevia.hidden = false;
       mostrarMensaje("", "");
  } catch (error) {
    portadaAdjunta = null;
    portadaPrevia.hidden = true;
    recPortada.value = "";
    mostrarMensaje(error.message, "error");
  }
});

botonPublicar.addEventListener("click", async function () {
  if (!sesion) return;

  const texto = textoPublicacion.value.trim();
  const conRecomendacion = !panelRecomendacion.hidden;

  let recTitulo = "";
  let recAutor = "";
  let recSinopsis = "";
  let recGeneros = [];

  if (conRecomendacion) {
    recTitulo = document.getElementById("rec-titulo").value.trim();
    recAutor = document.getElementById("rec-autor").value.trim();
    recSinopsis = document.getElementById("rec-sinopsis").value.trim();
    recGeneros = Array.from(document.querySelectorAll('input[name="genero"]:checked')).map(
      function (casilla) {
        return casilla.value;
      }
    );

    if (!recTitulo || !recAutor || !recSinopsis) {
      mostrarMensaje("Completá el título, el autor y la sinopsis de la recomendación.", "error");
      return;
    }
    if (recGeneros.length === 0) {
      mostrarMensaje("Elegí al menos un género.", "error");
      return;
    }
    if (!portadaAdjunta) {
      mostrarMensaje("Elegí la portada de la recomendación.", "error");
      return;
    }
  } else if (!texto && !imagenAdjunta) {
    mostrarMensaje("Escribí algo o adjuntá una imagen.", "error");
    return;
  }

  botonPublicar.disabled = true;
  mostrarMensaje("Publicando...", "");

  const subidos = [];

  try {
    const fila = { contenido: texto || null };

    if (imagenAdjunta) {
      fila.imagen_url = await subirArchivo("muro", imagenAdjunta, subidos);
    }

    if (conRecomendacion) {
      fila.rec_titulo = recTitulo;
      fila.rec_autor = recAutor;
      fila.rec_sinopsis = recSinopsis;
      fila.rec_generos = recGeneros;
      fila.rec_portada_url = await subirArchivo("portadas", portadaAdjunta, subidos);
    }

    const { error } = await supabaseClient.from("publicaciones").insert(fila);
    if (error) throw error;
  } catch (error) {
    for (const subido of subidos) {
      await supabaseClient.storage.from(subido.bucket).remove([subido.ruta]);
    }
    mostrarMensaje("No se pudo publicar: " + (error.message || "error desconocido"), "error");
    botonPublicar.disabled = false;
    return;
  }

  limpiarCompositor();
  mostrarMensaje("¡Publicado! 💜", "ok");
  botonPublicar.disabled = false;
  cargarMuro();
});

botonCargarMas.addEventListener("click", function () {
  cantidadVisible += PAGINA;
  cargarMuro();
});

async function iniciar() {
  const { data } = await supabaseClient.auth.getSession();
  sesion = data.session;

  if (sesion) {
    const { data: perfil } = await supabaseClient
      .from("profiles")
      .select("username")
      .eq("id", sesion.user.id)
      .maybeSingle();
    const miNombre = perfil ? perfil.username : "usuario";
    avatarCompositor.replaceWith(crearAvatar(miNombre));
    compositor.hidden = false;
  } else {
    aviso.hidden = false;
  }

  await cargarMuro();
}

iniciar();
