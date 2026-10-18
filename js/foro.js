const formulario = document.getElementById("form-publicacion");
const aviso = document.getElementById("aviso-sesion");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("boton-publicar");
const lista = document.getElementById("lista-publicaciones");

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = "mensaje " + tipo;
}

function crearPublicacion(pub) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "publicacion-card";

  const direccion = "publicacion.html?id=" + encodeURIComponent(pub.id);

  const titulo = document.createElement("h3");
  const enlaceTitulo = document.createElement("a");
  enlaceTitulo.href = direccion;
  enlaceTitulo.textContent = pub.titulo;
  enlaceTitulo.style.color = "inherit";
  enlaceTitulo.style.textDecoration = "none";
  titulo.appendChild(enlaceTitulo);

  const meta = document.createElement("p");
  meta.className = "publicacion-meta";
  const usuario = pub.profiles ? pub.profiles.username : "usuario";
  const fecha = new Date(pub.created_at).toLocaleDateString("es");
  meta.textContent = usuario + " · " + fecha;

  const texto = document.createElement("p");
  texto.className = "publicacion-texto";
  texto.textContent = pub.contenido;

  const leer = document.createElement("a");
  leer.href = direccion;
  leer.className = "enlace-volver";
  leer.style.marginTop = "8px";
  leer.style.marginBottom = "0";
  leer.textContent = "Leer y responder →";

  tarjeta.appendChild(titulo);
  tarjeta.appendChild(meta);
  tarjeta.appendChild(texto);
  tarjeta.appendChild(leer);

  return tarjeta;
}

async function cargarPublicaciones() {
  const { data, error } = await supabaseClient
    .from("publicaciones")
    .select("id, titulo, contenido, created_at, profiles!publicaciones_user_id_fkey(username)")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    lista.textContent = "No se pudieron cargar las publicaciones.";
    return;
  }

  if (data.length === 0) {
    lista.textContent = "Todavía no hay publicaciones. ¡Creá la primera!";
    return;
  }

  lista.textContent = "";
  data.forEach(function (pub) {
    lista.appendChild(crearPublicacion(pub));
  });
}

async function comprobarSesion() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    formulario.hidden = true;
    aviso.hidden = false;
  }
}

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const contenido = document.getElementById("contenido").value.trim();

  if (!titulo || !contenido) {
    mostrarMensaje("Completá el título y el mensaje.", "error");
    return;
  }

  boton.disabled = true;
  mostrarMensaje("Publicando...", "");

  const { error } = await supabaseClient
    .from("publicaciones")
    .insert({ titulo: titulo, contenido: contenido });

  boton.disabled = false;

  if (error) {
    mostrarMensaje("No se pudo publicar: " + error.message, "error");
    return;
  }

  formulario.reset();
  mostrarMensaje("¡Publicación creada! 💜", "ok");
  cargarPublicaciones();
});

comprobarSesion();
cargarPublicaciones();
