const parametros = new URLSearchParams(window.location.search);
const publicacionId = parametros.get("id");

const estado = document.getElementById("estado-detalle");
const contenido = document.getElementById("contenido");
const formRespuesta = document.getElementById("form-comentario");
const avisoResponder = document.getElementById("aviso-comentar");
const mensajeRespuesta = document.getElementById("mensaje-comentario");
const listaRespuestas = document.getElementById("lista-comentarios");
const botonResponder = document.getElementById("boton-comentar");

let sesion = null;

function mostrar(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = "mensaje " + tipo;
}

function crearRespuesta(respuesta) {
  const caja = document.createElement("div");
  caja.className = "comentario";

  const cabecera = document.createElement("p");
  cabecera.className = "comentario-cabecera";
  const usuario = respuesta.profiles ? respuesta.profiles.username : "usuario";
  const fecha = new Date(respuesta.created_at).toLocaleDateString("es");
  cabecera.textContent = usuario + " · " + fecha;

  const texto = document.createElement("p");
  texto.className = "comentario-texto";
  texto.textContent = respuesta.texto;

  caja.appendChild(cabecera);
  caja.appendChild(texto);

  if (sesion && sesion.user.id === respuesta.user_id) {
    const borrar = document.createElement("button");
    borrar.type = "button";
    borrar.className = "boton-borrar";
    borrar.textContent = "Borrar";
    borrar.addEventListener("click", async function () {
      if (!confirm("¿Borrar tu respuesta?")) return;
      const { error } = await supabaseClient
        .from("respuestas")
        .delete()
        .eq("id", respuesta.id);
      if (error) {
        mostrar(mensajeRespuesta, "No se pudo borrar la respuesta.", "error");
        return;
      }
      cargarRespuestas();
    });
    caja.appendChild(borrar);
  }

  return caja;
}

async function cargarRespuestas() {
  const { data, error } = await supabaseClient
    .from("respuestas")
    .select("id, texto, created_at, user_id, profiles!respuestas_user_id_fkey(username)")
    .eq("publicacion_id", publicacionId)
    .order("created_at", { ascending: true });

  if (error) {
    listaRespuestas.textContent = "No se pudieron cargar las respuestas.";
    return;
  }

  if (data.length === 0) {
    listaRespuestas.textContent = "Todavía no hay respuestas. ¡Escribí la primera!";
    return;
  }

  listaRespuestas.textContent = "";
  data.forEach(function (respuesta) {
    listaRespuestas.appendChild(crearRespuesta(respuesta));
  });
}

formRespuesta.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const texto = document.getElementById("texto-comentario").value.trim();
  if (!texto) {
    mostrar(mensajeRespuesta, "Escribí algo antes de responder.", "error");
    return;
  }

  botonResponder.disabled = true;

  const { error } = await supabaseClient
    .from("respuestas")
    .insert({ publicacion_id: publicacionId, texto: texto });

  botonResponder.disabled = false;

  if (error) {
    mostrar(mensajeRespuesta, "No se pudo publicar la respuesta.", "error");
    return;
  }

  formRespuesta.reset();
  mostrar(mensajeRespuesta, "", "");
  cargarRespuestas();
});

async function cargarPublicacion() {
  if (!publicacionId) {
    estado.textContent = "No encontramos esa publicación.";
    return false;
  }

  const { data: pub, error } = await supabaseClient
    .from("publicaciones")
    .select("id, titulo, contenido, created_at, user_id, profiles!publicaciones_user_id_fkey(username)")
    .eq("id", publicacionId)
    .maybeSingle();

  if (error || !pub) {
    estado.textContent = "No encontramos esa publicación.";
    return false;
  }

  document.title = pub.titulo + " - YuriWorld";
  document.getElementById("pub-titulo").textContent = pub.titulo;

  const usuario = pub.profiles ? pub.profiles.username : "usuario";
  const fecha = new Date(pub.created_at).toLocaleDateString("es");
  document.getElementById("pub-meta").textContent = usuario + " · " + fecha;
  document.getElementById("pub-texto").textContent = pub.contenido;

  if (sesion && sesion.user.id === pub.user_id) {
    const borrar = document.createElement("button");
    borrar.type = "button";
    borrar.className = "boton-borrar";
    borrar.textContent = "Borrar publicación";
    borrar.addEventListener("click", async function () {
      if (!confirm("¿Borrar esta publicación y todas sus respuestas?")) return;
      const { error: errorBorrar } = await supabaseClient
        .from("publicaciones")
        .delete()
        .eq("id", pub.id);
      if (errorBorrar) {
        alert("No se pudo borrar la publicación.");
        return;
      }
      window.location.href = "foro.html";
    });
    document.getElementById("acciones-publicacion").appendChild(borrar);
  }

  estado.hidden = true;
  contenido.hidden = false;
  return true;
}

async function iniciar() {
  const { data } = await supabaseClient.auth.getSession();
  sesion = data.session;

  formRespuesta.hidden = !sesion;
  avisoResponder.hidden = !!sesion;

  const encontrada = await cargarPublicacion();
  if (!encontrada) return;

  cargarRespuestas();
}

iniciar();
