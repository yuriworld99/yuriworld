const parametros = new URLSearchParams(window.location.search);
const recomendacionId = parametros.get("id");

const estado = document.getElementById("estado-detalle");
const contenido = document.getElementById("contenido");
const contenedorEstrellas = document.getElementById("estrellas");
const mensajeEstrellas = document.getElementById("mensaje-estrellas");
const textoPromedio = document.getElementById("promedio");
const formComentario = document.getElementById("form-comentario");
const avisoComentar = document.getElementById("aviso-comentar");
const mensajeComentario = document.getElementById("mensaje-comentario");
const listaComentarios = document.getElementById("lista-comentarios");
const botonComentar = document.getElementById("boton-comentar");

let sesion = null;
let calificacionPropia = 0;

function mostrar(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = "mensaje " + tipo;
}

function pintarEstrellas() {
  const botones = contenedorEstrellas.querySelectorAll("button");
  botones.forEach(function (boton, indice) {
    const llena = indice + 1 <= calificacionPropia;
    boton.textContent = llena ? "★" : "☆";
    boton.classList.toggle("activa", llena);
  });
}

function crearEstrellas() {
  for (let i = 1; i <= 5; i++) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "estrella";
    boton.setAttribute("aria-label", i + (i === 1 ? " estrella" : " estrellas"));
    boton.addEventListener("click", function () {
      calificar(i);
    });
    contenedorEstrellas.appendChild(boton);
  }
  pintarEstrellas();
}

async function cargarResumen() {
  const { data } = await supabaseClient
    .from("resumen_calificaciones")
    .select("promedio, cantidad")
    .eq("recomendacion_id", recomendacionId)
    .maybeSingle();

  if (!data) {
    textoPromedio.textContent = "Todavía no hay calificaciones.";
    return;
  }
  textoPromedio.textContent =
    "★ " + data.promedio + " · " + data.cantidad + (data.cantidad === 1 ? " voto" : " votos");
}

async function cargarCalificacionPropia() {
  if (!sesion) return;
  const { data } = await supabaseClient
    .from("calificaciones")
    .select("estrellas")
    .eq("recomendacion_id", recomendacionId)
    .eq("user_id", sesion.user.id)
    .maybeSingle();

  calificacionPropia = data ? data.estrellas : 0;
  pintarEstrellas();
}

async function calificar(valor) {
  if (!sesion) {
    mostrar(mensajeEstrellas, "Iniciá sesión para calificar.", "error");
    return;
  }

  const { error } = await supabaseClient
    .from("calificaciones")
    .upsert(
      {
        recomendacion_id: recomendacionId,
        user_id: sesion.user.id,
        estrellas: valor
      },
      { onConflict: "recomendacion_id,user_id" }
    );

  if (error) {
    mostrar(mensajeEstrellas, "No se pudo guardar tu calificación.", "error");
    return;
  }

  calificacionPropia = valor;
  pintarEstrellas();
  mostrar(mensajeEstrellas, "¡Gracias por calificar!", "ok");
  cargarResumen();
}

function crearComentario(comentario) {
  const caja = document.createElement("div");
  caja.className = "comentario";

  const cabecera = document.createElement("p");
  cabecera.className = "comentario-cabecera";
  const usuario = comentario.profiles ? comentario.profiles.username : "usuario";
  const fecha = new Date(comentario.created_at).toLocaleDateString("es");
  cabecera.textContent = usuario + " · " + fecha;

  const texto = document.createElement("p");
  texto.className = "comentario-texto";
  texto.textContent = comentario.texto;

  caja.appendChild(cabecera);
  caja.appendChild(texto);

  if (sesion && sesion.user.id === comentario.user_id) {
    const borrar = document.createElement("button");
    borrar.type = "button";
    borrar.className = "boton-borrar";
    borrar.textContent = "Borrar";
    borrar.addEventListener("click", async function () {
      if (!confirm("¿Borrar tu comentario?")) return;
      const { error } = await supabaseClient
        .from("comentarios")
        .delete()
        .eq("id", comentario.id);
      if (error) {
        mostrar(mensajeComentario, "No se pudo borrar el comentario.", "error");
        return;
      }
      cargarComentarios();
    });
    caja.appendChild(borrar);
  }

  return caja;
}

async function cargarComentarios() {
  const { data, error } = await supabaseClient
    .from("comentarios")
    .select("id, texto, created_at, user_id, profiles(username)")
    .eq("recomendacion_id", recomendacionId)
    .order("created_at", { ascending: false });

  if (error) {
    listaComentarios.textContent = "No se pudieron cargar los comentarios.";
    return;
  }

  if (data.length === 0) {
    listaComentarios.textContent = "Todavía no hay comentarios. ¡Escribí el primero!";
    return;
  }

  listaComentarios.textContent = "";
  data.forEach(function (comentario) {
    listaComentarios.appendChild(crearComentario(comentario));
  });
}

formComentario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const texto = document.getElementById("texto-comentario").value.trim();
  if (!texto) {
    mostrar(mensajeComentario, "Escribí algo antes de comentar.", "error");
    return;
  }

  botonComentar.disabled = true;

  const { error } = await supabaseClient
    .from("comentarios")
    .insert({ recomendacion_id: recomendacionId, texto: texto });

  botonComentar.disabled = false;

  if (error) {
    mostrar(mensajeComentario, "No se pudo publicar el comentario.", "error");
    return;
  }

  formComentario.reset();
  mostrar(mensajeComentario, "", "");
  cargarComentarios();
});

async function cargarRecomendacion() {
  if (!recomendacionId) {
    estado.textContent = "No encontramos esa recomendación.";
    return false;
  }

  const { data: rec, error } = await supabaseClient
    .from("recomendaciones")
    .select("id, titulo, autor, sinopsis, generos, portada_url, profiles!recomendaciones_user_id_fkey(username)")
    .eq("id", recomendacionId)
    .maybeSingle();

  if (error || !rec) {
    estado.textContent = "No encontramos esa recomendación.";
    return false;
  }

  document.title = rec.titulo + " - YuriWorld";

  const portada = document.getElementById("detalle-portada");
  portada.src = rec.portada_url;
  portada.alt = "Portada de " + rec.titulo;

  document.getElementById("detalle-titulo").textContent = rec.titulo;
  document.getElementById("detalle-autor").textContent = "de " + rec.autor;
  document.getElementById("detalle-sinopsis").textContent = rec.sinopsis;

  const contenedorGeneros = document.getElementById("detalle-generos");
  rec.generos.forEach(function (genero) {
    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta-genero";
    etiqueta.textContent = genero;
    contenedorGeneros.appendChild(etiqueta);
  });

  const usuario = rec.profiles ? rec.profiles.username : "usuario";
  document.getElementById("detalle-pie").textContent = "Recomendado por " + usuario;

  estado.hidden = true;
  contenido.hidden = false;
  return true;
}

async function iniciar() {
  const { data } = await supabaseClient.auth.getSession();
  sesion = data.session;

  formComentario.hidden = !sesion;
  avisoComentar.hidden = !!sesion;

  crearEstrellas();

  const encontrada = await cargarRecomendacion();
  if (!encontrada) return;

  cargarResumen();
  cargarCalificacionPropia();
  cargarComentarios();
}

iniciar();
