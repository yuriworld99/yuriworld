const formulario = document.getElementById("form-publicar");
const aviso = document.getElementById("aviso-sesion");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("boton-publicar");
const inputPortada = document.getElementById("portada");
const vistaPrevia = document.getElementById("vista-previa");
const selectTipo = document.getElementById("tipo");
const selectEstado = document.getElementById("estado");
const casilla18 = document.getElementById("es18");
const listaGeneros = document.getElementById("lista-generos");

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO = 2 * 1024 * 1024;

if (window.YW) {
  window.YW.llenarGeneros(listaGeneros);
  window.YW.llenarSelect(selectTipo, window.YW.TIPOS);
  window.YW.llenarSelect(selectEstado, window.YW.ESTADOS);
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = "mensaje " + tipo;
}

async function comprobarSesion() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    formulario.hidden = true;
    aviso.hidden = false;
  }
}

comprobarSesion();

inputPortada.addEventListener("change", function () {
  const archivo = inputPortada.files[0];
  if (!archivo) {
    vistaPrevia.hidden = true;
    return;
  }
  vistaPrevia.src = URL.createObjectURL(archivo);
  vistaPrevia.hidden = false;
});

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const autor = document.getElementById("autor").value.trim();
  const sinopsis = document.getElementById("sinopsis").value.trim();
  const tipo = selectTipo.value;
  const estado = selectEstado.value;
  const es18 = casilla18.checked;
  const generos = Array.from(
    document.querySelectorAll('input[name="genero"]:checked')
  ).map(function (casilla) {
    return casilla.value;
  });
  const archivo = inputPortada.files[0];

  if (!titulo || !autor || !sinopsis) {
    mostrarMensaje("Completá el título, el autor y la sinopsis.", "error");
    return;
  }
  if (!tipo) {
    mostrarMensaje("Elegí el tipo de obra (manga, manhwa, manhua o webtoon).", "error");
    return;
  }
  if (!estado) {
    mostrarMensaje("Elegí el estado: en emisión o finalizado.", "error");
    return;
  }
  if (generos.length === 0) {
    mostrarMensaje("Elegí al menos un género.", "error");
    return;
  }
  if (!archivo) {
    mostrarMensaje("Elegí una imagen de portada.", "error");
    return;
  }
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    mostrarMensaje("La portada tiene que ser JPG, PNG o WEBP.", "error");
    return;
  }
  if (archivo.size > TAMANO_MAXIMO) {
    mostrarMensaje("La portada pesa más de 2 MB. Elegí una imagen más liviana.", "error");
    return;
  }

  boton.disabled = true;
  mostrarMensaje("Publicando...", "");

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;
  if (!sesion) {
    mostrarMensaje("Tu sesión se cerró. Volvé a iniciar sesión.", "error");
    boton.disabled = false;
    return;
  }

  let extension = "jpg";
  if (archivo.type === "image/png") extension = "png";
  if (archivo.type === "image/webp") extension = "webp";
  const ruta = sesion.user.id + "/" + Date.now() + "." + extension;

  const { error: errorSubida } = await supabaseClient.storage
    .from("portadas")
    .upload(ruta, archivo);

  if (errorSubida) {
    mostrarMensaje("No se pudo subir la portada: " + errorSubida.message, "error");
    boton.disabled = false;
    return;
  }

  const { data: datosUrl } = supabaseClient.storage
    .from("portadas")
    .getPublicUrl(ruta);

  const { error: errorGuardar } = await supabaseClient
    .from("recomendaciones")
    .insert({
      titulo: titulo,
      autor: autor,
      sinopsis: sinopsis,
      generos: generos,
      tipo: tipo,
      estado: estado,
      es_18: es18,
      portada_url: datosUrl.publicUrl
    });

  if (errorGuardar) {
    await supabaseClient.storage.from("portadas").remove([ruta]);
    mostrarMensaje("No se pudo publicar: " + errorGuardar.message, "error");
    boton.disabled = false;
    return;
  }

  mostrarMensaje("¡Recomendación publicada! 💜", "ok");
  formulario.reset();
  vistaPrevia.hidden = true;
  boton.disabled = false;
});
