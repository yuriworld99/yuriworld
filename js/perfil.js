const COLORES_AVATAR = ["#e0529a", "#7b3fe4", "#c2418c", "#6a35c9", "#d94f8a", "#8a4fe8", "#b8387f", "#5d2fb8"];

function icono(ruta) {
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ruta + "</svg>";
}

const ICONOS = {
  comentario: icono('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>'),
  repost: icono('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  corazon: icono('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>'),
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
const pestanaPublicaciones = document.getElementById("pestana-publicaciones");
const pestanaRecomendaciones = document.getElementById("pestana-recomendaciones");
const panelPublicaciones = document.getElementById("panel-publicaciones");
const panelRecomendaciones = document.getElementById("panel-recomendaciones");
const avisoFlotante = document.getElementById("aviso-flotante");

let temporizadorAviso = null;
let nombreActual = "usuario";

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

function crearAvatar(nombre, direccion) {
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

function fechaRelativa(iso) {
  const segundos = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (segundos < 60) return "ahora";
  if (segundos < 3600) return "hace " + Math.floor(segundos / 60) + " min";
  if (segundos < 86400) return "hace " + Math.floor(segundos / 3600) + " h";
  if (segundos < 604800) return "hace " + Math.floor(segundos / 86400) + " d";
  return new Date(iso).toLocaleDateString("es");
}

function mostrarPestana(cual) {
  const esPublicaciones = cual === "publicaciones";
  panelPublicaciones.hidden = !esPublicaciones;
  panelRecomendaciones.hidden = esPublicaciones;
  pestanaPublicaciones.classList.toggle("activa", esPublicaciones);
  pestanaRecomendaciones.classList.toggle("activa", !esPublicaciones);
}

function crearVacio(texto) {
  const vacio = document.createElement("p");
  vacio.className = "perfil-vacio";
  vacio.textContent = texto;
  return vacio;
}

function crearContador(iconoHtml, cantidad, etiqueta) {
  const elemento = document.createElement("span");
  elemento.className = "accion";
  elemento.style.pointerEvents = "none";
  elemento.setAttribute("aria-label", etiqueta + ": " + cantidad);
  elemento.innerHTML = iconoHtml + '<span class="accion-num"></span>';
  elemento.querySelector(".accion-num").textContent = cantidad;
  return elemento;
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

function crearPost(post) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "post";

  const fecha = document.createElement("p");
  fecha.className = "post-fecha";
  fecha.style.margin = "0";
  fecha.textContent = fechaRelativa(post.created_at);
  fecha.title = new Date(post.created_at).toLocaleString("es");
  tarjeta.appendChild(fecha);

  if (post.titulo) {
    const titulo = document.createElement("p");
    titulo.className = "post-titulo";
    titulo.textContent = post.titulo;
    tarjeta.appendChild(titulo);
  }

  if (post.contenido) {
    const texto = document.createElement("p");
    texto.className = "post-texto";
    texto.textContent = post.contenido;
    tarjeta.appendChild(texto);
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
    tarjeta.appendChild(enlaceImagen);
  }

  if (post.rec_titulo) {
    tarjeta.appendChild(crearBloqueRecomendacion(post));
  }

  const acciones = document.createElement("div");
  acciones.className = "post-acciones";
  acciones.style.marginLeft = "-8px";

  const comentarios = document.createElement("a");
  comentarios.className = "accion";
  comentarios.href = "publicacion.html?id=" + encodeURIComponent(post.id);
  comentarios.setAttribute("aria-label", "Ver la publicación y sus comentarios");
  comentarios.innerHTML = ICONOS.comentario + '<span class="accion-num"></span>';
  comentarios.querySelector(".accion-num").textContent = Number(post.comentarios);

  acciones.appendChild(comentarios);
  acciones.appendChild(crearContador(ICONOS.repost, Number(post.reposts), "Reposts"));
  acciones.appendChild(crearContador(ICONOS.corazon, Number(post.me_gusta), "Me gusta"));

  tarjeta.appendChild(acciones);
  return tarjeta;
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

async function cargarPublicaciones() {
  const { data, error } = await supabaseClient
    .from("muro_publicaciones")
    .select("*")
    .eq("user_id", perfilId)
    .is("repost_de", null)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    panelPublicaciones.replaceChildren(crearVacio("No se pudieron cargar las publicaciones."));
    return;
  }

  if (data.length === 0) {
    panelPublicaciones.replaceChildren(crearVacio("Todavía no publicó nada en el muro."));
    return;
  }

  const fragmento = document.createDocumentFragment();
  data.forEach(function (post) {
    fragmento.appendChild(crearPost(post));
  });
  panelPublicaciones.replaceChildren(fragmento);
}

async function cargarRecomendaciones() {
  const { data, error } = await supabaseClient
    .from("recomendaciones")
    .select("id, titulo, autor, sinopsis, generos, portada_url")
    .eq("user_id", perfilId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    panelRecomendaciones.replaceChildren(crearVacio("No se pudieron cargar las recomendaciones."));
    return;
  }

  if (data.length === 0) {
    panelRecomendaciones.replaceChildren(crearVacio("Todavía no recomendó ninguna obra."));
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
  panelRecomendaciones.replaceChildren(fragmento);
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
  const sesion = datosSesion.session;

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

  contenedorAvatar.replaceWith(crearAvatar(perfil.username, perfil.avatar_url));

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

  pestanaPublicaciones.addEventListener("click", function () {
    mostrarPestana("publicaciones");
  });
  pestanaRecomendaciones.addEventListener("click", function () {
    mostrarPestana("recomendaciones");
  });

  cargarPublicaciones();
  cargarRecomendaciones();
}

iniciar();
