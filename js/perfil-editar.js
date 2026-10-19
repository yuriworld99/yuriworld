(async function () {
  const botonEditar = document.getElementById("boton-editar-perfil");
  const formulario = document.getElementById("form-editar-perfil");
  const textoDescripcion = document.getElementById("texto-descripcion");
  const archivoAvatar = document.getElementById("archivo-avatar");
  const vistaAvatar = document.getElementById("vista-avatar");
  const botonCancelar = document.getElementById("cancelar-edicion");
  const mensaje = document.getElementById("mensaje-edicion");
  const descripcion = document.getElementById("perfil-descripcion");

  if (!botonEditar || !formulario) return;

  const parametros = new URLSearchParams(window.location.search);
  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;
  const perfilId = parametros.get("id") || (sesion ? sesion.user.id : null);
  if (!perfilId) return;

  const { data: perfil } = await supabaseClient
    .from("profiles")
    .select("id, avatar_url, descripcion")
    .eq("id", perfilId)
    .maybeSingle();

  if (!perfil) return;

  if (perfil.descripcion) {
    descripcion.textContent = perfil.descripcion;
    descripcion.hidden = false;
  }

  if (!sesion || sesion.user.id !== perfil.id) return;

  let avatarNuevo = null;

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "muro-mensaje " + tipo;
  }

  function recortarCuadrado(archivo) {
    return new Promise(function (resolver, rechazar) {
      const direccion = URL.createObjectURL(archivo);
      const imagen = new Image();
      imagen.onload = function () {
        URL.revokeObjectURL(direccion);
        const lado = Math.min(imagen.width, imagen.height);
        const origenX = (imagen.width - lado) / 2;
        const origenY = (imagen.height - lado) / 2;
        const lienzo = document.createElement("canvas");
        lienzo.width = 256;
        lienzo.height = 256;
        const contexto = lienzo.getContext("2d");
        contexto.fillStyle = "#ffffff";
        contexto.fillRect(0, 0, 256, 256);
        contexto.drawImage(imagen, origenX, origenY, lado, lado, 0, 0, 256, 256);
        lienzo.toBlob(function (blob) {
          if (blob) resolver(blob);
          else rechazar(new Error("No se pudo procesar la foto."));
        }, "image/jpeg", 0.9);
      };
      imagen.onerror = function () {
        URL.revokeObjectURL(direccion);
        rechazar(new Error("No se pudo leer la foto."));
      };
      imagen.src = direccion;
    });
  }

  function cerrarEdicion() {
    formulario.hidden = true;
    botonEditar.hidden = false;
    archivoAvatar.value = "";
    vistaAvatar.hidden = true;
    avatarNuevo = null;
    mostrarMensaje("", "");
  }

  botonEditar.hidden = false;

  botonEditar.addEventListener("click", function () {
    textoDescripcion.value = perfil.descripcion || "";
    formulario.hidden = false;
    botonEditar.hidden = true;
  });

  botonCancelar.addEventListener("click", cerrarEdicion);

  archivoAvatar.addEventListener("change", async function () {
    const archivo = archivoAvatar.files[0];
    if (!archivo) {
      avatarNuevo = null;
      vistaAvatar.hidden = true;
      return;
    }
    if (!archivo.type.startsWith("image/")) {
      mostrarMensaje("El archivo tiene que ser una imagen.", "error");
      archivoAvatar.value = "";
      return;
    }
    try {
      avatarNuevo = await recortarCuadrado(archivo);
      vistaAvatar.src = URL.createObjectURL(avatarNuevo);
      vistaAvatar.hidden = false;
      mostrarMensaje("", "");
    } catch (error) {
      avatarNuevo = null;
      vistaAvatar.hidden = true;
      mostrarMensaje(error.message, "error");
    }
  });

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const botonGuardar = formulario.querySelector('button[type="submit"]');
    botonGuardar.disabled = true;
    mostrarMensaje("Guardando...", "");

    const texto = textoDescripcion.value.trim();
    let urlAvatar = perfil.avatar_url;
    let rutaSubida = null;

    try {
      if (avatarNuevo) {
        const ruta = sesion.user.id + "/" + Date.now() + ".jpg";
        const { error: errorSubida } = await supabaseClient.storage
          .from("avatares")
          .upload(ruta, avatarNuevo, { contentType: "image/jpeg" });
        if (errorSubida) throw errorSubida;
        rutaSubida = ruta;
        urlAvatar = supabaseClient.storage.from("avatares").getPublicUrl(ruta).data.publicUrl;
      }

      const { error: errorPerfil } = await supabaseClient
        .from("profiles")
        .update({ avatar_url: urlAvatar, descripcion: texto || null })
        .eq("id", sesion.user.id);
      if (errorPerfil) throw errorPerfil;
    } catch (error) {
      if (rutaSubida) {
        await supabaseClient.storage.from("avatares").remove([rutaSubida]);
      }
      mostrarMensaje("No se pudo guardar: " + (error.message || "error desconocido"), "error");
      botonGuardar.disabled = false;
      return;
    }

    if (avatarNuevo && perfil.avatar_url) {
      const partes = perfil.avatar_url.split("/avatares/");
      if (partes.length === 2) {
        await supabaseClient.storage.from("avatares").remove([decodeURIComponent(partes[1])]);
      }
    }

    window.location.reload();
  });
})();
